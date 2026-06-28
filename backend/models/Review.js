const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  storeRating: { type: Number, min: 1, max: 5 },
  productRating: { type: Number, min: 1, max: 5 },
  deliveryRating: { type: Number, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 },
  images: [String],
  isVerified: { type: Boolean, default: true },
  reply: { type: String, maxlength: 300 },
  repliedAt: Date,
}, { timestamps: true });

reviewSchema.index({ store: 1, createdAt: -1 });
reviewSchema.index({ product: 1 });

// Update store ratings after save
reviewSchema.post('save', async function () {
  const Store = mongoose.model('Store');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { store: this.store, storeRating: { $exists: true } } },
    { $group: { _id: '$store', avg: { $avg: '$storeRating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length) {
    await Store.findByIdAndUpdate(this.store, {
      'ratings.average': Math.round(stats[0].avg * 10) / 10,
      'ratings.count': stats[0].count,
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
