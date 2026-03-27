/**
 * ReplyIQ API Client
 * 
 * Key behaviours:
 *  - credentials: 'include' on ALL requests (httpOnly cookie auth)
 *  - Parses backend JSON error shape: { error: { code, message } }
 *  - Auto-redirects to /login on 401
 *  - AbortController timeout (15s default)
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1';
const DEFAULT_TIMEOUT_MS = 15_000;

class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request(method, path, { body, timeout = DEFAULT_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const options = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, options);
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new ApiError('TIMEOUT', 'Request timed out. Please try again.', 0);
    }
    throw new ApiError('NETWORK_ERROR', 'Network error. Check your connection.', 0);
  }
  clearTimeout(timer);

  // Handle 401 — redirect to login (except for the /me boot call)
  if (res.status === 401 && !path.includes('/auth/me')) {
    window.location.href = '/login';
    throw new ApiError('AUTH_REQUIRED', 'Session expired.', 401);
  }

  // Parse JSON response
  let data;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) {
      throw new ApiError('SERVER_ERROR', `Server error (${res.status})`, res.status);
    }
    return null;
  }

  if (!res.ok) {
    const errCode = data?.error?.code ?? 'SERVER_ERROR';
    const errMsg  = data?.error?.message ?? `Request failed (${res.status})`;
    throw new ApiError(errCode, errMsg, res.status);
  }

  return data;
}

// ── Convenience methods ──────────────────────────────────────
export const api = {
  get:    (path, opts)       => request('GET',    path, opts),
  post:   (path, body, opts) => request('POST',   path, { body, ...opts }),
  patch:  (path, body, opts) => request('PATCH',  path, { body, ...opts }),
  delete: (path, opts)       => request('DELETE', path, opts),
};

export { ApiError };
