import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Key, Sun, Moon, LogOut, Save, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/useToast';
import { VanguardCard, VanguardButton, VanguardBadge } from '../components/VanguardComponents';

export default function SettingsPage() {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await updateProfile({ first_name: firstName, last_name: lastName });
    setLoading(false);
    
    if (error) {
      showToast({ title: 'Update Failed', desc: error.message, type: 'error' });
    } else {
      showToast({ title: 'Profile Synchronized', desc: 'Neural registry updated successfully.', type: 'success' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full max-w-4xl mx-auto flex flex-col gap-8 pb-32"
    >
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-display font-light text-white tracking-tight">System Configuration</h1>
        <p className="text-white/40 text-sm tracking-wide font-mono uppercase">User Node Settings & Security</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Profile Synthesis Section */}
        <motion.div variants={itemVariants} className="md:col-span-7">
          <VanguardCard className="h-full flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10"><User size={20} className="text-white" /></div>
              <h2 className="text-xl font-display font-bold text-white">Neural Identity</h2>
            </div>
            
            <form onSubmit={handleUpdate} className="flex flex-col gap-5 border-none">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest pl-2">First Designation</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 transition-all font-body text-sm"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest pl-2">Last Designation</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 transition-all font-body text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest pl-2">Network ID (ReadOnly)</label>
                <div className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-3 text-white/40 font-mono text-xs cursor-not-allowed">
                  {user?.email}
                </div>
              </div>

              <div className="mt-4">
                <VanguardButton type="submit" variant="neon" isLoading={loading} icon={Save} className="w-full">
                  Commit Changes
                </VanguardButton>
              </div>
            </form>
          </VanguardCard>
        </motion.div>

        {/* Global Tokens & Toggles */}
        <motion.div variants={itemVariants} className="md:col-span-5 flex flex-col gap-6">
          
          {/* Theme Logic */}
          <VanguardCard className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                {theme === 'dark' ? <Moon size={20} className="text-white" /> : <Sun size={20} className="text-white" />}
              </div>
              <h2 className="text-lg font-display font-bold text-white">Visual Matrix</h2>
            </div>
            <p className="text-xs text-white/40 leading-relaxed">Toggle between high-intensity Vantablack immersion or Opal Glass light states.</p>
            <VanguardButton variant="ghost" onClick={toggleTheme} className="w-full group">
              {theme === 'dark' ? 'Initialize Opal Matrix' : 'Activate Vantablack'}
            </VanguardButton>
          </VanguardCard>

          {/* API Access Key (Dummy/State) */}
          <VanguardCard className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10"><Key size={20} className="text-white" /></div>
              <h2 className="text-lg font-display font-bold text-white">Gateway Link</h2>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Public Key</span>
              <VanguardBadge variant="purple">Active</VanguardBadge>
            </div>
            <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-mono text-cyan-400/50 truncate">
              VNGD_PRO_2026_XXXXXXXXXXXXXXXXXXXX
            </div>
            <VanguardButton variant="ghost" size="sm" className="w-full">Regenerate Link</VanguardButton>
          </VanguardCard>

          {/* Destructive Actions */}
          <div className="mt-auto">
            <VanguardButton variant="danger" icon={LogOut} onClick={logout} className="w-full">
              Terminate Session
            </VanguardButton>
            <button className="w-full text-[10px] font-mono text-red-500/30 hover:text-red-500/60 uppercase tracking-[0.3em] mt-6 transition-colors">
              Eradicate Profile Permanently
            </button>
          </div>

        </motion.div>
      </div>

    </motion.div>
  );
}