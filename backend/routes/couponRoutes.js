const express = require('express');
const router = express.Router();
const { validateCoupon, getAvailableCoupons } = require('../controllers/couponController');
const { protect } = require('../middleware/auth');
router.post('/validate', protect, validateCoupon);
router.get('/available', protect, getAvailableCoupons);
module.exports = router;
