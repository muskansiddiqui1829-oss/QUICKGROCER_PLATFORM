const crypto = require('crypto');

// Calculate distance between two coordinates (Haversine formula) - returns km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => (deg * Math.PI) / 180;

// Dynamic delivery fee calculation
const calculateDeliveryFee = (distanceKm, orderTotal) => {
  const BASE_FEE = 20;
  const PER_KM_RATE = 5;
  const FREE_DELIVERY_THRESHOLD = 499;

  if (orderTotal >= FREE_DELIVERY_THRESHOLD) return 0;
  const fee = BASE_FEE + Math.ceil(distanceKm) * PER_KM_RATE;
  return Math.min(fee, 100); // cap at ₹100
};

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

// Paginate query
const paginate = (query, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit) };
};

// Build pagination response
const paginateResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    limit: parseInt(limit),
  },
});

// Error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
  calculateDistance,
  calculateDeliveryFee,
  generateOTP,
  generateOrderNumber,
  paginate,
  paginateResponse,
  AppError,
  asyncHandler,
};
