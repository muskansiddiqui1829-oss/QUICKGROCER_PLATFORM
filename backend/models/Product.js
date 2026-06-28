const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  name: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, maxlength: 1000 },
  images: [{ type: String }],
  category: { type: String, required: true },
  subCategory: String,
  brand: String,
  sku: String,
  price: { type: Number, required: true, min: 0 },
  mrp: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  unit: { type: String, default: 'piece', enum: ['piece', 'kg', 'g', 'litre', 'ml', 'dozen', 'pack', 'box', 'bottle'] },
  quantity: { type: Number, default: 1 },
  stock: { type: Number, required: true, default: 0 },
  minOrderQty: { type: Number, default: 1 },
  maxOrderQty: { type: Number, default: 20 },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  tags: [String],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
  },
  expiryDate: Date,
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  soldCount: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.index({ store: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });

productSchema.virtual('finalPrice').get(function () {
  return this.price;
});

module.exports = mongoose.model('Product', productSchema);
