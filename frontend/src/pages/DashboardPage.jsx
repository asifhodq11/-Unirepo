import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import ReplyGenerator from '../components/ReplyGenerator';
import ReplyCard from '../components/ReplyCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertTriangle } from 'lucide-react';

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
    <motion.div 
      className="page-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {/* Header — typographic anchor: dominant H1 with gradient, extra space below */}
      <motion.div 
        style={{ marginBottom: 'var(--space-8)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 style={{ marginBottom: 'var(--space-2)' }}>
          <span className="text-gradient">Generate Reply</span>
        </h1>
        <p className="text-secondary">
          Paste a review below and get a human-sounding reply in seconds.
        </p>
      </motion.div>

      {/* Quota & Error Alerts */}
      <AnimatePresence>
        {atLimit && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="alert alert-warning" 
            style={{ marginBottom: 'var(--space-6)' }}
          >
            <Lock size={20} />
            <div>
              <strong>Monthly limit reached</strong>
              <p className="text-sm" style={{ marginTop: 'var(--space-1)', color: 'inherit', opacity: 0.85 }}>
                You've used all {limit} replies for this month.{' '}
                {plan === 'free' && <a href="/settings">Upgrade to Starter</a>} to unlock 100 replies/month.
              </p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="alert alert-error" 
            style={{ marginBottom: 'var(--space-6)' }}
          >
            <AlertTriangle size={20} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generator form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <ReplyGenerator onGenerate={handleGenerate} loading={loading} disabled={atLimit} slow={slow} />
      </motion.div>

      {/* Reply output — pre-allocated region (CLS prevention) */}
      <div className="reply-output-region" style={{ marginTop: 'var(--space-8)' }}>
        <AnimatePresence mode="wait">
          {reply && review && (
            <ReplyCard key={reply.id || 'new'} reply={reply} review={review} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
