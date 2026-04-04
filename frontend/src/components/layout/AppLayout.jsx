import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { VanguardSidebar } from './VanguardSidebar';

/**
 * AppLayout - Vanguard V9 Edition
 * High-Efficiency SaaS format: Fixed left sidebar (VanguardSidebar)
 * with a scrolling main content area. Retains Vantablack/Opal textures.
 */
export const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="relative min-h-screen w-full bg-black flex overflow-hidden">
      
      {/* Background Orchestration */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900/10 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')] opacity-5 mix-blend-overlay" />
      </div>

      {/* Structural Sidebar */}
      <VanguardSidebar />

      {/* Primary Display Surface */}
      <main className="relative z-10 flex-1 h-screen overflow-y-auto px-4 md:px-10 py-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
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
