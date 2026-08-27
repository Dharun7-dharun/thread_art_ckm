import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Key, Instagram } from 'lucide-react';
import { fetchSettings } from '../utils/api';

const Header = ({ currentView, onViewChange }) => {
  const [settings, setSettings] = useState({});
  const clickTimestamps = useRef([]);

  useEffect(() => {
    fetchSettings().then(setSettings).catch(console.error);
  }, []);

  const handleSecretLogin = () => {
    const now = Date.now();
    // Keep only clicks from the last 1.5 seconds
    clickTimestamps.current = clickTimestamps.current.filter(t => now - t < 1500);
    clickTimestamps.current.push(now);

    if (clickTimestamps.current.length >= 3) {
      onViewChange('owner');
      clickTimestamps.current = []; // reset
    } else {
      onViewChange('landing');
    }
  };

  return (
    <header className="glass-panel" style={{ padding: '16px 24px', marginBottom: '32px', zIndex: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>

        {/* Brand Logo - Secret Admin Entry */}
        <div
          onClick={handleSecretLogin}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
          title="Go to Home"
        >
          <img
            src="/logo.jpg"
            alt="Thread Arts Logo"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid var(--accent)',
              boxShadow: 'var(--shadow-sm)'
            }}
          />
          <div>
            <div className="font-display" style={{ fontSize: '20px', fontWeight: 600, lineHeight: 1.1, color: 'var(--text-primary)' }}>
              Thread Arts
            </div>
            <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-tertiary)', letterSpacing: '0.15em', marginTop: '2px' }}>
              CHIKMAGALUR
            </div>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="header-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => onViewChange('customer')}
            className={`btn btn-ghost ${currentView === 'customer' || currentView === 'checkout' ? 'active' : ''}`}
            style={{ fontSize: '13px' }}
          >
            <Sparkles size={14} style={{ marginRight: '4px' }} />
            Stitch Custom Order
          </button>
        </div>

      </div>
    </header>
  );
};

export default Header;
