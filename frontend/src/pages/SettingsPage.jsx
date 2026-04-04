import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Key, Sun, Moon, LogOut, Save, Settings as SettingsIcon, CreditCard, Zap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/useToast';
import { VanguardCard, VanguardButton, VanguardBadge } from '../components/VanguardComponents';

export default function SettingsPage() {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'general';

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
      showToast({ title: 'Profile Saved', desc: 'Account settings updated successfully.', type: 'success' });
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
        <h1 className="text-3xl font-display font-light text-white tracking-tight">System <span className="font-bold">Settings</span></h1>
        <p className="text-white/40 text-sm tracking-wide">Manage your account and billing</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 pb-1">
        <button 
          onClick={() => navigate('/settings')}
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'general' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-white/50 hover:text-white'}`}
        >
          General Options
        </button>
        <button 
          onClick={() => navigate('/settings?tab=billing')}
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === 'billing' ? 'border-purple-400 text-purple-400' : 'border-transparent text-white/50 hover:text-white'}`}
        >
          Subscription & Billing
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'general' && (
          <motion.div key="general" variants={itemVariants} initial="hidden" animate="show" exit="hidden" className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-7">
              <VanguardCard className="h-full flex flex-col gap-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/10"><User size={20} className="text-white" /></div>
                  <h2 className="text-xl font-display font-bold text-white">Profile Settings</h2>
                </div>
                
                <form onSubmit={handleUpdate} className="flex flex-col gap-5 border-none">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest pl-2">First Name</label>
                      <input 
                        type="text" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 transition-all font-body text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest pl-2">Last Name</label>
                      <input 
                        type="text" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl px-5 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 transition-all font-body text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest pl-2">Email Address (Read Only)</label>
                    <div className="w-full bg-[#0A0A0A]/50 border border-white/5 rounded-2xl px-5 py-3 text-white/40 font-mono text-xs cursor-not-allowed">
                      {user?.email}
                    </div>
                  </div>

                  <div className="mt-4">
                    <VanguardButton type="submit" variant="neon" isLoading={loading} icon={Save} className="w-full">
                      Save Changes
                    </VanguardButton>
                  </div>
                </form>
              </VanguardCard>
            </div>

            <div className="md:col-span-5 flex flex-col gap-6">
              {/* Theme Logic */}
              <VanguardCard className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                    {theme === 'dark' ? <Moon size={20} className="text-white" /> : <Sun size={20} className="text-white" />}
                  </div>
                  <h2 className="text-lg font-display font-bold text-white">Visual Theme</h2>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">Toggle between Dark Mode immersion or Light Mode states.</p>
                <VanguardButton variant="ghost" onClick={toggleTheme} className="w-full group">
                  {theme === 'dark' ? 'Enable Light Mode' : 'Enable Dark Mode'}
                </VanguardButton>
              </VanguardCard>

              {/* Destructive Actions */}
              <div className="mt-auto">
                <VanguardButton variant="danger" icon={LogOut} onClick={logout} className="w-full">
                  Sign Out
                </VanguardButton>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'billing' && (
          <motion.div key="billing" variants={itemVariants} initial="hidden" animate="show" exit="hidden" className="w-full">
            <VanguardCard className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 bg-gradient-to-br from-purple-900/10 to-transparent">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-400">
                    <Zap size={24} />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white">Pro Plan Active</h2>
                </div>
                <p className="text-white/60 text-sm">Your infrastructure limits are fully unlocked. Next billing cycle: <strong>May 1st, 2026</strong>.</p>
              </div>
              <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                <VanguardButton variant="neon" icon={CreditCard} className="w-full md:w-auto">
                  Manage Subscription
                </VanguardButton>
                <span className="text-[10px] font-mono text-white/30 tracking-widest uppercase">Via Stripe Portal</span>
              </div>
            </VanguardCard>

            <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest mt-10 mb-4 pl-2">Billing History</h3>
            <VanguardCard className="p-0 overflow-hidden border-white/10" hover={false}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/[0.02] border-b border-white/10">
                    <th className="px-6 py-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-right text-[10px] font-mono text-white/40 uppercase tracking-widest">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm text-white/80">April 1, 2026</td>
                    <td className="px-6 py-4 text-sm text-white font-mono">$49.00</td>
                    <td className="px-6 py-4"><VanguardBadge variant="emerald">Paid</VanguardBadge></td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-cyan-400 hover:text-cyan-300 text-xs uppercase tracking-wider font-mono">Download</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-sm text-white/80">March 1, 2026</td>
                    <td className="px-6 py-4 text-sm text-white font-mono">$49.00</td>
                    <td className="px-6 py-4"><VanguardBadge variant="emerald">Paid</VanguardBadge></td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-cyan-400 hover:text-cyan-300 text-xs uppercase tracking-wider font-mono">Download</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </VanguardCard>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}