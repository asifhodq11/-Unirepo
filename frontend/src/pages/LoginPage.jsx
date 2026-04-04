import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import { Zap, AlertTriangle, Mail } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading]           = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [resendSent, setResendSent]     = useState(false);
  
  const searchParams = new URLSearchParams(window.location.search);
  const isVerified   = searchParams.get('verified') === 'true';

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setEmailNotVerified(false);
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(true);
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Login failed. Please check your credentials or network.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendFromLogin() {
    try {
      await api.post('/auth/resend-verification', { email: form.email });
    } catch (err) {
      toast.error('Failed to resend verification link. Please wait a moment.');
    }
    setResendSent(true);
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-bg-base px-4">
      <div className="card w-full max-w-[400px] mx-auto p-8 shadow-sm">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-bg-elevated border border-border text-text-primary p-2 rounded-md">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-semibold tracking-tight">ReplyIQ</span>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold tracking-tight mb-1">Welcome back</h2>
          <p className="text-text-secondary text-sm">Enter your credentials to continue.</p>
        </div>

        {error && (
          <div className="alert alert-error flex items-center gap-2" style={{ marginBottom: '1rem' }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        {isVerified && !error && (
          <div className="alert alert-success" style={{ marginBottom: '1rem', padding: '0.85rem 1rem' }}>
            ✓ Email verified! You can now log in to your account.
          </div>
        )}

        {emailNotVerified && (
          <div style={{
            marginBottom: '1rem', padding: '0.85rem 1rem', borderRadius: '10px',
            background: 'rgba(var(--warning-rgb), 0.08)', border: '1px solid rgba(var(--warning-rgb), 0.25)',
            display: 'flex', flexDirection: 'column', gap: '0.4rem',
          }}>
            <div className="flex items-center gap-2" style={{ color: 'var(--warning)', fontSize: '0.875rem', fontWeight: 600 }}>
              <Mail size={16} /> Email not verified
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
              Please click the link we sent to <strong>{form.email || 'your inbox'}</strong>.
            </p>
            {!resendSent ? (
              <button
                type="button"
                onClick={handleResendFromLogin}
                style={{ background: 'none', border: 'none', color: 'var(--warning)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, padding: 0, textAlign: 'left', marginTop: '0.15rem' }}
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
