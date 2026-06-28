import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/stores', label: 'Stores', icon: '🏪' },
  { to: '/admin/users', label: 'Users', icon: '👥' },
  { to: '/admin/orders', label: 'Orders', icon: '📋' },
  { to: '/admin/delivery', label: 'Delivery Partners', icon: '🚴' },
  { to: '/admin/coupons', label: 'Coupons', icon: '🏷️' },
  { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
];

export default function AdminLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 250, background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: '28px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#2ecc71' }}>⚙️ Admin Panel</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{user?.name}</div>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, marginBottom: 4, textDecoration: 'none', color: isActive ? '#2ecc71' : 'rgba(255,255,255,0.65)', background: isActive ? 'rgba(46,204,113,0.15)' : 'transparent', fontWeight: isActive ? 700 : 400, transition: 'all 0.2s' })}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: 16 }}>
          <button onClick={() => { logout(); navigate('/login'); }} style={{ width: '100%', padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>🚪 Logout</button>
        </div>
      </div>
      <div style={{ flex: 1, marginLeft: 250, padding: 28, minHeight: '100vh' }}>{children}</div>
    </div>
  );
}
