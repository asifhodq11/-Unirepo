import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle, RefreshCw, Command } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { VanguardButton } from '../components/VanguardComponents';

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
      showToast({ title: 'Resend Successful', desc: 'A new transmission has been dispatched.', type: 'success' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-black relative flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden sm:flex items-center justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-cyan-900/10 blur-[150px] mix-blend-screen" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <Mail size={32} className="text-cyan-400" />
          </div>
          <h1 className="text-3xl font-display font-light text-white tracking-tight">Endpoint Validation</h1>
          <p className="text-white/30 text-[10px] font-mono tracking-widest uppercase mt-4 mb-8">Access Restricted - Verification Pending</p>
          
          <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/10 backdrop-blur-3xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] w-full">
            <p className="text-sm font-body text-white/60 mb-8 leading-relaxed">
              We've dispatched an authentication sequence to your registered endpoint. Please validate the transmission to establish a secure link with the Vanguard network.
            </p>
            
            <div className="flex flex-col gap-4">
              <VanguardButton 
                onClick={handleResend}
                variant="neon" 
                className="w-full !rounded-2xl !py-4"
                isLoading={loading}
                icon={RefreshCw}
              >
                Re-dispatch Sequence
              </VanguardButton>
              
              <Link to="/login">
                <VanguardButton variant="ghost" className="w-full !rounded-2xl !py-4">
                  Return to Node Access
                </VanguardButton>
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">
          Vanguard Synthesis Protocol v2.5
        </div>
      </motion.div>
    </div>
  );
}
