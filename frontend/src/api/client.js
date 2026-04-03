/**
 * ReplyIQ API Client
 * 
 * Key behaviours:
 *  - credentials: 'include' on ALL requests (httpOnly cookie auth)
 *  - Parses backend JSON error shape: { error: { code, message } }
 *  - Auto-redirects to /login on 401
 *  - AbortController timeout (15s default)
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';
const DEFAULT_TIMEOUT_MS = 150_000;

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

  // Handle 401 — redirect to login (except for /me check and explicit /login requests)
  if (res.status === 401 && !path.includes('/auth/me') && !path.includes('/auth/login')) {
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

  // Handle 403 EMAIL_UNVERIFIED — redirect to onboarding
  const errCode = data?.code ?? data?.error?.code ?? 'SERVER_ERROR';
  if (res.status === 403 && (errCode === 'EMAIL_UNVERIFIED')) {
    const isAuthPage = window.location.pathname === '/verify-email' || window.location.pathname === '/login';
    if (!isAuthPage) {
      window.location.href = '/verify-email';
    }
    throw new ApiError(errCode, 'Email verification required.', 403);
  }

  if (!res.ok) {
    // Backend returns: { "error": { "code": "CODE", "message": "Human text", "details": "Real exception text" } }
    const errorData = data?.error || {};
    const errCode   = errorData.code || data?.code || 'SERVER_ERROR';
    const errMsg    = errorData.details || errorData.message || data?.message || `Request failed (${res.status})`;
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

  /**
   * rawPost — like post() but resolves with { status, data } for any 2xx.
   * Use this when you need to branch on the HTTP status code (e.g. 201 vs 202).
   * Still throws ApiError on 4xx/5xx.
   */
  rawPost: async (path, body, opts = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeout ?? DEFAULT_TIMEOUT_MS);
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(body),
    }).finally(() => clearTimeout(timer));
    let data;
    try { data = await res.json(); } catch { data = null; }
    if (!res.ok) {
      const errCode = data?.code ?? 'SERVER_ERROR';
      const errMsg  = data?.message ?? `Request failed (${res.status})`;
      throw new ApiError(errCode, errMsg, res.status);
    }
    return { status: res.status, data };
  },
};

export { ApiError };
