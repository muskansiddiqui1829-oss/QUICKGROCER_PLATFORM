const Coupon = require('../models/Coupon');
const { asyncHandler, AppError } = require('../utils/helpers');

// @POST /api/coupons/validate
exports.validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderTotal, storeId } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (!coupon) throw new AppError('Invalid coupon code', 404);

  const validity = coupon.isValid(req.user._id, orderTotal, storeId);
  if (!validity.valid) throw new AppError(validity.message, 400);

  const discount = coupon.calculateDiscount(orderTotal, req.body.deliveryFee || 0);
  res.json({ success: true, data: { coupon: { _id: coupon._id, code: coupon.code, type: coupon.type, value: coupon.value, description: coupon.description }, discount } });
});

// @GET /api/coupons/available
exports.getAvailableCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.find({
    isActive: true, validFrom: { $lte: now }, validUntil: { $gte: now },
    usedBy: { $ne: req.user._id },
  }).select('-usedBy -createdBy');
  res.json({ success: true, data: coupons });
});
