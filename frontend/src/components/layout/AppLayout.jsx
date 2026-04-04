import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Command } from 'lucide-react';
import { ExecutiveSidebar } from './ExecutiveSidebar';

/**
 * AppLayout - ReplyIQ Executive
 * High-performance enterprise format: Fixed left sidebar (ExecutiveSidebar)
 * with a goal-oriented scrolling workspace.
 */
export const AppLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu on navigation
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen w-full bg-slate-950 flex flex-col lg:flex-row overflow-hidden font-body">
      
      {/* Executive Depth Orchestration */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-slate-900/20 blur-[120px]" />
        {/* Subtle noise texture for premium depth */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')] opacity-[0.02] mix-blend-overlay" />
      </div>

      {/* Mobile Top Navigation */}
      <div className="lg:hidden relative z-[60] flex items-center justify-between px-6 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-[0_0_10px_rgba(79,70,229,0.3)]">
            <Command className="text-white" size={16} />
          </div>
          <span className="text-white font-display font-bold tracking-tight text-lg">ReplyIQ</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] lg:hidden"
            />
            <motion.div 
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-64 z-[80] lg:hidden"
            >
              <ExecutiveSidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Structural Desktop Navigation */}
      <div className="relative z-50 h-screen hidden lg:block">
        <ExecutiveSidebar />
      </div>

      {/* High-Performance Workspace Surface */}
      <main className="relative z-10 flex-1 h-screen overflow-y-auto px-6 lg:px-12 py-10 lg:py-16 custom-scrollbar scroll-smooth">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

    </div>
  );
};

export default AppLayout;



