import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { storeAPI } from '../../services/api';

const CATEGORIES = [
  { value: '', label: 'All', emoji: '🛒' },
  { value: 'grocery', label: 'Grocery', emoji: '🏪' },
  { value: 'fruits_vegetables', label: 'Fruits & Veggies', emoji: '🥦' },
  { value: 'dairy', label: 'Dairy', emoji: '🥛' },
  { value: 'bakery', label: 'Bakery', emoji: '🍞' },
  { value: 'meat_seafood', label: 'Meat & Seafood', emoji: '🍖' },
  { value: 'beverages', label: 'Beverages', emoji: '🥤' },
  { value: 'snacks', label: 'Snacks', emoji: '🍫' },
  { value: 'organic', label: 'Organic', emoji: '🌿' },
];

export default function Home() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationError('Geolocation not supported by your browser'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError('');
        setLoading(false);
      },
      err => {
        let message = err?.message || 'Could not get location';
        if (err?.code === 1) message = 'Location permission denied. Allow location access and refresh the page.';
        else if (err?.code === 2) message = 'Unable to determine location. Try again or enter a location manually.';
        else if (err?.code === 3) message = 'Location request timed out. Please try again.';

        setLocation({ lat: 12.9716, lng: 77.5946 });
        setLocationError(`${message} Using default location (Bengaluru).`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => { getLocation(); }, [getLocation]);

  useEffect(() => {
    if (!location) return;
    const fetchStores = async () => {
      setLoading(true);
      try {
        const res = await storeAPI.getNearby({ lat: location.lat, lng: location.lng, radius: 10, category, limit: 20 });
        setStores(res.data || []);
      } catch {}
      setLoading(false);
    };
    fetchStores();
  }, [location, category]);

  const filteredStores = stores.filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div>
      <Navbar />
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #2ecc71 0%, #1abc9c 100%)', padding: '48px 0', color: 'white' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 12 }}>Groceries in 30 minutes ⚡</h1>
          <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 32 }}>Fresh from local stores near you</p>
          <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search stores..."
              style={{ width: '100%', padding: '16px 24px', borderRadius: 50, border: 'none', fontSize: 16, outline: 'none', paddingRight: 120, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
            />
            <button onClick={getLocation} style={{ position: 'absolute', right: 8, top: 8, background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 40, cursor: 'pointer', fontWeight: 600 }}>
              📍 Locate
            </button>
          </div>
          {locationError && <p style={{ marginTop: 8, opacity: 0.8, fontSize: 13 }}>{locationError}</p>}
        </div>
      </div>

      <div className="container" style={{ padding: '32px 16px' }}>
        {/* Categories */}
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8, marginBottom: 32 }}>
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setCategory(c.value)}
              style={{ flexShrink: 0, padding: '10px 20px', borderRadius: 40, border: `2px solid ${category === c.value ? 'var(--primary)' : 'var(--border)'}`, background: category === c.value ? 'var(--primary-light)' : 'white', color: category === c.value ? 'var(--primary-dark)' : 'var(--text-light)', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Stores */}
        <h2 style={{ marginBottom: 20, fontWeight: 700 }}>
          {loading ? 'Finding stores...' : `${filteredStores.length} stores near you`}
        </h2>

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : filteredStores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-light)' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🏪</div>
            <h3>No stores found</h3>
            <p>Try a different category or expand your radius</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {filteredStores.map(store => (
              <StoreCard key={store._id} store={store} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StoreCard({ store }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/store/${store._id}`)}
      style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}>
      <div style={{ height: 160, background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {store.banner ? <img src={store.banner} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 60 }}>🏪</span>}
        {!store.isOpen && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ background: 'white', padding: '6px 16px', borderRadius: 20, fontWeight: 700, color: '#e74c3c' }}>CLOSED</span>
          </div>
        )}
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16 }}>{store.name}</h3>
          <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 8px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>⭐ {store.ratings?.average || 'New'}</span>
        </div>
        <p style={{ color: 'var(--text-light)', fontSize: 13, marginBottom: 12 }}>{store.description || store.category?.replace('_', ' ')}</p>
        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-light)' }}>
          <span>🕒 {store.deliveryTime}</span>
          <span>📍 {store.distance} km</span>
          <span>💰 Min ₹{store.minOrderAmount}</span>
        </div>
      </div>
    </div>
  );
}
