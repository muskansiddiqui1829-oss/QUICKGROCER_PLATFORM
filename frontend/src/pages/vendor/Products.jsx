import React, { useState, useEffect } from 'react';
import VendorLayout from '../../components/vendor/VendorLayout';
import { productAPI } from '../../services/api';
import toast from 'react-hot-toast';

const EMPTY_FORM = { name: '', description: '', price: '', mrp: '', stock: '', category: '', unit: 'piece', quantity: 1, isFeatured: false };

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getMyProducts({ limit: 100 });
      setProducts(res.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowModal(true); };
  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || '', price: p.price, mrp: p.mrp, stock: p.stock, category: p.category, unit: p.unit, quantity: p.quantity, isFeatured: p.isFeatured });
    setEditId(p._id); setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editId) {
        await productAPI.update(editId, form);
        toast.success('Product updated');
      } else {
        await productAPI.create(form);
        toast.success('Product added!');
      }
      setShowModal(false); fetchProducts();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this product?')) return;
    try { await productAPI.delete(id); toast.success('Product removed'); fetchProducts(); } catch {}
  };

  const handleStockUpdate = async (id, stock) => {
    try { await productAPI.updateStock(id, stock); setProducts(ps => ps.map(p => p._id === id ? { ...p, stock } : p)); } catch {}
  };

  return (
    <VendorLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontWeight: 800 }}>Products <span style={{ fontSize: 18, color: 'var(--text-light)', fontWeight: 400 }}>({products.length})</span></h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
      </div>

      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
              {['Product', 'Category', 'Price/MRP', 'Stock', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 60, color: 'var(--text-light)' }}>No products yet. Add your first product!</td></tr>
              ) : products.map(p => (
                <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 44, height: 44, background: 'var(--bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {p.images?.[0] ? <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : '🛍️'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{p.quantity} {p.unit}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14 }}>{p.category}</td>
                  <td style={{ padding: '14px 16px', fontSize: 14 }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>₹{p.price}</span>
                    {p.mrp > p.price && <span style={{ marginLeft: 8, color: 'var(--text-light)', textDecoration: 'line-through', fontSize: 13 }}>₹{p.mrp}</span>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => handleStockUpdate(p._id, Math.max(0, p.stock - 1))} style={{ width: 26, height: 26, border: '1.5px solid var(--border)', borderRadius: 6, background: 'none', cursor: 'pointer', fontWeight: 700 }}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 30, textAlign: 'center' }}>{p.stock}</span>
                      <button onClick={() => handleStockUpdate(p._id, p.stock + 1)} style={{ width: 26, height: 26, border: '1.5px solid var(--primary)', borderRadius: 6, background: 'var(--primary)', color: 'white', cursor: 'pointer', fontWeight: 700 }}>+</button>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: p.isActive ? '#d1fae5' : '#fee2e2', color: p.isActive ? '#065f46' : '#991b1b' }}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEdit(p)} style={{ padding: '6px 14px', background: 'var(--secondary)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Edit</button>
                      <button onClick={() => handleDelete(p._id)} style={{ padding: '6px 14px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: 24, fontWeight: 700 }}>{editId ? 'Edit Product' : 'Add New Product'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[['name', 'Product Name', 'span 2'], ['category', 'Category'], ['price', 'Selling Price (₹)'], ['mrp', 'MRP (₹)'], ['stock', 'Stock'], ['quantity', 'Quantity']].map(([key, label, span]) => (
                <div key={key} className="form-group" style={{ gridColumn: span || undefined }}>
                  <label>{label}</label>
                  <input className="form-control" type={['price', 'mrp', 'stock', 'quantity'].includes(key) ? 'number' : 'text'}
                    value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                </div>
              ))}
              <div className="form-group">
                <label>Unit</label>
                <select className="form-control" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                  {['piece', 'kg', 'g', 'litre', 'ml', 'dozen', 'pack', 'box', 'bottle'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 24 }}>
                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} id="featured" />
                <label htmlFor="featured" style={{ margin: 0 }}>Featured</label>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Description</label>
                <textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save Product'}</button>
              <button className="btn btn-outline" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
}
