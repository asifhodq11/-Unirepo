import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import ReplyGenerator from '../components/ReplyGenerator';
import ReplyCard from '../components/ReplyCard';

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const [reply, setReply]       = useState(null);
  const [review, setReview]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [slow, setSlow]         = useState(false);

  const plan  = user?.plan ?? 'free';
  const used  = user?.reply_count_this_month ?? 0;
  const limit = plan === 'starter' ? 100 : 3;
  const atLimit = used >= limit;

  async function handleGenerate(formData) {
    setError('');
    setReply(null);
    setReview(null);
    setLoading(true);
    setSlow(false);

    const slowTimer = setTimeout(() => setSlow(true), 5000);

    try {
      const data = await api.post('/reviews/generate', formData, { timeout: 30_000 });
      setReply(data.reply);
      setReview(data.review);
      await refreshUser();
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('Monthly quota reached. Upgrade to Starter for more replies.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Generation failed. Please try again.');
      }
    } finally {
      clearTimeout(slowTimer);
      setSlow(false);
      setLoading(false);
    }
  }

  return (
    <div className="page-content">
      {/* Header — typographic anchor: dominant H1 with gradient, extra space below */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>
          <span className="text-gradient">Generate Reply</span>
        </h1>
        <p className="text-secondary">
          Paste a review below and get a human-sounding reply in seconds.
        </p>
      </div>

      {/* Quota warning — smash-cut animation for urgency */}
      {atLimit && (
        <div className="alert alert-warning t-smash-cut" style={{ marginBottom: 'var(--space-6)' }}>
          <span>🔒</span>
          <div>
            <strong>Monthly limit reached</strong>
            <p className="text-sm" style={{ marginTop: 'var(--space-1)', color: 'inherit', opacity: 0.85 }}>
              You've used all {limit} replies for this month.{' '}
              {plan === 'free' && <a href="/settings">Upgrade to Starter</a>} to unlock 100 replies/month.
            </p>
          </div>
        </div>
      )}

      {/* Error — smash-cut for danger */}
      {error && (
        <div className="alert alert-error t-smash-cut" style={{ marginBottom: 'var(--space-6)' }}>
          <span>⚠</span> {error}
        </div>
      )}

      {/* Generator form */}
      <ReplyGenerator onGenerate={handleGenerate} loading={loading} disabled={atLimit} slow={slow} />

      {/* Reply output — pre-allocated region (CLS prevention) */}
      <div className="reply-output-region" style={{ marginTop: 'var(--space-8)' }}>
        {reply && review && (
          <ReplyCard reply={reply} review={review} />
        )}
      </div>
    </div>
  );
}
