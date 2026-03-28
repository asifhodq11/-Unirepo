import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertTriangle, Activity, Zap, Cpu, Network, Star, TrendingUp, BarChart3, User, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPlanLimit, getPlanLimitDisplay } from '../utils/plans';
import ReviewModal from '../components/ReviewModal';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

/* ── Mini Sparkline Tooltip ── */
function SparkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10,10,15,0.95)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: '0.75rem',
    }}>
      <span className="text-muted">{label}</span>
      <div style={{ color: 'var(--accent)', fontWeight: 700 }}>
        {payload[0].value > 0 ? `${payload[0].value}★ avg` : 'No data'}
      </div>
      {payload[0].payload.count > 0 && (
        <span className="text-muted">{payload[0].payload.count} reviews</span>
      )}
    </div>
  );
}

/* ── Live Stats Panel (Right Column) ── */
function LiveEngineStats({ used, limitDisplay, analytics }) {
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState('');

  async function handleTriggerPoller() {
    setRunning(true);
    setToast('Scanning for new reviews...');
    try {
      const response = await api.post('/poller/trigger', {});
      setToast(response.message || 'Scan complete — 2 new replies generated!');
    } catch (err) {
      setToast('Scan failed to run.');
    } finally {
      setRunning(false);
      setTimeout(() => setToast(''), 4000);
    }
  }

  const avgRating = analytics?.avg_rating ?? 0;
  const replyRate = analytics?.reply_rate ?? 0;
  const dailyData = analytics?.daily_ratings ?? [];

  // Color logic for reputation score
  const repColor = avgRating >= 4 ? 'var(--success)' : avgRating >= 3 ? 'var(--warning)' : 'var(--danger, #ef4444)';

  return (
    <motion.div 
      className="flex flex-col gap-4" 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, staggerChildren: 0.1 }}
    >
      {/* Row 1: Usage Quota + Reputation Score */}
      <div className="grid-2 gap-4">
        <motion.div className="card card-glass flex-col justify-between" style={{ minHeight: '140px' }} whileHover={{ scale: 1.02 }}>
          <div className="flex items-center gap-2 text-muted mb-2"><Activity size={16} className="text-accent-cyan" /> <span>Usage This Month</span></div>
          <div className="flex items-baseline gap-1">
            <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }} className="text-gradient">{used}</span>
            <span className="text-muted">/ {limitDisplay}</span>
          </div>
          <div className="progress-track mt-4" style={{ height: '4px' }}>
            <div className="progress-fill" style={{ width: `${limitDisplay === '∞' ? Math.min((used / 200) * 100, 100) : Math.min((used / getPlanLimit('free')) * 100, 100)}%` }} />
          </div>
        </motion.div>

        <motion.div className="card card-glass flex-col justify-between" style={{ minHeight: '140px' }} whileHover={{ scale: 1.02 }}>
          <div className="flex items-center gap-2 text-muted mb-2"><Star size={16} style={{ color: repColor }} /> <span>Reputation Score</span></div>
          <div className="flex items-baseline gap-1">
            <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, color: repColor }}>{avgRating || '—'}</span>
            <span className="text-muted">/ 5.0</span>
          </div>
          <p className="text-xs mt-4 flex items-center gap-1" style={{ color: repColor, opacity: 0.85 }}>
            {replyRate > 0 ? `${replyRate}% reply rate` : 'Awaiting data…'}
          </p>
        </motion.div>
      </div>

      {/* Row 2: Sparkline Trend */}
      <motion.div className="card card-glass" whileHover={{ scale: 1.01 }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-muted"><TrendingUp size={16} className="text-accent" /> <span>14-Day Star Trend</span></div>
          {analytics?.total_reviews > 0 && (
            <span className="badge badge-muted text-xs">{analytics.total_reviews} total reviews</span>
          )}
        </div>
        <div style={{ width: '100%', height: 80 }}>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip content={<SparkTooltip />} />
                <Area
                  type="monotone"
                  dataKey="avg"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#sparkGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--bg-base)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted text-xs" style={{ opacity: 0.5 }}>
              <BarChart3 size={20} className="mr-2" /> Trend data populates after reviews are processed
            </div>
          )}
        </div>
      </motion.div>

      {/* Row 3: AI Engine Status + Scan Trigger */}
      <motion.div className="card card-glass" whileHover={{ scale: 1.01 }}>
        <div className="flex items-center gap-2 text-muted mb-4"><Network size={16} className="text-accent" /> <span>AI Engine Status</span></div>
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

        {/* Scan Trigger */}
        <div className="mt-6 border-t border-gray-800 pt-4 flex items-center justify-between">
            <button 
              onClick={handleTriggerPoller} 
              disabled={running}
              className="btn btn-secondary text-sm" 
              style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
            >
              <Cpu size={14} className="mr-2" />
              {running ? 'Running...' : 'Trigger Scan'}
            </button>
            {toast && <span className="text-xs text-success bg-success/10 px-2 py-1 rounded">{toast}</span>}
        </div>
      </motion.div>
    </motion.div>
  );
}

function DashboardInsights({ activities, analytics, plan, navigate, onOpenReview }) {
  const avgRating = analytics?.avg_rating || 0;
  const totalProcessed = analytics?.total_reviews || 0;
  
  // Calculate "Time Saved" — 5 mins per manual reply
  const timeSavedLabel = totalProcessed > 0 ? `${(totalProcessed * 5 / 60).toFixed(1)}h saved` : "Ready";

  return (
    <div className="flex flex-col gap-6">
      {/* ── Row 1: AI Impact Summary ── */}
      <div className="grid grid-2 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <motion.div className="card card-insight p-6" whileHover={{ y: -4 }}>
          <div className="flex items-center gap-2 text-muted mb-2 text-xs uppercase font-bold tracking-widest">
            <Zap size={14} className="text-accent-cyan pulse-icon" /> <span>Time Saved</span>
          </div>
          <div className="stat-value">{timeSavedLabel}</div>
          <p className="text-xs text-muted mt-2">Manual hours reclaimed by AI</p>
        </motion.div>

        <motion.div className="card card-insight p-6" whileHover={{ y: -4 }}>
          <div className="flex items-center gap-2 text-muted mb-2 text-xs uppercase font-bold tracking-widest">
            <TrendingUp size={14} className="text-accent" /> <span>Avg. Rating</span>
          </div>
          <div className="stat-value">{avgRating || '0.0'}★</div>
          <p className="text-xs text-muted mt-2">Overall customer reputation score</p>
        </motion.div>
      </div>

      {/* ── Row 2: Auto-Reply Heartbeat ── */}
      <div className="card card-glass p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-accent-cyan" />
            <h3 className="text-sm font-bold uppercase tracking-widest">Auto-Reply Heartbeat</h3>
          </div>
          <span className="badge badge-success flex items-center gap-1">
            <Zap size={10} fill="currentColor" /> Live
          </span>
        </div>
        
        <div className="grid-3 gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Next Scan</span>
            <span className="text-sm font-medium">approx. 12m</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Region</span>
            <span className="text-sm font-medium">Poller @US-West</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">AI Model</span>
            <span className="text-xs badge badge-accent">gpt-4o / gemini</span>
          </div>
        </div>
      </div>

      {/* ── Row 3: Recent Activity — Plate Cards ── */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-2">Recent Activity</h3>
        {!activities.length ? (
          <div className="card card-glass" style={{ padding: 'var(--space-4)', textAlign: 'center' }}>
            <p className="text-xs text-muted italic">No activity yet. Trigger a scan or wait for the auto-poller.</p>
          </div>
        ) : (
          activities.slice(0, 5).map(act => {
            const isPending = act.status === 'pending';
            const hasName = act.reviewer_name && act.reviewer_name.trim();
            const rating = act.rating ?? 0;

            return (
              <motion.div
                key={act.id}
                className="card card-glass"
                style={{
                  cursor: 'pointer',
                  padding: 'var(--space-3) var(--space-4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 'var(--space-3)',
                  borderLeft: isPending ? '2px solid var(--warning)' : '2px solid var(--success)',
                }}
                whileHover={{ scale: 1.01, x: 2 }}
                onClick={() => {
                  if (isPending) {
                    navigate(`/history?status=pending&open=${act.id}`);
                  } else {
                    onOpenReview(act);
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', overflow: 'hidden' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <User size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {hasName ? act.reviewer_name : 'Anonymous Guest'}
                    </span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {Array.from({ length: rating }).map((_, i) => (
                        <Star key={i} size={11} fill="var(--accent)" stroke="var(--accent)" />
                      ))}
                      {Array.from({ length: 5 - rating }).map((_, i) => (
                        <Star key={`e${i}`} size={11} fill="none" stroke="var(--text-muted)" style={{ opacity: 0.3 }} />
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <span className={`badge ${isPending ? 'badge-warning' : 'badge-success'}`}>
                    {isPending ? 'Pending' : 'Replied'}
                  </span>
                  <ExternalLink size={13} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);

  const plan  = user?.plan ?? 'free';
  const used  = user?.reply_count_this_month ?? 0;
  const limit = getPlanLimit(plan);
  const limitDisplay = getPlanLimitDisplay(plan);
  const atLimit = used >= limit;

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      try {
        const [anRes, actRes] = await Promise.all([
          api.get('/analytics/overview').catch(() => null),
          api.get('/reviews/activity').catch(() => ({ events: [] }))
        ]);
        setAnalytics(anRes);
        setActivities(actRes.events || []);
      } catch (err) {
        // Soft fail
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  return (
    <>
    <motion.div 
      className="page-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {/* Header */}
      <motion.div 
        style={{ marginBottom: 'var(--space-8)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 style={{ marginBottom: 'var(--space-2)' }}>
          <span className="text-gradient">Dashboard</span>
        </h1>
        <p className="text-secondary">
          Monitor your replies, reputation, and auto-reply heartbeat.
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
                You've used all {limitDisplay} replies for this month.{' '}
                {plan === 'free' && <a href="/settings">Upgrade your plan</a>} to unlock more replies.
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

      {/* Grid Layout */}
      <div className="app-bento-grid">
        {/* Left Column: Insights */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          {loading ? (
             <div className="flex flex-col gap-4">
                <div className="skeleton" style={{ height: '160px' }} />
                <div className="skeleton" style={{ height: '120px' }} />
             </div>
          ) : (
            <DashboardInsights 
              activities={activities} 
              analytics={analytics} 
              plan={plan}
              navigate={navigate}
              onOpenReview={setSelectedReview}
            />
          )}
        </motion.div>

        {/* Right Column: Live Meter & Controls */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <LiveEngineStats used={used} limitDisplay={limitDisplay} analytics={analytics} />
        </motion.div>
      </div>
    </motion.div>

    {/* Dashboard read-only review modal */}
    {selectedReview && (
      <ReviewModal
        item={selectedReview}
        onClose={() => setSelectedReview(null)}
        readOnly
      />
    )}
  </>);
}
