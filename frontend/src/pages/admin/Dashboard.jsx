import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminAPI } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminAPI.getDashboard().then(res => setData(res.data)).catch(() => {});
  }, []);

  if (!data) return <AdminLayout><div className="loading-container"><div className="spinner" /></div></AdminLayout>;

  const { stats, revenueByDay } = data;
  const statCards = [
    { label: 'Total Customers', value: stats.totalUsers, icon: '👥', color: '#3498db' },
    { label: 'Active Stores', value: stats.totalStores, icon: '🏪', color: '#2ecc71' },
    { label: 'Total Orders', value: stats.totalOrders, icon: '📦', color: '#9b59b6' },
    { label: 'Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`, icon: '💰', color: '#f39c12' },
    { label: "Today's Orders", value: stats.todayOrders, icon: '📋', color: '#1abc9c' },
    { label: 'Pending Stores', value: stats.pendingStores, icon: '⏳', color: '#e74c3c' },
    { label: 'Pending Partners', value: stats.pendingDeliveries, icon: '🚴', color: '#e67e22' },
    { label: 'Active Orders', value: stats.activeOrders, icon: '⚡', color: '#e74c3c' },
  ];

  return (
    <AdminLayout>
      <h1 style={{ fontWeight: 800, fontSize: 28, marginBottom: 28 }}>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow)', borderLeft: `4px solid ${card.color}` }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ color: 'var(--text-light)', fontSize: 13, marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', padding: 24, marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, marginBottom: 20 }}>Revenue (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={revenueByDay}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']} />
            <Line type="monotone" dataKey="revenue" stroke="#2ecc71" strokeWidth={3} dot={{ fill: '#2ecc71', r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pending approvals */}
      {(stats.pendingStores > 0 || stats.pendingDeliveries > 0) && (
        <div style={{ background: '#fef3c7', border: '1.5px solid #f59e0b', borderRadius: 12, padding: 16, display: 'flex', gap: 20 }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <div>
            <strong>Pending Approvals:</strong>
            {stats.pendingStores > 0 && <span style={{ marginLeft: 12, color: '#92400e' }}>{stats.pendingStores} stores</span>}
            {stats.pendingDeliveries > 0 && <span style={{ marginLeft: 12, color: '#92400e' }}>{stats.pendingDeliveries} delivery partners</span>}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
