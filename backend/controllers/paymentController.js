const Razorpay = require('razorpay');
const Stripe = require('stripe');
const crypto = require('crypto');
const Order = require('../models/Order');
const { asyncHandler, AppError } = require('../utils/helpers');
const { broadcastOrderStatus, emitToUser } = require('../socket/socketManager');

// Initialize Razorpay only if credentials are provided
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// Initialize Stripe only if credentials are provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);
}

// @POST /api/payments/razorpay/create-order
exports.createRazorpayOrder = asyncHandler(async (req, res) => {
  if (!razorpay) throw new AppError('Razorpay is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET', 503);
  
  const { orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);
  if (order.customer.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);

  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(order.totalAmount * 100), // paise
    currency: 'INR',
    receipt: order.orderNumber,
    notes: { orderId: order._id.toString(), customerId: req.user._id.toString() },
  });

  order.paymentDetails.razorpayOrderId = razorpayOrder.id;
  await order.save();

  res.json({
    success: true,
    data: {
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

// @POST /api/payments/razorpay/verify
exports.verifyRazorpayPayment = asyncHandler(async (req, res) => {
  if (!razorpay) throw new AppError('Razorpay is not configured', 503);
  
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (signature !== razorpaySignature) throw new AppError('Payment verification failed', 400);

  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);

  order.paymentStatus = 'paid';
  order.paymentDetails.razorpayPaymentId = razorpayPaymentId;
  order.status = 'confirmed';
  order.statusHistory.push({ status: 'confirmed', message: 'Payment confirmed via Razorpay' });
  await order.save();

  broadcastOrderStatus(order);

  res.json({ success: true, message: 'Payment verified successfully', data: order });
});

// @POST /api/payments/stripe/create-session
exports.createStripeSession = asyncHandler(async (req, res) => {
  if (!stripe) throw new AppError('Stripe is not configured. Please set STRIPE_SECRET_KEY', 503);
  
  const { orderId } = req.body;
  const order = await Order.findById(orderId).populate('items.product', 'name images');
  if (!order) throw new AppError('Order not found', 404);
  if (order.customer.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);

  const lineItems = order.items.map(item => ({
    price_data: {
      currency: 'inr',
      product_data: { name: item.name, images: item.image ? [item.image] : [] },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  // Add delivery fee
  if (order.deliveryFee > 0) {
    lineItems.push({
      price_data: { currency: 'inr', product_data: { name: 'Delivery Fee' }, unit_amount: Math.round(order.deliveryFee * 100) },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL}/order/${orderId}?payment=success`,
    cancel_url: `${process.env.FRONTEND_URL}/order/${orderId}?payment=cancel`,
    metadata: { orderId: orderId.toString() },
    discounts: order.discount > 0 ? [{ coupon: await createStripeCoupon(stripe, order.discount) }] : [],
  });

  order.paymentDetails.stripeSessionId = session.id;
  await order.save();

  res.json({ success: true, data: { sessionId: session.id, url: session.url } });
});

// @POST /api/payments/stripe/webhook
exports.stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new AppError(`Webhook error: ${err.message}`, 400);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const order = await Order.findById(session.metadata.orderId);
    if (order && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.paymentDetails.stripePaymentIntentId = session.payment_intent;
      order.status = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', message: 'Payment confirmed via Stripe' });
      await order.save();
      broadcastOrderStatus(order);
    }
  }
  res.json({ received: true });
});

// @POST /api/payments/wallet/pay
exports.payWithWallet = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const User = require('../models/User');
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404);
  if (order.customer.toString() !== req.user._id.toString()) throw new AppError('Not authorized', 403);

  const user = await User.findById(req.user._id);
  if (user.wallet < order.totalAmount) throw new AppError('Insufficient wallet balance', 400);

  user.wallet -= order.totalAmount;
  await user.save();

  order.paymentStatus = 'paid';
  order.status = 'confirmed';
  order.statusHistory.push({ status: 'confirmed', message: 'Payment via wallet' });
  await order.save();

  broadcastOrderStatus(order);
  res.json({ success: true, message: 'Payment successful via wallet', data: { walletBalance: user.wallet } });
});

const createStripeCoupon = async (stripe, discountAmount) => {
  const coupon = await stripe.coupons.create({ amount_off: Math.round(discountAmount * 100), currency: 'inr', duration: 'once' });
  return coupon.id;
};
