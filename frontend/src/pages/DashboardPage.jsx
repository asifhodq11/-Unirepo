import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, MessageSquareQuote, ShieldCheck, Zap, ArrowUpRight, Clock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ExecutiveCard, ExecutiveStat, ExecutiveBadge } from '../components/ExecutiveComponents';
import { ExecutiveGenerator } from '../components/ExecutiveGenerator';

const DashboardPage = () => {
  const { user } = useAuth();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-8 w-full pb-20"
    >
      {/* Executive Action Header */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">System Status</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">
            Executive Summary
          </h1>
          <p className="text-slate-400 text-sm">Reviewing activity for {user?.email_metadata?.business_name || 'ReplyIQ Workspace'}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end px-4 border-r border-slate-800">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Priority Queue</span>
            <span className="text-xl font-display font-medium text-indigo-400">12 Pending</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">System Health</span>
            <span className="text-xl font-display font-medium text-emerald-400">Optimal</span>
          </div>
        </div>
      </motion.div>

      {/* Main Grid Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Primary Workflow Module */}
        <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col">
          <ExecutiveGenerator />
        </motion.div>
        
        {/* Performance Sidebar */}
        <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 gap-4">
            <ExecutiveStat 
              label="Replies Generated" 
              value="1,284" 
              subValue="+12.5%" 
              icon={MessageSquareQuote} 
            />
            
            <ExecutiveStat 
              label="AI Accuracy Score" 
              value="99.2%" 
              subValue="+0.4%" 
              icon={ShieldCheck} 
            />
          </div>

          <ExecutiveCard className="p-6 bg-indigo-600/5 border-indigo-500/10 group" hover={false}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <Zap size={20} />
              </div>
              <ExecutiveBadge variant="indigo">Pro Active</ExecutiveBadge>
            </div>
            <h3 className="text-lg font-display font-bold text-white mb-1">Billing Overview</h3>
            <p className="text-sm text-slate-400 mb-6 font-body">Your enterprise features are unlocked. Next cycle begins May 1st.</p>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Usage (Current Month)</span>
                <span>8.4k / 10k</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="w-[84%] h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.3)]" />
              </div>
            </div>
          </ExecutiveCard>

        </motion.div>
      </div>

    </motion.div>
  );
};

export default DashboardPage;


