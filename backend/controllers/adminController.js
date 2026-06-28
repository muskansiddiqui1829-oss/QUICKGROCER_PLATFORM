const User = require('../models/User');
const Store = require('../models/Store');
const Order = require('../models/Order');
const Product = require('../models/Product');
const DeliveryPartner = require('../models/DeliveryPartner');
const Coupon = require('../models/Coupon');
const { asyncHandler, AppError, paginate, paginateResponse } = require('../utils/helpers');
const { sendEmail, emailTemplates } = require('../utils/email');
const { emitToUser } = require('../socket/socketManager');

// @GET /api/admin/dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0, 0, 0, 0);

  const [
    totalUsers, totalStores, totalOrders, pendingStores, pendingDeliveries,
    todayOrders, monthOrders, revenueData, activeOrders
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    Store.countDocuments({ isApproved: true }),
    Order.countDocuments(),
    Store.countDocuments({ isApproved: false, isActive: true }),
    DeliveryPartner.countDocuments({ isApproved: false }),
    Order.countDocuments({ createdAt: { $gte: today } }),
    Order.countDocuments({ createdAt: { $gte: thisMonth } }),
    Order.aggregate([{ $match: { status: 'delivered', paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Order.countDocuments({ status: { $in: ['pending', 'confirmed', 'preparing', 'packed', 'assigned', 'out_for_delivery'] } }),
  ]);

  const revenueByDay = await Order.aggregate([
    { $match: { status: 'delivered', createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({
    success: true,
    data: {
      stats: { totalUsers, totalStores, totalOrders, pendingStores, pendingDeliveries, todayOrders, monthOrders, totalRevenue: revenueData[0]?.total || 0, activeOrders },
      revenueByDay,
    },
  });
});

// @GET /api/admin/stores
exports.getAllStores = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, category } = req.query;
  const query = {};
  if (status === 'pending') { query.isApproved = false; query.isActive = true; }
  else if (status === 'approved') query.isApproved = true;
  if (category) query.category = category;

  const { skip, limit: lim } = paginate(null, page, limit);
  const [stores, total] = await Promise.all([
    Store.find(query).sort('-createdAt').skip(skip).limit(lim).populate('owner', 'name email phone'),
    Store.countDocuments(query),
  ]);
  res.json({ success: true, ...paginateResponse(stores, total, page, lim) });
});

// @PUT /api/admin/stores/:id/approve
exports.approveStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id).populate('owner', 'name email');
  if (!store) throw new AppError('Store not found', 404);

  store.isApproved = true;
  store.rejectionReason = undefined;
  await store.save();

  await sendEmail({ to: store.owner.email, ...emailTemplates.storeApproved(store) });
  emitToUser(store.owner._id, 'store:approved', { storeId: store._id, name: store.name });

  res.json({ success: true, message: 'Store approved', data: store });
});

// @PUT /api/admin/stores/:id/reject
exports.rejectStore = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const store = await Store.findById(req.params.id).populate('owner', 'email name');
  if (!store) throw new AppError('Store not found', 404);

  store.isApproved = false;
  store.isActive = false;
  store.rejectionReason = reason;
  await store.save();

  await sendEmail({
    to: store.owner.email,
    subject: 'Store Application Update',
    html: `<p>Your store <strong>${store.name}</strong> was not approved. Reason: ${reason}</p>`,
  });

  res.json({ success: true, message: 'Store rejected' });
});

// @GET /api/admin/users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }];

  const { skip, limit: lim } = paginate(null, page, limit);
  const [users, total] = await Promise.all([
    User.find(query).sort('-createdAt').skip(skip).limit(lim).select('-password'),
    User.countDocuments(query),
  ]);
  res.json({ success: true, ...paginateResponse(users, total, page, lim) });
});

// @PUT /api/admin/users/:id/toggle-status
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, data: { isActive: user.isActive } });
});

// @GET /api/admin/delivery-partners
exports.getDeliveryPartners = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = {};
  if (status === 'pending') query.isApproved = false;
  else if (status === 'approved') query.isApproved = true;

  const { skip, limit: lim } = paginate(null, page, limit);
  const [partners, total] = await Promise.all([
    DeliveryPartner.find(query).skip(skip).limit(lim).populate('user', 'name email phone avatar'),
    DeliveryPartner.countDocuments(query),
  ]);
  res.json({ success: true, ...paginateResponse(partners, total, page, lim) });
});

// @PUT /api/admin/delivery-partners/:id/approve
exports.approveDeliveryPartner = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.findById(req.params.id).populate('user', 'name email');
  if (!partner) throw new AppError('Partner not found', 404);
  partner.isApproved = true;
  await partner.save();
  emitToUser(partner.user._id, 'delivery:approved', { message: 'Your delivery account is approved!' });
  res.json({ success: true, message: 'Delivery partner approved' });
});

// @GET /api/admin/orders
exports.getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, startDate, endDate } = req.query;
  const query = {};
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const { skip, limit: lim } = paginate(null, page, limit);
  const [orders, total] = await Promise.all([
    Order.find(query).sort('-createdAt').skip(skip).limit(lim)
      .populate('customer', 'name phone').populate('store', 'name').populate('deliveryPartner', 'name phone'),
    Order.countDocuments(query),
  ]);
  res.json({ success: true, ...paginateResponse(orders, total, page, lim) });
});

// @POST /api/admin/coupons
exports.createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: coupon });
});

// @GET /api/admin/coupons
exports.getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort('-createdAt').populate('createdBy', 'name');
  res.json({ success: true, data: coupons });
});

// @PUT /api/admin/coupons/:id
exports.updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!coupon) throw new AppError('Coupon not found', 404);
  res.json({ success: true, data: coupon });
});

// @DELETE /api/admin/coupons/:id
exports.deleteCoupon = asyncHandler(async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Coupon deleted' });
});

// @GET /api/admin/analytics
exports.getAnalytics = asyncHandler(async (req, res) => {
  const { period = 30 } = req.query;
  const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

  const [ordersByStatus, revenueByStore, topProducts, ordersByDay] = await Promise.all([
    Order.aggregate([{ $match: { createdAt: { $gte: startDate } } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { status: 'delivered', createdAt: { $gte: startDate } } },
      { $group: { _id: '$store', revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { revenue: -1 } }, { $limit: 10 },
      { $lookup: { from: 'stores', localField: '_id', foreignField: '_id', as: 'store' } },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', count: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { count: -1 } }, { $limit: 10 },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({ success: true, data: { ordersByStatus, revenueByStore, topProducts, ordersByDay } });
});
