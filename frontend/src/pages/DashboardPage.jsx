import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertTriangle, Activity, Zap, Cpu, Network, Star, TrendingUp, BarChart3, Wand2, Clock } from 'lucide-react';

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

/* ── Auxiliary Components for Bento Box Density ── */
function LiveEngineStats({ used, limit, analytics }) {
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState('');

  async function handleTriggerPoller() {
    setRunning(true);
    setToast('Simulation engine started...');
    try {
      const response = await api.post('/poller/trigger', {});
      setToast(response.message || 'Simulation generated 2 new replies!');
    } catch (err) {
      setToast('Simulation failed to run.');
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
          <div className="flex items-center gap-2 text-muted mb-2"><Activity size={16} className="text-accent-cyan" /> <span>Usage Quota</span></div>
          <div className="flex items-baseline gap-1">
            <span style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }} className="text-gradient">{used}</span>
            <span className="text-muted">/ {limit}</span>
          </div>
          <div className="progress-track mt-4" style={{ height: '4px' }}>
            <div className="progress-fill" style={{ width: `${Math.min((used/limit)*100, 100)}%` }} />
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
              <BarChart3 size={20} className="mr-2" /> Trend data will populate after reviews are processed
            </div>
          )}
        </div>
      </motion.div>

      {/* Row 3: Intelligence Nodes + Simulation */}
      <motion.div className="card card-glass" whileHover={{ scale: 1.01 }}>
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

        {/* Simulation Poller Trigger */}
        <div className="mt-6 border-t border-gray-800 pt-4 flex items-center justify-between">
            <button 
              onClick={handleTriggerPoller} 
              disabled={running}
              className="btn btn-secondary text-sm" 
              style={{ width: 'auto', padding: '0.4rem 0.8rem' }}
            >
              <Cpu size={14} className="mr-2" />
              {running ? 'Running...' : 'Run Diagnostics'}
            </button>
            {toast && <span className="text-xs text-success bg-success/10 px-2 py-1 rounded">{toast}</span>}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ActivityList({ activities, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="skeleton" style={{ height: '70px', width: '100%' }} />
        <div className="skeleton" style={{ height: '70px', width: '100%' }} />
        <div className="skeleton" style={{ height: '70px', width: '100%' }} />
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <div className="card text-center flex flex-col items-center justify-center p-8" style={{ minHeight: '300px' }}>
        <Wand2 size={40} className="text-muted mb-4 opacity-50" />
        <h3 className="text-primary mb-2">System Idling</h3>
        <p className="text-secondary text-sm max-w-sm">
          No automated activity detected yet. Use the Magic Wand in the bottom right to manually generate your first reply.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-muted tracking-wide flex items-center gap-2 uppercase">
          <Activity size={14} className="text-accent-cyan" /> Live Feed
        </h3>
        <span className="badge badge-muted flex items-center gap-1"><Clock size={12}/> Auto-syncing</span>
      </div>
      
      {activities.map(act => (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          key={act.id} 
          className="card card-glass flex items-center justify-between" 
          style={{ padding: 'var(--space-4)', borderLeft: act.type === 'draft_created' ? '3px solid var(--success)' : '3px solid var(--warning)' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`badge ${act.type === 'draft_created' ? 'badge-success' : 'badge-warning'}`}>
                {act.type === 'draft_created' ? 'Draft Ready' : 'Scanning'}
              </span>
              <span className="text-xs text-muted">
                {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm font-medium">{act.title}</p>
          </div>
          {act.rating && (
            <div className="flex items-center gap-1 text-accent-cyan font-bold bg-accent/10 px-2 py-1 rounded">
              {act.rating} <Star size={12} fill="currentColor" />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [activities, setActivities] = useState([]);

  const plan  = user?.plan ?? 'free';
  const used  = user?.reply_count_this_month ?? 0;
  const limit = plan === 'starter' ? 100 : 3;
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
          <span className="text-gradient">Activity Console</span>
        </h1>
        <p className="text-secondary">
          Monitor your automated replies and overall reputation heartbeat.
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
          gridTemplateColumns: 'minmax(350px, 1.2fr) minmax(350px, 1fr)', 
          gap: 'var(--space-8)', 
          alignItems: 'start' 
        }}
      >
        {/* Left Column: Live Activity Feed */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <ActivityList activities={activities} loading={loading} />
        </motion.div>

        {/* Right Column: AI Analytics Hub */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <h3 className="text-muted">Command Center</h3>
            <p className="text-xs text-muted" style={{ opacity: 0.6 }}>Real-time intelligence & analytics</p>
          </div>
          <LiveEngineStats used={used} limit={limit} analytics={analytics} />
        </motion.div>
      </div>
    </motion.div>
  );
}
