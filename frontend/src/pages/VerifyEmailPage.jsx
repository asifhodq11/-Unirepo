import { useState } from 'react';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmailPage() {
  const { logout, user } = useAuth();
  const searchParams = new URLSearchParams(window.location.search);
  const emailParam   = searchParams.get('email');
  const targetEmail  = user?.email || emailParam;

  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState(null);

  const handleResend = async () => {
    if (!targetEmail) {
      setError("No email found to resend to.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/resend-verification', { email: targetEmail });

      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      setError(err.message || 'Failed to resend. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>

        {/* Icon */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: '1.5rem',
        }}>
          <div style={{
            width: '60px', height: '60px',
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mail size={28} style={{ color: '#60a5fa' }} />
          </div>
        </div>

        <h2 style={{ marginBottom: '0.5rem' }}>One last step</h2>
        <p className="text-sm text-muted" style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
          We've sent a verification link to <strong>{targetEmail || "your email"}</strong>. Click it to activate
          your ReplyIQ account and unlock your dashboard.
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem', textAlign: 'left' }}>
            {error}
          </div>
        )}

        {sent && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
            ✓ Verification email sent — check your inbox.
          </div>
        )}

        <div className="flex flex-col gap-4">
          <button
            id="resend-verification-btn"
            onClick={handleResend}
            disabled={loading || sent}
            className="btn btn-primary btn-lg btn-full"
          >
            {loading
              ? <><span className="spinner" /> Sending…</>
              : sent
              ? '✓ Email Sent!'
              : <><RefreshCw size={16} /> Resend Verification Email</>
            }
          </button>

          <button
            id="logout-btn"
            onClick={handleLogout}
            className="btn btn-ghost btn-lg btn-full"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          >
            <LogOut size={16} />
            Log Out and Try Again
          </button>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <p className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>
            Already clicked the link?
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.background = 'var(--bg-elevated)'}
            onMouseOut={(e) => e.target.style.background = 'var(--bg-glass)'}
          >
            Click here to log in
          </button>
        </div>
      </div>
    </div>
  );
}
