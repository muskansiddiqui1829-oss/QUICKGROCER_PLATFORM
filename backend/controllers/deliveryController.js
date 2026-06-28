const DeliveryPartner = require('../models/DeliveryPartner');
const Order = require('../models/Order');
const { asyncHandler, AppError, paginate, paginateResponse } = require('../utils/helpers');

// @GET /api/delivery/profile
exports.getProfile = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findOne({ user: req.user._id }).populate('user', 'name email phone avatar');
  if (!partner) throw new AppError('Delivery profile not found', 404);
  res.json({ success: true, data: partner });
});

// @PUT /api/delivery/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { vehicleType, vehicleNumber, licenseNumber, bankDetails } = req.body;
  const partner = await DeliveryPartner.findOneAndUpdate(
    { user: req.user._id },
    { vehicleType, vehicleNumber, licenseNumber, bankDetails },
    { new: true, runValidators: true }
  );
  if (!partner) throw new AppError('Profile not found', 404);
  res.json({ success: true, data: partner });
});

// @PUT /api/delivery/location
exports.updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  await DeliveryPartner.findOneAndUpdate(
    { user: req.user._id },
    { currentLocation: { type: 'Point', coordinates: [lng, lat], updatedAt: new Date() } }
  );
  res.json({ success: true, message: 'Location updated' });
});

// @PUT /api/delivery/toggle-duty
exports.toggleDuty = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findOne({ user: req.user._id });
  if (!partner) throw new AppError('Profile not found', 404);
  if (!partner.isApproved) throw new AppError('Profile not yet approved', 403);

  partner.isOnDuty = !partner.isOnDuty;
  partner.isAvailable = partner.isOnDuty;
  await partner.save();
  res.json({ success: true, data: { isOnDuty: partner.isOnDuty, isAvailable: partner.isAvailable } });
});

// @GET /api/delivery/orders
exports.getMyDeliveries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = { deliveryPartner: req.user._id };
  if (status) query.status = status;

  const { skip, limit: lim } = paginate(null, page, limit);
  const [orders, total] = await Promise.all([
    Order.find(query).sort('-createdAt').skip(skip).limit(lim)
      .populate('store', 'name location').populate('customer', 'name phone'),
    Order.countDocuments(query),
  ]);
  res.json({ success: true, ...paginateResponse(orders, total, page, lim) });
});

// @GET /api/delivery/active-order
exports.getActiveOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    deliveryPartner: req.user._id,
    status: { $in: ['assigned', 'out_for_delivery'] },
  }).populate('store', 'name location phone').populate('customer', 'name phone').populate('items.product', 'name images');
  res.json({ success: true, data: order });
});

// @PUT /api/delivery/orders/:id/pickup
exports.confirmPickup = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (order.deliveryPartner.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);
  if (order.status !== 'assigned') throw new AppError('Order must be assigned first', 400);

  order.status = 'out_for_delivery';
  order.statusHistory.push({ status: 'out_for_delivery', message: 'Picked up from store', updatedBy: req.user._id });
  await order.save();

  const { broadcastOrderStatus } = require('../socket/socketManager');
  broadcastOrderStatus(order);
  res.json({ success: true, data: order });
});

// @PUT /api/delivery/orders/:id/deliver
exports.confirmDelivery = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  if (order.deliveryPartner.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);
  if (order.status !== 'out_for_delivery') throw new AppError('Order must be out for delivery', 400);
  if (order.otp !== otp) throw new AppError('Invalid OTP', 400);

  order.status = 'delivered';
  order.actualDeliveryTime = new Date();
  order.paymentStatus = order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus;
  order.statusHistory.push({ status: 'delivered', message: 'Delivered successfully', updatedBy: req.user._id });
  await order.save();

  // Update earnings
  const earnings = order.deliveryFee * 0.8;
  await DeliveryPartner.findOneAndUpdate(
    { user: req.user._id },
    { $inc: { 'earnings.today': earnings, 'earnings.total': earnings, totalDeliveries: 1 }, activeOrder: null, isAvailable: true }
  );

  const { broadcastOrderStatus } = require('../socket/socketManager');
  broadcastOrderStatus(order);
  res.json({ success: true, message: 'Delivery confirmed!', data: order });
});

// @GET /api/delivery/earnings
exports.getEarnings = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findOne({ user: req.user._id });
  if (!partner) throw new AppError('Profile not found', 404);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0, 0, 0, 0);

  const [todayOrders, weekOrders] = await Promise.all([
    Order.find({ deliveryPartner: req.user._id, status: 'delivered', actualDeliveryTime: { $gte: today } }),
    Order.find({ deliveryPartner: req.user._id, status: 'delivered', actualDeliveryTime: { $gte: weekStart } }),
  ]);

  res.json({
    success: true,
    data: {
      earnings: partner.earnings,
      totalDeliveries: partner.totalDeliveries,
      todayDeliveries: todayOrders.length,
      weekDeliveries: weekOrders.length,
      ratings: partner.ratings,
    },
  });
});

// @GET /api/delivery/dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findOne({ user: req.user._id });
  if (!partner) throw new AppError('Profile not found', 404);

  const activeOrder = await Order.findOne({
    deliveryPartner: req.user._id,
    status: { $in: ['assigned', 'out_for_delivery'] },
  }).populate('store', 'name location').populate('customer', 'name phone');

  res.json({
    success: true,
    data: {
      partner,
      activeOrder,
      isOnDuty: partner.isOnDuty,
      isAvailable: partner.isAvailable,
    },
  });
});
