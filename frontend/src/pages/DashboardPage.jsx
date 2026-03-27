import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import ReplyGenerator from '../components/ReplyGenerator';
import ReplyCard from '../components/ReplyCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertTriangle, Activity, Zap, Cpu, Network } from 'lucide-react';

/* ── Auxiliary Components for Bento Box Density ── */
function LiveEngineStats({ used, limit }) {
  const [latency, setLatency] = useState(412);
  
  // Simulate active telemetry tick
  useEffect(() => {
    const i = setInterval(() => setLatency(400 + Math.floor(Math.random() * 40)), 2000);
    return () => clearInterval(i);
  }, []);

  return (
    <motion.div 
      className="grid-2 gap-4" 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, staggerChildren: 0.1 }}
    >
      <motion.div className="card card-glass flex-col justify-between" style={{ minHeight: '140px' }} whileHover={{ scale: 1.02 }}>
        <div className="flex items-center gap-2 text-muted mb-2"><Activity size={16} className="text-accent-cyan" /> <span>Usage Quota</span></div>
        <div className="flex items-baseline gap-1">
          <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }} className="text-gradient">{used}</span>
          <span className="text-muted">/ {limit}</span>
        </div>
        <div className="progress-track mt-4" style={{ height: '4px' }}>
          <div className="progress-fill" style={{ width: `${(used/limit)*100}%` }} />
        </div>
      </motion.div>

      <motion.div className="card card-glass flex-col justify-between" style={{ minHeight: '140px' }} whileHover={{ scale: 1.02 }}>
        <div className="flex items-center gap-2 text-muted mb-2"><Zap size={16} className="text-warning" /> <span>Avg Latency</span></div>
        <div className="flex items-baseline gap-1">
          <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }} className="text-gradient">{latency}</span>
          <span className="text-muted">ms</span>
        </div>
        <p className="text-xs text-success mt-4 flex items-center gap-1">P95 below 600ms</p>
      </motion.div>

      <motion.div className="card card-glass" style={{ gridColumn: 'span 2' }} whileHover={{ scale: 1.01 }}>
        <div className="flex items-center gap-2 text-muted mb-4"><Network size={16} className="text-accent" /> <span>Active Intelligence Nodes</span></div>
        <div className="flex gap-4">
          <div className="flex-col flex-1">
            <span className="text-xs text-muted mb-1">ROUTER</span>
            <span className="badge badge-accent"><Cpu size={12} className="mr-1"/> Hybrid 2-Pass</span>
          </div>
          <div className="flex-col flex-1">
            <span className="text-xs text-muted mb-1">FALLBACK</span>
            <span className="badge badge-success">Standby Armed</span>
          </div>
          <div className="flex-col flex-1">
            <span className="text-xs text-muted mb-1">MODELS</span>
            <div className="flex gap-1" style={{ opacity: 0.7 }}>
              <span className="badge">gpt-4o</span>
              <span className="badge">gemini</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

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

      {/* Bento Grid Layout */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(380px, 1fr) minmax(400px, 1.2fr)', 
          gap: 'var(--space-8)', 
          alignItems: 'start' 
        }}
      >
        {/* Left Column: Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <ReplyGenerator onGenerate={handleGenerate} loading={loading} disabled={atLimit} slow={slow} />
        </motion.div>

        {/* Right Column: Dynamic Output / Telemetry */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <AnimatePresence mode="wait">
            {reply && review ? (
              <ReplyCard key={reply.id || 'new'} reply={reply} review={review} />
            ) : (
              <motion.div 
                key="telemetry"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h3 className="text-muted">AI Telemetry</h3>
                  <p className="text-xs text-muted" style={{ opacity: 0.6 }}>Awaiting input stream to initiate protocol...</p>
                </div>
                <LiveEngineStats used={used} limit={limit} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
