import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw, Command, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { ExecutiveButton } from '../components/ExecutiveComponents';

export default function VerifyEmailPage() {
  const { resendVerification } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    const { error } = await resendVerification();
    setLoading(false);
    
    if (error) {
      showToast({ title: 'Resend Failed', desc: error.message, type: 'error' });
    } else {
      showToast({ title: 'Email Sent', desc: 'A new verification link has been dispatched.', type: 'success' });
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(79,70,229,0.3)]">
            <Mail size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Verify your email</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Check your inbox to activate your workspace.</p>
        </div>

        <div className="p-10 rounded-[32px] bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl shadow-2xl shadow-black/50 w-full text-center">
          <p className="text-sm font-medium text-slate-400 mb-8 leading-relaxed">
            We've sent a secure verification link to your email address. Please click the link to confirm your identity and unlock full executive access.
          </p>
          
          <div className="flex flex-col gap-4">
            <ExecutiveButton 
              onClick={handleResend}
              variant="primary" 
              className="w-full h-14 text-base shadow-lg shadow-indigo-500/20"
              isLoading={loading}
              icon={Send}
            >
              Resend Link
            </ExecutiveButton>
            
            <Link to="/login">
              <ExecutiveButton variant="outline" className="w-full h-14 text-base border-slate-800 hover:bg-slate-900">
                Back to Sign In
              </ExecutiveButton>
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-2 opacity-30">
            <ShieldCheck className="text-indigo-400" size={14} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Company Infrastructure V2.5
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
