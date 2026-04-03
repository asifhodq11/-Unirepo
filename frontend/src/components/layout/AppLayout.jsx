import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FloatingGenerator from '../FloatingGenerator';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, LayoutDashboard, Settings, MessageSquarePlus, 
  Shield, Plus, PanelLeftClose, PanelLeft, Search, Bell, LogOut, User
} from 'lucide-react';
import { getPlanLimit, getPlanLimitDisplay, PLAN_LABELS } from '../../utils/plans';
import ThemeToggle from '../ThemeToggle';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const plan = user?.plan ?? 'free';
  const used = user?.reply_count_this_month ?? 0;
  const limit = getPlanLimit(plan);
  const limitDisplay = getPlanLimitDisplay(plan);
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const progressClass = pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : '';

  const navItems = [
    { to: '/dashboard', label: 'Monitor', icon: Activity },
    { to: '/history',   label: 'History', icon: LayoutDashboard },
    { to: '/settings',  label: 'Settings', icon: Settings },
  ];

  if (user?.is_admin) {
    navItems.push({ to: '/admin', label: 'Admin', icon: Shield });
  }

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <div className="app-layout">
      {/* ── Sidebar (Professional Collapsible) ── */}
      {!isMobile && (
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-logo">
            <div className="flex items-center gap-3">
              <div className="sidebar-logo-icon">
                <MessageSquarePlus size={20} strokeWidth={2.5} />
              </div>
              {!isSidebarCollapsed && <span className="sidebar-logo-name font-semibold" style={{ color: 'var(--text-primary)' }}>ReplyIQ</span>}
            </div>
          </div>

          <div className="flex flex-col flex-1 mt-4">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                title={isSidebarCollapsed ? label : ''}
              >
                <div className="nav-item-icon"><Icon size={20} /></div>
                {!isSidebarCollapsed && <span style={{ flex: 1 }}>{label}</span>}
              </NavLink>
            ))}

            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="nav-item text-accent"
              style={{ border: 'none', background: 'transparent', width: 'auto' }}
              title={isSidebarCollapsed ? 'Draft New' : ''}
            >
              <div className="nav-item-icon" style={{ color: 'var(--accent)' }}>
                <Plus size={22} strokeWidth={3} />
              </div>
              {!isSidebarCollapsed && <span className="font-semibold" style={{ color: 'var(--accent)' }}>Draft New</span>}
            </button>
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-[var(--border-subtle)]">
            {!isSidebarCollapsed && (
              <div className="mb-4 px-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Quota Usage</span>
                  <span className="text-[10px] font-bold text-primary">{used}/{limitDisplay}</span>
                </div>
                <div className="progress-track" style={{ height: '4px' }}>
                  <div className={`progress-fill ${progressClass}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
            
            <button 
              onClick={toggleSidebar}
              className="nav-item m-0 p-0 hover:bg-transparent"
              style={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', background: 'transparent', border: 'none' }}
            >
              <div className="nav-item-icon">
                {isSidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
              </div>
              {!isSidebarCollapsed && <span className="text-xs">Collapse Sidebar</span>}
            </button>
          </div>
        </aside>
      )}

      {/* ── Main Container (Search Header + Content) ── */}
      <div className="main-container">
        {!isMobile && (
          <header className="action-header">
            <div className="header-search">
              <Search size={16} className="header-search-icon" />
              <input type="text" placeholder="Search reviews, history, or commands... (⌘K)" />
            </div>

            <div className="flex items-center gap-6">
              <ThemeToggle />
              <button className="text-muted hover:text-primary transition-colors" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <Bell size={20} />
              </button>
              <div className="h-6 w-[1px] bg-[rgba(255,255,255,0.1)]" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center overflow-hidden">
                  <User size={16} className="text-indigo-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-primary truncate max-w-[120px]">
                    {user?.email?.split('@')[0]}
                  </span>
                  <button onClick={logout} className="text-[10px] text-muted hover:text-danger flex items-center gap-1 transition-colors" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    <LogOut size={10} /> Logout
                  </button>
                </div>
              </div>
            </div>
          </header>
        )}

        <main className="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="page-content"
              style={{ width: '100%', height: '100%' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Mobile Floating Navigation ── */}
      {isMobile && !isGeneratorOpen && (
        <nav className="nav-floating-pill">
          {navItems.slice(0, 2).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-pill-item${isActive ? ' active' : ''}`}>
              <Icon className="nav-icon" size={24} />
              <span>{label}</span>
            </NavLink>
          ))}
          <button className="nav-pill-center" onClick={() => setIsGeneratorOpen(true)}>
            <Plus className="nav-icon" size={32} strokeWidth={2.5} />
          </button>
      {/* ── Global Quick Reply (Controlled) ── */}
      <FloatingGenerator 
        isOpen={isGeneratorOpen} 
        onClose={() => setIsGeneratorOpen(false)} 
      />
    </div>
  );
}
