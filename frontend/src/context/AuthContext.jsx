import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true until boot /me call resolves

  // ── Boot: Rehydrate session from httpOnly cookie ────────────────
  useEffect(() => {
    api.get('/auth/me')
      .then(data => setUser(data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // ── Login ────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setUser(data.user);
    return data.user;
  }, []);

  // ── Signup ───────────────────────────────────────────────────────
  const signup = useCallback(async (payload) => {
    const data = await api.post('/auth/signup', payload);
    setUser(data.user);
    return data.user;
  }, []);

  // ── Logout ───────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    setUser(null);
    window.location.href = '/login';
  }, []);

  // ── Refresh user (call after settings update, Stripe return, etc) ─
  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      setUser(data?.user ?? null);
    } catch { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
