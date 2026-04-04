import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, BrainCircuit, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VanguardCard, VanguardStat, VanguardBadge } from '../components/VanguardComponents';
import { VanguardGenerator } from '../components/VanguardGenerator';

const DashboardPage = () => {
  const { user } = useAuth();
  
  // Real layout parameters for Framer Motion stagger stagger
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
    show: { 
      opacity: 1, 
      scale: 1, 
      filter: 'blur(0px)',
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-8 w-full max-w-7xl mx-auto"
    >
      {/* Header Phase */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <VanguardBadge variant="purple">System Online</VanguardBadge>
            <span className="text-[10px] text-white/30 font-mono tracking-widest uppercase flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Secure Link
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-light text-white tracking-tight">
            Welcome back, <span className="font-bold">{user?.user_metadata?.first_name || 'Commander'}</span>
          </h1>
          <p className="text-white/40 mt-2 text-sm tracking-wide">ReplyIQ Synthesis Engine V2.0 is standing by.</p>
        </div>
      </motion.div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Core Generator (Takes up large left section) */}
        <motion.div variants={itemVariants} className="lg:col-span-8 min-h-[500px]">
          <VanguardGenerator />
        </motion.div>
        
        {/* Analytics & Metrics Stack (Takes up right section) */}
        <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col gap-6">
          
          <VanguardStat 
            label="Neural Output Today" 
            value="142" 
            subValue="Tokens Expended: ~1.2M" 
            icon={BrainCircuit} 
          />
          
          <VanguardStat 
            label="Response Efficacy" 
            value="98.4%" 
            subValue="Turing Compliance: High" 
            icon={ShieldCheck} 
            delay={0.1}
          />

          <VanguardCard className="flex-1 flex flex-col justify-center items-center text-center p-8 bg-gradient-to-br from-purple-500/10 to-cyan-500/5 group" delay={0.2}>
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500 shadow-[0_0_30px_rgba(192,132,252,0.2)]">
              <Zap className="text-purple-400" size={24} />
            </div>
            <h3 className="text-lg font-display text-white mb-2">Hyper-Scale Pending</h3>
            <p className="text-sm text-white/40">Your current infrastructure tier supports unlimited parallel synthesis.</p>
          </VanguardCard>

        </motion.div>
      </div>

    </motion.div>
  );
};

export default DashboardPage;