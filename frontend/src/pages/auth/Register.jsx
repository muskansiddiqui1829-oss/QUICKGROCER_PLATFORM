import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'customer' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await register(form);
      toast.success('Account created!');
      if (user.role === 'vendor') navigate('/vendor/onboarding');
      else if (user.role === 'delivery') navigate('/delivery');
      else navigate('/');
    } catch {}
    setLoading(false);
  };

  const roles = [
    { value: 'customer', label: '🛒 Customer', desc: 'Order groceries' },
    { value: 'vendor', label: '🏪 Vendor', desc: 'Sell products' },
    { value: 'delivery', label: '🚴 Delivery', desc: 'Deliver orders' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2ecc71, #3498db)', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48 }}>🛒</div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Create Account</h1>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {roles.map(r => (
            <button key={r.value} type="button" onClick={() => setForm({ ...form, role: r.value })}
              style={{ flex: 1, padding: '12px 8px', border: `2px solid ${form.role === r.value ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 10, background: form.role === r.value ? 'var(--primary-light)' : 'white', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: form.role === r.value ? 'var(--primary-dark)' : 'var(--text-light)', transition: 'all 0.2s' }}>
              <div>{r.label}</div><div style={{ fontSize: 11, marginTop: 2 }}>{r.desc}</div>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input className="form-control" placeholder="9876543210" maxLength={10} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-light)', fontSize: 14 }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
