const express = require('express');
const router = express.Router();
const { getDashboard, getAllStores, approveStore, rejectStore, getAllUsers, toggleUserStatus, getDeliveryPartners, approveDeliveryPartner, getAllOrders, createCoupon, getCoupons, updateCoupon, deleteCoupon, getAnalytics } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));
router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);
router.get('/stores', getAllStores);
router.put('/stores/:id/approve', approveStore);
router.put('/stores/:id/reject', rejectStore);
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.get('/delivery-partners', getDeliveryPartners);
router.put('/delivery-partners/:id/approve', approveDeliveryPartner);
router.get('/orders', getAllOrders);
router.post('/coupons', createCoupon);
router.get('/coupons', getCoupons);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

module.exports = router;
