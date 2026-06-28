const User = require('../models/User');
const Notification = require('../models/Notification');
const { asyncHandler, AppError } = require('../utils/helpers');

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { name, phone, avatar }, { new: true, runValidators: true });
  res.json({ success: true, data: user });
});

exports.addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) {
    user.addresses.forEach(a => a.isDefault = false);
  }
  user.addresses.push(req.body);
  await user.save();
  res.json({ success: true, data: user.addresses });
});

exports.updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addressId);
  if (!addr) throw new AppError('Address not found', 404);
  if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
  Object.assign(addr, req.body);
  await user.save();
  res.json({ success: true, data: user.addresses });
});

exports.deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses.pull(req.params.addressId);
  await user.save();
  res.json({ success: true, data: user.addresses });
});

exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(50);
  const unread = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ success: true, data: notifications, unread });
});

exports.markNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  res.json({ success: true, message: 'All notifications marked as read' });
});

exports.getWalletBalance = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('wallet');
  res.json({ success: true, data: { balance: user.wallet } });
});

exports.updateFcmToken = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { fcmToken: req.body.token });
  res.json({ success: true });
});
