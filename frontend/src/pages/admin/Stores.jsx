import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminStores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getStores({ status, limit: 50 });
      setStores(res.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchStores(); }, [status]);

  const handleApprove = async (id) => {
    try { await adminAPI.approveStore(id); toast.success('Store approved!'); fetchStores(); } catch {}
  };

  const handleReject = async () => {
    try { await adminAPI.rejectStore(rejectModal, rejectReason); toast.success('Store rejected'); setRejectModal(null); setRejectReason(''); fetchStores(); } catch {}
  };

  return (
    <AdminLayout>
      <h1 style={{ fontWeight: 800, marginBottom: 24 }}>Stores</h1>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {['pending', 'approved', ''].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            style={{ padding: '8px 20px', borderRadius: 30, border: `2px solid ${status === s ? 'var(--primary)' : 'var(--border)'}`, background: status === s ? 'var(--primary-light)' : 'white', color: status === s ? 'var(--primary-dark)' : 'var(--text-light)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            {s === 'pending' ? 'Pending' : s === 'approved' ? 'Approved' : 'All'}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
              {['Store', 'Owner', 'Category', 'Location', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {stores.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>No stores found</td></tr>
              ) : stores.map(store => (
                <tr key={store._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700 }}>{store.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{new Date(store.createdAt).toLocaleDateString('en-IN')}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14 }}>
                    <div>{store.owner?.name}</div>
                    <div style={{ color: 'var(--text-light)', fontSize: 12 }}>{store.owner?.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14 }}>{store.category?.replace('_', ' ')}</td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-light)' }}>{store.location?.city}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: store.isApproved ? '#d1fae5' : '#fef3c7', color: store.isApproved ? '#065f46' : '#92400e' }}>
                      {store.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {!store.isApproved ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleApprove(store._id)} style={{ padding: '6px 14px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Approve</button>
                        <button onClick={() => setRejectModal(store._id)} style={{ padding: '6px 14px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Reject</button>
                      </div>
                    ) : <span style={{ color: 'var(--text-light)', fontSize: 13 }}>Active</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: 420 }}>
            <h3 style={{ marginBottom: 16 }}>Reject Store</h3>
            <textarea className="form-control" placeholder="Reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={4} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-danger" onClick={handleReject} disabled={!rejectReason} style={{ flex: 1 }}>Reject</button>
              <button className="btn btn-outline" onClick={() => setRejectModal(null)} style={{ flex: 1 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
