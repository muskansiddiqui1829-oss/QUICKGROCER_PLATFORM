import React, { useState } from 'react';
import Navbar from '../../components/common/Navbar';
import useAuthStore from '../../context/authStore';
import { userAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await userAPI.updateProfile(form);
      updateUser(res.data);
      toast.success('Profile updated!');
    } catch {}
    setSaving(false);
  };

  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: '32px 16px', maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ marginBottom: 32, fontWeight: 700 }}>My Profile</h1>
        <div style={{ background: 'white', borderRadius: 16, boxShadow: 'var(--shadow)', padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg, #2ecc71, #3498db)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: 'white', margin: '0 auto 12px' }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} maxLength={10} />
          </div>
          <div className="form-group">
            <label>Email (cannot change)</label>
            <input className="form-control" value={user?.email} disabled style={{ opacity: 0.6 }} />
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%', marginTop: 8 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
