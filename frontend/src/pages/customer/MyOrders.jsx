// MyOrders.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { orderAPI } from '../../services/api';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await orderAPI.getMyOrders({ status, limit: 20 });
        setOrders(res.data || []);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [status]);

  const statuses = ['', 'pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: '32px 16px' }}>
        <h1 style={{ marginBottom: 24, fontWeight: 700 }}>My Orders</h1>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 24 }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              style={{ flexShrink: 0, padding: '8px 18px', borderRadius: 30, border: `2px solid ${status === s ? 'var(--primary)' : 'var(--border)'}`, background: status === s ? 'var(--primary-light)' : 'white', color: status === s ? 'var(--primary-dark)' : 'var(--text-light)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {s || 'All'}
            </button>
          ))}
        </div>
        {loading ? <div className="loading-container"><div className="spinner" /></div> : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 64, marginBottom: 12 }}>📋</div>
            <h3 style={{ marginBottom: 8 }}>No orders yet</h3>
            <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: 16 }}>Start Shopping</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {orders.map(order => (
              <Link key={order._id} to={`/orders/${order._id}`} style={{ background: 'white', borderRadius: 12, boxShadow: 'var(--shadow)', padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform 0.2s' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>#{order.orderNumber}</div>
                  <div style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 6 }}>{order.store?.name} • {order.items.length} items</div>
                  <div style={{ fontSize: 13, color: 'var(--text-light)' }}>{new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>₹{order.totalAmount}</div>
                  <span className={`badge badge-${order.status}`}>{order.status.replace(/_/g, ' ')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
