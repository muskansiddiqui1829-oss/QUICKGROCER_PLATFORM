import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import useCartStore from '../../context/cartStore';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const cartCount = useCartStore(state => state.getCount());
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 20, color: 'var(--primary)' }}>
          🛒 QuickGrocer
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {isAuthenticated ? (
            <>
              {user?.role === 'customer' && (
                <>
                  <Link to="/orders" style={{ color: 'var(--text-light)', fontSize: 14, fontWeight: 500 }}>My Orders</Link>
                  <Link to="/cart" style={{ position: 'relative', background: 'var(--primary)', color: 'white', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
                    🛒 Cart {cartCount > 0 && <span style={{ background: 'white', color: 'var(--primary)', fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 10, marginLeft: 6 }}>{cartCount}</span>}
                  </Link>
                </>
              )}
              {user?.role === 'vendor' && (
                <Link to="/vendor" style={{ color: 'var(--text-light)', fontSize: 14, fontWeight: 500 }}>Dashboard</Link>
              )}
              {user?.role === 'delivery' && (
                <Link to="/delivery" style={{ color: 'var(--text-light)', fontSize: 14, fontWeight: 500 }}>Dashboard</Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" style={{ color: 'var(--text-light)', fontSize: 14, fontWeight: 500 }}>Admin</Link>
              )}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'var(--bg)', border: 'none', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500 }}>
                  <div style={{ width: 32, height: 32, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 14 }}>{user?.name?.split(' ')[0]}</span>
                </button>
                {menuOpen && (
                  <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 8, background: 'white', boxShadow: 'var(--shadow-lg)', borderRadius: 10, minWidth: 180, overflow: 'hidden', zIndex: 200 }}>
                    <Link to="/profile" onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '12px 16px', fontSize: 14, color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>👤 Profile</Link>
                    <button onClick={handleLogout} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', fontSize: 14, color: 'var(--danger)', background: 'none', cursor: 'pointer' }}>🚪 Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'var(--text-light)', fontSize: 14, fontWeight: 500 }}>Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
