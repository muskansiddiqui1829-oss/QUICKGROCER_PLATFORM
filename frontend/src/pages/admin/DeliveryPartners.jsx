import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminDelivery() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getDeliveryPartners({ status });
      setPartners(res.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPartners(); }, [status]);

  const handleApprove = async (id) => {
    try {
      await adminAPI.approveDeliveryPartner(id);
      toast.success('Partner approved!');
      fetchPartners();
    } catch {}
  };

  return (
    <AdminLayout>
      <h1 style={{ fontWeight: 800, marginBottom: 24 }}>Delivery Partners</h1>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {['pending', 'approved', ''].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            style={{ padding: '8px 20px', borderRadius: 30, border: `2px solid ${status === s ? 'var(--primary)' : 'var(--border)'}`, background: status === s ? 'var(--primary-light)' : 'white', color: status === s ? 'var(--primary-dark)' : 'var(--text-light)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            {s === 'pending' ? 'Pending' : s === 'approved' ? 'Approved' : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-container"><div className="spinner" /></div>
      ) : (
        <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                {['Partner', 'Vehicle', 'License', 'Deliveries', 'Earnings', 'Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partners.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-light)' }}>No partners found</td></tr>
              ) : partners.map(p => (
                <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{p.user?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{p.user?.phone}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14 }}>
                    <div>{p.vehicleType}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{p.vehicleNumber}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-light)' }}>{p.licenseNumber}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700 }}>{p.totalDeliveries}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--primary-dark)' }}>₹{(p.earnings?.total || 0).toLocaleString('en-IN')}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: p.isApproved ? '#d1fae5' : '#fef3c7', color: p.isApproved ? '#065f46' : '#92400e' }}>
                      {p.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {!p.isApproved && (
                      <button onClick={() => handleApprove(p._id)}
                        style={{ padding: '6px 14px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
