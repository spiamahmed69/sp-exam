// API client for the SP Exam PHP backend.
// Base URL: import.meta.env.VITE_API_URL (e.g. http://127.0.0.1:8080/api
// locally, or https://<infinityfree-host>/spexam-api/api on InfinityFree).
// Empty = backend not configured: the app runs in local/offline mode and
// every API page shows an honest "Backend not connected" state.
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const apiConfigured = () => API_URL.length > 0;

const TOKEN_KEY = 'sp-exam:token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}
export function setToken(t) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

let onUnauthorized = null;
export function setOnUnauthorized(fn) {
  onUnauthorized = fn;
}

async function request(path, { method = 'GET', body, token } = {}) {
  if (!apiConfigured()) {
    const err = new Error('Backend not configured. Set VITE_API_URL to your PHP API URL.');
    err.code = 'not_configured';
    throw err;
  }
  const headers = { 'Content-Type': 'application/json' };
  const t = token !== undefined ? token : getToken();
  if (t) headers.Authorization = `Bearer ${t}`;
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    const err = new Error(`Cannot reach the backend at ${API_URL}. Is the PHP API running?`);
    err.code = 'unreachable';
    err.cause = e;
    throw err;
  }
  let payload = null;
  try {
    payload = await res.json();
  } catch {
    const err = new Error(`Backend returned an unreadable response (HTTP ${res.status}).`);
    err.code = 'bad_response';
    err.status = res.status;
    throw err;
  }
  if (!res.ok || payload?.success === false) {
    const err = new Error(payload?.error?.message || `Request failed (HTTP ${res.status}).`);
    err.code = payload?.error?.code || `http_${res.status}`;
    err.status = res.status;
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    throw err;
  }
  return payload.data;
}

export const api = {
  get: (p, opts) => request(p, { ...opts, method: 'GET' }),
  post: (p, body, opts) => request(p, { ...opts, method: 'POST', body }),
  put: (p, body, opts) => request(p, { ...opts, method: 'PUT', body }),
  del: (p, opts) => request(p, { ...opts, method: 'DELETE' }),
  health: () => request('/health'),
};

// Connection status: 'unknown' | 'online' | 'offline' | 'not_configured'
export async function checkConnection() {
  if (!apiConfigured()) return { status: 'not_configured', url: '' };
  try {
    await api.health();
    return { status: 'online', url: API_URL };
  } catch {
    return { status: 'offline', url: API_URL };
  }
}

export { API_URL as apiUrl };
