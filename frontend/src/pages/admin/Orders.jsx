import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminAPI } from '../../services/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setLoading(true);
    adminAPI.getOrders({ status, limit: 50 })
      .then(res => setOrders(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  const statuses = ['', 'pending', 'confirmed', 'preparing', 'packed', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <AdminLayout>
      <h1 style={{ fontWeight: 800, marginBottom: 24 }}>All Orders</h1>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24 }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 30, border: `2px solid ${status === s ? 'var(--primary)' : 'var(--border)'}`, background: status === s ? 'var(--primary-light)' : 'white', color: status === s ? 'var(--primary-dark)' : 'var(--text-light)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            {s || 'All'}
          </button>
        ))}
      </div>
      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
              {['Order #', 'Customer', 'Store', 'Amount', 'Payment', 'Status', 'Date'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {orders.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>No orders found</td></tr>
                : orders.map(order => (
                  <tr key={order._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, fontSize: 14 }}>#{order.orderNumber}</td>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>
                      <div>{order.customer?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{order.customer?.phone}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14 }}>{order.store?.name}</td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--primary-dark)' }}>₹{order.totalAmount}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: 12, background: order.paymentStatus === 'paid' ? '#d1fae5' : '#fef3c7', color: order.paymentStatus === 'paid' ? '#065f46' : '#92400e', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                        {order.paymentMethod} / {order.paymentStatus}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge badge-${order.status}`}>{order.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-light)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
