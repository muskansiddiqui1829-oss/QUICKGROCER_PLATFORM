import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './context/authStore';
import { connectSocket } from './services/socket';

// Customer pages
import Home from './pages/customer/Home';
import StorePage from './pages/customer/StorePage';
import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import OrderDetail from './pages/customer/OrderDetail';
import MyOrders from './pages/customer/MyOrders';
import Profile from './pages/customer/Profile';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Vendor pages
import VendorDashboard from './pages/vendor/Dashboard';
import VendorProducts from './pages/vendor/Products';
import VendorOrders from './pages/vendor/Orders';
import VendorStore from './pages/vendor/StoreSettings';
import VendorOnboarding from './pages/vendor/Onboarding';

// Delivery pages
import DeliveryDashboard from './pages/delivery/Dashboard';
import DeliveryOrders from './pages/delivery/Orders';
import DeliveryEarnings from './pages/delivery/Earnings';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminStores from './pages/admin/Stores';
import AdminUsers from './pages/admin/Users';
import AdminOrders from './pages/admin/Orders';
import AdminDelivery from './pages/admin/DeliveryPartners';
import AdminCoupons from './pages/admin/Coupons';
import AdminAnalytics from './pages/admin/Analytics';

// Guards
const ProtectedRoute = ({ children, roles, allowGuest = false }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) {
    if (allowGuest) return children;
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated) {
    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'vendor') return <Navigate to="/vendor" replace />;
    if (user?.role === 'delivery') return <Navigate to="/delivery" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && token) connectSocket(token);
  }, [isAuthenticated, token]);

  return (
    <Router>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/store/:id" element={<StorePage />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Customer */}
        <Route path="/cart" element={<ProtectedRoute roles={['customer']} allowGuest><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute roles={['customer']}><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute roles={['customer']}><MyOrders /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute roles={['customer']}><OrderDetail /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Vendor */}
        <Route path="/vendor" element={<ProtectedRoute roles={['vendor']}><VendorDashboard /></ProtectedRoute>} />
        <Route path="/vendor/products" element={<ProtectedRoute roles={['vendor']}><VendorProducts /></ProtectedRoute>} />
        <Route path="/vendor/orders" element={<ProtectedRoute roles={['vendor']}><VendorOrders /></ProtectedRoute>} />
        <Route path="/vendor/store" element={<ProtectedRoute roles={['vendor']}><VendorStore /></ProtectedRoute>} />
        <Route path="/vendor/onboarding" element={<ProtectedRoute roles={['vendor']}><VendorOnboarding /></ProtectedRoute>} />

        {/* Delivery */}
        <Route path="/delivery" element={<ProtectedRoute roles={['delivery']}><DeliveryDashboard /></ProtectedRoute>} />
        <Route path="/delivery/orders" element={<ProtectedRoute roles={['delivery']}><DeliveryOrders /></ProtectedRoute>} />
        <Route path="/delivery/earnings" element={<ProtectedRoute roles={['delivery']}><DeliveryEarnings /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/stores" element={<ProtectedRoute roles={['admin']}><AdminStores /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/delivery" element={<ProtectedRoute roles={['admin']}><AdminDelivery /></ProtectedRoute>} />
        <Route path="/admin/coupons" element={<ProtectedRoute roles={['admin']}><AdminCoupons /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
