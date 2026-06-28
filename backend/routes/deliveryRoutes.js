const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateLocation, toggleDuty, getMyDeliveries, getActiveOrder, confirmPickup, confirmDelivery, getEarnings, getDashboard } = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('delivery'));
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/location', updateLocation);
router.put('/toggle-duty', toggleDuty);
router.get('/orders', getMyDeliveries);
router.get('/active-order', getActiveOrder);
router.get('/earnings', getEarnings);
router.get('/dashboard', getDashboard);
router.put('/orders/:id/pickup', confirmPickup);
router.put('/orders/:id/deliver', confirmDelivery);

module.exports = router;
