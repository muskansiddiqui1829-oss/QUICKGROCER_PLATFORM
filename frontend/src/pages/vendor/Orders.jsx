import React, { useState, useEffect, useCallback } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_ACTIONS = {
  pending: { next: 'confirmed', label: 'Confirm Order', color: 'var(--primary)' },
  confirmed: { next: 'preparing', label: 'Start Preparing', color: 'var(--secondary)' },
  preparing: { next: 'packed', label: 'Mark Packed', color: '#9b59b6' },
  packed: { next: null, label: 'Assign Delivery', color: '#e67e22', action: 'assign' },
};

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderAPI.getStoreOrders({ status, limit: 50 });
      setOrders(res.data || []);
    } catch {}
    setLoading(false);
  }, [status]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleAction = async (order, action) => {
    setActionLoading(order._id);
    try {
      if (action === 'assign') {
        await orderAPI.assignDelivery(order._id);
        toast.success('Delivery partner assigned!');
      } else {
        await orderAPI.updateStatus(order._id, action);
        toast.success(`Order marked as ${action}`);
      }
      fetchOrders();
    } catch {}
    setActionLoading('');
  };

  const statuses = ['', 'pending', 'confirmed', 'preparing', 'packed', 'assigned', 'out_for_delivery', 'delivered', 'cancelled'];

  return (
    <VendorLayout>
      <h1 style={{ fontWeight: 800, marginBottom: 24 }}>Orders</h1>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 24 }}>
        {statuses.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            style={{ flexShrink: 0, padding: '8px 16px', borderRadius: 30, border: `2px solid ${status === s ? 'var(--primary)' : 'var(--border)'}`, background: status === s ? 'var(--primary-light)' : 'white', color: status === s ? 'var(--primary-dark)' : 'var(--text-light)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: 60 }}>No orders</p> :
            orders.map(order => {
              const sa = STATUS_ACTIONS[order.status];
              return (
                <div key={order._id} style={{ background: 'white', borderRadius: 12, boxShadow: 'var(--shadow)', padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>#{order.orderNumber}</span>
                      <span style={{ marginLeft: 12, color: 'var(--text-light)', fontSize: 14 }}>{new Date(order.createdAt).toLocaleString('en-IN')}</span>
                    </div>
                    <span className={`badge badge-${order.status}`}>{order.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>CUSTOMER</div>
                      <div style={{ fontWeight: 600 }}>{order.customer?.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-light)' }}>{order.customer?.phone}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>ITEMS</div>
                      {order.items?.slice(0, 3).map(item => (
                        <div key={item._id} style={{ fontSize: 13 }}>{item.name} × {item.quantity}</div>
                      ))}
                      {order.items?.length > 3 && <div style={{ fontSize: 12, color: 'var(--text-light)' }}>+{order.items.length - 3} more</div>}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 4 }}>AMOUNT</div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary-dark)' }}>₹{order.totalAmount}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-light)' }}>{order.paymentMethod.toUpperCase()}</div>
                    </div>
                  </div>
                  {sa && (
                    <button onClick={() => handleAction(order, sa.action || sa.next)}
                      disabled={actionLoading === order._id}
                      style={{ padding: '10px 20px', borderRadius: 8, background: sa.color, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                      {actionLoading === order._id ? 'Processing...' : sa.label}
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </VendorLayout>
  );
}
