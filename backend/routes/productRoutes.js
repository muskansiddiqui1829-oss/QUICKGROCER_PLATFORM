const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getMyProducts, updateStock, getCategories } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { productValidators, validate } = require('../middleware/validate');

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/my-products', protect, authorize('vendor'), getMyProducts);
router.get('/:id', getProduct);
router.post('/', protect, authorize('vendor'), productValidators.create, validate, createProduct);
router.put('/:id', protect, authorize('vendor'), updateProduct);
router.put('/:id/stock', protect, authorize('vendor'), updateStock);
router.delete('/:id', protect, authorize('vendor'), deleteProduct);

module.exports = router;
