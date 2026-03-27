import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Generate Reply', icon: '✨' },
  { to: '/history',   label: 'History',        icon: '📋' },
  { to: '/settings',  label: 'Settings',       icon: '⚙️' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const plan = user?.plan ?? 'free';
  const used = user?.reply_count_this_month ?? 0;
  const limit = plan === 'starter' ? 100 : 3;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const progressClass = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : '';

  return (
    <div className="app-layout">
      {/* ── Sidebar ─────────────────────── */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💬</div>
          <span className="sidebar-logo-name">ReplyIQ</span>
        </div>

        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-item-icon">{icon}</span>
            {label}
          </NavLink>
        ))}

        {/* ── Sidebar footer (harmonized spacing) ── */}
        <div className="sidebar-footer">
          {/* Usage meter — pre-allocated min-height to prevent collapse */}
          <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-3)', minHeight: '90px', contain: 'layout' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-2)' }}>
              <span className="text-xs text-muted">Replies this month</span>
              <span className="text-xs font-medium">{used}/{limit}</span>
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
                Upgrade to Starter ↗
              </button>
            )}
          </div>

          {/* User info — spacing: space-3 gaps (one step from space-4 above) */}
          <div style={{ padding: '0 var(--space-1)' }}>
            <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </p>
            <div className="flex items-center gap-2">
              <span className={`badge ${plan === 'starter' ? 'badge-accent' : 'badge-muted'}`}>
                {plan}
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
        <Outlet />
      </main>
    </div>
  );
}
