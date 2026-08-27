import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { trackOrders } from '../utils/api';

const OrderTracker = () => {
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await trackOrders(cleanPhone);
      setOrders(res.sort((a, b) => b.createdAt - a.createdAt));
      setSearched(true);
    } catch (err) {
      console.error(err);
      setError('Could not track orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Advance Pending': return 'pill-pending';
      case 'Confirmed': return 'pill-confirmed';
      case 'In progress':
      case 'Out for delivery':
      case 'Ready for pickup': return 'pill-progress';
      case 'Completed': return 'pill-done';
      case 'Cancelled': return 'pill-cancelled';
      default: return 'pill-pending';
    }
  };

  const formatRupee = (num) => {
    return '₹' + Number(num).toLocaleString('en-IN');
  };

  return (
    <div className="glass-panel" style={{ padding: '28px', marginTop: '32px' }}>
      <h3 className="font-display" style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>
        Track an Order
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
        Look up your handmade order status using the mobile number provided during checkout.
      </p>

      <form onSubmit={handleTrack} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="10-digit phone number (e.g. 9876543210)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ paddingLeft: '16px' }}
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ padding: '12px 20px', whiteSpace: 'nowrap' }} disabled={loading}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Track Status
        </button>
      </form>

      {error && <div style={{ color: '#d12424', fontSize: '13px', marginTop: '4px' }}>{error}</div>}

      {searched && (
        <div style={{ marginTop: '24px' }}>
          <h4 className="font-mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Found {orders.length} Order(s)
          </h4>

          {orders.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', textAlign: 'center', padding: '16px 0' }}>
              No orders found matching this phone number.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {orders.map((o) => (
                <div key={o.id} className="glass-panel" style={{ padding: '20px', background: '#ffffff', boxShadow: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div className="font-mono" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)' }}>
                        #{o.id.slice(-6).toUpperCase()} &middot; {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '14.5px', marginTop: '4px' }}>
                        {o.items.map(i => `${i.name} (x${i.qty})`).join(', ')}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Method: {o.method} {o.address && `| Address: ${o.address}`}
                      </div>
                    </div>
                    <div>
                      <span className={`pill ${getStatusClass(o.status)}`}>
                        {o.status}
                      </span>
                    </div>
                  </div>
                  <div className="stitch-line" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Total Amount
                    </span>
                    <span className="font-mono" style={{ fontSize: '14.5px', fontWeight: 600 }}>
                      {formatRupee(o.total)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', background: 'rgba(236, 72, 153, 0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                    <strong style={{ color: 'var(--accent)', fontSize: '13px' }}>Advance Paid (50%)</strong>
                    <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '13px' }}>
                      {formatRupee(o.advance || o.total * 0.5)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', padding: '0 8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Balance Amount</span>
                    <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {formatRupee((o.total || 0) - (o.advance || (o.total * 0.5)))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderTracker;
