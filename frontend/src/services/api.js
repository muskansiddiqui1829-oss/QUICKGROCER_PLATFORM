import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || '/api';

if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_URL) {
  console.error(
    'REACT_APP_API_URL is not configured. Production frontend will send API requests to /api on the frontend host.\n' +
    'Set REACT_APP_API_URL to the backend API URL (for example https://your-backend.onrender.com/api).'
  );
}

const api = axios.create({ baseURL: API_URL, timeout: 30000 });

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          localStorage.setItem('token', data.token);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return api(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || 'Something went wrong';
    toast.error(message);
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  updatePassword: (data) => api.put('/auth/update-password', data),
};

// Stores
export const storeAPI = {
  getNearby: (params) => api.get('/stores/nearby', { params }),
  getById: (id) => api.get(`/stores/${id}`),
  getMyStore: () => api.get('/stores/my-store'),
  getDashboard: () => api.get('/stores/dashboard'),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  toggleStatus: (id) => api.put(`/stores/${id}/toggle-status`),
  getReviews: (storeId, params) => api.get(`/reviews/store/${storeId}`, { params }),
};

// Products
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getMyProducts: (params) => api.get('/products/my-products', { params }),
  getCategories: (params) => api.get('/products/categories', { params }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  updateStock: (id, stock) => api.put(`/products/${id}/stock`, { stock }),
  delete: (id) => api.delete(`/products/${id}`),
};

// Orders
export const orderAPI = {
  place: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getStoreOrders: (params) => api.get('/orders/store-orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status, message) => api.put(`/orders/${id}/status`, { status, message }),
  cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
  assignDelivery: (id) => api.post(`/orders/${id}/assign-delivery`),
  rate: (id, data) => api.put(`/orders/${id}/rate`, data),
};

// Cart
export const cartAPI = {
  validate: (items) => api.post('/cart/validate', { items }),
};

// Coupons
export const couponAPI = {
  validate: (data) => api.post('/coupons/validate', data),
  getAvailable: () => api.get('/coupons/available'),
};

// Payments
export const paymentAPI = {
  createRazorpayOrder: (orderId) => api.post('/payments/razorpay/create-order', { orderId }),
  verifyRazorpay: (data) => api.post('/payments/razorpay/verify', data),
  createStripeSession: (orderId) => api.post('/payments/stripe/create-session', { orderId }),
  payWithWallet: (orderId) => api.post('/payments/wallet/pay', { orderId }),
};

// Delivery
export const deliveryAPI = {
  getProfile: () => api.get('/delivery/profile'),
  updateProfile: (data) => api.put('/delivery/profile', data),
  updateLocation: (lat, lng) => api.put('/delivery/location', { lat, lng }),
  toggleDuty: () => api.put('/delivery/toggle-duty'),
  getOrders: (params) => api.get('/delivery/orders', { params }),
  getActiveOrder: () => api.get('/delivery/active-order'),
  confirmPickup: (id) => api.put(`/delivery/orders/${id}/pickup`),
  confirmDelivery: (id, otp) => api.put(`/delivery/orders/${id}/deliver`, { otp }),
  getEarnings: () => api.get('/delivery/earnings'),
  getDashboard: () => api.get('/delivery/dashboard'),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getStores: (params) => api.get('/admin/stores', { params }),
  approveStore: (id) => api.put(`/admin/stores/${id}/approve`),
  rejectStore: (id, reason) => api.put(`/admin/stores/${id}/reject`, { reason }),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  getDeliveryPartners: (params) => api.get('/admin/delivery-partners', { params }),
  approveDeliveryPartner: (id) => api.put(`/admin/delivery-partners/${id}/approve`),
  getOrders: (params) => api.get('/admin/orders', { params }),
  createCoupon: (data) => api.post('/admin/coupons', data),
  getCoupons: () => api.get('/admin/coupons'),
  updateCoupon: (id, data) => api.put(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),
};

// User
export const userAPI = {
  updateProfile: (data) => api.put('/users/profile', data),
  addAddress: (data) => api.post('/users/addresses', data),
  updateAddress: (id, data) => api.put(`/users/addresses/${id}`, data),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`),
  getNotifications: () => api.get('/users/notifications'),
  markNotificationsRead: () => api.put('/users/notifications/read'),
  getWalletBalance: () => api.get('/users/wallet'),
};

export default api;
