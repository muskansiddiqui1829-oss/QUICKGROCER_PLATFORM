const { validationResult, body, param, query } = require('express-validator');
const { AppError } = require('../utils/helpers');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map(e => e.msg).join(', ');
    return next(new AppError(message, 400));
  }
  next();
};

const authValidators = {
  register: [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Valid Indian phone required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['customer', 'vendor', 'delivery']).withMessage('Invalid role'),
  ],
  login: [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  forgotPassword: [body('email').isEmail().withMessage('Valid email required')],
  resetPassword: [body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
};

const storeValidators = {
  create: [
    body('name').trim().notEmpty().withMessage('Store name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('location.coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates [lng, lat] required'),
    body('location.address').notEmpty().withMessage('Address is required'),
  ],
};

const productValidators = {
  create: [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
    body('mrp').isFloat({ min: 0 }).withMessage('Valid MRP required'),
    body('stock').isInt({ min: 0 }).withMessage('Valid stock required'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
};

const orderValidators = {
  place: [
    body('storeId').isMongoId().withMessage('Valid store ID required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('deliveryAddress').notEmpty().withMessage('Delivery address required'),
    body('paymentMethod').isIn(['cod', 'razorpay', 'stripe', 'wallet']).withMessage('Invalid payment method'),
  ],
};

module.exports = { validate, authValidators, storeValidators, productValidators, orderValidators };
