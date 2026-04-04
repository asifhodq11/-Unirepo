import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ExecutiveCard, ExecutiveStat, ExecutiveBadge, ExecutivePageHeader, ExecutiveEmptyState } from '../components/ExecutiveComponents';
import { ExecutiveGenerator } from '../components/ExecutiveGenerator';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { useToast } from '../hooks/useToast';
import { 
  RefreshCw, 
  LayoutGrid, 
  Activity, 
  MessageSquareQuote, 
  ShieldCheck, 
  Zap, 
  ArrowUpRight, 
  CheckCircle, 
  Clock 
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const intervalRef = useRef(null);
  
  useEffect(() => {
    fetchDashboardData();

    // GAP-004 FIX: Only poll when tab is visible to avoid wasting rate-limit budget.
    const startPolling = () => {
      intervalRef.current = setInterval(fetchDashboardData, 60000);
    };
    const stopPolling = () => {
      clearInterval(intervalRef.current);
    };
    const handleVisibility = () => {
      document.hidden ? stopPolling() : startPolling();
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsData, activityData] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/reviews/activity')
      ]);
      setStats(statsData);
      setActivity(activityData?.events || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post('/poller/trigger');
      // GAP-005 FIX: Show toast feedback so user knows sync started.
      showToast({ title: 'Sync Started', desc: 'Background scan initiated. Results will appear shortly.', type: 'success' });
      setTimeout(fetchDashboardData, 2000);
    } catch (err) {
      console.error('Sync failed:', err);
      showToast({ title: 'Sync Failed', desc: err.message || 'Could not initiate background scan.', type: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-8 w-full pb-20"
    >
      {/* Executive Action Header */}
      <ExecutivePageHeader 
        title="Executive Summary"
        subtitle={`Reviewing activity for ${user?.user_metadata?.business_name || user?.business_name || 'ReplyIQ Workspace'}`}
        label="System Status"
        icon={Activity}
        actions={
          <div className="flex items-center gap-4">
            <button 
              onClick={handleSync}
              disabled={syncing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-800 text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/5 active:scale-95 ${syncing ? 'opacity-50 grayscale' : 'text-slate-300'}`}
            >
              <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <div className="hidden md:flex flex-col items-end px-4 border-r border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Priority Queue</span>
              <span className="text-xl font-display font-medium text-indigo-400">{stats?.total_reviews || 0} Pending</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">System Health</span>
              <span className="text-xl font-display font-medium text-emerald-400">Optimal</span>
            </div>
          </div>
        }
      />

      {/* Main Grid Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Primary Workflow Module */}
        <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col">
          <ExecutiveGenerator />
        </motion.div>
        
        {/* Performance Sidebar */}
        <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 gap-4">
            <ExecutiveStat 
              label="Replies Generated" 
              value={stats?.total_replied?.toLocaleString() || '0'} 
              subValue={`${stats?.reply_rate || 0}% rate`} 
              icon={MessageSquareQuote} 
            />
            
            <ExecutiveStat 
              label="AI Accuracy Score" 
              value={stats?.avg_rating ? `${(stats.avg_rating * 20).toFixed(1)}%` : '98.4%'} 
              subValue={`${stats?.avg_rating || 0} stars`} 
              icon={ShieldCheck} 
            />
          </div>

          <ExecutiveCard className="p-6 bg-indigo-600/5 border-indigo-500/10 group" hover={false}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Zap size={20} />
              </div>
              <ExecutiveBadge variant="indigo">Pro Active</ExecutiveBadge>
            </div>
            <h3 className="text-lg font-display font-bold text-white mb-1">Billing Overview</h3>
            <p className="text-sm text-slate-400 mb-6 font-body">Your enterprise features are unlocked. Manage seats in settings.</p>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Usage Efficiency</span>
                <span>{stats?.total_replied || 0} / {stats?.total_reviews || 0}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-all duration-1000" 
                  style={{ width: `${stats?.reply_rate || 0}%` }}
                />
              </div>
            </div>
          </ExecutiveCard>

          {/* Activity Feed Snippet */}
          <ExecutiveCard className="flex-1 flex flex-col p-0 overflow-hidden" hover={false}>
            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LayoutGrid size={18} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">Recent Activity</h3>
              </div>
              <ArrowUpRight size={16} className="text-slate-500" />
            </div>
            <div className="flex-1 overflow-y-auto max-h-[300px] p-2">
              {activity.length > 0 ? (
                activity.map((event, idx) => (
                  <div key={event.id || idx} className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-colors group">
                    <div className={`mt-1 p-2 rounded-lg ${event.type === 'reply_sent' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                      {event.type === 'reply_sent' ? <CheckCircle size={14} /> : <Clock size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-300 font-medium truncate">{event.reviewer_name || 'Anonymous'}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{event.review_text || 'New review detected'}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 uppercase mt-1">
                      {new Date(event.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">No Recent Events</p>
                </div>
              )}
            </div>
          </ExecutiveCard>

        </motion.div>
      </div>

    </motion.div>
  );
};

export default DashboardPage;


