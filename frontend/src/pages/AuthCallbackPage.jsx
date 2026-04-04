import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (session) {
        // Professional transition delay
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        navigate('/login');
      }
    }
  }, [session, loading, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-body relative overflow-hidden">
      
      {/* Executive Depth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-900/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <div className="relative mb-12 z-10">
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ repeat: Infinity, duration: 4 }}
          className="absolute inset-0 bg-indigo-600 blur-[60px] rounded-full" 
        />
        <div className="w-20 h-20 rounded-3xl bg-slate-900/40 border border-slate-800 flex items-center justify-center relative z-10 shadow-2xl backdrop-blur-xl">
          <Loader2 className="text-indigo-500 animate-spin" size={32} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xs relative z-10"
      >
        <h1 className="text-2xl font-display font-bold text-white tracking-tight mb-2">Establishing Connection</h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mb-10">Securing Workspace Identity</p>
        
        <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="h-full w-1/3 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          />
        </div>

        <div className="mt-12 flex items-center justify-center gap-2 opacity-40">
          <ShieldCheck className="text-indigo-400" size={14} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enterprise Infrastructure Ready</span>
        </div>
      </motion.div>

    </div>
  );
}



