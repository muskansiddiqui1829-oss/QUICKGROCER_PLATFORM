const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');

const vendorEmail = 'vendor@quickgrocer.com';
const vendorPassword = 'Vendor@123456';

const storeSeeds = [
  {
    name: 'Fresh Basket',
    description: 'Fresh vegetables, fruits, dairy and pantry essentials delivered quickly.',
    category: 'fruits_vegetables',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716],
      address: 'MG Road, Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001',
    },
    deliveryRadius: 6,
    deliveryTime: '20-30 mins',
    minOrderAmount: 199,
    isOpen: true,
    isApproved: true,
    isActive: true,
    tags: ['fresh', 'local', 'organic'],
  },
  {
    name: 'Daily Mart',
    description: 'Quick grocery essentials, snacks, beverages and household basics.',
    category: 'grocery',
    location: {
      type: 'Point',
      coordinates: [77.6090, 12.9352],
      address: 'Koramangala, Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
    },
    deliveryRadius: 5,
    deliveryTime: '25-35 mins',
    minOrderAmount: 149,
    isOpen: true,
    isApproved: true,
    isActive: true,
    tags: ['essentials', 'household', 'daily'],
  },
  {
    name: 'Baker & Dairy Hub',
    description: 'Bakery favorites, milk, breads, curd, and breakfast staples.',
    category: 'bakery',
    location: {
      type: 'Point',
      coordinates: [77.5678, 12.9784],
      address: 'Indiranagar, Bengaluru',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    deliveryRadius: 7,
    deliveryTime: '18-28 mins',
    minOrderAmount: 179,
    isOpen: true,
    isApproved: true,
    isActive: true,
    tags: ['bakery', 'dairy', 'breakfast'],
  },
];

const productSeeds = [
  {
    name: 'Farm Fresh Tomatoes',
    category: 'fruits_vegetables',
    subCategory: 'Vegetables',
    price: 42,
    mrp: 55,
    unit: 'kg',
    stock: 60,
    minOrderQty: 1,
    maxOrderQty: 8,
    images: ['https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80'],
    description: 'Fresh red tomatoes from local farms.',
    isFeatured: true,
    tags: ['fresh', 'veg'],
  },
  {
    name: 'Banana Bunch',
    category: 'fruits_vegetables',
    subCategory: 'Fruits',
    price: 64,
    mrp: 80,
    unit: 'dozen',
    stock: 45,
    minOrderQty: 1,
    maxOrderQty: 6,
    images: ['https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=900&q=80'],
    description: 'Sweet and ripe bananas packed fresh.',
    tags: ['fruit', 'healthy'],
  },
  {
    name: 'Classic White Bread',
    category: 'bakery',
    subCategory: 'Bread',
    price: 48,
    mrp: 60,
    unit: 'piece',
    stock: 30,
    minOrderQty: 1,
    maxOrderQty: 10,
    images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80'],
    description: 'Soft and fresh white bread baked daily.',
    isFeatured: true,
    tags: ['bakery', 'breakfast'],
  },
  {
    name: 'Full Cream Milk',
    category: 'dairy',
    subCategory: 'Milk',
    price: 58,
    mrp: 70,
    unit: 'litre',
    stock: 40,
    minOrderQty: 1,
    maxOrderQty: 5,
    images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80'],
    description: 'Rich full cream milk sourced from trusted dairy farms.',
    tags: ['milk', 'dairy'],
  },
  {
    name: 'Basmati Rice 5kg',
    category: 'grocery',
    subCategory: 'Rice',
    price: 390,
    mrp: 450,
    unit: 'pack',
    stock: 25,
    minOrderQty: 1,
    maxOrderQty: 3,
    images: ['https://images.unsplash.com/photo-1586201375761-83865001a9ac?auto=format&fit=crop&w=900&q=80'],
    description: 'Premium long grain basmati rice for daily meals.',
    isFeatured: true,
    tags: ['rice', 'basmati', 'staple'],
  },
  {
    name: 'Coca Cola 250ml',
    category: 'beverages',
    subCategory: 'Soft Drinks',
    price: 52,
    mrp: 70,
    unit: 'bottle',
    stock: 70,
    minOrderQty: 1,
    maxOrderQty: 10,
    images: ['https://images.unsplash.com/photo-1622483767028-3f66f2b0c1d6?auto=format&fit=crop&w=900&q=80'],
    description: 'Refreshing chilled cola for quick energy boosts.',
    tags: ['drink', 'cold'],
  },
  {
    name: 'Potato 1kg',
    category: 'fruits_vegetables',
    subCategory: 'Vegetables',
    price: 34,
    mrp: 45,
    unit: 'kg',
    stock: 50,
    minOrderQty: 1,
    maxOrderQty: 6,
    images: ['https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=900&q=80'],
    description: 'Fresh, clean and ready-to-cook potatoes.',
    tags: ['veg', 'fresh'],
  },
  {
    name: 'Paneer Cubes',
    category: 'dairy',
    subCategory: 'Cottage Cheese',
    price: 110,
    mrp: 130,
    unit: 'pack',
    stock: 22,
    minOrderQty: 1,
    maxOrderQty: 4,
    images: ['https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=80'],
    description: 'Soft paneer cubes perfect for curries and snacks.',
    tags: ['paneer', 'protein'],
  },
];

async function seedDemoData() {
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 120000,
    socketTimeoutMS: 120000,
  });

  console.log('Connected to MongoDB');

  let vendor = await User.findOne({ email: vendorEmail });
  if (!vendor) {
    vendor = await User.create({
      name: 'Demo Vendor',
      email: vendorEmail,
      phone: '9876543210',
      password: vendorPassword,
      role: 'vendor',
      isVerified: true,
      isActive: true,
    });
  } else {
    vendor.password = vendorPassword;
    vendor.role = 'vendor';
    vendor.isVerified = true;
    vendor.isActive = true;
    await vendor.save();
  }

  const createdStores = [];

  for (const storeData of storeSeeds) {
    const existingStore = await Store.findOne({ name: storeData.name });
    const store = existingStore
      ? await Store.findByIdAndUpdate(
          existingStore._id,
          { ...storeData, owner: vendor._id },
          { new: true, upsert: true }
        )
      : await Store.create({ ...storeData, owner: vendor._id });

    createdStores.push(store);

    for (const productData of productSeeds) {
      const productPayload = {
        ...productData,
        store: store._id,
        isActive: true,
      };

      await Product.findOneAndUpdate(
        { store: store._id, name: productData.name },
        productPayload,
        { upsert: true, new: true }
      );
    }
  }

  console.log(`Seed complete. Created ${createdStores.length} stores and demo products.`);
  console.log('Vendor login:', { email: vendorEmail, password: vendorPassword });
  process.exit(0);
}

seedDemoData().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
