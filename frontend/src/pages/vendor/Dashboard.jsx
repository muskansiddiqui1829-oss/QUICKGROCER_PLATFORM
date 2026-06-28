import React, { useState, useEffect } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { storeAPI, orderAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../../services/socket';
import toast from 'react-hot-toast';

export default function VendorDashboard() {
  const [dashData, setDashData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, ordersRes] = await Promise.all([
          storeAPI.getDashboard(),
          orderAPI.getStoreOrders({ limit: 5 }),
        ]);
        setDashData(dashRes.data);
        setRecentOrders(ordersRes.data || []);
      } catch (err) {
        if (err.response?.status === 404) navigate('/vendor/onboarding');
      }
      setLoading(false);
    };
    fetchData();

    // Real-time new orders
    const socket = getSocket();
    if (socket) {
      socket.on('order:new', (data) => {
        toast.success('🔔 New order received!');
        setRecentOrders(prev => [data.order, ...prev.slice(0, 4)]);
        setDashData(prev => prev ? { ...prev, stats: { ...prev.stats, pendingOrders: prev.stats.pendingOrders + 1 } } : prev);
      });
    }
    return () => { if (socket) socket.off('order:new'); };
  }, [navigate]);

  const handleToggleStatus = async () => {
    try {
      const res = await storeAPI.toggleStatus(dashData.store._id);
      setDashData(prev => ({ ...prev, store: { ...prev.store, isOpen: res.data.isOpen } }));
      toast.success(res.data.isOpen ? 'Store is now Open 🟢' : 'Store is now Closed 🔴');
    } catch {}
  };

  if (loading) return <VendorLayout><div className="loading-container"><div className="spinner" /></div></VendorLayout>;
  if (!dashData) return <VendorLayout><p>No store found</p></VendorLayout>;

  const { store, stats } = dashData;

  const statCards = [
    { label: "Today's Orders", value: stats.todayOrders, icon: '📦', color: '#3498db' },
    { label: 'Pending', value: stats.pendingOrders, icon: '⏳', color: '#f39c12' },
    { label: 'Total Orders', value: stats.totalOrders, icon: '✅', color: '#2ecc71' },
    { label: 'Total Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, icon: '💰', color: '#9b59b6' },
  ];

  return (
    <VendorLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: 26 }}>{store.name}</h1>
          <p style={{ color: 'var(--text-light)', marginTop: 4 }}>{store.location?.address}</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: store.isOpen ? 'var(--primary)' : 'var(--danger)', fontWeight: 600 }}>
            {store.isOpen ? '🟢 Open' : '🔴 Closed'}
          </span>
          <button onClick={handleToggleStatus} className={`btn ${store.isOpen ? 'btn-danger' : 'btn-primary'} btn-sm`}>
            {store.isOpen ? 'Close Store' : 'Open Store'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow)', borderLeft: `4px solid ${card.color}` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ color: 'var(--text-light)', fontSize: 13, marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontWeight: 700 }}>Recent Orders</h2>
          <button onClick={() => navigate('/vendor/orders')} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>View All →</button>
        </div>
        {recentOrders.length === 0 ? <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: 40 }}>No orders yet</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              {['Order #', 'Customer', 'Items', 'Amount', 'Status'].map(h => <th key={h} style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontSize: 14, fontWeight: 600 }}>#{order.orderNumber}</td>
                  <td style={{ padding: '12px', fontSize: 14 }}>{order.customer?.name}</td>
                  <td style={{ padding: '12px', fontSize: 14 }}>{order.items?.length} items</td>
                  <td style={{ padding: '12px', fontSize: 14, fontWeight: 700 }}>₹{order.totalAmount}</td>
                  <td style={{ padding: '12px' }}><span className={`badge badge-${order.status}`}>{order.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </VendorLayout>
  );
}
