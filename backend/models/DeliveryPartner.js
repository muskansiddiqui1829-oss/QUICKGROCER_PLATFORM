const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  vehicleType: { type: String, enum: ['bike', 'bicycle', 'scooter'], required: true },
  vehicleNumber: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  documents: {
    license: String,
    vehicleRC: String,
    aadhar: String,
  },
  isApproved: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: false },
  isOnDuty: { type: Boolean, default: false },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    updatedAt: { type: Date, default: Date.now },
  },
  activeOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  earnings: {
    today: { type: Number, default: 0 },
    thisWeek: { type: Number, default: 0 },
    thisMonth: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  totalDeliveries: { type: Number, default: 0 },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    accountHolderName: String,
    upiId: String,
  },
  workingArea: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number],
    radius: { type: Number, default: 10 }, // km
  },
}, { timestamps: true });

deliveryPartnerSchema.index({ currentLocation: '2dsphere' });
deliveryPartnerSchema.index({ workingArea: '2dsphere' });

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
