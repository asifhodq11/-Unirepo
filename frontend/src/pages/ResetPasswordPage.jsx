import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, Save, Command } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { VanguardButton } from '../components/VanguardComponents';

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return;
    setLoading(true);
    const { error } = await resetPassword(password);
    setLoading(false);
    
    if (error) {
      showToast({ title: 'System Error', desc: error.message, type: 'error' });
    } else {
      showToast({ title: 'Key Restored', desc: 'Secure access re-established.', type: 'success' });
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen w-full bg-black relative flex items-center justify-center p-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden sm:flex items-center justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-emerald-900/10 blur-[150px] mix-blend-screen" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <Command size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-light text-white tracking-tight">Terminal Reset</h1>
          <p className="text-white/30 text-[10px] font-mono tracking-widest uppercase mt-4">Establish New Authentication Key</p>
        </div>

        <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/10 backdrop-blur-3xl shadow-[0_24px_64px_-12px_rgba(0,0,0,0.8)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 border-none">
            
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest pl-2">New Protocol Key (Password)</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/50 transition-all font-body text-sm"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              />
            </div>

            <VanguardButton 
              type="submit" 
              variant="primary" 
              className="w-full !rounded-2xl !py-4"
              isLoading={loading}
              icon={Save}
            >
              Update Protocol Key
            </VanguardButton>

          </form>
        </div>
      </motion.div>
    </div>
  );
}
