const express = require('express');
const cors = require('cors');
const path = require('path');
const { readDb, writeDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;
const OWNER_USERNAME = 'admin';
const OWNER_PASSWORD = 'ckm9620';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper to generate IDs
function generateId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Auth Route
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === OWNER_USERNAME && password === OWNER_PASSWORD) {
    return res.json({ success: true, token: 'session_auth_token_threadarts' });
  }
  return res.status(401).json({ success: false, message: 'Invalid Username or Password' });
});

// Products Routes
app.get('/api/products', (req, res) => {
  const db = readDb();
  res.json(db.products || []);
});

app.post('/api/products', (req, res) => {
  const { name, price, desc, category, image, imageFit, imagePosition } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const db = readDb();
  const newProduct = {
    id: generateId('p'),
    name,
    price: Number(price),
    category: category || 'Thread Art',
    image: image || null,
    imageFit: imageFit || 'cover',
    imagePosition: imagePosition || 'center center',
    desc: desc || ''
  };

  db.products.push(newProduct);
  const success = writeDb(db);

  if (success) {
    res.status(201).json(newProduct);
  } else {
    res.status(500).json({ error: 'Database write error' });
  }
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { price, image, imageFit, imagePosition } = req.body;

  const db = readDb();
  const productIndex = db.products.findIndex(p => p.id === id);

  if (productIndex === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Update only provided fields
  if (price !== undefined) {
    db.products[productIndex].price = Number(price);
  }
  if (image !== undefined) {
    db.products[productIndex].image = image;
  }
  if (imageFit !== undefined) {
    db.products[productIndex].imageFit = imageFit;
  }
  if (imagePosition !== undefined) {
    db.products[productIndex].imagePosition = imagePosition;
  }

  const success = writeDb(db);
  if (success) {
    res.json(db.products[productIndex]);
  } else {
    res.status(500).json({ error: 'Database write error' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();
  const initialLength = db.products.length;
  db.products = db.products.filter(p => p.id !== id);

  if (db.products.length === initialLength) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const success = writeDb(db);
  if (success) {
    res.json({ message: 'Product deleted successfully' });
  } else {
    res.status(500).json({ error: 'Database write error' });
  }
});


// Orders Routes
app.get('/api/orders', (req, res) => {
  const db = readDb();
  res.json(db.orders || []);
});

app.post('/api/orders', (req, res) => {
  const { items, name, phone, whatsapp, method, address, slotId, note, photos, subtotal, discount, promoCode, total } = req.body;

  if (!items || !items.length || !name || !phone || !whatsapp || !method) {
    return res.status(400).json({ error: 'Missing required order details' });
  }

  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    return res.status(400).json({ error: 'Phone number must be a 10-digit mobile number' });
  }

  const cleanWhatsapp = whatsapp.replace(/\D/g, '');
  if (cleanWhatsapp.length !== 10) {
    return res.status(400).json({ error: 'WhatsApp number must be a 10-digit mobile number' });
  }

  if (method === 'Delivery' && !address) {
    return res.status(400).json({ error: 'Delivery address is required' });
  }

  const db = readDb();

  const calcTotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const finalTotal = total !== undefined ? total : calcTotal;

  const newOrder = {
    id: generateId('ord'),
    items,
    total: finalTotal,
    subtotal: subtotal !== undefined ? subtotal : calcTotal,
    discount: discount || 0,
    promoCode: promoCode || null,
    note: note || '',
    name,
    phone: cleanPhone,
    whatsapp: cleanWhatsapp,
    method,
    address: method === 'Delivery' ? address : '',
    slotId: slotId || null,
    photos: photos || [],
    status: 'Advance Pending',
    createdAt: Date.now()
  };

  db.orders.push(newOrder);
  const success = writeDb(db);

  if (success) {
    res.status(201).json(newOrder);
  } else {
    res.status(500).json({ error: 'Database write error' });
  }
});

// Order Tracking
app.get('/api/orders/track', (req, res) => {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const cleanPhone = phone.replace(/\D/g, '');
  const db = readDb();
  const matches = (db.orders || []).filter(o => o.phone === cleanPhone);

  res.json(matches);
});

// Order Status Update
app.post('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const db = readDb();
  const orderIndex = db.orders.findIndex(o => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  db.orders[orderIndex].status = status;
  const success = writeDb(db);

  if (success) {
    res.json(db.orders[orderIndex]);
  } else {
    res.status(500).json({ error: 'Database write error' });
  }
});

// Update Order Price (for Custom Orders)
app.post('/api/orders/:id/price', (req, res) => {
  const { id } = req.params;
  const { price } = req.body;

  if (price === undefined || isNaN(price)) {
    return res.status(400).json({ error: 'Valid price is required' });
  }

  const db = readDb();
  const orderIndex = db.orders.findIndex(o => o.id === id);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  db.orders[orderIndex].total = Number(price);
  db.orders[orderIndex].advance = Number(price) * 0.5;

  // Optionally update the item price if there is exactly 1 item and it's a custom request
  if (db.orders[orderIndex].items.length === 1 && db.orders[orderIndex].items[0].price === 0) {
    db.orders[orderIndex].items[0].price = Number(price);
  }

  const success = writeDb(db);

  if (success) {
    res.json(db.orders[orderIndex]);
  } else {
    res.status(500).json({ error: 'Database write error' });
  }
});

// Delete Order
app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const db = readDb();

  const initialLength = db.orders.length;
  db.orders = db.orders.filter(o => o.id !== id);

  if (db.orders.length === initialLength) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const success = writeDb(db);
  if (success) {
    res.json({ message: 'Order deleted successfully' });
  } else {
    res.status(500).json({ error: 'Database write error' });
  }
});

// Settings Routes
app.get('/api/settings', (req, res) => {
  const db = readDb();
  res.json(db.settings || {});
});

app.post('/api/settings', (req, res) => {
  const settings = req.body;
  const db = readDb();
  db.settings = { ...db.settings, ...settings };

  const success = writeDb(db);
  if (success) {
    res.json(db.settings);
  } else {
    res.status(500).json({ error: 'Database write error' });
  }
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
}); 
