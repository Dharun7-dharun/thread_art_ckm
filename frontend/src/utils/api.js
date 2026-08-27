const API_BASE = import.meta.env.VITE_API_BASE_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'API request failed');
  }

  return data;
}

export async function fetchProducts() {
  return request('/products');
}

export async function createProduct(product) {
  return request('/products', {
    method: 'POST',
    body: JSON.stringify(product)
  });
}

export async function deleteProduct(id) {
  return request(`/products/${id}`, {
    method: 'DELETE'
  });
}

export async function updateProduct(id, updates) {
  return request(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

export async function deleteOrder(id) {
  return request(`/orders/${id}`, {
    method: 'DELETE'
  });
}

export async function fetchOrders() {
  return request('/orders');
}

export async function placeOrder(order) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(order)
  });
}

export async function updateOrderPrice(id, price) {
  return request(`/orders/${id}/price`, {
    method: 'POST',
    body: JSON.stringify({ price })
  });
}

export async function trackOrders(phone) {
  return request(`/orders/track?phone=${encodeURIComponent(phone)}`);
}

export async function fetchSettings() {
  return request('/settings');
}

export async function updateSettings(settings) {
  return request('/settings', {
    method: 'POST',
    body: JSON.stringify(settings)
  });
}

export async function updateOrderStatus(id, status) {
  return request(`/orders/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status })
  });
}

export async function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}
