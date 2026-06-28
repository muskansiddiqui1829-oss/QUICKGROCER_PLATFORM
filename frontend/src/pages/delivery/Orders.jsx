// Orders.jsx
import React, { useState, useEffect } from 'react';
import { DeliveryLayout } from '../../components/delivery/DeliveryLayout';
import { deliveryAPI } from '../../services/api';

export default function DeliveryOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deliveryAPI.getOrders({ limit: 50 }).then(res => setOrders(res.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <DeliveryLayout>
      <h1 style={{ fontWeight: 800, marginBottom: 24 }}>My Deliveries</h1>
      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: 60 }}>No deliveries yet</p> :
            orders.map(order => (
              <div key={order._id} style={{ background: 'white', borderRadius: 12, boxShadow: 'var(--shadow)', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontWeight: 700 }}>#{order.orderNumber}</span>
                  <span className={`badge badge-${order.status}`}>{order.status.replace(/_/g, ' ')}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 14 }}>
                  <div><span style={{ color: 'var(--text-light)' }}>Store: </span>{order.store?.name}</div>
                  <div><span style={{ color: 'var(--text-light)' }}>Customer: </span>{order.customer?.name}</div>
                  <div><span style={{ color: 'var(--text-light)' }}>Earnings: </span><strong style={{ color: 'var(--primary)' }}>₹{(order.deliveryFee * 0.8).toFixed(0)}</strong></div>
                  <div><span style={{ color: 'var(--text-light)' }}>Date: </span>{new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
              </div>
            ))}
        </div>
      )}
    </DeliveryLayout>
  );
}
