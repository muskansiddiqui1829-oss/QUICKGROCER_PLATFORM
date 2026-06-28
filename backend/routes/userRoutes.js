const express = require('express');
const router = express.Router();
const { updateProfile, addAddress, updateAddress, deleteAddress, getNotifications, markNotificationsRead, getWalletBalance, updateFcmToken } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.put('/profile', updateProfile);
router.get('/notifications', getNotifications);
router.put('/notifications/read', markNotificationsRead);
router.get('/wallet', getWalletBalance);
router.put('/fcm-token', updateFcmToken);
router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);

module.exports = router;
