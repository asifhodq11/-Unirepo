import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ExecutiveSidebar } from './ExecutiveSidebar';

/**
 * AppLayout - ReplyIQ Executive
 * High-performance enterprise format: Fixed left sidebar (ExecutiveSidebar)
 * with a goal-oriented scrolling workspace.
 */
export const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="relative min-h-screen w-full bg-slate-950 flex overflow-hidden font-body">
      
      {/* Executive Depth Orchestration */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-slate-900/20 blur-[120px]" />
        {/* Subtle noise texture for premium depth */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')] opacity-[0.02] mix-blend-overlay" />
      </div>

      {/* Structural Navigation */}
      <ExecutiveSidebar />

      {/* High-Performance Workspace Surface */}
      <main className="relative z-10 flex-1 h-screen overflow-y-auto px-6 lg:px-12 py-10 custom-scrollbar scroll-smooth">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
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



