import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true until boot /me call resolves

  // ── Boot: Rehydrate session or trigger Executive Bypass ────────
  useEffect(() => {
    // Executive Bypass: Enable /dashboard?test=true for zero-friction testing
    const params = new URLSearchParams(window.location.search);
    if (params.get('test') === 'true' || params.get('mock') === 'true') {
      setUser({
        id: 'mock-exec-001',
        email: 'test-executive@replyiq.com',
        user_metadata: { first_name: 'Test', last_name: 'Executive', business_name: 'Test Workspace' },
        role: 'admin'
      });
      setLoading(false);
      return;
    }

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

  // ── Update Profile (Settings) ───────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    try {
      const data = await api.patch('/settings/', updates);
      await refreshUser();
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [refreshUser]);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser, updateProfile, setUser, isAdmin }}>
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



