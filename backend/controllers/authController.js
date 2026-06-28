const crypto = require('crypto');
const User = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner');
const { asyncHandler, AppError } = require('../utils/helpers');
const { sendEmail, emailTemplates } = require('../utils/email');

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();
  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      wallet: user.wallet,
    },
  });
};

// @route POST /api/auth/register
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, phone, password, role = 'customer' } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError('Email already registered', 400);

  const user = await User.create({ name, email, phone, password, role });

  // Create delivery partner profile if role is delivery
  if (role === 'delivery') {
    await DeliveryPartner.create({ user: user._id, vehicleType: 'bike', vehicleNumber: 'PENDING', licenseNumber: 'PENDING' });
  }

  sendTokenResponse(user, 201, res);
});

// @route POST /api/auth/login
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isActive) throw new AppError('Account deactivated. Contact support.', 401);

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @route POST /api/auth/refresh-token
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token required', 400);

  const jwt = require('jsonwebtoken');
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) throw new AppError('Invalid refresh token', 401);

  const newToken = user.generateAuthToken();
  res.json({ success: true, token: newToken });
});

// @route POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw new AppError('No user with that email', 404);

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const template = emailTemplates.passwordReset(resetToken);
  await sendEmail({ to: user.email, ...template });

  res.json({ success: true, message: 'Password reset email sent' });
});

// @route PUT /api/auth/reset-password/:token
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) throw new AppError('Invalid or expired token', 400);

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @route GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
});

// @route PUT /api/auth/update-password
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }
  user.password = req.body.newPassword;
  await user.save();
  sendTokenResponse(user, 200, res);
});
