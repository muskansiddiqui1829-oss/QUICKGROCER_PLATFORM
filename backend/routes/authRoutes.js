const express = require('express');
const router = express.Router();
const { register, login, refreshToken, forgotPassword, resetPassword, getMe, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authValidators, validate } = require('../middleware/validate');

router.post('/register', authValidators.register, validate, register);
router.post('/login', authValidators.login, validate, login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', authValidators.forgotPassword, validate, forgotPassword);
router.put('/reset-password/:token', authValidators.resetPassword, validate, resetPassword);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePassword);

module.exports = router;
