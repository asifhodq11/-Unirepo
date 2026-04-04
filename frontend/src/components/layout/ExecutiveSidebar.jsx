import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  History, 
  CheckCircle, 
  CreditCard,
  Settings, 
  ShieldCheck,
  LogOut,
  Command
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/history', icon: History, label: 'Review History' },
  { path: '/approvals', icon: CheckCircle, label: 'Approvals' },
];

const SYS_ITEMS = [
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/settings?tab=billing', icon: CreditCard, label: 'Billing & Plan' },
];

export const ExecutiveSidebar = () => {
  const { signOut, isAdmin, user } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-64 h-screen flex flex-col bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/60 sticky top-0 left-0 z-50">
      {/* Brand Header */}
      <div className="p-6 h-20 flex items-center border-b border-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(79,70,229,0.3)]">
            <Command className="text-white" size={16} />
          </div>
          <span className="text-white font-display font-bold tracking-tight text-lg">ReplyIQ</span>
        </div>
      </div>

      {/* Navigation Space */}
      <nav className="flex-1 px-4 py-8 space-y-9 overflow-y-auto custom-scrollbar">
        
        {/* Core Tools */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-3 mb-4">Operations</h3>
          <ul className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink to={item.path} className="relative block group">
                    <div className={`relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'}`}>
                      {isActive && (
                        <motion.div 
                          layoutId="activeNav"
                          className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-full"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <Icon size={18} className={isActive ? 'text-indigo-400 ml-2' : 'text-slate-500 group-hover:text-slate-300'} />
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
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-3 mb-4">Management</h3>
          <ul className="space-y-1.5">
            {SYS_ITEMS.map((item) => {
              const isActive = location.pathname + location.search === item.path || (location.pathname === item.path && !item.path.includes('?'));
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink to={item.path} className="relative block group">
                    <div className={`relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/10 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'}`}>
                      {isActive && (
                        <motion.div 
                          layoutId="activeNav"
                          className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-full"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                      <Icon size={18} className={isActive ? 'text-indigo-400 ml-2' : 'text-slate-500 group-hover:text-slate-300'} />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </NavLink>
                </li>
              );
            })}
            
            {isAdmin && (
              <li>
                <NavLink to="/admin" className="relative block group">
                  <div className={`relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${location.pathname === '/admin' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'}`}>
                    {location.pathname === '/admin' && (
                      <motion.div 
                         layoutId="activeNav"
                         className="absolute left-0 w-1 h-5 bg-indigo-500 rounded-full"
                         transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <ShieldCheck size={18} className={location.pathname === '/admin' ? 'text-indigo-400 ml-2' : 'text-slate-500 group-hover:text-slate-300'} />
                    <span className="text-sm font-medium">Admin Panel</span>
                  </div>
                </NavLink>
              </li>
            )}
          </ul>
        </div>

      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800/40 bg-slate-950/50">
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60 shadow-sm">
          <div className="flex flex-col truncate pr-2">
            <span className="text-[11px] font-bold text-slate-100 truncate">{user?.email || 'Guest Manager'}</span>
            <span className="text-[10px] text-slate-500 font-medium">Authenticated</span>
          </div>
          <button 
            onClick={signOut}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};



