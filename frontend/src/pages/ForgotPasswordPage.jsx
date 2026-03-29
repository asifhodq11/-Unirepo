import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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

        {sent ? (
          /* ── Success State ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <CheckCircle2 size={48} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 style={{ marginBottom: '0.5rem' }}>Check your inbox</h2>
            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem' }}>
              If <strong>{email}</strong> is registered, a password reset link has been sent.
              The link expires in 1 hour.
            </p>
            <Link to="/login" className="btn btn-secondary btn-full">
              Back to Sign in
            </Link>
          </div>
        ) : (
          /* ── Request Form ── */
          <>
            <h2 style={{ marginBottom: '0.25rem' }}>Forgot password?</h2>
            <p className="text-sm text-muted" style={{ marginBottom: '1.75rem' }}>
              Enter your email and we'll send you a reset link.
            </p>

            {error && (
              <div className="alert alert-error flex items-center gap-2" style={{ marginBottom: '1rem' }}>
                <AlertTriangle size={18} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  id="forgot-email"
                  type="email"
                  className="form-input"
                  placeholder="you@business.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="email"
                />
              </div>

              <button
                id="forgot-submit"
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={loading}
                style={{ marginTop: '0.25rem' }}
              >
                {loading ? <><span className="spinner" /> Sending…</> : 'Send reset link'}
              </button>
            </form>

            <p className="text-sm text-center text-muted" style={{ marginTop: '1.5rem' }}>
              Remembered it?{' '}
              <Link to="/login" className="font-medium" style={{ color: 'var(--accent-hover)' }}>
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
