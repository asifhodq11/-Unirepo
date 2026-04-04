import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (session) {
        // High-fidelity redirect
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        navigate('/login');
      }
    }
  }, [session, loading, navigate]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
      
      {/* Immersive Loader Grid */}
      <div className="relative mb-12">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="absolute inset-0 bg-cyan-400 blur-[60px] opacity-20 rounded-full" 
        />
        <div className="w-24 h-24 rounded-3xl bg-white/[0.05] border border-white/10 flex items-center justify-center relative z-10 shadow-[0_0_40px_rgba(34,211,238,0.1)]">
          <Activity className="text-cyan-400 animate-pulse" size={40} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xs"
      >
        <h1 className="text-2xl font-display font-light text-white tracking-tight mb-3">Syncing Neural Link</h1>
        <p className="text-xs text-white/30 font-mono uppercase tracking-[0.3em] mb-8">Validating Registry Handshake</p>
        
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="h-full w-1/2 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          />
        </div>

        <div className="mt-12 flex items-center justify-center gap-2">
          <ShieldCheck className="text-emerald-400/50" size={14} />
          <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Secure Handover in Progress</span>
        </div>
      </motion.div>

    </div>
  );
}