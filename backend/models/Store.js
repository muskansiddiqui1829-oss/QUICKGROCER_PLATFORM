const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  logo: { type: String, default: '' },
  banner: { type: String, default: '' },
  category: {
    type: String,
    enum: ['grocery', 'fruits_vegetables', 'dairy', 'bakery', 'meat_seafood', 'beverages', 'snacks', 'organic', 'general'],
    required: true,
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
    address: String,
    city: String,
    state: String,
    pincode: String,
  },
  deliveryRadius: { type: Number, default: 5 }, // in km
  deliveryTime: { type: String, default: '30-45 mins' },
  minOrderAmount: { type: Number, default: 99 },
  isOpen: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  openingHours: {
    monday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    tuesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    wednesday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    thursday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    friday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    saturday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
    sunday: { open: String, close: String, isOpen: { type: Boolean, default: true } },
  },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    upiId: String,
  },
  documents: {
    gstNumber: String,
    fssaiNumber: String,
    panNumber: String,
  },
  tags: [String],
  rejectionReason: String,
}, { timestamps: true });

storeSchema.index({ location: '2dsphere' });
storeSchema.index({ isApproved: 1, isActive: 1 });

module.exports = mongoose.model('Store', storeSchema);
