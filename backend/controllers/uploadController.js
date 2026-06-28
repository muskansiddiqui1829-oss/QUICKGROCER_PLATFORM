const { cloudinary } = require('../config/cloudinary');
const { asyncHandler, AppError } = require('../utils/helpers');

exports.uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('No file uploaded', 400);
  res.json({ success: true, data: { url: req.file.path, publicId: req.file.filename } });
});

exports.uploadMultiple = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) throw new AppError('No files uploaded', 400);
  const urls = req.files.map(f => ({ url: f.path, publicId: f.filename }));
  res.json({ success: true, data: urls });
});

exports.deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.body;
  if (!publicId) throw new AppError('Public ID required', 400);
  await cloudinary.uploader.destroy(publicId);
  res.json({ success: true, message: 'Image deleted' });
});
