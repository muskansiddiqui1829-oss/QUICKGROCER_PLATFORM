import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { storeAPI, productAPI } from '../../services/api';
import useCartStore from '../../context/cartStore';
import useAuthStore from '../../context/authStore';
import toast from 'react-hot-toast';

export default function StorePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { addItem, updateQuantity, getItemCount, getTotal, getCount, storeId: cartStoreId } = useCartStore();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storeRes, productRes, catRes] = await Promise.all([
          storeAPI.getById(id),
          productAPI.getAll({ storeId: id, limit: 100 }),
          productAPI.getCategories({ storeId: id }),
        ]);
        setStore(storeRes.data);
        setProducts(productRes.data || []);
        setCategories(catRes.data || []);
      } catch { navigate('/'); }
      setLoading(false);
    };
    fetchData();
  }, [id, navigate]);

  const filtered = products.filter(p => {
    const matchesCategory = !activeCategory || p.category === activeCategory;
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product) => {
    if (!isAuthenticated) { toast.error('Please login to add items'); navigate('/login'); return; }
    addItem(product, store._id, store.name);
  };

  if (loading) return <div><Navbar /><div className="loading-container"><div className="spinner" /></div></div>;
  if (!store) return null;

  const cartTotal = getTotal();
  const cartCount = getCount();
  const showCartBar = cartStoreId === store._id && cartCount > 0;

  return (
    <div style={{ paddingBottom: showCartBar ? 80 : 0 }}>
      <Navbar />

      {/* Store Header */}
      <div style={{ background: 'linear-gradient(135deg, #2ecc71, #1abc9c)', color: 'white', padding: '32px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 80, height: 80, background: 'rgba(255,255,255,0.2)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
            {store.logo ? <img src={store.logo} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} /> : '🏪'}
          </div>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800 }}>{store.name}</h1>
            <p style={{ opacity: 0.9, marginTop: 4 }}>{store.description}</p>
            <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 14, opacity: 0.9 }}>
              <span>⭐ {store.ratings?.average || 'New'} ({store.ratings?.count || 0} reviews)</span>
              <span>🕒 {store.deliveryTime}</span>
              <span>💰 Min ₹{store.minOrderAmount}</span>
              <span style={{ background: store.isOpen ? 'rgba(255,255,255,0.25)' : 'rgba(231,76,60,0.7)', padding: '2px 10px', borderRadius: 12, fontWeight: 700 }}>
                {store.isOpen ? '🟢 Open' : '🔴 Closed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '24px 16px' }}>
        {/* Search */}
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search products..."
          style={{ width: '100%', padding: '12px 20px', borderRadius: 50, border: '2px solid var(--border)', fontSize: 15, marginBottom: 24, background: 'white' }}
        />

        <div style={{ display: 'flex', gap: 24 }}>
          {/* Category sidebar */}
          {categories.length > 0 && (
            <div style={{ width: 180, flexShrink: 0 }}>
              <h4 style={{ marginBottom: 12, color: 'var(--text-light)', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>Categories</h4>
              {[{ _id: '', count: products.length }, ...categories].map(cat => (
                <button key={cat._id} onClick={() => setActiveCategory(cat._id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 14px', marginBottom: 4, borderRadius: 8, border: 'none', background: activeCategory === cat._id ? 'var(--primary-light)' : 'transparent', color: activeCategory === cat._id ? 'var(--primary-dark)' : 'var(--text)', cursor: 'pointer', fontWeight: activeCategory === cat._id ? 700 : 400, fontSize: 14 }}>
                  <span>{cat._id || 'All'}</span>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>{cat.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Products grid */}
          <div style={{ flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-light)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                <h3>No products found</h3>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {filtered.map(product => (
                  <ProductCard key={product._id} product={product} storeIsOpen={store.isOpen}
                    quantity={getItemCount(product._id)}
                    onAdd={() => handleAddToCart(product)}
                    onIncrease={() => updateQuantity(product._id, getItemCount(product._id) + 1)}
                    onDecrease={() => updateQuantity(product._id, getItemCount(product._id) - 1)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Cart Bar */}
      {showCartBar && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--primary)', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)', zIndex: 100 }}>
          <div>
            <span style={{ fontWeight: 700 }}>{cartCount} item{cartCount > 1 ? 's' : ''}</span>
            <span style={{ opacity: 0.9, marginLeft: 8 }}>₹{cartTotal.toFixed(0)}</span>
          </div>
          <button onClick={() => navigate('/cart')}
            style={{ background: 'white', color: 'var(--primary)', padding: '10px 24px', borderRadius: 8, fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 15 }}>
            View Cart →
          </button>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, storeIsOpen, quantity, onAdd, onIncrease, onDecrease }) {
  const discountPct = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  return (
    <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 140, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 48 }}>🛍️</span>}
        {discountPct > 0 && (
          <span style={{ position: 'absolute', top: 8, left: 8, background: 'var(--danger)', color: 'white', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6 }}>{discountPct}% OFF</span>
        )}
        {product.stock === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--text-light)' }}>OUT OF STOCK</div>
        )}
      </div>
      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{product.name}</h4>
          <p style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 8 }}>{product.quantity} {product.unit}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--primary-dark)' }}>₹{product.price}</span>
            {product.mrp > product.price && <span style={{ fontSize: 12, color: 'var(--text-light)', textDecoration: 'line-through' }}>₹{product.mrp}</span>}
          </div>
        </div>
        {quantity === 0 ? (
          <button onClick={onAdd} disabled={!storeIsOpen || product.stock === 0}
            style={{ width: '100%', padding: '9px', background: storeIsOpen && product.stock > 0 ? 'var(--primary)' : 'var(--border)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: storeIsOpen && product.stock > 0 ? 'pointer' : 'not-allowed', fontSize: 14 }}>
            {!storeIsOpen ? 'Store Closed' : product.stock === 0 ? 'Out of Stock' : 'Add'}
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--primary)', borderRadius: 8, overflow: 'hidden' }}>
            <button onClick={onDecrease} style={{ background: 'none', border: 'none', color: 'white', padding: '8px 16px', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>−</button>
            <span style={{ color: 'white', fontWeight: 700 }}>{quantity}</span>
            <button onClick={onIncrease} style={{ background: 'none', border: 'none', color: 'white', padding: '8px 16px', cursor: 'pointer', fontSize: 18, fontWeight: 700 }}>+</button>
          </div>
        )}
      </div>
    </div>
  );
}
