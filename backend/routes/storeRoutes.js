// storeRoutes.js
const express = require('express');
const router = express.Router();
const { getNearbyStores, getStore, createStore, updateStore, getMyStore, toggleStoreStatus, getStoreDashboard } = require('../controllers/storeController');
const { protect, authorize } = require('../middleware/auth');

router.get('/nearby', getNearbyStores);
router.get('/my-store', protect, authorize('vendor'), getMyStore);
router.get('/dashboard', protect, authorize('vendor'), getStoreDashboard);
router.get('/:id', getStore);
router.post('/', protect, createStore);
router.put('/:id', protect, authorize('vendor'), updateStore);
router.put('/:id/toggle-status', protect, authorize('vendor'), toggleStoreStatus);

module.exports = router;
