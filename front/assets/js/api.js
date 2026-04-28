/**
 * Chamadas à API (mesma origem: /api/...).
 * Sessão PHP via cookie — usar credentials: 'include'.
 */
async function apiJson(path, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };
  const cfg = {
    credentials: 'include',
    ...options,
    headers,
  };
  if (
    cfg.body &&
    typeof cfg.body === 'object' &&
    !(cfg.body instanceof FormData) &&
    !(cfg.body instanceof Blob)
  ) {
    cfg.body = JSON.stringify(cfg.body);
    if (!cfg.headers['Content-Type']) {
      cfg.headers['Content-Type'] = 'application/json';
    }
  }
  const res = await fetch('/api' + path, cfg);
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(text || res.statusText);
    }
  }
  if (!res.ok) {
    const msg = data && data.error ? data.error : res.statusText;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function getMe() {
  return apiJson('/auth/me');
}

async function logout() {
  await apiJson('/auth/logout', { method: 'POST' });
  window.location.href = 'login.html';
}
