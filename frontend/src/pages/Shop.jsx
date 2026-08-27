import React, { useEffect, useState } from 'react';
import { ShoppingBag, ArrowRight, X, Trash2, Heart, Sparkles, Flower2, Gift, Instagram, Star, Gem, MessageCircle, Mail, Plus } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import OrderTracker from '../components/OrderTracker';
import { fetchProducts, fetchSettings } from '../utils/api';

const Shop = ({ cart, onAddToCart, onRemoveFromCart, onClearCart, onNavigate }) => {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortOrder, setSortOrder] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getData = async () => {
      try {
        const [prodData, setData] = await Promise.all([
          fetchProducts(),
          fetchSettings().catch(() => null) // Ignore settings error
        ]);
        // Shuffle products to show a mixed variety of all categories (Thread Art, Bouquet, etc.)
        const shuffledProducts = [...prodData].sort(() => Math.random() - 0.5);
        
        // Give a slight priority to Thread Art by pulling the first few Thread Arts to the very top
        const threadArts = shuffledProducts.filter(p => p.category === 'Thread Art' || !p.category);
        const others = shuffledProducts.filter(p => p.category !== 'Thread Art' && p.category);
        
        // Mix them: 2 thread arts, then 1 other, etc. Or just put a couple thread arts at top, then the rest shuffled
        const finalMix = [
          ...threadArts.slice(0, 2), 
          ...shuffledProducts.filter(p => !threadArts.slice(0, 2).includes(p))
        ];

        setProducts(finalMix);
        if (setData) setSettings(setData);
      } catch (err) {
        console.error(err);
        setError('Unable to load catalog. Please check backend connection.');
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const formatRupee = (num) => {
    return '₹' + Number(num).toLocaleString('en-IN');
  };

  const carouselDisplayImages = settings?.carouselImages && settings.carouselImages.length > 0
    ? settings.carouselImages
    : products.map(p => p.image).filter(Boolean);

  const ICON_MAP = {
    Sparkles: Sparkles,
    Flower2: Flower2,
    Gift: Gift,
    Star: Star,
    Heart: Heart,
    Gem: Gem,
    Default: Sparkles
  };

  let displayCategories = settings?.categories && settings.categories.length > 0
    ? [...settings.categories]
    : [
        { name: 'Thread Art', desc: 'Custom name hoops, thread portraits, and personalised wall hangings.', icon: 'Sparkles' },
        { name: 'Bouquet', desc: 'Everlasting flower arrangements and detailed rose garden bouquets.', icon: 'Flower2' },
        { name: 'Mystery Box', desc: 'Surprise mini item hampers and complete embroidery starter kits.', icon: 'Gift' }
      ];

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
      
      {/* Auto-scrolling Photo Carousel Display */}
      {carouselDisplayImages.length > 0 && (
        <section className="glass-panel animate-float" style={{ padding: '24px 0', overflow: 'hidden', position: 'relative', background: 'rgba(255, 255, 255, 0.4)' }}>
          <div style={{ display: 'flex', width: 'fit-content', gap: '16px', animation: 'photoScroll 120s linear infinite' }}>
            {[...carouselDisplayImages, ...carouselDisplayImages, ...carouselDisplayImages, ...carouselDisplayImages, ...carouselDisplayImages, ...carouselDisplayImages].map((imgSrc, i) => (
              <img 
                key={i} 
                src={imgSrc} 
                alt="Thread Arts showcase" 
                style={{ 
                  height: '240px', 
                  width: '400px', 
                  objectFit: 'cover', 
                  objectPosition: 'center center',
                  borderRadius: '16px',
                  boxShadow: 'var(--shadow-md)',
                  flexShrink: 0
                }} 
              />
            ))}
          </div>
        </section>
      )}

      {/* Primary Catalog & Shopping Loop */}
      <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: cart.length > 0 ? '1.4fr 0.9fr' : '1fr', gap: '32px' }}>
        
        {/* Catalog List */}
        <div id="catalog">
          
          {/* 3 Column Category Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            {displayCategories.map((cat, idx) => {
              const IconComp = ICON_MAP[cat.icon] || ICON_MAP.Default;
              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                  className={`glass-panel category-card ${selectedCategory === cat.name ? 'selected-category-card' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="category-icon-wrapper">
                    <IconComp size={28} />
                  </div>
                  <div>
                    <h3 className="font-display category-title">
                      {cat.name}
                      <ArrowRight size={18} className="category-arrow" />
                    </h3>
                    <p className="category-desc">
                      {cat.desc}
                    </p>
                    <div className="category-action-text">
                      {selectedCategory === cat.name ? 'Showing Collection' : 'Explore Category'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Heart size={18} fill="#2c2a29" />
              <h2 className="font-display" style={{ fontSize: '24px', fontWeight: 500 }}>
                {selectedCategory ? `${selectedCategory} Collection` : 'The Collection'}
              </h2>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <select 
                className="form-input" 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '13px', width: 'auto', minWidth: '150px', background: '#fff', cursor: 'pointer' }}
              >
                <option value="default">Sort: Shuffled</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>

              {selectedCategory && (
                <button 
                  onClick={() => setSelectedCategory(null)} 
                  className="btn btn-ghost" 
                  style={{ padding: '6px 12px', fontSize: '12.5px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Clear <X size={13} />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Weaving the collection...
            </div>
          ) : error ? (
            <div className="glass-panel" style={{ padding: '32px', color: '#d12424', textAlign: 'center' }}>
              {error}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {selectedCategory === 'Bouquet' && (
                <div 
                  className="glass-panel product-card-container" 
                  style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', alignItems: 'center', textAlign: 'center', background: 'rgba(236, 72, 153, 0.03)', border: '2px dashed var(--accent)', cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onClick={() => onAddToCart({ id: 'custom-bouquet', name: 'Custom Bouquet Request', price: 0, category: 'Bouquet', desc: 'Custom request. Provide reference photos and notes during checkout.' })}
                >
                  <Sparkles size={32} style={{ color: 'var(--accent)', marginBottom: '16px' }} />
                  <h3 className="font-display" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    Customize Your Product
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: 1.5, marginBottom: '20px' }}>
                    Have a specific flower arrangement or color in mind? Click here to request a custom bouquet. You can add photos and descriptions at checkout.
                  </p>
                  <div className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '12.5px', pointerEvents: 'none' }}>
                    <Plus size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                    Add Custom Request
                  </div>
                </div>
              )}

              {products
                .filter(p => !selectedCategory || (p.category || 'Thread Art') === selectedCategory)
                .sort((a, b) => {
                  if (sortOrder === 'price-asc') return a.price - b.price;
                  if (sortOrder === 'price-desc') return b.price - a.price;
                  return 0;
                })
                .map((p) => (
                  <ProductCard 
                    key={p.id} 
                    product={p} 
                    onAdd={onAddToCart} 
                  />
                ))}
            </div>
          )}

          {/* Underneath tracker */}
          <OrderTracker />
        </div>

        {/* Floating Cart Panel (Only shows when items are added) */}
        {cart.length > 0 && (
          <aside style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={18} />
                  <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 500 }}>
                    Your Embroidery Hoop
                  </h3>
                </div>
                <span className="font-mono" style={{ fontSize: '12px', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                  {cartCount} items
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px', marginBottom: '16px' }}>
                {cart.map((item, index) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 500 }}>{item.name}</div>
                      <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {item.qty} &times; {item.price === 0 ? 'Pending Quote' : formatRupee(item.price)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="font-mono" style={{ fontSize: '13.5px', fontWeight: 600 }}>
                        {item.price === 0 ? 'Pending Quote' : formatRupee(item.price * item.qty)}
                      </span>
                      <button 
                        onClick={() => onRemoveFromCart(index)} 
                        className="btn btn-ghost" 
                        style={{ padding: '6px', minWidth: 'auto', color: 'var(--text-tertiary)' }}
                        title="Remove"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="stitch-line" />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Total Estimate</span>
                <span className="font-mono" style={{ fontSize: '18px', fontWeight: 700 }}>
                  {formatRupee(cartTotal)}
                </span>
              </div>

              <button 
                onClick={() => onNavigate('checkout')} 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '14px' }}
              >
                Proceed to Thread Details
                <ArrowRight size={16} />
              </button>
            </div>
          </aside>
        )}

      </div>
      
      {/* Contact & Social Footer */}
      {(settings?.instagramLink || settings?.whatsapp || settings?.email) && (
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border-color)', textAlign: 'center', paddingBottom: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px' }}>
          
          {settings?.whatsapp && (
            <a 
              href={`https://wa.me/${settings.whatsapp.replace(/\D/g,'')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <div style={{
                background: '#25D366',
                color: 'white',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <MessageCircle size={14} />
              </div>
              <span className="font-display" style={{ fontSize: '14px', fontWeight: 500 }}>
                WhatsApp
              </span>
            </a>
          )}

          {settings?.instagramLink && (
            <a 
              href={settings.instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <div style={{
                background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                color: 'white',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <Instagram size={14} />
              </div>
              <span className="font-display" style={{ fontSize: '14px', fontWeight: 500 }}>
                @{(() => {
                  try {
                    const cleanLink = settings.instagramLink.split('?')[0].replace(/\/$/, '');
                    const parts = cleanLink.split('/');
                    return parts[parts.length - 1] || 'Instagram';
                  } catch {
                    return 'Instagram';
                  }
                })()}
              </span>
            </a>
          )}

          {settings?.email && (
            <a 
              href={`mailto:${settings.email}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <div style={{
                background: 'var(--text-primary)',
                color: 'white',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <Mail size={14} />
              </div>
              <span className="font-display" style={{ fontSize: '14px', fontWeight: 500 }}>
                {settings.email}
              </span>
            </a>
          )}

        </div>
      )}
    </div>
  );
};

export default Shop;
