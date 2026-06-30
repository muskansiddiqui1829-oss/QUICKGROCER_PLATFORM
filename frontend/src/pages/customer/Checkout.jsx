import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import useCartStore from '../../context/cartStore';
import useAuthStore from '../../context/authStore';
import { orderAPI, paymentAPI, userAPI } from '../../services/api';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when delivered' },
  { id: 'razorpay', label: 'Razorpay', icon: '💳', desc: 'Cards, UPI, NetBanking' },
  { id: 'wallet', label: 'Wallet', icon: '👛', desc: 'Use wallet balance' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const { state: routeState } = useLocation();
  const { items, storeId, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [addresses] = useState(user?.addresses || []);
  const [selectedAddress, setSelectedAddress] = useState(user?.addresses?.find(a => a.isDefault) || user?.addresses?.[0] || null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [newAddress, setNewAddress] = useState({ street: '', city: '', state: '', pincode: '', label: 'Home', location: { type: 'Point', coordinates: [77.5946, 12.9716] } });
  const [showAddressForm, setShowAddressForm] = useState(!selectedAddress);

  const { coupon, deliveryFee = 30, discount = 0, total, subtotal } = routeState || {};

  useEffect(() => {
    if (!items.length) navigate('/cart');
    userAPI.getWalletBalance().then(res => setWalletBalance(res.data.balance)).catch(() => {});
  }, [items.length, navigate]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        setNewAddress(a => ({ ...a, location: { type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude] } }));
        toast.success('Location captured!');
      },
      err => {
        let message = err?.message || 'Could not get location';
        if (err?.code === 1) message = 'Location permission denied. Enable location access and try again.';
        else if (err?.code === 2) message = 'Unable to determine location. Check GPS and try again.';
        else if (err?.code === 3) message = 'Location request timed out. Try again.';
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress && !showAddressForm) { toast.error('Select a delivery address'); return; }
    setLoading(true);
    try {
      const address = showAddressForm ? newAddress : selectedAddress;
      const orderData = {
        storeId,
        items: items.map(i => ({ productId: i._id, quantity: i.quantity })),
        deliveryAddress: address,
        paymentMethod,
        couponCode: coupon?.coupon?.code || '',
        specialInstructions: '',
      };

      const orderRes = await orderAPI.place(orderData);
      const order = orderRes.data;

      if (paymentMethod === 'cod') {
        clearCart();
        toast.success('Order placed! 🎉');
        navigate(`/orders/${order._id}`);
      } else if (paymentMethod === 'razorpay') {
        const rpRes = await paymentAPI.createRazorpayOrder(order._id);
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: rpRes.data.amount,
          currency: rpRes.data.currency,
          name: 'QuickGrocer',
          description: `Order #${order.orderNumber}`,
          order_id: rpRes.data.razorpayOrderId,
          handler: async (response) => {
            await paymentAPI.verifyRazorpay({ orderId: order._id, ...response });
            clearCart();
            toast.success('Payment successful! 🎉');
            navigate(`/orders/${order._id}`);
          },
          prefill: { name: user.name, email: user.email, contact: user.phone },
          theme: { color: '#2ecc71' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else if (paymentMethod === 'wallet') {
        await paymentAPI.payWithWallet(order._id);
        clearCart();
        toast.success('Paid from wallet! 🎉');
        navigate(`/orders/${order._id}`);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: '32px 16px' }}>
        <h1 style={{ marginBottom: 24, fontWeight: 700 }}>Checkout</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          <div>
            {/* Delivery Address */}
            <div style={{ background: 'white', borderRadius: 12, boxShadow: 'var(--shadow)', padding: 24, marginBottom: 16 }}>
              <h3 style={{ marginBottom: 16, fontWeight: 700 }}>📍 Delivery Address</h3>
              {addresses.map(addr => (
                <div key={addr._id} onClick={() => { setSelectedAddress(addr); setShowAddressForm(false); }}
                  style={{ padding: '14px 16px', borderRadius: 10, border: `2px solid ${selectedAddress?._id === addr._id ? 'var(--primary)' : 'var(--border)'}`, marginBottom: 10, cursor: 'pointer', background: selectedAddress?._id === addr._id ? 'var(--primary-light)' : 'white' }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{addr.label} {addr.isDefault && <span style={{ fontSize: 11, background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: 4, marginLeft: 8 }}>Default</span>}</div>
                  <div style={{ color: 'var(--text-light)', fontSize: 14 }}>{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</div>
                </div>
              ))}
              <button onClick={() => setShowAddressForm(!showAddressForm)} style={{ color: 'var(--primary)', background: 'none', border: '2px dashed var(--primary)', borderRadius: 10, padding: '12px 20px', cursor: 'pointer', fontWeight: 600, width: '100%', marginTop: 8 }}>
                + Add New Address
              </button>
              {showAddressForm && (
                <div style={{ marginTop: 16, padding: 20, background: 'var(--bg)', borderRadius: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[['street', 'Street Address'], ['city', 'City'], ['state', 'State'], ['pincode', 'Pincode']].map(([key, label]) => (
                      <div key={key} className="form-group" style={{ gridColumn: key === 'street' ? 'span 2' : undefined }}>
                        <label>{label}</label>
                        <input className="form-control" value={newAddress[key]} onChange={e => setNewAddress(a => ({ ...a, [key]: e.target.value }))} />
                      </div>
                    ))}
                  </div>
                  <button onClick={handleGetLocation} style={{ color: 'var(--primary)', background: 'var(--primary-light)', border: 'none', padding: '10px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                    📍 Use My Current Location
                  </button>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div style={{ background: 'white', borderRadius: 12, boxShadow: 'var(--shadow)', padding: 24 }}>
              <h3 style={{ marginBottom: 16, fontWeight: 700 }}>💳 Payment Method</h3>
              {PAYMENT_METHODS.map(method => (
                <div key={method.id} onClick={() => setPaymentMethod(method.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, border: `2px solid ${paymentMethod === method.id ? 'var(--primary)' : 'var(--border)'}`, marginBottom: 10, cursor: 'pointer', background: paymentMethod === method.id ? 'var(--primary-light)' : 'white' }}>
                  <span style={{ fontSize: 24 }}>{method.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{method.label}</div>
                    <div style={{ color: 'var(--text-light)', fontSize: 13 }}>
                      {method.id === 'wallet' ? `${method.desc} (Balance: ₹${walletBalance})` : method.desc}
                    </div>
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${paymentMethod === method.id ? 'var(--primary)' : 'var(--border)'}`, background: paymentMethod === method.id ? 'var(--primary)' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {paymentMethod === method.id && <div style={{ width: 8, height: 8, background: 'white', borderRadius: '50%' }} />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div>
            <div style={{ background: 'white', borderRadius: 12, boxShadow: 'var(--shadow)', padding: 24, position: 'sticky', top: 80 }}>
              <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Order Summary</h3>
              <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 16 }}>
                {items.map(item => (
                  <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-light)' }}>{item.name} × {item.quantity}</span>
                    <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                {[['Subtotal', `₹${subtotal?.toFixed(0) || 0}`], ['Delivery', deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`], ...(discount > 0 ? [['Coupon', `-₹${discount.toFixed(0)}`]] : [])].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-light)' }}>{label}</span>
                    <span style={{ fontWeight: 600, color: label === 'Coupon' ? 'var(--danger)' : 'var(--text)' }}>{value}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, borderTop: '2px solid var(--border)', paddingTop: 12, marginTop: 8 }}>
                  <span>Total</span><span style={{ color: 'var(--primary-dark)' }}>₹{total?.toFixed(0) || 0}</span>
                </div>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 20, padding: 16, fontSize: 16 }}
                onClick={handlePlaceOrder} disabled={loading}>
                {loading ? 'Placing Order...' : `Place Order - ₹${total?.toFixed(0) || 0}`}
              </button>
              <p style={{ fontSize: 12, color: 'var(--text-light)', textAlign: 'center', marginTop: 12 }}>
                🔒 Secure & encrypted payment
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
