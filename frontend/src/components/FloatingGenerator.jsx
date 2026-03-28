import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, X, Loader2, AlertTriangle } from 'lucide-react';
import ReplyGenerator from './ReplyGenerator';
import ReplyCard from './ReplyCard';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function FloatingGenerator() {
  const { user, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [slow, setSlow] = useState(false);
  const [reply, setReply] = useState(null);
  const [review, setReview] = useState(null);

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
      // Inform parent components if needed, or just let them refetch
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('Monthly quota reached. Upgrade to Starter.');
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
    <>
      <div className="fab-container">
        <button 
          className="magic-fab" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open Magic Generator"
        >
          {isOpen ? <X size={24} /> : <Wand2 size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="magic-panel"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="magic-panel-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 size={18} className="text-accent-cyan" />
                <h3 style={{ fontSize: '1.05rem' }}>Magic Generator</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="btn btn-ghost btn-sm" 
                style={{ padding: '8px', borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="magic-panel-content">
              {error && (
                <div className="alert alert-error mb-4" style={{ padding: 'var(--space-2) var(--space-3)' }}>
                  <AlertTriangle size={16} /> <span className="text-xs">{error}</span>
                </div>
              )}

              {!reply ? (
                <ReplyGenerator onGenerate={handleGenerate} loading={loading} disabled={atLimit} slow={slow} />
              ) : (
                <div className="flex flex-col gap-4">
                  <ReplyCard key={reply.id} reply={reply} review={review} />
                  <button className="btn btn-secondary btn-full" onClick={() => { setReply(null); setReview(null); }}>
                    Generate Another
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
