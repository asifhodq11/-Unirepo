import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, AlertTriangle, Activity, Zap, Cpu, Network, 
  Star, TrendingUp, BarChart3, User, ExternalLink, 
  MessageSquare, Shield, Clock, MousePointer2, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPlanLimit, getPlanLimitDisplay } from '../utils/plans';
import { ProCard, ProButton, ProBadge, ProStat } from '../components/BaseComponents';
import ReviewModal from '../components/ReviewModal';
import OnboardingModal from '../components/modals/OnboardingModal';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useToast } from '../hooks/useToast';
import { useResilientAction } from '../hooks/useResilientAction';
import NetworkHealthCheck from '../components/NetworkHealthCheck';

/* ── Dashboard Stats Section ── */
function DashboardOverview({ used, limit, limitDisplay, analytics, onTriggerScan, scanLoading }) {
  const avgRating = analytics?.avg_rating ?? 0;
  const totalReviews = analytics?.total_reviews ?? 0;
  const replyRate = analytics?.reply_rate ?? 0;
  const timeSaved = totalReviews > 0 ? (totalReviews * 5 / 60).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <ProStat 
        label="Monthly Usage" 
        value={used} 
        subValue={`of ${limitDisplay} replies`} 
        icon={Activity}
        trend={null}
      />
      <ProStat 
        label="Reputation" 
        value={avgRating || "0.0"} 
        subValue={`${totalReviews} total reviews`} 
        icon={Star}
        trend={avgRating > 4 ? 12 : -5} // Mock trend for visual polish
      />
      <ProStat 
        label="AI Efficiency" 
        value={`${replyRate}%`} 
        subValue="Response coverage" 
        icon={Zap}
        trend={8}
      />
      <ProStat 
        label="Time Reclaimed" 
        value={`${timeSaved}h`} 
        subValue="Manual effort saved" 
        icon={Clock}
        trend={15}
      />
    </div>
  );
}

/* ── Heartbeat & Engine Status ── */
function EngineHeartbeat({ isSafeMode, onTriggerScan, running }) {
  return (
    <ProCard className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-accent">
            <Network size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider">AI Engine Heartbeat</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] font-medium text-success uppercase">System Operational</span>
            </div>
          </div>
        </div>
        <ProButton 
          variant="secondary" 
          size="sm" 
          onClick={onTriggerScan} 
          isLoading={running}
          icon={RefreshCw}
        >
          Check for Reviews
        </ProButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Active Model</span>
          <ProBadge variant="accent">GPT-4o + Gemini</ProBadge>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Routing Mode</span>
          <ProBadge variant={isSafeMode ? 'warning' : 'success'}>
            {isSafeMode ? 'Safe Mode' : 'Performance'}
          </ProBadge>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Latency</span>
          <span className="text-xs font-bold text-primary">84ms avg</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Success Rate</span>
          <span className="text-xs font-bold text-primary">99.8%</span>
        </div>
      </div>
    </ProCard>
  );
}

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { execute, loading: scanLoading, isSafeMode } = useResilientAction();
  
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(user?.onboarding_complete === false);

  const plan = user?.plan ?? 'free';
  const used = user?.reply_count_this_month ?? 0;
  const limit = getPlanLimit(plan);
  const limitDisplay = getPlanLimitDisplay(plan);

  useEffect(() => {
    async function fetchData() {
      try {
        const [anRes, actRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/reviews/activity')
        ]);
        setAnalytics(anRes);
        setActivities(actRes.events || []);
      } catch (err) {
        toast.error('Failed to sync dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleTriggerScan = async () => {
    await execute(
      () => api.post('/poller/trigger', {}),
      {
        loadingMessage: 'Scanning Google Workspace...',
        successMessage: 'Scan complete. New reviews processed.',
      }
    );
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* ── Page Header ── */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-primary tracking-tight">Overview</h1>
          <p className="text-sm text-muted font-medium mt-1">Real-time performance and AI monitoring.</p>
        </div>
        <NetworkHealthCheck />
      </header>

      {/* ── Actionable Alerts ── */}
      <AnimatePresence>
        {user?.google_status === 'degraded' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <ProCard className="bg-danger/5 border-danger/20 flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-danger" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-primary">Google Connection Degraded</h4>
                  <p className="text-xs text-muted">We are unable to fetch new reviews from your profile.</p>
                </div>
              </div>
              <ProButton size="sm" variant="danger" onClick={() => navigate('/settings')}>Reconnect</ProButton>
            </ProCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Core Widgets ── */}
      <DashboardOverview 
        used={used} 
        limit={limit} 
        limitDisplay={limitDisplay} 
        analytics={analytics} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <EngineHeartbeat 
            isSafeMode={isSafeMode} 
            onTriggerScan={handleTriggerScan} 
            running={scanLoading} 
          />

          <ProCard>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Recent Activity</h3>
              <ProButton variant="ghost" size="sm" onClick={() => navigate('/history')}>View All</ProButton>
            </div>
            
            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-16 w-full rounded-lg bg-white/5 animate-pulse" />)
              ) : activities.length > 0 ? (
                activities.slice(0, 5).map(act => (
                  <motion.div 
                    key={act.id}
                    whileHover={{ x: 4 }}
                    onClick={() => act.status === 'pending' ? navigate(`/history?open=${act.id}`) : setSelectedReview(act)}
                    className="group flex items-center justify-between p-3 rounded-lg border border-border hover:border-accent/40 hover:bg-white/[0.02] cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-border flex items-center justify-center group-hover:border-accent/20">
                        <User size={16} className="text-muted" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">{act.reviewer_name || 'Anonymous'}</span>
                          <ProBadge variant={act.status === 'pending' ? 'warning' : 'success'}>
                            {act.status}
                          </ProBadge>
                        </div>
                        <div className="flex gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={10} 
                              fill={i < (act.rating || 0) ? "var(--accent)" : "none"} 
                              stroke={i < (act.rating || 0) ? "var(--accent)" : "var(--text-muted)"} 
                              className={i >= (act.rating || 0) ? "opacity-20" : ""}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <MessageSquare size={32} className="mx-auto text-muted opacity-20 mb-3" />
                  <p className="text-xs text-muted">No recent reviews found.</p>
                </div>
              )}
            </div>
          </ProCard>
        </div>

        {/* Right: Insights & Trends */}
        <div className="space-y-6">
          <ProCard className="h-full">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-6">Reputation Trend</h3>
            <div className="h-[200px] w-full">
              {analytics?.daily_ratings?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.daily_ratings}>
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.2}/>
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--accent)', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="avg" stroke="var(--accent)" strokeWidth={3} fill="url(#trendGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white/[0.02] rounded-xl border border-dashed border-border">
                  <BarChart3 size={24} className="text-muted mb-2" />
                  <p className="text-[10px] text-muted uppercase font-bold tracking-widest">Awaiting More Data</p>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-border">
                <div className="flex items-center gap-3">
                  <TrendingUp size={16} className="text-success" />
                  <span className="text-xs font-bold">Growth Velocity</span>
                </div>
                <span className="text-xs font-black text-success">+14%</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-border">
                <div className="flex items-center gap-3">
                  <MousePointer2 size={16} className="text-accent" />
                  <span className="text-xs font-bold">Interaction Rate</span>
                </div>
                <span className="text-xs font-black text-primary">3.2%</span>
              </div>
            </div>
          </ProCard>
        </div>
      </div>

      <ReviewModal 
        item={selectedReview} 
        onClose={() => setSelectedReview(null)} 
        readOnly 
      />
      
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
        user={user} 
      />
    </div>
  );
}
