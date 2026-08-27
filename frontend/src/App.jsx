import React, { useState } from 'react';
import Header from './components/Header';
import ThreadAnimation from './components/ThreadAnimation';
import Shop from './pages/Shop';
import Checkout from './pages/Checkout';
import OwnerDashboard from './pages/OwnerDashboard';

function App() {
  const [view, setView] = useState('landing'); // 'landing' (Shop catalog), 'customer', 'checkout', 'owner'
  const [cart, setCart] = useState([]);

  // Cart operations
  const handleAddToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { id: product.id, name: product.name, price: product.price, category: product.category, image: product.image, qty: 1 }];
    });
  };

  const handleRemoveFromCart = (indexToRemove) => {
    setCart((prevCart) => prevCart.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleNavigate = (targetView) => {
    setView(targetView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="main-layout" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Background roses and threads interactive canvas animation */}
      <ThreadAnimation />

      {/* Main navigation header */}
      <Header currentView={view} onViewChange={handleNavigate} />

      {/* Pages Container */}
      <main style={{ position: 'relative', zIndex: 10, paddingBottom: '80px' }}>
        {(view === 'landing' || view === 'customer') && (
          <Shop
            cart={cart}
            onAddToCart={handleAddToCart}
            onRemoveFromCart={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onNavigate={handleNavigate}
          />
        )}

        {view === 'checkout' && (
          <Checkout
            cart={cart}
            onClearCart={handleClearCart}
            onNavigate={handleNavigate}
          />
        )}

        {view === 'owner' && (
          <OwnerDashboard />
        )}
      </main>

      {/* Footnote */}
      <footer style={{
        position: 'absolute',
        bottom: '24px',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontSize: '11px',
        color: 'var(--text-tertiary)',
        fontFamily: 'DM Mono, monospace',
        letterSpacing: '0.05em',
        pointerEvents: 'none'
      }}>
        THREAD ARTS &copy; {new Date().getFullYear()} &middot; CRAFTED IN CHIKMAGALUR
      </footer>
    </div>
  );
}

export default App;
