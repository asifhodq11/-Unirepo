import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true until boot /me call resolves
  const [error, setError]     = useState(null);

  // ── Refresh User Logic (Atomic) ──────────────
  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      setUser(data?.user ?? null);
      setError(null);
      return data?.user;
    } catch (err) {
      console.error('[AuthContext] Refresh failed:', err);
      setUser(null);
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Boot: Rehydrate session or trigger Executive Bypass ────────
  useEffect(() => {
    // Executive Bypass: Enable /dashboard?test=true for zero-friction testing
    const params = new URLSearchParams(window.location.search);
    const isTestMode = params.get('test') === 'true' || params.get('mock') === 'true' || localStorage.getItem('replyiq_test_mode') === 'true';
    
    if (isTestMode) {
      if (params.get('test') === 'true') {
        localStorage.setItem('replyiq_test_mode', 'true');
      }
      
      setUser({
        id: 'mock-exec-001',
        email: 'test-executive@replyiq.com',
        user_metadata: { 
          first_name: 'Test', 
          last_name: 'Executive', 
          business_name: 'Test Workspace' 
        },
        role: 'admin'
      });
      setLoading(false);
      return;
    }

    refreshUser();
  }, [refreshUser]);

  // ── Login ────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    await refreshUser();
    return data.user;
  }, [refreshUser]);

  // ── Signup ───────────────────────────────────────────────────────
  const signup = useCallback(async (payload) => {
    const data = await api.post('/auth/signup', payload);
    await refreshUser();
    return data.user;
  }, [refreshUser]);

  // ── Logout ───────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    // BUG-003 FIX: Always clear the Executive Bypass flag on logout
    // to prevent a ghost mock-admin session persisting across real logouts.
    localStorage.removeItem('replyiq_test_mode');
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



