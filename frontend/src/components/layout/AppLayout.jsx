import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FloatingGenerator from '../FloatingGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, LayoutDashboard, Settings, MessageSquarePlus } from 'lucide-react';
import { getPlanLimit, getPlanLimitDisplay, PLAN_LABELS } from '../../utils/plans';
import ThemeToggle from '../ThemeToggle';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',  icon: Activity },
  { to: '/history',   label: 'History',   icon: LayoutDashboard },
  { to: '/settings',  label: 'Settings',  icon: Settings },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const plan = user?.plan ?? 'free';
  const used = user?.reply_count_this_month ?? 0;
  const limit = getPlanLimit(plan);
  const limitDisplay = getPlanLimitDisplay(plan);
  const pct = plan === 'pro' ? Math.min(100, Math.round((used / 200) * 100)) : Math.min(100, Math.round((used / limit) * 100));
  const progressClass = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : '';

  return (
    <div className="app-layout">
      {/* ── Sidebar ─────────────────────── */}
      <nav className="sidebar">
        <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div className="sidebar-logo-icon"><MessageSquarePlus size={20} /></div>
            <span className="sidebar-logo-name">ReplyIQ</span>
          </div>
          <ThemeToggle />
        </div>

        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-item-icon"><Icon size={18} strokeWidth={2.5} /></span>
            {label}
          </NavLink>
        ))}

        {/* ── Sidebar footer ── */}
        <div className="sidebar-footer">
          {/* Usage meter */}
          <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-3)', minHeight: '90px', contain: 'layout' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2)' }}>
              <span className="text-xs text-muted">Replies this month</span>
              <span className="text-xs font-medium">{used}/{limitDisplay}</span>
            </div>
            <div className="progress-track">
              <div
                className={`progress-fill ${progressClass}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {plan === 'free' && (
              <button
                className="btn btn-primary btn-sm btn-full"
                style={{ marginTop: 'var(--space-3)' }}
                onClick={() => navigate('/settings')}
              >
                Upgrade Plan
              </button>
            )}
          </div>

          {/* User info */}
          <div style={{ padding: '0 var(--space-1)' }}>
            <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
            <div className="flex items-center gap-2">
              <span className={`badge ${
                plan === 'pro' ? 'badge-success' :
                plan === 'starter' ? 'badge-accent' : 'badge-muted'
              }`}>
                {PLAN_LABELS[plan] || plan}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={logout} style={{ padding: 'var(--space-1) var(--space-2)' }}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main content ────────────────── */}
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            style={{ width: '100%', height: '100%' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Mobile Bottom Navigation ─────── */}
      <nav className="bottom-nav" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item-bottom${isActive ? ' active' : ''}`}
          >
            <Icon className="nav-icon" size={24} strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Global Floating Quick Reply ── */}
      <FloatingGenerator />
    </div>
  );
}
