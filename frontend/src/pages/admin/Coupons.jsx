import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EMPTY = {
  code: '', description: '', type: 'percentage', value: '', minOrderAmount: 0,
  maxDiscount: '', usageLimit: '', userUsageLimit: 1, validFrom: '', validUntil: '', isActive: true,
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try { const res = await adminAPI.getCoupons(); setCoupons(res.data || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setShowModal(true); };
  const openEdit = (c) => {
    setForm({ ...c, validFrom: c.validFrom?.slice(0, 10), validUntil: c.validUntil?.slice(0, 10) });
    setEditId(c._id); setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) { await adminAPI.updateCoupon(editId, form); toast.success('Coupon updated'); }
      else { await adminAPI.createCoupon(form); toast.success('Coupon created!'); }
      setShowModal(false); fetchCoupons();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try { await adminAPI.deleteCoupon(id); toast.success('Deleted'); fetchCoupons(); } catch {}
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800 }}>Coupons</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Create Coupon</button>
      </div>

      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {coupons.map(c => (
            <div key={c._id} style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', padding: 20, borderLeft: `4px solid ${c.isActive ? 'var(--primary)' : 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: 2, color: 'var(--primary)' }}>{c.code}</div>
                  <div style={{ color: 'var(--text-light)', fontSize: 13, marginTop: 2 }}>{c.description}</div>
                </div>
                <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.isActive ? '#d1fae5' : '#fee2e2', color: c.isActive ? '#065f46' : '#991b1b' }}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                {[
                  ['Type', c.type], ['Value', c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`],
                  ['Min Order', `₹${c.minOrderAmount}`], ['Used', `${c.usedCount}${c.usageLimit ? `/${c.usageLimit}` : ''}`],
                  ['Valid Till', new Date(c.validUntil).toLocaleDateString('en-IN')],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => openEdit(c)} style={{ flex: 1, padding: '8px', background: 'var(--secondary)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Edit</button>
                <button onClick={() => handleDelete(c._id)} style={{ flex: 1, padding: '8px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: 24, fontWeight: 700 }}>{editId ? 'Edit Coupon' : 'Create Coupon'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                ['code', 'Coupon Code', 'span 2', 'text'],
                ['description', 'Description', 'span 2', 'text'],
                ['value', 'Discount Value', null, 'number'],
                ['minOrderAmount', 'Min Order Amount (₹)', null, 'number'],
                ['maxDiscount', 'Max Discount (₹)', null, 'number'],
                ['usageLimit', 'Total Usage Limit', null, 'number'],
                ['userUsageLimit', 'Per User Limit', null, 'number'],
                ['validFrom', 'Valid From', null, 'date'],
                ['validUntil', 'Valid Until', null, 'date'],
              ].map(([key, label, span, type]) => (
                <div key={key} className="form-group" style={{ gridColumn: span || undefined }}>
                  <label>{label}</label>
                  <input className="form-control" type={type} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div className="form-group">
                <label>Type</label>
                <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="free_delivery">Free Delivery</option>
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
                <input type="checkbox" id="active" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                <label htmlFor="active" style={{ margin: 0 }}>Active</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="btn btn-outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
