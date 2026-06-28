// cartRoutes.js
const express = require('express');
const router = express.Router();
const { validateCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');
router.post('/validate', protect, validateCart);
module.exports = router;
