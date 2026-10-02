import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent to your email');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to send the reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #2ecc71, #3498db)', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
        <h2 style={{ marginBottom: 8 }}>Forgot Password?</h2>
        {sent ? (
          <>
            <p style={{ color: 'var(--text-light)' }}>Check your email for the reset link.</p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>Back to Login</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>Enter your email to receive a password reset link.</p>
            <div className="form-group">
              <label>Email</label>
              <input className="form-control" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            {error && <p role="alert" style={{ color: 'var(--danger)', marginBottom: 16 }}>{error}</p>}
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <Link to="/login" style={{ display: 'block', textAlign: 'center', marginTop: 16, color: 'var(--text-light)', fontSize: 14 }}>Back to Login</Link>
          </form>
        )}
      </div>
    </div>
  );
}
