import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Command, ChevronRight, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { ExecutiveButton } from '../components/ExecutiveComponents';

export default function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await login(email, password);
    setLoading(false);
    if (error) {
      showToast({ title: 'Access Denied', desc: error.message, type: 'error' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 relative flex items-center justify-center p-6 font-body">
      
      {/* Executive Depth */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-indigo-900/10 blur-[150px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <Link to="/" className="flex flex-col items-center group">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(79,70,229,0.3)] group-hover:scale-105 transition-transform duration-300">
              <Command size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white tracking-tight">Sign in to ReplyIQ</h1>
            <p className="text-slate-500 mt-2 text-sm font-medium">Welcome back to your executive workspace.</p>
          </Link>
        </div>

        <div className="p-10 rounded-[32px] bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all font-body text-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center pl-1 pr-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                <Link to="/forgot-password" size="sm" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">Forgot Password?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all font-body text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="mt-2">
              <ExecutiveButton 
                type="submit" 
                variant="primary" 
                className="w-full h-14 text-base shadow-lg shadow-indigo-500/20"
                isLoading={loading}
                icon={ArrowRight}
              >
                Sign In
              </ExecutiveButton>
            </div>

          </form>
        </div>

        <div className="mt-8 text-center flex flex-col items-center gap-6">
          <p className="text-sm font-medium text-slate-500">
            Don't have an account? <Link to="/signup" className="text-white hover:text-indigo-400 transition-colors ml-1 font-bold">Start 14-day free trial</Link>
          </p>
          
          <div className="flex items-center gap-3 opacity-30">
            <div className="h-px w-8 bg-slate-800" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Secure Infrastructure</span>
            <div className="h-px w-8 bg-slate-800" />
          </div>
        </div>
      </motion.div>

    </div>
  );
}


