import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import useCartStore from '../../context/cartStore';
import { couponAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Cart() {
  const navigate = useNavigate();
  const { items, storeId, storeName, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const DELIVERY_FEE = 30;

  const subtotal = getTotal();
  const discount = coupon ? coupon.discount : 0;
  const deliveryFee = subtotal >= 499 ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee - discount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await couponAPI.validate({ code: couponCode, orderTotal: subtotal, storeId, deliveryFee });
      setCoupon(res.data);
      toast.success(`Coupon applied! Saved ₹${res.data.discount}`);
    } catch {}
    setCouponLoading(false);
  };

  const handleRemoveCoupon = () => { setCoupon(null); setCouponCode(''); };

  if (items.length === 0) {
    return (
      <div>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{ fontSize: 80, marginBottom: 16 }}>🛒</div>
          <h2 style={{ marginBottom: 8 }}>Your cart is empty</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: 32 }}>Add items from a store to get started</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Stores</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: '32px 16px' }}>
        <h1 style={{ marginBottom: 24, fontWeight: 700 }}>Your Cart</h1>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          {/* Items */}
          <div>
            <div style={{ background: 'white', borderRadius: 12, boxShadow: 'var(--shadow)', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 600 }}>🏪 {storeName}</h3>
                <button onClick={() => { if (window.confirm('Clear cart?')) clearCart(); }} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>Clear Cart</button>
              </div>
              {items.map(item => (
                <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 64, height: 64, background: 'var(--bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.images?.[0] ? <img src={item.images[0]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : <span style={{ fontSize: 28 }}>🛍️</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>{item.name}</h4>
                    <p style={{ color: 'var(--text-light)', fontSize: 13 }}>{item.quantity} {item.unit} × ₹{item.price}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border)', background: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>−</button>
                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--primary)', background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>+</button>
                    <button onClick={() => removeItem(item._id)} style={{ color: 'var(--text-light)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginLeft: 4 }}>🗑️</button>
                  </div>
                  <div style={{ minWidth: 70, textAlign: 'right', fontWeight: 700, color: 'var(--primary-dark)' }}>₹{(item.price * item.quantity).toFixed(0)}</div>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div style={{ background: 'white', borderRadius: 12, boxShadow: 'var(--shadow)', padding: 20 }}>
              <h3 style={{ marginBottom: 14, fontWeight: 600 }}>🏷️ Have a coupon?</h3>
              {coupon ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--primary-light)', borderRadius: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{coupon.coupon.code}</span>
                    <span style={{ color: 'var(--text-light)', marginLeft: 12, fontSize: 14 }}>Saved ₹{discount.toFixed(0)}</span>
                  </div>
                  <button onClick={handleRemoveCoupon} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Remove</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    style={{ flex: 1, padding: '12px 16px', border: '2px solid var(--border)', borderRadius: 8, fontSize: 14 }}
                    onKeyPress={e => e.key === 'Enter' && handleApplyCoupon()} />
                  <button className="btn btn-outline btn-sm" onClick={handleApplyCoupon} disabled={couponLoading}>
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div style={{ background: 'white', borderRadius: 12, boxShadow: 'var(--shadow)', padding: 24, position: 'sticky', top: 80 }}>
              <h3 style={{ marginBottom: 20, fontWeight: 700 }}>Order Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <Row label="Subtotal" value={`₹${subtotal.toFixed(0)}`} />
                <Row label="Delivery Fee" value={deliveryFee === 0 ? 'FREE 🎉' : `₹${deliveryFee}`} color={deliveryFee === 0 ? 'var(--primary)' : undefined} />
                {discount > 0 && <Row label="Discount" value={`-₹${discount.toFixed(0)}`} color="var(--danger)" />}
                {subtotal < 499 && <p style={{ fontSize: 12, color: 'var(--primary)', background: 'var(--primary-light)', padding: '8px 12px', borderRadius: 6 }}>Add ₹{(499 - subtotal).toFixed(0)} more for FREE delivery</p>}
              </div>
              <div style={{ borderTop: '2px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, marginBottom: 20 }}>
                <span>Total</span><span style={{ color: 'var(--primary-dark)' }}>₹{total.toFixed(0)}</span>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', padding: 16, fontSize: 16 }}
                onClick={() => navigate('/checkout', { state: { coupon, deliveryFee, discount, total, subtotal } })}>
                Proceed to Checkout →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Row = ({ label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
    <span style={{ color: 'var(--text-light)' }}>{label}</span>
    <span style={{ fontWeight: 600, color: color || 'var(--text)' }}>{value}</span>
  </div>
);
