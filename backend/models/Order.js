const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  image: String,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit: String,
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  items: [orderItemSchema],
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'packed', 'assigned', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    message: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  deliveryAddress: {
    label: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
  },
  paymentMethod: { type: String, enum: ['cod', 'razorpay', 'stripe', 'wallet'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    stripeSessionId: String,
    stripePaymentIntentId: String,
  },
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  distance: Number,
  specialInstructions: String,
  cancellationReason: String,
  refundAmount: { type: Number, default: 0 },
  rating: { type: Number, min: 1, max: 5 },
  review: String,
  otp: String, // delivery OTP
  isRated: { type: Boolean, default: false },
}, { timestamps: true });

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ store: 1, status: 1 });
orderSchema.index({ deliveryPartner: 1, status: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
