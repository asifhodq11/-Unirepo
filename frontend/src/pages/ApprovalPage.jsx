import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';

export default function ApprovalPage() {
  const { token } = useParams();
  const [status, setStatus]   = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const [done, setDone]       = useState(false);

  useEffect(() => {
    if (!token || done) return;

    async function approve() {
      try {
        await api.post('/approvals/approve', { token });
        setStatus('success');
        setMessage('Reply approved and posted to your Google Business Profile. ✅');
      } catch (err) {
        if (err instanceof ApiError && err.status === 410) {
          setMessage('This approval link has already been used or has expired.');
        } else {
          setMessage(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
        }
        setStatus('error');
      } finally {
        setDone(true);
      }
    }

    approve();
  }, [token, done]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'radial-gradient(ellipse at 60% 10%, rgba(99,102,241,0.08) 0%, transparent 60%), var(--bg-base)',
      padding: '2rem',
      fontFamily: 'var(--font)',
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <div style={{
            width: '36px', height: '36px',
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem',
          }}>💬</div>
          <span style={{ fontWeight: 700, fontSize: '1.15rem' }}>ReplyIQ</span>
        </div>

        {status === 'loading' && (
          <>
            <div className="spinner spinner-lg" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ marginBottom: '0.5rem' }}>Approving Reply</h2>
            <p className="text-secondary text-sm">Posting your reply to Google Business Profile…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ marginBottom: '0.75rem' }}>Reply Posted!</h2>
            <p className="text-secondary text-sm">{message}</p>
            <p className="text-muted text-xs" style={{ marginTop: '1.25rem' }}>
              Powered by ReplyIQ — AI replies that sound human.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ marginBottom: '0.75rem' }}>Approval Failed</h2>
            <p className="text-secondary text-sm">{message}</p>
            <p className="text-muted text-xs" style={{ marginTop: '1.25rem' }}>
              If you believe this is an error, contact your account admin.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
