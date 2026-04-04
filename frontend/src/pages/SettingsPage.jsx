import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Key, Sun, Moon, LogOut, Save, Settings as SettingsIcon, CreditCard, Zap, CheckCircle2, History as HistoryIcon, ShieldCheck, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks/useToast';
import { ExecutiveCard, ExecutiveButton, ExecutiveBadge } from '../components/ExecutiveComponents';

export default function SettingsPage() {
  const { user, logout, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'profile';

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
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-32"
    >
      {/* Executive Header */}
      <div className="flex flex-col gap-1 border-b border-slate-800/60 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <SettingsIcon className="text-indigo-400" size={18} />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Workspace Configuration</span>
        </div>
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">Account & Workspace</h1>
        <p className="text-slate-400 text-sm">Managing your professional identity and subscription status.</p>
      </div>

      {/* Modern Tabs */}
      <div className="flex gap-8 border-b border-slate-800/60 transition-all">
        <button 
          onClick={() => navigate('/settings?tab=profile')}
          className={`pb-4 px-1 text-sm font-semibold transition-all relative ${activeTab === 'profile' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Profile Information
          {activeTab === 'profile' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />}
        </button>
        <button 
          onClick={() => navigate('/settings?tab=subscription')}
          className={`pb-4 px-1 text-sm font-semibold transition-all relative ${activeTab === 'subscription' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Billing & Subscription
          {activeTab === 'subscription' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div key="profile" variants={itemVariants} initial="hidden" animate="show" exit="hidden" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              <ExecutiveCard className="h-full flex flex-col gap-8 p-8 border-slate-800/80 bg-slate-900/20" hover={false}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20"><User size={24} className="text-indigo-400" /></div>
                  <div>
                    <h2 className="text-xl font-display font-bold text-white">Identity Details</h2>
                    <p className="text-xs text-slate-500">Update your public name and representative metadata.</p>
                  </div>
                </div>
                
                <form onSubmit={handleUpdate} className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">First Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Alexander"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all font-body text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Last Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Hamilton"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 placeholder:text-slate-700 focus:outline-none focus:border-indigo-500/50 transition-all font-body text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Corporate Email</label>
                    <div className="flex items-center gap-3 w-full bg-slate-950/40 border border-slate-800/40 rounded-lg px-4 py-2.5 text-slate-500 font-medium text-sm cursor-not-allowed">
                      <Mail size={14} className="opacity-50" />
                      {user?.email}
                      <ExecutiveBadge variant="white" className="ml-auto text-[8px]">Verified</ExecutiveBadge>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/60">
                    <ExecutiveButton type="submit" variant="primary" isLoading={loading} icon={Save} className="w-full md:w-auto px-10">
                      Update Profile
                    </ExecutiveButton>
                  </div>
                </form>
              </ExecutiveCard>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Security Status */}
              <ExecutiveCard className="p-6 border-slate-800/80 bg-slate-900/20" hover={false}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <ShieldCheck size={20} className="text-emerald-400" />
                  </div>
                  <h3 className="font-display font-bold text-white text-sm">Security Matrix</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">MFA Status</span>
                    <span className="text-emerald-400 font-bold">Enabled</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Last Password Change</span>
                    <span className="text-slate-300">14 days ago</span>
                  </div>
                </div>
              </ExecutiveCard>

              {/* Theme Selection */}
              <ExecutiveCard className="p-6 border-slate-800/80 bg-slate-900/20" hover={false}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                    {theme === 'dark' ? <Moon size={18} className="text-slate-300" /> : <Sun size={18} className="text-indigo-400" />}
                  </div>
                  <h3 className="font-display font-bold text-white text-sm">Visual Mode</h3>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">Switch between immersive dark or light states.</p>
                <ExecutiveButton variant="outline" size="sm" onClick={toggleTheme} className="w-full text-[11px] h-9 border-slate-800 hover:bg-slate-800">
                  Toggle {theme === 'dark' ? 'Light' : 'Dark'} Mode
                </ExecutiveButton>
              </ExecutiveCard>

              <div className="mt-auto">
                <ExecutiveButton variant="ghost" icon={LogOut} onClick={logout} className="w-full text-slate-500 hover:text-red-400 hover:bg-red-500/5">
                  Sign Out of Session
                </ExecutiveButton>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'subscription' && (
          <motion.div key="subscription" variants={itemVariants} initial="hidden" animate="show" exit="hidden" className="w-full flex flex-col gap-8">
            <ExecutiveCard className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 p-10 bg-indigo-600/5 border-indigo-500/20 relative overflow-hidden" hover={false}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-3">
                  <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400">
                    <Zap size={32} />
                  </div>
                  <div>
                    <ExecutiveBadge variant="indigo" className="mb-1">Active Enterprise Plan</ExecutiveBadge>
                    <h2 className="text-3xl font-display font-bold text-white">ReplyIQ Premium</h2>
                  </div>
                </div>
                <p className="text-slate-400 text-sm max-w-md">Your executive workspace is fully active with unlimited AI generation and GBP API priority access. Next cycle: <span className="text-slate-200 font-bold">May 01, 2026</span></p>
              </div>
              
              <div className="flex flex-col items-end gap-3 w-full md:w-auto relative z-10">
                <ExecutiveButton variant="primary" icon={CreditCard} className="w-full md:w-auto px-8 h-12 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  Stripe Billing Portal
                </ExecutiveButton>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  PCI Compliance Secure
                </div>
              </div>
            </ExecutiveCard>

            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-display font-bold text-white px-1">Transaction History</h3>
              <ExecutiveCard className="p-0 overflow-hidden border-slate-800/80" hover={false}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/40 border-b border-slate-800/60">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Billing Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 bg-slate-950/20">
                    <tr className="hover:bg-indigo-500/5 transition-colors">
                      <td className="px-6 py-5 text-sm font-medium text-slate-300">April 01, 2026</td>
                      <td className="px-6 py-5 text-sm text-slate-500">Enterprise Plan Monthly Cycle</td>
                      <td className="px-6 py-5 text-sm text-white font-bold">$49.00 USD</td>
                      <td className="px-6 py-5 text-right">
                        <ExecutiveButton variant="ghost" size="sm" className="text-xs h-8 px-3 border border-slate-800">PDF</ExecutiveButton>
                      </td>
                    </tr>
                    <tr className="hover:bg-indigo-500/5 transition-colors">
                      <td className="px-6 py-5 text-sm font-medium text-slate-300">March 01, 2026</td>
                      <td className="px-6 py-5 text-sm text-slate-500">Enterprise Plan Monthly Cycle</td>
                      <td className="px-6 py-5 text-sm text-white font-bold">$49.00 USD</td>
                      <td className="px-6 py-5 text-right">
                        <ExecutiveButton variant="ghost" size="sm" className="text-xs h-8 px-3 border border-slate-800">PDF</ExecutiveButton>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ExecutiveCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


