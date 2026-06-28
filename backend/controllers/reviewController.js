// reviewController.js
const Review = require('../models/Review');
const { asyncHandler, AppError, paginate, paginateResponse } = require('../utils/helpers');

exports.getStoreReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { skip, limit: lim } = paginate(null, page, limit);
  const [reviews, total] = await Promise.all([
    Review.find({ store: req.params.storeId }).sort('-createdAt').skip(skip).limit(lim).populate('customer', 'name avatar'),
    Review.countDocuments({ store: req.params.storeId }),
  ]);
  res.json({ success: true, ...paginateResponse(reviews, total, page, lim) });
});

exports.createReview = asyncHandler(async (req, res) => {
  const Order = require('../models/Order');
  const order = await Order.findOne({ _id: req.body.orderId, customer: req.user._id, status: 'delivered' });
  if (!order) throw new AppError('Cannot review this order', 403);
  if (order.isRated) throw new AppError('Already reviewed', 400);

  const review = await Review.create({ ...req.body, customer: req.user._id, store: order.store, order: order._id });
  order.isRated = true;
  await order.save();
  res.status(201).json({ success: true, data: review });
});

exports.replyToReview = asyncHandler(async (req, res) => {
  const Store = require('../models/Store');
  const review = await Review.findById(req.params.id).populate('store');
  if (!review) throw new AppError('Review not found', 404);
  if (review.store.owner.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);
  review.reply = req.body.reply;
  review.repliedAt = new Date();
  await review.save();
  res.json({ success: true, data: review });
});
