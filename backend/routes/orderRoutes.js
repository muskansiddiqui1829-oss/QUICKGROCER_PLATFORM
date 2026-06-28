const express = require('express');
const router = express.Router();
const { placeOrder, getMyOrders, getOrder, updateOrderStatus, cancelOrder, getStoreOrders, assignDeliveryPartner, rateOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');
const { orderValidators, validate } = require('../middleware/validate');

router.post('/', protect, authorize('customer'), orderValidators.place, validate, placeOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/store-orders', protect, authorize('vendor'), getStoreOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, authorize('vendor', 'delivery', 'admin'), updateOrderStatus);
router.put('/:id/cancel', protect, authorize('customer'), cancelOrder);
router.post('/:id/assign-delivery', protect, authorize('vendor', 'admin'), assignDeliveryPartner);
router.put('/:id/rate', protect, authorize('customer'), rateOrder);

module.exports = router;
