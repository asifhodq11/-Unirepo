import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import { MessageSquareText, AlertTriangle, Mail } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading]           = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendSent, setResendSent]     = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setEmailNotVerified(false);
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(true);
      } else {
        setError(err instanceof ApiError ? err.message : 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendFromLogin() {
    try {
      await api.post('/auth/resend-verification', { email: form.email });
    } catch { /* silent fail */ }
    setResendSent(true);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-cyan))', color: '#000', padding: '12px', borderRadius: '12px', display: 'flex' }}>
            <MessageSquareText size={24} />
          </div>
          <span className="auth-logo-name">ReplyIQ</span>
        </div>

        <h2 style={{ marginBottom: '0.25rem' }}>Welcome back</h2>
        <p className="text-sm text-muted" style={{ marginBottom: '1.75rem' }}>
          Sign in to your account
        </p>

        {error && (
          <div className="alert alert-error flex items-center gap-2" style={{ marginBottom: '1rem' }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {emailNotVerified && (
          <div style={{
            marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '10px',
            background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)',
            display: 'flex', flexDirection: 'column', gap: '0.4rem',
          }}>
            <div className="flex items-center gap-2" style={{ color: '#eab308', fontSize: '0.875rem', fontWeight: 600 }}>
              <Mail size={16} /> Email not verified
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
              Please click the link we sent to <strong>{form.email || 'your inbox'}</strong>.
            </p>
            {!resendSent ? (
              <button
                type="button"
                onClick={handleResendFromLogin}
                style={{ background: 'none', border: 'none', color: '#eab308', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: 0, textAlign: 'left', marginTop: '0.15rem' }}
              >
                Resend verification email →
              </button>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>✓ Verification email sent. Check your inbox.</span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@business.com"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading}
            style={{ marginTop: '0.25rem' }}
          >
            {loading ? <><span className="spinner" /> Signing in…</> : 'Sign in'}
          </button>
        </form>

        <div className="divider-text" style={{ marginTop: '1.5rem' }}>or</div>

        <p className="text-sm text-center text-muted" style={{ marginTop: '1rem' }}>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium" style={{ color: 'var(--accent-hover)' }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
