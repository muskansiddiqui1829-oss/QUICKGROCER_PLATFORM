const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: String,
  type: { type: String, enum: ['percentage', 'fixed', 'free_delivery'], required: true },
  value: { type: Number, required: true, min: 0 },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: null },
  usageLimit: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  userUsageLimit: { type: Number, default: 1 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  applicableStores: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Store' }], // empty = all stores
  applicableCategories: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

couponSchema.methods.isValid = function (userId, orderTotal, storeId) {
  const now = new Date();
  if (!this.isActive) return { valid: false, message: 'Coupon is not active' };
  if (now < this.validFrom || now > this.validUntil) return { valid: false, message: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (orderTotal < this.minOrderAmount) return { valid: false, message: `Minimum order ₹${this.minOrderAmount} required` };
  const userUseCount = this.usedBy.filter(id => id.toString() === userId.toString()).length;
  if (userUseCount >= this.userUsageLimit) return { valid: false, message: 'You have already used this coupon' };
  if (this.applicableStores.length > 0 && !this.applicableStores.some(s => s.toString() === storeId.toString()))
    return { valid: false, message: 'Coupon not valid for this store' };
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (orderTotal, deliveryFee) {
  if (this.type === 'free_delivery') return deliveryFee;
  if (this.type === 'fixed') return Math.min(this.value, orderTotal);
  if (this.type === 'percentage') {
    const discount = (orderTotal * this.value) / 100;
    return this.maxDiscount ? Math.min(discount, this.maxDiscount) : discount;
  }
  return 0;
};

module.exports = mongoose.model('Coupon', couponSchema);
