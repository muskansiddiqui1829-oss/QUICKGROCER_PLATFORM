import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

const COLORS = ['#2ecc71', '#3498db', '#9b59b6', '#f39c12', '#e74c3c', '#1abc9c', '#e67e22'];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    adminAPI.getAnalytics({ period }).then(res => setData(res.data)).catch(() => {});
  }, [period]);

  if (!data) return <AdminLayout><div className="loading-container"><div className="spinner" /></div></AdminLayout>;

  const { ordersByStatus, revenueByStore, topProducts, ordersByDay } = data;

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ fontWeight: 800 }}>Analytics</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setPeriod(d)}
              style={{ padding: '8px 18px', borderRadius: 30, border: `2px solid ${period === d ? 'var(--primary)' : 'var(--border)'}`, background: period === d ? 'var(--primary-light)' : 'white', color: period === d ? 'var(--primary-dark)' : 'var(--text-light)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Last {d}d
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Orders by day */}
        <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Orders Over Time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={ordersByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#2ecc71" strokeWidth={2} dot={false} name="Orders" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Orders by status */}
        <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Orders by Status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={ordersByStatus} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}>
                {ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by store */}
        <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Top Stores by Revenue</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueByStore.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey={(d) => d.store?.[0]?.name || 'Unknown'} tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#2ecc71" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top products */}
        <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Top Products</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topProducts.slice(0, 8).map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg)', borderRadius: 8 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ width: 24, height: 24, background: COLORS[i % COLORS.length], borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{p.product?.[0]?.name || 'Unknown'}</span>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13 }}>
                  <div style={{ fontWeight: 700 }}>{p.count} sold</div>
                  <div style={{ color: 'var(--primary)', fontWeight: 600 }}>₹{p.revenue?.toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
