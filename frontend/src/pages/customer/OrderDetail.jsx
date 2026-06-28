import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { orderAPI } from '../../services/api';
import { getSocket, trackOrder } from '../../services/socket';
import toast from 'react-hot-toast';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: '📋' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'packed', label: 'Packed', icon: '📦' },
  { key: 'assigned', label: 'Partner Assigned', icon: '🚴' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🏃' },
  { key: 'delivered', label: 'Delivered', icon: '🎉' },
];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await orderAPI.getById(id);
        setOrder(res.data);
      } catch {}
      setLoading(false);
    };
    fetchOrder();

    // Real-time tracking
    const socket = getSocket();
    if (socket) {
      trackOrder(id);
      socket.on('order:status_update', (data) => {
        if (data.orderId === id) {
          setOrder(prev => prev ? { ...prev, status: data.status } : prev);
          toast(`Order status: ${data.status.replace(/_/g, ' ')}`, { icon: '📦' });
        }
      });
    }
    return () => {
      if (socket) socket.off('order:status_update');
    };
  }, [id]);

  const handleRate = async () => {
    if (!rating) return;
    setRatingLoading(true);
    try {
      await orderAPI.rate(id, { rating, review });
      setOrder(prev => ({ ...prev, isRated: true, rating, review }));
      toast.success('Thanks for your feedback! ⭐');
    } catch {}
    setRatingLoading(false);
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      const res = await orderAPI.cancel(id, 'Cancelled by customer');
      setOrder(res.data);
      toast.success('Order cancelled');
    } catch {}
  };

  if (loading) return <div><Navbar /><div className="loading-container"><div className="spinner" /></div></div>;
  if (!order) return <div><Navbar /><p style={{ textAlign: 'center', padding: 40 }}>Order not found</p></div>;

  const currentStep = STATUS_STEPS.findIndex(s => s.key === order.status);

  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: '32px 16px', maxWidth: 800, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontWeight: 800, fontSize: 24 }}>Order #{order.orderNumber}</h1>
            <p style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 4 }}>{new Date(order.createdAt).toLocaleString('en-IN')}</p>
          </div>
          <span className={`badge badge-${order.status}`} style={{ fontSize: 14, padding: '8px 16px' }}>{order.status.replace(/_/g, ' ').toUpperCase()}</span>
        </div>

        {/* Tracking */}
        {order.status !== 'cancelled' && (
          <div style={{ background: 'white', borderRadius: 12, boxShadow: 'var(--shadow)', padding: 24, marginBottom: 16 }}>
            <h3 style={{ marginBottom: 20, fontWeight: 700 }}>📍 Order Tracking</h3>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: 'var(--border)', zIndex: 0 }} />
              {STATUS_STEPS.map((step, idx) => {
                const isDone = idx <= currentStep;
                const isActive = idx === currentStep;
                return (
                  <div key={step.key} style={{ display: 'flex', gap: 20, marginBottom: 20, position: 'relative', zIndex: 1 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: isDone ? 'var(--primary)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, transition: 'background 0.3s', boxShadow: isActive ? '0 0 0 4px var(--primary-light)' : 'none' }}>
                      {isDone ? step.icon : '○'}
                    </div>
                    <div style={{ paddingTop: 8 }}>
                      <div style={{ fontWeight: isActive ? 700 : isDone ? 600 : 400, color: isDone ? 'var(--text)' : 'var(--text-light)', fontSize: 15 }}>{step.label}</div>
                      {isActive && order.statusHistory?.find(h => h.status === step.key)?.message && (
                        <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 2 }}>{order.statusHistory.find(h => h.status === step.key)?.message}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {order.estimatedDeliveryTime && order.status !== 'delivered' && (
              <div style={{ background: 'var(--primary-light)', padding: '12px 16px', borderRadius: 8, marginTop: 12 }}>
                <span style={{ color: 'var(--primary-dark)', fontWeight: 600 }}>⏱️ Estimated delivery: {new Date(order.estimatedDeliveryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Items */}
          <div style={{ background: 'white', borderRadius: 12, boxShadow: 'var(--shadow)', padding: 20 }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700 }}>🛍️ Items</h3>
            {order.items.map(item => (
              <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                <span>{item.name} × {item.quantity}</span>
                <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 10 }}>
              {[['Subtotal', `₹${order.subtotal}`], ['Delivery', `₹${order.deliveryFee}`], ...(order.discount > 0 ? [['Discount', `-₹${order.discount}`]] : []), ['Total', `₹${order.totalAmount}`]].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, fontWeight: label === 'Total' ? 700 : 400 }}>
                  <span style={{ color: label === 'Total' ? 'var(--text)' : 'var(--text-light)' }}>{label}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Info */}
          <div style={{ background: 'white', borderRadius: 12, boxShadow: 'var(--shadow)', padding: 20 }}>
            <h3 style={{ marginBottom: 14, fontWeight: 700 }}>📦 Details</h3>
            <div style={{ fontSize: 14, color: 'var(--text-light)', lineHeight: 2 }}>
              <div><strong style={{ color: 'var(--text)' }}>Store:</strong> {order.store?.name}</div>
              <div><strong style={{ color: 'var(--text)' }}>Payment:</strong> {order.paymentMethod.toUpperCase()} ({order.paymentStatus})</div>
              <div><strong style={{ color: 'var(--text)' }}>Address:</strong> {order.deliveryAddress?.street}, {order.deliveryAddress?.city}</div>
              {order.deliveryPartner && <div><strong style={{ color: 'var(--text)' }}>Delivery Agent:</strong> {order.deliveryPartner.name} ({order.deliveryPartner.phone})</div>}
              {order.status === 'out_for_delivery' && <div style={{ background: '#fef3c7', padding: '8px 12px', borderRadius: 8, marginTop: 8 }}><strong>OTP:</strong> <span style={{ fontSize: 20, fontWeight: 800, color: '#92400e' }}>{order.otp}</span> (share with delivery agent)</div>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          {['pending', 'confirmed'].includes(order.status) && (
            <button className="btn btn-danger" onClick={handleCancel}>Cancel Order</button>
          )}
        </div>

        {/* Rating */}
        {order.status === 'delivered' && !order.isRated && (
          <div style={{ background: 'white', borderRadius: 12, boxShadow: 'var(--shadow)', padding: 24, marginTop: 16 }}>
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>⭐ Rate Your Order</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, fontSize: 36 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <button key={s} onClick={() => setRating(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: s <= rating ? '#f39c12' : '#ddd', fontSize: 36 }}>★</button>
              ))}
            </div>
            <textarea className="form-control" value={review} onChange={e => setReview(e.target.value)} placeholder="Share your experience..." rows={3} style={{ marginBottom: 12, resize: 'vertical' }} />
            <button className="btn btn-primary" onClick={handleRate} disabled={!rating || ratingLoading}>{ratingLoading ? 'Submitting...' : 'Submit Review'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
