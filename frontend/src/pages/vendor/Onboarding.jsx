import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['grocery', 'fruits_vegetables', 'dairy', 'bakery', 'meat_seafood', 'beverages', 'snacks', 'organic', 'general'];

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', description: '', category: ['grocery'], minOrderAmount: 99, deliveryRadius: 5, deliveryTime: '30-45 mins', location: { type: 'Point', coordinates: [77.5946, 12.9716], address: '', city: '', state: '', pincode: '' } });
  const [saving, setSaving] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, location: { ...f.location, coordinates: [pos.coords.longitude, pos.coords.latitude] } }));
        toast.success('Location captured!');
      },
      err => {
        let message = err?.message || 'Could not get location';
        if (err?.code === 1) message = 'Location permission denied. Enable location access and try again.';
        else if (err?.code === 2) message = 'Unable to determine location. Check GPS and try again.';
        else if (err?.code === 3) message = 'Location request timed out. Try again.';
        toast.error(message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await storeAPI.create(form);
      toast.success('Store created! Awaiting admin approval.');
      navigate('/vendor');
    } catch {}
    setSaving(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #2ecc71 0%, #3498db 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: 40, width: '100%', maxWidth: 580, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏪</div>
          <h1 style={{ fontWeight: 800, fontSize: 26 }}>Set Up Your Store</h1>
          <p style={{ color: 'var(--text-light)' }}>Step {step} of 2</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
            {[1, 2].map(s => <div key={s} style={{ width: 40, height: 4, borderRadius: 2, background: s <= step ? 'var(--primary)' : 'var(--border)' }} />)}
          </div>
        </div>

        {step === 1 && (
          <div>
            <div className="form-group">
              <label>Store Name *</label>
              <input className="form-control" placeholder="e.g. Fresh Mart" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea className="form-control" placeholder="Tell customers what you sell..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="form-group">
              <label>Categories *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map(c => {
                  const selected = form.category.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(prev => {
                        const next = prev.category.includes(c)
                          ? prev.category.filter(item => item !== c)
                          : [...prev.category, c];
                        return { ...prev, category: next };
                      })}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 20,
                        border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                        background: selected ? 'var(--primary-light)' : 'white',
                        color: selected ? 'var(--primary-dark)' : 'var(--text-light)',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {c.replace('_', ' & ')}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 8 }}>
                {form.category.length ? `${form.category.length} selected` : 'Select at least one category'}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label>Min Order Amount (₹)</label>
                <input className="form-control" type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: +e.target.value })} />
              </div>
              <div className="form-group">
                <label>Delivery Radius (km)</label>
                <input className="form-control" type="number" value={form.deliveryRadius} onChange={e => setForm({ ...form, deliveryRadius: +e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', padding: 14 }} onClick={() => setStep(2)} disabled={!form.name || form.category.length === 0}>Next →</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>📍 Store Location</h3>
            <button onClick={handleGetLocation} style={{ width: '100%', padding: '12px', border: '2px dashed var(--primary)', borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, marginBottom: 16 }}>
              📍 Use My Current Location
            </button>
            {[['address', 'Street Address', 'span 2'], ['city', 'City'], ['state', 'State'], ['pincode', 'Pincode']].map(([key, label, span]) => (
              <div key={key} className="form-group" style={{ gridColumn: span }}>
                <label>{label}</label>
                <input className="form-control" value={form.location[key] || ''} onChange={e => setForm(f => ({ ...f, location: { ...f.location, [key]: e.target.value } }))} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleSubmit} disabled={saving || !form.location.city}>{saving ? 'Creating...' : '🚀 Create Store'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
