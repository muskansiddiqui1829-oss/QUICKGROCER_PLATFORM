// DeliveryLayout.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';

const NAV = [
  { to: '/delivery', label: 'Dashboard', icon: '📊', end: true },
  { to: '/delivery/orders', label: 'Orders', icon: '📋' },
  { to: '/delivery/earnings', label: 'Earnings', icon: '💰' },
];

export function DeliveryLayout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: 220, background: 'white', boxShadow: '2px 0 10px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0 }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>🚴 Delivery</div>
          <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>{user?.name}</div>
        </div>
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, marginBottom: 4, textDecoration: 'none', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--primary-dark)' : 'var(--text-light)', background: isActive ? 'var(--primary-light)' : 'transparent' })}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>{item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: 16 }}>
          <button onClick={() => { logout(); navigate('/login'); }} style={{ width: '100%', padding: 12, borderRadius: 10, background: 'none', border: '1.5px solid var(--border)', cursor: 'pointer', color: 'var(--text-light)', fontWeight: 600 }}>🚪 Logout</button>
        </div>
      </div>
      <div style={{ flex: 1, marginLeft: 220, padding: 28 }}>{children}</div>
    </div>
  );
}
