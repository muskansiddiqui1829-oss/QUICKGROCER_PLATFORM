const express = require('express');
const router = express.Router();
const { uploadImage, uploadMultiple, deleteImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

router.post('/single', protect, (req, res, next) => {
  req.uploadFolder = req.query.folder || 'misc';
  next();
}, upload.single('image'), uploadImage);

router.post('/multiple', protect, (req, res, next) => {
  req.uploadFolder = req.query.folder || 'misc';
  next();
}, upload.array('images', 5), uploadMultiple);

router.delete('/', protect, deleteImage);

module.exports = router;
