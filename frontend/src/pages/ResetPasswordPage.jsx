import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageSquareText, AlertTriangle, Zap } from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../hooks/useToast';

export default function ResetPasswordPage() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { toast }   = useToast();

  // Supabase appends the access_token as a URL hash fragment (#access_token=...)
  // or as a query param depending on the redirect config. We handle both.
  const params      = new URLSearchParams(location.search);
  const hashParams  = new URLSearchParams(location.hash.replace('#', ''));
  const accessToken = params.get('access_token') || hashParams.get('access_token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!accessToken) {
      setError('Invalid or expired reset link. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        access_token: accessToken,
        new_password: newPassword,
      });
      toast('Password updated! Please sign in with your new password.', 'success');
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Reset failed. The link may have expired. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-cyan))', color: 'var(--black)', padding: '12px', borderRadius: 'var(--radius-md)', display: 'flex' }}>
            <Zap size={28} fill="currentColor" />
          </div>
          <span className="auth-logo-name">ReplyIQ</span>
        </div>

        <h2 style={{ marginBottom: '0.25rem' }}>Set new password</h2>
        <p className="text-sm text-muted" style={{ marginBottom: '1.75rem' }}>
          Choose a strong password of at least 8 characters.
        </p>

        {error && (
          <div className="alert alert-error flex items-center gap-2" style={{ marginBottom: '1rem' }}>
            <AlertTriangle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              id="reset-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoFocus
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              id="reset-confirm"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            id="reset-submit"
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading || !accessToken}
            style={{ marginTop: '0.25rem' }}
          >
            {loading ? <><span className="spinner" /> Updating…</> : 'Update password'}
          </button>
        </form>

        {!accessToken && (
          <p className="text-sm text-center text-muted" style={{ marginTop: '1rem' }}>
            Link expired?{' '}
            <a href="/forgot-password" style={{ color: 'var(--accent-hover)' }}>
              Request a new one
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
