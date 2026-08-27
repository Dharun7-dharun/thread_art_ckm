import React, { useEffect, useState } from 'react';
import { Lock, Plus, Trash2, Calendar, FileText, Gift, Loader2, Edit2, Check, X, Settings, Download } from 'lucide-react';
import { 
  login, 
  fetchOrders, 
  fetchProducts, 
  updateOrderStatus, 
  createProduct, 
  deleteProduct,
  updateProduct,
  deleteOrder,
  fetchSettings,
  updateSettings,
  updateOrderPrice
} from '../utils/api';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

const OwnerDashboard = () => {
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  // Security verification states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  useEffect(() => {
    if (lockoutTimer > 0) {
      const interval = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTimer]);

  // Dashboard state
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({ instagramLink: '', carouselImages: [] });
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Quote Order State
  const [quotingOrder, setQuotingOrder] = useState(null);
  const [quotePrice, setQuotePrice] = useState('');

  // Form states for creating resources
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCategory, setProdCategory] = useState('Thread Art');
  const [prodImage, setProdImage] = useState('');
  const [prodError, setProdError] = useState('');

  // Image Cropper States
  const [pendingCropImage, setPendingCropImage] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); // 'add' or 'edit'
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropDone = async () => {
    if (!pendingCropImage || !croppedAreaPixels) return;
    try {
      const croppedImage = await getCroppedImg(pendingCropImage, croppedAreaPixels);
      if (cropTarget === 'add') {
        setProdImage(croppedImage);
      } else if (cropTarget === 'edit') {
        setEditImage(croppedImage);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to crop image');
    }
    setPendingCropImage(null);
    setCropTarget(null);
  };

  const handleCropCancel = () => {
    setPendingCropImage(null);
    setCropTarget(null);
  };

  // Handle Owner Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;
    if (!username || !password) {
      setLoginError('Username and Password are required.');
      return;
    }

    setLoginError('');
    setAuthenticating(true);
    try {
      const res = await login(username, password);
      if (res.success) {
        setAuthed(true);
        setFailedAttempts(0);
        loadDashboardData();
      }
    } catch (err) {
      console.error(err);
      setFailedAttempts((prev) => {
        const next = prev + 1;
        if (next >= 3) {
          setLockoutTimer(30);
        }
        return next;
      });
      setLoginError('Invalid Username or Password.');
    } finally {
      setAuthenticating(false);
    }
  };

  // Load backend collections
  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      const [allOrders, allProducts, appSettings] = await Promise.all([
        fetchOrders(),
        fetchProducts(),
        fetchSettings()
      ]);
      setOrders(allOrders.sort((a, b) => b.createdAt - a.createdAt));
      setProducts(allProducts);
      if (appSettings) {
        setSettings({ 
          instagramLink: appSettings.instagramLink || '',
          whatsapp: appSettings.whatsapp || '',
          email: appSettings.email || '',
          carouselImages: appSettings.carouselImages || [],
          categories: appSettings.categories || [
            { name: 'Thread Art', desc: 'Custom name hoops, thread portraits, and personalised wall hangings.', icon: 'Sparkles' },
            { name: 'Bouquet', desc: 'Everlasting flower arrangements and detailed rose garden bouquets.', icon: 'Flower2' },
            { name: 'Mystery Box', desc: 'Surprise mini item hampers and complete embroidery starter kits.', icon: 'Gift' }
          ]
        });
      }
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const generateReceipt = (order, printWindow) => {
    if (!printWindow) return;

    const receiptHtml = `
      <html>
        <head>
          <title>Receipt - Order ${order.id}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; color: #111; max-width: 400px; margin: 0 auto; }
            h1 { text-align: center; font-size: 24px; margin-bottom: 5px; font-weight: 800; }
            h3 { text-align: center; font-size: 12px; margin-top: 0; color: #555; }
            .divider { border-top: 1px dashed #111; margin: 15px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
            .item-row { margin-bottom: 10px; }
            .item-name { font-weight: bold; font-size: 14px; }
            .item-details { display: flex; justify-content: space-between; font-size: 13px; color: #333; margin-top: 3px; }
            .totals { font-weight: bold; font-size: 15px; }
          </style>
        </head>
        <body>
          <h1>THREAD ARTS</h1>
          <h3>Chikmagalur, Karnataka</h3>
          <div class="divider"></div>
          <div class="row"><span>Order ID:</span> <span>${order.id}</span></div>
          <div class="row"><span>Date:</span> <span>${new Date(order.createdAt).toLocaleString('en-IN')}</span></div>
          <div class="row"><span>Customer:</span> <span>${order.name}</span></div>
          <div class="row"><span>Phone:</span> <span>${order.phone}</span></div>
          <div class="divider"></div>
          
          ${order.items.map(item => `
            <div class="item-row">
              <div class="item-name">${item.name}</div>
              <div class="item-details">
                <span>${item.qty} x ${formatRupee(item.price)}</span>
                <span>${formatRupee(item.qty * item.price)}</span>
              </div>
            </div>
          `).join('')}
          
          <div class="divider"></div>
          
          <div class="row totals"><span>Subtotal:</span> <span>${formatRupee(order.subtotal || order.total)}</span></div>
          ${order.promoCode ? `
            <div class="row" style="color: #333;"><span>Promo (${order.promoCode}):</span> <span>-${formatRupee(order.discount)}</span></div>
            <div class="row totals"><span>Grand Total:</span> <span>${formatRupee(order.total)}</span></div>
          ` : `
            <div class="row totals"><span>Grand Total:</span> <span>${formatRupee(order.total)}</span></div>
          `}
          
          <div class="divider"></div>
          <div class="row"><span>Advance Paid:</span> <span>${formatRupee(order.advance || order.total * 0.5)}</span></div>
          <div class="row"><span>Balance Due:</span> <span>${formatRupee(order.total - (order.advance || order.total * 0.5))}</span></div>
          
          <div class="divider"></div>
          <p style="text-align: center; font-size: 12px; margin-top: 20px;">Thank you for your handcrafted order!</p>
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  // Update Status
  const handleStatusChange = async (orderId, newStatus) => {
    // Open window immediately on user click to avoid popup blockers
    let printWindow = null;
    if (newStatus === 'In Progress') {
      printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write('<html><body><p style="font-family:sans-serif;padding:20px;">Generating receipt...</p></body></html>');
      }
    }

    try {
      await updateOrderStatus(orderId, newStatus);
      
      if (newStatus === 'In Progress' && printWindow) {
        const allOrders = await fetchOrders();
        const acceptedOrder = allOrders.find(o => o.id === orderId);
        if (acceptedOrder) {
          // Pass the window object to generateReceipt
          generateReceipt(acceptedOrder, printWindow);
        }
        setOrders(allOrders.sort((a, b) => b.createdAt - a.createdAt));
      } else {
        // Reload orders to reflect update
        const allOrders = await fetchOrders();
        setOrders(allOrders.sort((a, b) => b.createdAt - a.createdAt));
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Could not update status.');
      if (printWindow) printWindow.close();
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await updateSettings(settings);
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Could not save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCategoryChange = (index, field, value) => {
    const newCategories = [...(settings.categories || [])];
    newCategories[index][field] = value;
    setSettings({ ...settings, categories: newCategories });
  };

  const handleAddCategory = () => {
    const newCategories = [...(settings.categories || []), { name: '', desc: '', icon: 'Sparkles' }];
    setSettings({ ...settings, categories: newCategories });
  };

  const handleRemoveCategory = (index) => {
    const newCategories = [...(settings.categories || [])];
    newCategories.splice(index, 1);
    setSettings({ ...settings, categories: newCategories });
  };

  const handleCarouselImageAdd = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const newImages = [...(settings.carouselImages || []), event.target.result];
      setSettings({ ...settings, carouselImages: newImages });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCarouselImageRemove = (index) => {
    const newImages = [...(settings.carouselImages || [])];
    newImages.splice(index, 1);
    setSettings({ ...settings, carouselImages: newImages });
  };

  const handleDeleteOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel and delete this order?')) return;
    try {
      await deleteOrder(orderId);
      const allOrders = await fetchOrders();
      setOrders(allOrders.sort((a, b) => b.createdAt - a.createdAt));
    } catch (err) {
      console.error('Failed to delete order:', err);
      alert('Could not delete order.');
    }
  };

  const handleUpdatePrice = async (orderId) => {
    if (!quotePrice || isNaN(quotePrice) || Number(quotePrice) <= 0) {
      alert('Please enter a valid quoted price.');
      return;
    }
    try {
      await updateOrderPrice(orderId, Number(quotePrice));
      const allOrders = await fetchOrders();
      setOrders(allOrders.sort((a, b) => b.createdAt - a.createdAt));
      setQuotingOrder(null);
      setQuotePrice('');
    } catch (err) {
      console.error('Failed to update order price:', err);
      alert('Could not update order price.');
    }
  };

  // Manage Products
  const handleAddProduct = async (e) => {
    e.preventDefault();
    setProdError('');
    if (!prodName || !prodPrice) {
      setProdError('Please provide a name and price.');
      return;
    }
    try {
      await createProduct({
        name: prodName,
        price: Number(prodPrice),
        category: prodCategory,
        image: prodImage,
        desc: prodDesc
      });
      setProdName('');
      setProdPrice('');
      setProdDesc('');
      setProdImage('');
      setProdCategory('Thread Art');
      // Reload products
      const allProducts = await fetchProducts();
      setProducts(allProducts);
    } catch (err) {
      console.error(err);
      setProdError('Failed to add product.');
    }
  };

  const handleRemoveProduct = async (id) => {
    if (!confirm('Are you sure you want to remove this product?')) return;
    try {
      await deleteProduct(id);
      const allProducts = await fetchProducts();
      setProducts(allProducts);
    } catch (err) {
      console.error(err);
      alert('Failed to remove product.');
    }
  };

  const [editingProduct, setEditingProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleStartEdit = (product) => {
    setEditingProduct(product.id);
    setEditPrice(product.price);
    setEditImage(product.image || '');
    setEditName(product.name || '');
    setEditDesc(product.desc || '');
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditPrice('');
    setEditImage('');
    setEditName('');
    setEditDesc('');
  };

  const handleSaveEdit = async (id) => {
    try {
      await updateProduct(id, { 
        name: editName,
        desc: editDesc,
        price: Number(editPrice), 
        image: editImage
      });
      setEditingProduct(null);
      const allProducts = await fetchProducts();
      setProducts(allProducts);
    } catch (err) {
      console.error(err);
      alert('Failed to update product.');
    }
  };

  const formatRupee = (num) => {
    return '₹' + Number(num).toLocaleString('en-IN');
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

  // 1. LOGIN SCREEN VIEW
  if (!authed) {
    return (
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '400px', margin: '80px auto', padding: '40px 28px', textAlign: 'center' }}>
        <Lock size={36} style={{ margin: '0 auto 16px', color: 'var(--text-primary)' }} />
        <h2 className="font-display" style={{ fontSize: '24px', fontWeight: 500, marginBottom: '8px' }}>
          Owner Desk Authentication
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '28px' }}>
          Enter your username and password to manage custom orders, slots, and pieces.
        </p>

        <form onSubmit={handleLogin}>
          {/* Secure Username / User ID Field */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px', width: '100%' }}>
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={lockoutTimer > 0}
              style={{
                textAlign: 'center',
                maxWidth: '220px',
                padding: '10px'
              }}
            />
          </div>

          {/* Secure Password Field */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', width: '100%' }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={lockoutTimer > 0}
              style={{
                textAlign: 'center',
                maxWidth: '220px',
                padding: '10px'
              }}
            />
          </div>


          {loginError && <div style={{ color: '#d12424', fontSize: '13px', marginBottom: '16px' }}>{loginError}</div>}
          
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px' }} 
            disabled={authenticating || lockoutTimer > 0}
          >
            {lockoutTimer > 0 
              ? `Locked out (${lockoutTimer}s)` 
              : authenticating 
                ? <Loader2 size={16} className="animate-spin" /> 
                : 'Enter Workshop'
            }
          </button>
        </form>
      </div>
    );
  }

  // 2. AUTHENTICATED ADMINISTRATOR DESK VIEW
  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="font-display" style={{ fontSize: '28px', fontWeight: 500 }}>
            Workshop Desk
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>
            Admin Control Panel
          </p>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="glass-panel" style={{ display: 'flex', padding: '4px', gap: '2px', boxShadow: 'none' }}>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`btn btn-ghost ${activeTab === 'orders' ? 'active' : ''}`}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <FileText size={14} style={{ marginRight: '6px' }} />
            Orders ({orders.filter(o => o.status === 'Advance Pending').length} new)
          </button>

          <button 
            onClick={() => setActiveTab('products')} 
            className={`btn btn-ghost ${activeTab === 'products' ? 'active' : ''}`}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <Gift size={14} style={{ marginRight: '6px' }} />
            Pieces
          </button>

          <button 
            onClick={() => setActiveTab('settings')} 
            className={`btn btn-ghost ${activeTab === 'settings' ? 'active' : ''}`}
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <Settings size={14} style={{ marginRight: '6px' }} />
            Settings
          </button>
        </div>
      </div>

      {loadingData ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Reading database cache...
        </div>
      ) : (
        <div>
          {/* TAB 1: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {orders.length === 0 ? (
                <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No orders have been placed yet.
                </div>
              ) : (
                orders.map((o) => {
                  return (
                    <div key={o.id} className="glass-panel" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <span className="font-mono" style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-tertiary)' }}>
                            #{o.id.slice(-6).toUpperCase()} &middot; {new Date(o.createdAt).toLocaleString('en-IN')}
                          </span>
                          <h3 style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>
                            {o.name} &middot; Phone: {o.phone} {o.whatsapp && <span style={{ color: '#1e7e34' }}>&middot; WA: {o.whatsapp}</span>}
                          </h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>
                            Method: {o.method}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span className={`pill ${getStatusClass(o.status)}`}>
                            {o.status}
                          </span>
                          <button onClick={() => handleDeleteOrder(o.id)} className="btn btn-ghost" style={{ padding: '6px', color: '#d12424', minWidth: 'auto', borderRadius: '4px' }} title="Delete Order">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="stitch-line" />

                      <div style={{ fontSize: '14px', lineHeight: 1.6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <strong>Stitched items:</strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {o.total === 0 ? (
                              quotingOrder === o.id ? (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <input 
                                    type="number" 
                                    className="form-input" 
                                    style={{ width: '80px', padding: '4px 8px', fontSize: '13px' }}
                                    placeholder="Price"
                                    value={quotePrice}
                                    onChange={(e) => setQuotePrice(e.target.value)}
                                  />
                                  <button onClick={() => handleUpdatePrice(o.id)} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }}>Save</button>
                                  <button onClick={() => setQuotingOrder(null)} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '12px' }}>Cancel</button>
                                </div>
                              ) : (
                                <>
                                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Pending Quote</span>
                                  <button onClick={() => setQuotingOrder(o.id)} className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '12px', border: '1px solid var(--border-color)' }}>
                                    Set Price
                                  </button>
                                </>
                              )
                            ) : (
                              <span className="font-mono" style={{ fontWeight: 700 }}>
                                {formatRupee(o.subtotal || o.total)}
                              </span>
                            )}
                          </div>
                        </div>

                        {o.promoCode && (
                          <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4px', background: 'rgba(30, 126, 52, 0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                              <strong style={{ color: '#1e7e34', fontSize: '13px' }}>Promo ({o.promoCode}):</strong>
                              <span className="font-mono" style={{ fontWeight: 700, color: '#1e7e34', fontSize: '14px' }}>
                                -{formatRupee(o.discount)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4px', padding: '0 8px' }}>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>Grand Total:</strong>
                              <span className="font-mono" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                                {formatRupee(o.total)}
                              </span>
                            </div>
                          </>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4px', background: 'rgba(236, 72, 153, 0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                          <strong style={{ color: 'var(--accent)', fontSize: '13px' }}>Advance (50%):</strong>
                          <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '14px' }}>
                            {formatRupee(o.advance || o.total * 0.5)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4px', padding: '0 8px' }}>
                          <strong style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Balance on Delivery:</strong>
                          <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '14px' }}>
                            {formatRupee((o.total || 0) - (o.advance || (o.total * 0.5)))}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                          {o.items.map((i, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.02)', padding: '8px', borderRadius: '6px' }}>
                              {i.image ? (
                                <img src={i.image} alt={i.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                              ) : (
                                <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                                  <Gift size={16} color="var(--text-tertiary)" />
                                </div>
                              )}
                              <div>
                                <div style={{ fontWeight: 500, fontSize: '13.5px' }}>{i.name}</div>
                                <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Qty: {i.qty}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {o.note && (
                        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '4px', marginTop: '12px', fontSize: '13px' }}>
                          <strong>Notes:</strong> {o.note}
                        </div>
                      )}

                      {o.method === 'Delivery' && o.address && (
                        <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                          <strong>Ship to:</strong> {o.address}
                        </div>
                      )}
                      {(o.photos?.length > 0 || o.photo) && (
                        <div style={{ marginTop: '12px' }}>
                          <span className="form-label" style={{ marginBottom: '8px' }}>Reference Photos:</span>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {(o.photos || (o.photo ? [o.photo] : [])).map((p, i) => (
                              <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                                <img 
                                  src={p} 
                                  alt={`Reference ${i+1}`} 
                                  style={{ 
                                    width: '100px', 
                                    height: '100px',
                                    objectFit: 'cover',
                                    borderRadius: 'var(--radius-sm)', 
                                    border: '1px solid var(--border-color)', 
                                    display: 'block' 
                                  }} 
                                />
                                <a 
                                  href={p} 
                                  download={`order_${o.id}_ref_${i+1}.png`}
                                  style={{ 
                                    position: 'absolute', 
                                    bottom: '4px', 
                                    right: '4px', 
                                    background: 'rgba(0,0,0,0.6)', 
                                    color: 'white', 
                                    padding: '4px', 
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textDecoration: 'none'
                                  }}
                                  title="Download Photo"
                                >
                                  <Download size={14} />
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}


                      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="form-label" style={{ margin: 0 }}>Update order status:</span>
                        <select
                          className="form-select"
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                          style={{ width: 'auto', padding: '6px 12px', fontSize: '13px' }}
                        >
                          {['Advance Pending', 'Confirmed', 'In progress', o.method === 'Delivery' ? 'Out for delivery' : 'Ready for pickup', 'Completed', 'Cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: PRODUCTS PIECES MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '32px' }}>
              <div>
                <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 500, marginBottom: '16px' }}>Add a New Piece</h3>
                <form onSubmit={handleAddProduct} className="glass-panel" style={{ padding: '24px' }}>
                  <div className="form-group">
                    <label className="form-label">Piece Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Handmade Flower Cushion Cover" 
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price (₹)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      min="0"
                      placeholder="e.g. 899" 
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                    >
                      <option value="Thread Art">Thread Art</option>
                      <option value="Bouquet">Bouquet</option>
                      <option value="Mystery Box">Mystery Box</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Upload Product Photo</label>
                    {!prodImage ? (
                      <div 
                        style={{
                          border: '2px dashed var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '30px 20px',
                          textAlign: 'center',
                          background: 'rgba(0, 0, 0, 0.01)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--text-primary)'}
                        onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                      >
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            opacity: 0,
                            cursor: 'pointer'
                          }} 
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setPendingCropImage(reader.result);
                                setCropTarget('add');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '24px' }}>📸</span>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                            Click to select photo file
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            Supports PNG, JPG, JPEG (saved in square shape)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '16px', 
                        padding: '16px', 
                        border: '1px solid var(--border-color)', 
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255, 255, 255, 0.03)'
                      }}>
                        <div style={{ 
                          width: '80px', 
                          height: '80px', 
                          borderRadius: 'var(--radius-sm)', 
                          overflow: 'hidden', 
                          border: '1px solid var(--border-color)',
                          background: '#faf9f6',
                          flexShrink: 0
                        }}>
                          <img 
                            src={prodImage} 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover'
                            }} 
                            alt="Preview" 
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e7e34', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                            <span>✓</span> Photo Loaded
                          </div>

                          <button 
                            type="button" 
                            className="btn btn-ghost" 
                            style={{ padding: '4px 8px', fontSize: '11px', color: '#d12424', minWidth: 'auto' }} 
                            onClick={() => setProdImage('')}
                          >
                            Remove Photo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea 
                      className="form-textarea" 
                      rows="3" 
                      placeholder="Describe the materials and stitching details..." 
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                    />
                  </div>

                  {prodError && <div style={{ color: '#d12424', fontSize: '13px', marginBottom: '12px' }}>{prodError}</div>}
                  
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    <Plus size={16} /> Add to Collection
                  </button>
                </form>
              </div>

              <div>
                <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 500, marginBottom: '16px' }}>Inventory Items</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {products.map(p => (
                    <div key={p.id} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', background: 'var(--glass-bg)', boxShadow: 'none' }}>
                      {editingProduct === p.id ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <input 
                              type="text" 
                              className="form-input" 
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Product Name"
                              style={{ fontWeight: 600, fontSize: '14.5px', padding: '6px', width: '70%', marginBottom: 0 }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleSaveEdit(p.id)} className="btn btn-ghost" style={{ padding: '4px', color: '#1e7e34', minWidth: 'auto' }} title="Save">
                                <Check size={18} />
                              </button>
                              <button onClick={handleCancelEdit} className="btn btn-ghost" style={{ padding: '4px', color: 'var(--text-secondary)', minWidth: 'auto' }} title="Cancel">
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '11px' }}>Price (₹)</label>
                              <input 
                                type="number" 
                                className="form-input" 
                                min="0"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                style={{ padding: '6px', fontSize: '13px' }}
                              />
                            </div>

                            <div className="form-group" style={{ flex: 2, minWidth: '200px', marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '11px' }}>Description</label>
                              <textarea 
                                className="form-textarea" 
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                placeholder="Product Description..."
                                style={{ padding: '6px', fontSize: '12px', minHeight: '60px' }}
                              />
                            </div>
                          </div>
                          
                          <div className="form-group" style={{ marginBottom: 0 }}>
                              <label className="form-label" style={{ fontSize: '11px' }}>Update Image</label>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                      {editImage && (
                                        <div style={{ width: '32px', height: '32px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                                          <img src={editImage} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                      )}
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        style={{ fontSize: '12px', width: '100%' }}
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              setPendingCropImage(reader.result);
                                              setCropTarget('edit');
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                      {editImage && (
                                        <button type="button" onClick={() => setEditImage('')} className="btn btn-ghost" style={{ padding: '4px', color: '#d12424', fontSize: '11px', minWidth: 'auto' }}>Clear</button>
                                      )}
                                    </div>
                                  </div>
                            </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                            {p.image && (
                              <div style={{ 
                                width: '60px', 
                                height: '60px', 
                                borderRadius: 'var(--radius-sm)', 
                                overflow: 'hidden',
                                border: '1px solid var(--border-color)',
                                background: '#faf9f6',
                                flexShrink: 0
                              }}>
                                <img 
                                  src={p.image} 
                                  alt={p.name} 
                                  style={{ width: '100%', height: '100%', objectFit: p.imageFit || 'cover', objectPosition: p.imagePosition || 'center center' }} 
                                />
                              </div>
                            )}
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 600, fontSize: '14.5px' }}>{p.name}</span>
                                {p.category && (
                                  <span className="font-mono" style={{ fontSize: '10px', background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                    {p.category}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>{p.desc}</div>
                              <div className="font-mono" style={{ fontSize: '13px', fontWeight: 600, marginTop: '4px', color: 'var(--text-primary)' }}>
                                {formatRupee(p.price)}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button onClick={() => handleStartEdit(p)} className="btn btn-ghost" style={{ padding: '8px', color: 'var(--text-secondary)', minWidth: 'auto' }}>
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleRemoveProduct(p.id)} className="btn btn-ghost" style={{ padding: '8px', color: '#d12424', minWidth: 'auto' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3 className="font-display" style={{ fontSize: '18px', fontWeight: 500, marginBottom: '16px' }}>Site Settings</h3>
              <form onSubmit={handleSaveSettings} className="glass-panel" style={{ padding: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Social & Contact Links</label>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <input 
                      type="url" 
                      className="form-input" 
                      placeholder="Instagram Profile URL (e.g., https://instagram.com/your_profile)" 
                      value={settings.instagramLink}
                      onChange={(e) => setSettings({ ...settings, instagramLink: e.target.value })}
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="WhatsApp Phone Number (e.g., 919876543210)" 
                      value={settings.whatsapp}
                      onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                    />
                  </div>

                  <div>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="Email Address (e.g., hello@threadarts.com)" 
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    />
                  </div>
                  
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    These links will appear at the bottom footer of your shop page. Leave blank to hide them.
                  </p>
                </div>

                <div className="form-group" style={{ marginTop: '32px' }}>
                  <label className="form-label">Shop Categories</label>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Add, edit, or remove product categories that customers can filter by on the main shop page.
                  </p>
                  
                  {settings.categories?.map((cat, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={cat.name} 
                        onChange={(e) => handleCategoryChange(index, 'name', e.target.value)} 
                        placeholder="Category Name" 
                        style={{ flex: 1 }} 
                      />
                      <input 
                        type="text" 
                        className="form-input" 
                        value={cat.desc} 
                        onChange={(e) => handleCategoryChange(index, 'desc', e.target.value)} 
                        placeholder="Short Description" 
                        style={{ flex: 2 }} 
                      />
                      <select 
                        className="form-input" 
                        value={cat.icon || 'Sparkles'} 
                        onChange={(e) => handleCategoryChange(index, 'icon', e.target.value)} 
                        style={{ width: '120px' }}
                      >
                        <option value="Sparkles">Sparkles</option>
                        <option value="Flower2">Flower</option>
                        <option value="Gift">Gift</option>
                        <option value="Star">Star</option>
                        <option value="Heart">Heart</option>
                        <option value="Gem">Gem</option>
                      </select>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveCategory(index)} 
                        className="btn btn-ghost" 
                        style={{ padding: '8px', color: '#d12424' }}
                        title="Remove Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  
                  <button 
                    type="button" 
                    onClick={handleAddCategory} 
                    className="btn btn-secondary" 
                    style={{ marginTop: '8px', fontSize: '13px', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14} /> Add Category
                  </button>
                </div>

                <div className="form-group" style={{ marginTop: '24px' }}>
                  <label className="form-label">Shop Header Carousel Photos</label>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Upload specific photos to show in the scrolling banner on the main shop page. 
                    If you don't add any here, it will automatically use your product photos instead.
                  </p>
                  
                  {settings.carouselImages && settings.carouselImages.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                      {settings.carouselImages.map((imgSrc, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          <img src={imgSrc} alt={`Carousel ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => handleCarouselImageRemove(idx)}
                            className="btn"
                            style={{ position: 'absolute', top: '4px', right: '4px', padding: '4px', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%' }}
                            title="Remove Photo"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <label className="btn btn-secondary" style={{ width: 'fit-content', cursor: 'pointer', display: 'flex', gap: '8px' }}>
                    <Plus size={16} />
                    Add Carousel Photo
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCarouselImageAdd} />
                  </label>
                </div>
                
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '32px' }} disabled={savingSettings}>
                  {savingSettings ? <Loader2 size={16} className="animate-spin" /> : 'Save Settings'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
      
      {/* Cropper Modal */}
      {pendingCropImage && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '500px', height: '60vh', background: '#333', borderRadius: '8px', overflow: 'hidden' }}>
            <Cropper
              image={pendingCropImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={(area, areaPixels) => setCroppedAreaPixels(areaPixels)}
              onZoomChange={setZoom}
            />
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px', background: '#fff', padding: '16px 24px', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCropCancel} className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleCropDone} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>Apply Crop</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
