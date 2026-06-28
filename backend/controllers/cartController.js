// cartController.js
const Product = require('../models/Product');
const { asyncHandler, AppError } = require('../utils/helpers');

// In-memory cart is handled by client; server-side cart for persistence uses User model addresses
// This controller validates cart items before checkout

exports.validateCart = asyncHandler(async (req, res) => {
  const { items } = req.body;
  const validated = [];
  let total = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId).populate('store', 'name isOpen isApproved');
    if (!product || !product.isActive) {
      validated.push({ ...item, error: 'Product no longer available', available: false });
      continue;
    }
    if (!product.store.isOpen || !product.store.isApproved) {
      validated.push({ ...item, error: 'Store is closed', available: false });
      continue;
    }
    if (product.stock < item.quantity) {
      validated.push({ ...item, availableStock: product.stock, error: `Only ${product.stock} in stock`, available: false });
      continue;
    }
    validated.push({ ...item, price: product.price, name: product.name, image: product.images[0], available: true });
    total += product.price * item.quantity;
  }

  res.json({ success: true, data: { items: validated, subtotal: total } });
});
