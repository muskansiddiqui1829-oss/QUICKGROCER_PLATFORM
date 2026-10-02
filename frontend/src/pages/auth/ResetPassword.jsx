import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authAPI.resetPassword(token, password);
      toast.success('Password updated. Please sign in.');
      navigate('/login', { replace: true });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to reset your password. Please request a new link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2ecc71, #3498db)', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48 }}>🔐</div>
          <h2 style={{ marginBottom: 8 }}>Reset Password</h2>
          <p style={{ color: 'var(--text-light)' }}>Choose a new password for your account.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              className="form-control"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              className="form-control"
              type="password"
              autoComplete="new-password"
              minLength={6}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <p role="alert" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</p>}
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Updating password...' : 'Reset Password'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-light)', fontSize: 14 }}>
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
}
