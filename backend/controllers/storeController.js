const Store = require('../models/Store');
const User = require('../models/User');
const { asyncHandler, AppError, calculateDistance, paginate, paginateResponse } = require('../utils/helpers');
const { cacheGet, cacheSet, cacheDel, cacheDelPattern } = require('../config/redis');
const { sendEmail, emailTemplates } = require('../utils/email');

// @GET /api/stores/nearby?lat=&lng=&radius=&category=
exports.getNearbyStores = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5, category, page = 1, limit = 20 } = req.query;
  if (!lat || !lng) throw new AppError('Location coordinates required', 400);

  const cacheKey = `stores:nearby:${lat}:${lng}:${radius}:${category || 'all'}:${page}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json({ success: true, ...cached });

  const query = {
    isApproved: true,
    isActive: true,
    location: {
      $geoWithin: {
        $centerSphere: [[parseFloat(lng), parseFloat(lat)], parseFloat(radius) / 6378.1],
      },
    },
  };
  if (category) query.category = category;

  const stores = await Store.find(query).populate('owner', 'name phone');
  const storesWithDistance = stores.map(s => {
    const dist = calculateDistance(parseFloat(lat), parseFloat(lng), s.location.coordinates[1], s.location.coordinates[0]);
    return { ...s.toObject(), distance: Math.round(dist * 10) / 10 };
  }).sort((a, b) => a.distance - b.distance);

  const total = storesWithDistance.length;
  const { skip, limit: lim } = paginate(null, page, limit);
  const pagedStores = storesWithDistance.slice(skip, skip + lim);
  const result = paginateResponse(pagedStores, total, page, lim);
  await cacheSet(cacheKey, result, 120);
  res.json({ success: true, ...result });
});

// @GET /api/stores/:id
exports.getStore = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id).populate('owner', 'name phone email');
  if (!store) throw new AppError('Store not found', 404);
  res.json({ success: true, data: store });
});

// @POST /api/stores - Vendor creates store
exports.createStore = asyncHandler(async (req, res) => {
  const existing = await Store.findOne({ owner: req.user._id });
  if (existing) throw new AppError('You already have a store', 400);

  const store = await Store.create({ ...req.body, owner: req.user._id });
  await User.findByIdAndUpdate(req.user._id, { role: 'vendor' });

  res.status(201).json({ success: true, message: 'Store created. Awaiting admin approval.', data: store });
});

// @PUT /api/stores/:id - Vendor updates own store
exports.updateStore = asyncHandler(async (req, res) => {
  let store = await Store.findById(req.params.id);
  if (!store) throw new AppError('Store not found', 404);
  if (store.owner.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);

  store = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  await cacheDelPattern(`stores:nearby:*`);
  res.json({ success: true, data: store });
});

// @GET /api/stores/my-store - Vendor's own store
exports.getMyStore = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) throw new AppError('No store found', 404);
  res.json({ success: true, data: store });
});

// @PUT /api/stores/:id/toggle-status
exports.toggleStoreStatus = asyncHandler(async (req, res) => {
  const store = await Store.findById(req.params.id);
  if (!store) throw new AppError('Store not found', 404);
  if (store.owner.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);

  store.isOpen = !store.isOpen;
  await store.save();
  res.json({ success: true, data: { isOpen: store.isOpen } });
});

// @GET /api/stores/:id/dashboard - Vendor dashboard stats
exports.getStoreDashboard = asyncHandler(async (req, res) => {
  const Order = require('../models/Order');
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) throw new AppError('Store not found', 404);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [todayOrders, pendingOrders, totalOrders, revenueData] = await Promise.all([
    Order.countDocuments({ store: store._id, createdAt: { $gte: today } }),
    Order.countDocuments({ store: store._id, status: { $in: ['pending', 'confirmed', 'preparing', 'packed'] } }),
    Order.countDocuments({ store: store._id }),
    Order.aggregate([
      { $match: { store: store._id, status: 'delivered', paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      store,
      stats: {
        todayOrders,
        pendingOrders,
        totalOrders,
        totalRevenue: revenueData[0]?.total || 0,
        ratings: store.ratings,
      },
    },
  });
});
