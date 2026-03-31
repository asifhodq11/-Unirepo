import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import { MessageSquareText, CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * AuthCallbackPage — /auth/callback
 *
 * Supabase redirects here after the user clicks the email confirmation link.
 * The access_token is appended as a URL hash fragment:
 *   /auth/callback#access_token=xxx&token_type=bearer&...
 *
 * We send the token to the backend, which calls supabase.auth.set_session()
 * and returns the user object + sets the httpOnly session cookie.
 */
export default function AuthCallbackPage() {
  const navigate    = useNavigate();
  const { setUser } = useAuth();

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function exchangeToken() {
      // Parse the hash fragment that Supabase appends to the redirect URL
      const hash   = window.location.hash.replace('#', '');
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');

      if (!accessToken) {
        setStatus('error');
        setErrorMsg('No verification token found in the URL. The link may have expired or already been used.');
        return;
      }

      try {
        const data = await api.post('/auth/verify-email', { access_token: accessToken });
        setUser(data.user);
        setStatus('success');

        // Brief success flash, then redirect to login
        setTimeout(() => navigate('/login?verified=true', { replace: true }), 1800);
      } catch (err) {
        setStatus('error');
        setErrorMsg(
          err instanceof ApiError
            ? err.message
            : 'Verification failed. The link may have expired. Please request a new one.'
        );
      }
    }

    exchangeToken();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>

        {/* Logo */}
        <div className="auth-logo" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-cyan))', color: '#000', padding: '12px', borderRadius: '12px', display: 'flex' }}>
            <MessageSquareText size={24} />
          </div>
          <span className="auth-logo-name">ReplyIQ</span>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            </div>
            <h2 style={{ marginBottom: '0.4rem' }}>Verifying your email…</h2>
            <p className="text-sm text-muted">Just a moment while we confirm your account.</p>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <CheckCircle2 size={52} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 style={{ marginBottom: '0.4rem' }}>Email confirmed! 🎉</h2>
            <p className="text-sm text-muted">Your account is active. Redirecting to dashboard…</p>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <AlertTriangle size={48} style={{ color: '#f87171' }} />
            </div>
            <h2 style={{ marginBottom: '0.4rem' }}>Verification failed</h2>
            <p className="text-sm text-muted" style={{ marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {errorMsg}
            </p>
            <a
              href="/signup"
              className="btn btn-primary btn-full"
              style={{ marginBottom: '0.75rem' }}
            >
              Back to Sign up
            </a>
            <a href="/login" className="btn btn-secondary btn-full">
              Sign in
            </a>
          </>
        )}
      </div>
    </div>
  );
}
