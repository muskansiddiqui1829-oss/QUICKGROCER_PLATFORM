const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Coupon = require('../models/Coupon');
const DeliveryPartner = require('../models/DeliveryPartner');
const Notification = require('../models/Notification');
const { asyncHandler, AppError, generateOrderNumber, calculateDistance, calculateDeliveryFee, paginate, paginateResponse } = require('../utils/helpers');
const { broadcastOrderStatus, emitToUser, emitToRole } = require('../socket/socketManager');
const { sendEmail, emailTemplates } = require('../utils/email');

const createNotification = async (userId, title, message, type, data = {}) => {
  await Notification.create({ user: userId, title, message, type, data });
  emitToUser(userId, 'notification:new', { title, message, type, data });
};

// @POST /api/orders
exports.placeOrder = asyncHandler(async (req, res, next) => {
  const { storeId, items, deliveryAddress, paymentMethod, couponCode, specialInstructions } = req.body;

  const store = await Store.findById(storeId);
  if (!store || !store.isApproved || !store.isActive) throw new AppError('Store not available', 400);
  if (!store.isOpen) throw new AppError('Store is currently closed', 400);

  // Validate and calculate items
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product || !product.isActive) throw new AppError(`Product ${item.productId} not available`, 400);
    if (product.store.toString() !== storeId) throw new AppError('All items must be from the same store', 400);
    if (product.stock < item.quantity) throw new AppError(`Insufficient stock for ${product.name}`, 400);
    if (item.quantity < product.minOrderQty || item.quantity > product.maxOrderQty)
      throw new AppError(`Invalid quantity for ${product.name}`, 400);

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images[0] || '',
      price: product.price,
      quantity: item.quantity,
      unit: product.unit,
    });
    subtotal += product.price * item.quantity;
  }

  if (subtotal < 1) throw new AppError('Cart is empty', 400);
  if (subtotal < (store.minOrderAmount || 0)) {
    throw new AppError(`Minimum order is ₹${store.minOrderAmount || 0}`, 400);
  }

  // Calculate distance & delivery fee
  const storeCoords = store.location.coordinates;
  const customerCoords = deliveryAddress.location?.coordinates || [0, 0];
  const distanceKm = calculateDistance(
    customerCoords[1], customerCoords[0],
    storeCoords[1], storeCoords[0]
  );
  const deliveryFee = calculateDeliveryFee(distanceKm, subtotal);

  // Apply coupon
  let discount = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (!coupon) throw new AppError('Invalid coupon code', 400);
    const validity = coupon.isValid(req.user._id, subtotal, storeId);
    if (!validity.valid) throw new AppError(validity.message, 400);
    discount = coupon.calculateDiscount(subtotal, deliveryFee);
    appliedCoupon = coupon._id;
    coupon.usedCount += 1;
    coupon.usedBy.push(req.user._id);
    await coupon.save();
  }

  const totalAmount = Math.max(subtotal + deliveryFee - discount, 0);

  // Create order
  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    customer: req.user._id,
    store: storeId,
    items: orderItems,
    subtotal,
    deliveryFee,
    discount,
    totalAmount,
    coupon: appliedCoupon,
    deliveryAddress,
    paymentMethod,
    specialInstructions,
    distance: Math.round(distanceKm * 10) / 10,
    estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000),
    statusHistory: [{ status: 'pending', message: 'Order placed successfully' }],
    otp: Math.floor(1000 + Math.random() * 9000).toString(),
  });

  // Deduct stock
  await Promise.all(items.map(item =>
    Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity, soldCount: item.quantity } })
  ));

  // Notify store owner
  const storeOwnerNotif = createNotification(
    store.owner, 'New Order!', `Order #${order.orderNumber} received - ₹${totalAmount}`, 'order_update',
    { orderId: order._id, orderNumber: order.orderNumber }
  );

  // Notify customer
  const customerNotif = createNotification(
    req.user._id, 'Order Placed!', `Your order #${order.orderNumber} is placed`, 'order_update',
    { orderId: order._id }
  );

  await Promise.all([storeOwnerNotif, customerNotif]);

  // Emit to vendor
  emitToUser(store.owner, 'order:new', { order: order.toObject() });

  const populated = await Order.findById(order._id).populate('store', 'name logo').populate('items.product', 'name images');
  res.status(201).json({ success: true, data: populated });
});

// @GET /api/orders/my-orders
exports.getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const query = { customer: req.user._id };
  if (status) query.status = status;

  const { skip, limit: lim } = paginate(null, page, limit);
  const [orders, total] = await Promise.all([
    Order.find(query).sort('-createdAt').skip(skip).limit(lim)
      .populate('store', 'name logo').populate('deliveryPartner', 'name phone'),
    Order.countDocuments(query),
  ]);
  res.json({ success: true, ...paginateResponse(orders, total, page, lim) });
});

// @GET /api/orders/:id
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('store', 'name logo phone location')
    .populate('customer', 'name phone')
    .populate('deliveryPartner', 'name phone avatar')
    .populate('items.product', 'name images unit');

  if (!order) throw new AppError('Order not found', 404);

  const isOwner = order.customer._id.toString() === req.user._id.toString();
  const isStoreOwner = req.user.role === 'vendor';
  const isDelivery = order.deliveryPartner?._id?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isStoreOwner && !isDelivery && !isAdmin) throw new AppError('Not authorized', 403);
  res.json({ success: true, data: order });
});

// @PUT /api/orders/:id/status - Vendor/Delivery/Admin update status
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, message } = req.body;
  const order = await Order.findById(req.params.id).populate('store');

  if (!order) throw new AppError('Order not found', 404);

  // Permission check
  const allowedTransitions = {
    vendor: { pending: ['confirmed', 'cancelled'], confirmed: ['preparing'], preparing: ['packed'], packed: ['assigned'] },
    delivery: { assigned: ['out_for_delivery'], out_for_delivery: ['delivered'] },
    admin: { pending: ['confirmed', 'cancelled'], confirmed: ['preparing', 'cancelled'], preparing: ['packed', 'cancelled'], packed: ['assigned', 'cancelled'], assigned: ['out_for_delivery', 'cancelled'], out_for_delivery: ['delivered', 'cancelled'] },
  };

  const role = req.user.role;
  const allowed = allowedTransitions[role]?.[order.status] || [];
  if (!allowed.includes(status) && role !== 'admin') {
    throw new AppError(`Cannot change status from '${order.status}' to '${status}'`, 400);
  }

  order.status = status;
  order.statusHistory.push({ status, message: message || `Order ${status}`, updatedBy: req.user._id });
  if (status === 'delivered') {
    order.actualDeliveryTime = new Date();
    order.paymentStatus = order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus;

    // Update store stats
    await Store.findByIdAndUpdate(order.store._id, {
      $inc: { totalOrders: 1, totalRevenue: order.totalAmount },
    });

    // Update delivery partner earnings
    if (order.deliveryPartner) {
      const earnings = order.deliveryFee * 0.8;
      await DeliveryPartner.findOneAndUpdate(
        { user: order.deliveryPartner },
        { $inc: { 'earnings.today': earnings, 'earnings.total': earnings, totalDeliveries: 1 }, activeOrder: null, isAvailable: true }
      );
    }
  }

  await order.save();
  broadcastOrderStatus(order);

  // Notify customer
  await createNotification(
    order.customer, 'Order Update', `Your order is now: ${status.replace(/_/g, ' ')}`, 'order_update',
    { orderId: order._id, status }
  );

  res.json({ success: true, data: order });
});

// @PUT /api/orders/:id/cancel
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (order.customer.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);

  const cancellableStatuses = ['pending', 'confirmed'];
  if (!cancellableStatuses.includes(order.status)) throw new AppError('Order cannot be cancelled at this stage', 400);

  order.status = 'cancelled';
  order.cancellationReason = req.body.reason || 'Cancelled by customer';
  order.statusHistory.push({ status: 'cancelled', message: order.cancellationReason, updatedBy: req.user._id });

  // Restore stock
  await Promise.all(order.items.map(item =>
    Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity, soldCount: -item.quantity } })
  ));

  // Refund if paid
  if (order.paymentStatus === 'paid') {
    order.paymentStatus = 'refunded';
    order.refundAmount = order.totalAmount;
    const User = require('../models/User');
    await User.findByIdAndUpdate(order.customer, { $inc: { wallet: order.totalAmount } });
  }

  await order.save();
  broadcastOrderStatus(order);
  await createNotification(order.customer, 'Order Cancelled', `Order #${order.orderNumber} cancelled`, 'order_update', { orderId: order._id });

  res.json({ success: true, data: order });
});

// @GET /api/orders/store/pending - Vendor sees store orders
exports.getStoreOrders = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) throw new AppError('No store found', 404);

  const { page = 1, limit = 20, status } = req.query;
  const query = { store: store._id };
  if (status) query.status = status;

  const { skip, limit: lim } = paginate(null, page, limit);
  const [orders, total] = await Promise.all([
    Order.find(query).sort('-createdAt').skip(skip).limit(lim)
      .populate('customer', 'name phone').populate('deliveryPartner', 'name phone'),
    Order.countDocuments(query),
  ]);

  res.json({ success: true, ...paginateResponse(orders, total, page, lim) });
});

// @POST /api/orders/:id/assign-delivery
exports.assignDeliveryPartner = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('store');
  if (!order) throw new AppError('Order not found', 404);
  if (order.status !== 'packed') throw new AppError('Order must be packed before assigning delivery', 400);

  const storeCoords = order.store.location.coordinates;
  const partners = await DeliveryPartner.find({
    isApproved: true, isAvailable: true, isOnDuty: true, activeOrder: null,
    currentLocation: {
      $geoWithin: {
        $centerSphere: [storeCoords, 10000 / 6378100],
      },
    },
  }).populate('user', 'name phone');

  const nearbyPartner = partners
    .map(partner => ({
      partner,
      distance: calculateDistance(
        storeCoords[1],
        storeCoords[0],
        partner.currentLocation.coordinates[1],
        partner.currentLocation.coordinates[0],
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.partner;

  if (!nearbyPartner) throw new AppError('No delivery partners available', 404);

  order.deliveryPartner = nearbyPartner.user._id;
  order.status = 'assigned';
  order.statusHistory.push({ status: 'assigned', message: `Assigned to ${nearbyPartner.user.name}`, updatedBy: req.user._id });
  await order.save();

  nearbyPartner.activeOrder = order._id;
  nearbyPartner.isAvailable = false;
  await nearbyPartner.save();

  await createNotification(nearbyPartner.user._id, 'New Delivery!', `Pickup from ${order.store.name}`, 'delivery', { orderId: order._id });
  broadcastOrderStatus(order);

  res.json({ success: true, data: order, deliveryPartner: nearbyPartner.user });
});

// @PUT /api/orders/:id/rate
exports.rateOrder = asyncHandler(async (req, res) => {
  const { rating, review } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (order.customer.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);
  if (order.status !== 'delivered') throw new AppError('Can only rate delivered orders', 400);
  if (order.isRated) throw new AppError('Already rated', 400);

  order.rating = rating;
  order.review = review;
  order.isRated = true;
  await order.save();

  const Review = require('../models/Review');
  await Review.create({ order: order._id, customer: req.user._id, store: order.store, storeRating: rating, comment: review });

  res.json({ success: true, message: 'Thank you for your rating!' });
});
