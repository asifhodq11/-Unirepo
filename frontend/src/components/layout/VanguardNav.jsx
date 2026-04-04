import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, History, Settings, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const VanguardNav = () => {
  const { logout } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Command' },
    { to: '/history', icon: History, label: 'Neural Feed' },
    { to: '/settings', icon: Settings, label: 'System' },
  ];

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.5 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
    >
      {/* Floating Glass Pill */}
      <div className="pointer-events-auto flex items-center gap-2 p-2 rounded-full bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
        
        {/* Nav Links */}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              group relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300
              ${isActive ? 'text-white' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="text-xs font-bold tracking-widest uppercase hidden md:block">
                  {item.label}
                </span>
                
                {/* Active Indicator Glow */}
                {isActive && (
                  <motion.div 
                    layoutId="activeNavPulse"
                    className="absolute inset-0 bg-white/10 rounded-full"
                    transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
                  />
                )}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="w-[1px] h-8 bg-white/10 mx-2" />

        {/* Action Button */}
        <button 
          onClick={() => { /* Trigger Master Action */ }}
          className="relative flex items-center justify-center p-3 rounded-full bg-white text-black hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all duration-300"
          title="New Generation"
        >
          <Zap size={18} className="fill-current" />
        </button>

        {/* Logout */}
        <button 
          onClick={logout}
          className="p-3 ml-1 rounded-full text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300"
          title="Disconnect Sequence"
        >
          <LogOut size={18} />
        </button>
      </div>
    </motion.div>
  );
};
