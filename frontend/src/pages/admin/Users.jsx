// Users.jsx
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('customer');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ role, search, limit: 50 });
      setUsers(res.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [role]);

  const handleToggle = async (id) => {
    try { await adminAPI.toggleUserStatus(id); toast.success('Status updated'); fetchUsers(); } catch {}
  };

  return (
    <AdminLayout>
      <h1 style={{ fontWeight: 800, marginBottom: 24 }}>Users</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        {['customer', 'vendor', 'delivery', 'admin'].map(r => (
          <button key={r} onClick={() => setRole(r)}
            style={{ padding: '8px 20px', borderRadius: 30, border: `2px solid ${role === r ? 'var(--primary)' : 'var(--border)'}`, background: role === r ? 'var(--primary-light)' : 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, color: role === r ? 'var(--primary-dark)' : 'var(--text-light)' }}>
            {r}
          </button>
        ))}
        <input placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} onKeyPress={e => e.key === 'Enter' && fetchUsers()}
          style={{ padding: '8px 16px', border: '2px solid var(--border)', borderRadius: 30, marginLeft: 'auto', fontSize: 14 }} />
      </div>
      {loading ? <div className="loading-container"><div className="spinner" /></div> : (
        <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
              {['User', 'Phone', 'Role', 'Joined', 'Status', 'Action'].map(h => <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: 13, color: 'var(--text-light)', fontWeight: 600 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14 }}>{u.phone}</td>
                  <td style={{ padding: '14px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 20, background: 'var(--primary-light)', color: 'var(--primary-dark)', fontSize: 12, fontWeight: 600 }}>{u.role}</span></td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-light)' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '14px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: u.isActive ? '#d1fae5' : '#fee2e2', color: u.isActive ? '#065f46' : '#991b1b' }}>{u.isActive ? 'Active' : 'Banned'}</span></td>
                  <td style={{ padding: '14px 16px' }}>
                    <button onClick={() => handleToggle(u._id)} style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: u.isActive ? '#fee2e2' : '#d1fae5', color: u.isActive ? '#991b1b' : '#065f46' }}>
                      {u.isActive ? 'Ban' : 'Unban'}
                    </button>
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
