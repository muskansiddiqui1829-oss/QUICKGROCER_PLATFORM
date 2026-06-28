const Product = require('../models/Product');
const Store = require('../models/Store');
const mongoose = require('mongoose');
const { asyncHandler, AppError, paginate, paginateResponse } = require('../utils/helpers');
const { cacheGet, cacheSet, cacheDel, cacheDelPattern } = require('../config/redis');

// @GET /api/products?storeId=&category=&search=&page=&limit=
exports.getProducts = asyncHandler(async (req, res) => {
  const { storeId, category, search, page = 1, limit = 20, featured, sort = '-createdAt' } = req.query;
  const query = { isActive: true };

  if (storeId) query.store = storeId;
  if (category) query.category = category;
  if (featured === 'true') query.isFeatured = true;
  if (search) query.$text = { $search: search };

  const cacheKey = `products:${JSON.stringify(query)}:${page}:${sort}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json({ success: true, ...cached });

  const { skip, limit: lim } = paginate(null, page, limit);
  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(lim)
      .populate('store', 'name logo isOpen'),
    Product.countDocuments(query),
  ]);

  const result = paginateResponse(products, total, page, lim);
  await cacheSet(cacheKey, result, 300);
  res.json({ success: true, ...result });
});

// @GET /api/products/:id
exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('store', 'name logo isOpen deliveryTime');
  if (!product || !product.isActive) throw new AppError('Product not found', 404);
  res.json({ success: true, data: product });
});

// @POST /api/products - Vendor adds product
exports.createProduct = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id, isApproved: true });
  if (!store) throw new AppError('Approved store required to add products', 403);

  const product = await Product.create({ ...req.body, store: store._id });
  await cacheDelPattern(`products:*`);
  res.status(201).json({ success: true, data: product });
});

// @PUT /api/products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('store');
  if (!product) throw new AppError('Product not found', 404);
  if (product.store.owner.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);

  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  await cacheDelPattern(`products:*`);
  res.json({ success: true, data: updated });
});

// @DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('store');
  if (!product) throw new AppError('Product not found', 404);
  if (product.store.owner.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);

  product.isActive = false;
  await product.save();
  await cacheDelPattern(`products:*`);
  res.json({ success: true, message: 'Product removed' });
});

// @GET /api/products/store/my-products - All vendor products
exports.getMyProducts = asyncHandler(async (req, res) => {
  const store = await Store.findOne({ owner: req.user._id });
  if (!store) throw new AppError('No store found', 404);

  const { page = 1, limit = 50, category, search } = req.query;
  const query = { store: store._id };
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const { skip, limit: lim } = paginate(null, page, limit);
  const [products, total] = await Promise.all([
    Product.find(query).sort('-createdAt').skip(skip).limit(lim),
    Product.countDocuments(query),
  ]);

  res.json({ success: true, ...paginateResponse(products, total, page, lim) });
});

// @PUT /api/products/:id/stock
exports.updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body;
  const product = await Product.findById(req.params.id).populate('store');
  if (!product) throw new AppError('Product not found', 404);
  if (product.store.owner.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);

  product.stock = stock;
  await product.save();
  res.json({ success: true, data: { stock: product.stock } });
});

// @GET /api/products/categories
exports.getCategories = asyncHandler(async (req, res) => {
  const { storeId } = req.query;
  const match = { isActive: true };
  if (storeId) match.store = new mongoose.Types.ObjectId(storeId);

  const categories = await Product.aggregate([
    { $match: match },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  res.json({ success: true, data: categories });
});
