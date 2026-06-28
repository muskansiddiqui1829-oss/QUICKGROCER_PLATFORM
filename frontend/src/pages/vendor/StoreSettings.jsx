// StoreSettings.jsx
import React, { useState, useEffect } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { storeAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function StoreSettings() {
  const [store, setStore] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    storeAPI.getMyStore().then(res => { setStore(res.data); setForm(res.data); }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await storeAPI.update(store._id, form);
      setStore(res.data);
      toast.success('Store settings saved!');
    } catch {}
    setSaving(false);
  };

  if (!store) return <VendorLayout><div className="loading-container"><div className="spinner" /></div></VendorLayout>;

  return (
    <VendorLayout>
      <h1 style={{ fontWeight: 800, marginBottom: 24 }}>Store Settings</h1>
      <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', padding: 32, maxWidth: 680 }}>
        {[['name', 'Store Name'], ['description', 'Description'], ['deliveryTime', 'Delivery Time (e.g. 30-45 mins)'], ['minOrderAmount', 'Minimum Order Amount (₹)'], ['deliveryRadius', 'Delivery Radius (km)']].map(([key, label]) => (
          <div key={key} className="form-group">
            <label>{label}</label>
            {key === 'description'
              ? <textarea className="form-control" value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} rows={3} />
              : <input className="form-control" value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
            }
          </div>
        ))}
        <div style={{ background: 'var(--primary-light)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14, color: 'var(--primary-dark)' }}>
          Store Status: <strong>{store.isApproved ? '✅ Approved' : '⏳ Pending Admin Approval'}</strong>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </VendorLayout>
  );
}
