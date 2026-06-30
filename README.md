# 🛒 QuickGrocer - Hyperlocal Grocery Delivery Platform

A production-ready MERN stack app inspired by Blinkit/Zepto. Multi-vendor grocery delivery with real-time tracking, payment gateway integration, and admin panel.

## 🏗️ Architecture

```
quickgrocer/
├── backend/          → Express + Node.js (Deploy to Render)
│   ├── controllers/  → Business logic
│   ├── models/       → Mongoose schemas
│   ├── routes/       → API routes
│   ├── middleware/   → Auth, validation
│   ├── socket/       → Socket.io real-time
│   ├── config/       → DB, Redis, Cloudinary
│   └── utils/        → Helpers, email, logger
└── frontend/         → React 18 (Deploy to Vercel)
    ├── pages/
    │   ├── customer/ → Home, Store, Cart, Checkout, Orders
    │   ├── vendor/   → Dashboard, Products, Orders, Settings
    │   ├── delivery/ → Dashboard, Orders, Earnings
    │   └── admin/    → Dashboard, Stores, Users, Analytics
    ├── context/      → Zustand stores (auth, cart)
    └── services/     → Axios API, Socket.io
```

## 🚀 Features

- **Multi-vendor**: Stores onboard, list products, manage orders
- **Geolocation**: Nearby store discovery via browser Geolocation API
- **Real-time tracking**: Socket.io order status (placed → delivered)
- **Delivery partner app**: Duty toggle, OTP delivery confirmation, earnings
- **Payments**: Razorpay, Stripe, Cash on Delivery, Wallet
- **Coupons**: Percentage, fixed, free delivery with per-user limits
- **Admin panel**: Store approvals, user management, analytics charts
- **Caching**: Redis for nearby stores and product listings
- **Image uploads**: Cloudinary CDN

## ⚡ Quick Start (Local)

```bash
# 1. Install dependencies
npm run install:all

# 2. Configure backend
cp backend/.env.example backend/.env
# Fill in MONGO_URI, JWT_SECRET, etc.

# 3. Configure frontend
cp frontend/.env.example frontend/.env.local
# Set REACT_APP_API_URL=http://localhost:5000/api

# 4. Run both servers
npm run dev:backend   # terminal 1 → :5000
npm run dev:frontend  # terminal 2 → :3000
```

## ☁️ Deploy to Production

### Backend → Render

1. Push to GitHub
2. New Web Service on [render.com](https://render.com)
3. Set **Build command**: `npm install`
4. Set **Start command**: `node server.js`
5. Add all env vars from `.env.example`
6. Deploy — get URL like `https://quickgrocer-api.onrender.com`

### Frontend → Vercel

1. New project on [vercel.com](https://vercel.com)
2. Import repo, set **Root Directory** to `frontend`
3. Add env vars:
   ```
   REACT_APP_API_URL=https://quickgrocer-api.onrender.com
   REACT_APP_SOCKET_URL=https://quickgrocer-api.onrender.com
   REACT_APP_RAZORPAY_KEY_ID=rzp_live_...
   ```
   > `REACT_APP_API_URL` can be the backend host or the backend API URL. The app will normalize it to end in `/api`.
4. Deploy!

## 🔑 Environment Variables

### Backend Required
| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Strong random string (min 32 chars) |
| `JWT_REFRESH_SECRET` | Different random string |
| `FRONTEND_URL` | Vercel app URL (for CORS) |
| `CLOUDINARY_*` | Cloudinary account credentials |
| `RAZORPAY_*` | Razorpay dashboard keys |
| `SMTP_*` | Email SMTP credentials |

### Frontend Required
| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Backend URL + `/api` |
| `REACT_APP_SOCKET_URL` | Backend URL (no /api) |
| `REACT_APP_RAZORPAY_KEY_ID` | Razorpay publishable key |

## 👤 Demo Accounts

Create an admin manually in MongoDB or use the seeder:
```js
// In MongoDB Atlas, create a user with:
{ email: "admin@groceryapp.com", role: "admin" }
// Then login and the system auto-assigns role
```

## 📡 API Reference

### Auth
- `POST /api/auth/register` — Register (roles: customer/vendor/delivery)
- `POST /api/auth/login` — Login → returns JWT
- `GET  /api/auth/me` — Get current user

### Customer Flow
- `GET  /api/stores/nearby?lat=&lng=&radius=5` — Discover stores
- `GET  /api/products?storeId=&category=` — Browse products
- `POST /api/orders` — Place order
- `GET  /api/orders/my-orders` — Order history
- `POST /api/payments/razorpay/create-order` — Initiate payment

### Vendor Flow
- `POST /api/stores` — Create store
- `GET  /api/stores/dashboard` — Stats
- `POST /api/products` — Add product
- `GET  /api/orders/store-orders` — Incoming orders
- `PUT  /api/orders/:id/status` — Update status

### Delivery Flow
- `PUT  /api/delivery/toggle-duty` — Go on/off duty
- `PUT  /api/delivery/location` — Update GPS location
- `GET  /api/delivery/active-order` — Current delivery
- `PUT  /api/delivery/orders/:id/deliver` — Confirm with OTP

### Admin Flow
- `GET  /api/admin/dashboard` — Platform stats
- `PUT  /api/admin/stores/:id/approve` — Approve store
- `POST /api/admin/coupons` — Create coupon
- `GET  /api/admin/analytics` — Revenue/order charts

## 🔌 Socket.io Events

| Event | Direction | Description |
|---|---|---|
| `order:new` | server → vendor | New order received |
| `order:status_update` | server → customer/delivery | Status changed |
| `delivery:location` | server → customer | GPS coordinates |
| `order:track` | client → server | Subscribe to order |
| `location:update` | delivery → server | Send GPS position |

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router 6, Zustand, Recharts |
| Backend | Node.js, Express, Socket.io |
| Database | MongoDB Atlas, Mongoose |
| Cache | Redis (Upstash) |
| Auth | JWT + Refresh Tokens |
| Payments | Razorpay, Stripe |
| Images | Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| Deploy | Render (backend), Vercel (frontend) |
