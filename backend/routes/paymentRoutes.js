// paymentRoutes.js
const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyRazorpayPayment, createStripeSession, stripeWebhook, payWithWallet } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/razorpay/create-order', protect, createRazorpayOrder);
router.post('/razorpay/verify', protect, verifyRazorpayPayment);
router.post('/stripe/create-session', protect, createStripeSession);
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
router.post('/wallet/pay', protect, payWithWallet);

module.exports = router;
