import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Activity, 
  CheckCircle, 
  CreditCard,
  Settings, 
  ShieldAlert,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/history', icon: Activity, label: 'Neural Feed' },
  { path: '/approvals', icon: CheckCircle, label: 'Approvals' },
];

const SYS_ITEMS = [
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/settings?tab=billing', icon: CreditCard, label: 'Subscription' },
];

export const VanguardSidebar = () => {
  const { signOut, isAdmin, user } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-72 h-screen flex flex-col bg-black/90 border-r border-white/10 backdrop-blur-3xl sticky top-0 left-0 z-50">
      {/* Brand Header */}
      <div className="p-6 h-20 flex items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-cyan-400/20 blur-md" />
            <span className="text-cyan-400 font-bold text-sm relative z-10">IQ</span>
          </div>
          <span className="text-white font-semibold tracking-wider uppercase text-sm">Vanguard<span className="text-cyan-400">.</span></span>
        </div>
      </div>

      {/* Navigation Space */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto custom-scrollbar">
        
        {/* Core Tools */}
        <div>
          <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-widest pl-3 mb-3">Core Systems</h3>
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink to={item.path} className="relative block group">
                    {isActive && (
                      <motion.div 
                        layoutId="active-nav"
                        className="absolute inset-0 bg-white/5 rounded-lg border border-white/10"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    <div className={`relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white group-hover:bg-white/5'}`}>
                      <Icon size={18} className={isActive ? 'text-cyan-400' : 'text-white/40'} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Administration & Config */}
        <div>
          <h3 className="text-[10px] font-mono text-white/40 uppercase tracking-widest pl-3 mb-3">Configuration</h3>
          <ul className="space-y-1">
            {SYS_ITEMS.map((item) => {
              // Exact match for query params if any
              const isActive = location.pathname + location.search === item.path || (location.pathname === item.path && !item.path.includes('?'));
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink to={item.path} className="relative block group">
                     {isActive && (
                      <motion.div 
                        layoutId="active-nav"
                        className="absolute inset-0 bg-white/5 rounded-lg border border-white/10"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    <div className={`relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white group-hover:bg-white/5'}`}>
                      <Icon size={18} className={isActive ? 'text-purple-400' : 'text-white/40'} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </NavLink>
                </li>
              );
            })}
            {isAdmin && (
              <li>
                <NavLink to="/admin" className="relative block group">
                  {location.pathname === '/admin' && (
                    <motion.div 
                      layoutId="active-nav"
                      className="absolute inset-0 bg-red-900/10 rounded-lg border border-red-500/20"
                      transition={{ duration: 0.2 }}
                    />
                  )}
                  <div className={`relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${location.pathname === '/admin' ? 'text-red-400' : 'text-white/60 group-hover:text-red-300 group-hover:bg-red-950/20'}`}>
                    <ShieldAlert size={18} className={location.pathname === '/admin' ? 'text-red-500' : 'text-white/40'} />
                    <span className="text-sm font-medium">Overwatch (Admin)</span>
                  </div>
                </NavLink>
              </li>
            )}
          </ul>
        </div>

      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-white/5 bg-black/50">
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <div className="flex flex-col truncate pr-2">
            <span className="text-xs font-semibold text-white truncate">{user?.email || 'Vanguard Agent'}</span>
            <span className="text-[10px] text-white/50 font-mono">SYS.VERIFIED</span>
          </div>
          <button 
            onClick={signOut}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0"
            title="Terminate Session"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
