import React, { useState, useEffect, useRef } from 'react';
import { DeliveryLayout } from '../../components/delivery/DeliveryLayout';
import { deliveryAPI } from '../../services/api';
import { getSocket, sendLocationUpdate } from '../../services/socket';
import toast from 'react-hot-toast';

export default function DeliveryDashboard() {
  const [dashData, setDashData] = useState(null);
  const [otp, setOtp] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const locationWatchId = useRef(null);

  const fetchDashboard = async () => {
    try {
      const res = await deliveryAPI.getDashboard();
      setDashData(res.data);
    } catch {}
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleToggleDuty = async () => {
    setActionLoading('duty');
    try {
      const res = await deliveryAPI.toggleDuty();
      setDashData(prev => ({ ...prev, isOnDuty: res.data.isOnDuty, isAvailable: res.data.isAvailable }));
      toast.success(res.data.isOnDuty ? '🟢 You are on duty!' : '🔴 You are off duty');

      if (res.data.isOnDuty) {
        locationWatchId.current = navigator.geolocation.watchPosition(
          pos => deliveryAPI.updateLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {}),
          err => {
            toast.error(`Location error: ${err?.message || 'Unable to get location'}`);
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
        );
      } else {
        if (locationWatchId.current) navigator.geolocation.clearWatch(locationWatchId.current);
      }
    } catch {}
    setActionLoading('');
  };

  const handlePickup = async (orderId) => {
    setActionLoading('pickup');
    try {
      await deliveryAPI.confirmPickup(orderId);
      toast.success('Pickup confirmed!');
      fetchDashboard();
    } catch {}
    setActionLoading('');
  };

  const handleDeliver = async (orderId) => {
    if (!otp) { toast.error('Enter OTP'); return; }
    setActionLoading('deliver');
    try {
      await deliveryAPI.confirmDelivery(orderId, otp);
      toast.success('Delivery confirmed! 🎉');
      setOtp('');
      fetchDashboard();
    } catch {}
    setActionLoading('');
  };

  if (!dashData) return <DeliveryLayout><div className="loading-container"><div className="spinner" /></div></DeliveryLayout>;

  const { partner, activeOrder, isOnDuty } = dashData;

  return (
    <DeliveryLayout>
      <h1 style={{ fontWeight: 800, marginBottom: 24 }}>Dashboard</h1>

      {/* Duty Toggle */}
      <div style={{ background: isOnDuty ? 'linear-gradient(135deg, #2ecc71, #27ae60)' : 'linear-gradient(135deg, #95a5a6, #7f8c8d)', borderRadius: 16, padding: 24, color: 'white', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontWeight: 800 }}>{isOnDuty ? '🟢 You are On Duty' : '🔴 You are Off Duty'}</h2>
          <p style={{ opacity: 0.9, marginTop: 4 }}>{isOnDuty ? 'Ready to accept deliveries' : 'Toggle to start accepting orders'}</p>
        </div>
        <button onClick={handleToggleDuty} disabled={actionLoading === 'duty'}
          style={{ background: 'white', color: isOnDuty ? '#e74c3c' : '#2ecc71', padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>
          {actionLoading === 'duty' ? '...' : isOnDuty ? 'Go Off Duty' : 'Go On Duty'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: "Today's Earnings", value: `₹${partner?.earnings?.today || 0}`, icon: '💵', color: '#2ecc71' },
          { label: 'Total Deliveries', value: partner?.totalDeliveries || 0, icon: '📦', color: '#3498db' },
          { label: 'Rating', value: `⭐ ${partner?.ratings?.average || 'New'}`, icon: '⭐', color: '#f39c12' },
        ].map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow)', borderLeft: `4px solid ${card.color}`, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ color: 'var(--text-light)', fontSize: 13 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Active Order */}
      {activeOrder ? (
        <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', padding: 24 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 20 }}>📦 Active Delivery</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 10 }}>
              <h4 style={{ marginBottom: 8, color: 'var(--text-light)', fontSize: 13 }}>PICKUP FROM</h4>
              <p style={{ fontWeight: 700, fontSize: 16 }}>{activeOrder.store?.name}</p>
              <p style={{ color: 'var(--text-light)', fontSize: 14 }}>{activeOrder.store?.location?.address}</p>
            </div>
            <div style={{ padding: 16, background: 'var(--bg)', borderRadius: 10 }}>
              <h4 style={{ marginBottom: 8, color: 'var(--text-light)', fontSize: 13 }}>DELIVER TO</h4>
              <p style={{ fontWeight: 700, fontSize: 16 }}>{activeOrder.customer?.name}</p>
              <p style={{ color: 'var(--text-light)', fontSize: 14 }}>{activeOrder.deliveryAddress?.street}, {activeOrder.deliveryAddress?.city}</p>
              <p style={{ fontWeight: 600, color: 'var(--primary)' }}>📞 {activeOrder.customer?.phone}</p>
            </div>
          </div>
          <div style={{ marginBottom: 16, padding: 14, background: 'var(--primary-light)', borderRadius: 10 }}>
            <span style={{ fontWeight: 700 }}>Order:</span> #{activeOrder.orderNumber} • {activeOrder.items?.length} items • <span style={{ color: 'var(--primary-dark)', fontWeight: 700 }}>₹{activeOrder.totalAmount}</span>
          </div>
          {activeOrder.status === 'assigned' ? (
            <button className="btn btn-primary" style={{ width: '100%', padding: 14, fontSize: 16 }}
              onClick={() => handlePickup(activeOrder._id)} disabled={actionLoading === 'pickup'}>
              {actionLoading === 'pickup' ? 'Confirming...' : '✅ Confirm Pickup from Store'}
            </button>
          ) : activeOrder.status === 'out_for_delivery' ? (
            <div style={{ display: 'flex', gap: 12 }}>
              <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 4-digit OTP from customer"
                style={{ flex: 1, padding: '14px 16px', border: '2px solid var(--border)', borderRadius: 10, fontSize: 16, letterSpacing: 4, fontWeight: 700, textAlign: 'center' }} maxLength={4} />
              <button className="btn btn-primary" style={{ padding: '14px 24px' }} onClick={() => handleDeliver(activeOrder._id)} disabled={actionLoading === 'deliver'}>
                {actionLoading === 'deliver' ? '...' : '🎉 Delivered!'}
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🏍️</div>
          <h3>{isOnDuty ? 'Waiting for a delivery...' : 'Go on duty to receive deliveries'}</h3>
        </div>
      )}
    </DeliveryLayout>
  );
}
