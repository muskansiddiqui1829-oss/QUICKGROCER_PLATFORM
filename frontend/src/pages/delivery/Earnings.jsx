import React, { useState, useEffect } from 'react';
import { DeliveryLayout } from '../../components/delivery/DeliveryLayout';
import { deliveryAPI } from '../../services/api';

export default function DeliveryEarnings() {
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    deliveryAPI.getEarnings().then(res => setEarnings(res.data)).catch(() => {});
  }, []);

  if (!earnings) return <DeliveryLayout><div className="loading-container"><div className="spinner" /></div></DeliveryLayout>;

  const cards = [
    { label: "Today", value: `₹${earnings.earnings?.today || 0}`, sub: `${earnings.todayDeliveries} deliveries`, color: '#2ecc71' },
    { label: "This Week", value: `₹${earnings.earnings?.thisWeek || 0}`, sub: `${earnings.weekDeliveries} deliveries`, color: '#3498db' },
    { label: "Total Earned", value: `₹${(earnings.earnings?.total || 0).toLocaleString('en-IN')}`, sub: `${earnings.totalDeliveries} total`, color: '#9b59b6' },
  ];

  return (
    <DeliveryLayout>
      <h1 style={{ fontWeight: 800, marginBottom: 24 }}>Earnings</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {cards.map(c => (
          <div key={c.label} style={{ background: 'white', borderRadius: 14, padding: 24, boxShadow: 'var(--shadow)', borderTop: `4px solid ${c.color}` }}>
            <div style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 8 }}>{c.label}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: c.color }}>{c.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'white', borderRadius: 14, boxShadow: 'var(--shadow)', padding: 24 }}>
        <h3 style={{ marginBottom: 16, fontWeight: 700 }}>💡 Earning Info</h3>
        <p style={{ color: 'var(--text-light)', lineHeight: 1.8, fontSize: 14 }}>
          You earn <strong>80% of the delivery fee</strong> for each delivery. <br />
          Fees range from ₹20 to ₹100 based on distance. <br />
          Payments are processed weekly to your bank account.
        </p>
      </div>
    </DeliveryLayout>
  );
}
