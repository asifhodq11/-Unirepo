import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, MessageSquareQuote, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VanguardCard, VanguardStat, VanguardBadge } from '../components/VanguardComponents';
import { VanguardGenerator } from '../components/VanguardGenerator';

const DashboardPage = () => {
  const { user } = useAuth();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.98, filter: 'blur(5px)' },
    show: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { type: "spring", stiffness: 100, damping: 20 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-6 w-full"
    >
      {/* Header Phase */}
      <motion.div variants={itemVariants} className="flex flex-col justify-between gap-1 mb-2">
        <div className="flex items-center gap-3 mb-1">
          <VanguardBadge variant="emerald">System Online</VanguardBadge>
        </div>
        <h1 className="text-3xl font-display font-bold text-white tracking-tight">
          Welcome back, {user?.user_metadata?.first_name || 'Admin'}
        </h1>
        <p className="text-white/40 text-sm tracking-wide">ReplyIQ SaaS Dashboard</p>
      </motion.div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Core Generator (Takes up large left section) */}
        <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col min-h-[480px]">
          <VanguardGenerator />
        </motion.div>
        
        {/* Analytics & Metrics Stack (Takes up right section) */}
        <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col gap-4">
          
          <VanguardStat 
            label="Replies Generated" 
            value="142" 
            subValue="Today's Volume" 
            icon={MessageSquareQuote} 
          />
          
          <VanguardStat 
            label="AI Accuracy Score" 
            value="98.4%" 
            subValue="Based on approvals" 
            icon={ShieldCheck} 
            delay={0.1}
          />

          <VanguardCard className="flex-1 flex flex-col justify-center items-center text-center p-6 bg-gradient-to-br from-purple-500/10 to-cyan-500/5 group" delay={0.2}>
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <Zap className="text-purple-400" size={20} />
            </div>
            <h3 className="text-base font-display text-white mb-1">Subscription Active</h3>
            <p className="text-xs text-white/40 leading-relaxed max-w-[200px]">Your API limits are unlocked for current billing cycle.</p>
          </VanguardCard>

        </motion.div>
      </div>

    </motion.div>
  );
};

export default DashboardPage;