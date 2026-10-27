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
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchStores = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const limit = 100;
        const firstPage = await storeAPI.getAll({ category, limit, page: 1 });
        const allStores = firstPage.data || [];
        const pages = firstPage.pagination?.pages || 1;

        for (let page = 2; page <= pages; page += 1) {
          const res = await storeAPI.getAll({ category, limit, page });
          allStores.push(...(res.data || []));
        }

        if (!cancelled) setStores(allStores);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error?.response?.data?.message || 'Unable to load stores. Refresh the page to try again.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStores();
    return () => { cancelled = true; };
  }, [category]);

  const filteredStores = stores.filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div>
      <Navbar />
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #2ecc71 0%, #1abc9c 100%)', padding: '48px 0', color: 'white' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 12 }}>Groceries in 30 minutes ⚡</h1>
          <p style={{ fontSize: 18, opacity: 0.9, marginBottom: 32 }}>Browse stores from every location</p>
          <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative' }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search stores..."
              style={{ width: '100%', padding: '16px 24px', borderRadius: 50, border: 'none', fontSize: 16, outline: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
            />
          </div>
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
          {loading ? 'Loading stores...' : `${filteredStores.length} stores available`}
        </h2>

        {loading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : loadError ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-light)' }}>
            <h3>{loadError}</h3>
          </div>
        ) : filteredStores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-light)' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🏪</div>
            <h3>No stores found</h3>
            <p>Try a different category or search term</p>
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
          <span>📍 {store.location?.city || store.location?.address}</span>
          <span>💰 Min ₹{store.minOrderAmount}</span>
        </div>
      </div>
    </div>
  );
}
