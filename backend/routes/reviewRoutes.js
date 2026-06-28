const express = require('express');
const router = express.Router();
const { getStoreReviews, createReview, replyToReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
router.get('/store/:storeId', getStoreReviews);
router.post('/', protect, authorize('customer'), createReview);
router.put('/:id/reply', protect, authorize('vendor'), replyToReview);
module.exports = router;
