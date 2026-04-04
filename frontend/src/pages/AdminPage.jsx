import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Activity, HardDrive, Search, Filter, MoreHorizontal, UserCheck, UserX, Download, Settings2, Zap } from 'lucide-react';
import { ExecutiveCard, ExecutiveStat, ExecutiveBadge, ExecutiveButton } from '../components/ExecutiveComponents';
import { api } from '../api/client';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  useEffect(() => {
    // Mock data for immersive visualization
    setUsers([
      { id: 'usr_01', email: 'executive.admin@replyiq.io', role: 'Super Admin', joined: 'Mar 01, 2026', status: 'active' },
      { id: 'usr_02', email: 'operations.lead@enterprise.net', role: 'Admin', joined: 'Mar 15, 2026', status: 'active' },
      { id: 'usr_03', email: 'trial.user@standard.tech', role: 'Member', joined: 'Apr 02, 2026', status: 'pending' },
    ]);
    setLoading(false);
  }, []);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-32"
    >
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="text-indigo-400" size={18} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Administrative Console</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">System Administration</h1>
          <p className="text-slate-400 text-sm">Managing enterprise infrastructure and member permissions.</p>
        </div>
        <div className="flex gap-3">
          <ExecutiveButton variant="ghost" size="sm" icon={Download}>Export CSV</ExecutiveButton>
          <ExecutiveButton variant="primary" size="sm" icon={Settings2}>Global Config</ExecutiveButton>
        </div>
      </div>

      {/* Real-time Health Hybrid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ExecutiveStat label="Active Seats" value="482" subValue="+4% this week" icon={Users} />
        <ExecutiveStat label="API Performance" value="18ms" subValue="99.9% Up-time" icon={Activity} />
        <ExecutiveStat label="Data Throughput" value="1.2TB" subValue="82% Capacity" icon={HardDrive} />
        
        <ExecutiveCard className="flex flex-col justify-center p-6 bg-indigo-500/5 group" hover={false}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Normal Operations</span>
          </div>
          <p className="text-sm text-slate-400">All system services are operational across all regions.</p>
        </ExecutiveCard>
      </div>

      {/* User Management Module */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-display font-bold text-white">Member Directory</h2>
          <ExecutiveBadge variant="indigo">{users.length} Total Members</ExecutiveBadge>
        </div>

        <ExecutiveCard className="p-0 border-slate-800/80 overflow-hidden" hover={false}>
          <div className="p-5 border-b border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900/40">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Lookup user by email or ID..."
                className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-2 pl-12 pr-6 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-all font-body"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <ExecutiveButton variant="ghost" size="sm" icon={Filter} className="border border-slate-700/50 h-10 px-4">Filters</ExecutiveButton>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800/60">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest uppercase">Member Profile</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest uppercase">Authorization</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest uppercase">Join Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest uppercase">System Status</th>
                  <th className="px-6 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-indigo-600/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700 font-bold text-indigo-400 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-colors">
                          {user.email[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-200">{user.email}</span>
                          <span className="text-[10px] font-medium text-slate-600 uppercase tracking-tighter mt-0.5">{user.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <ExecutiveBadge variant={user.role === 'Super Admin' ? 'indigo' : 'white'}>{user.role}</ExecutiveBadge>
                    </td>
                    <td className="px-6 py-5 text-[xs] text-slate-400 font-medium">
                      {user.joined}
                    </td>
                    <td className="px-6 py-5">
                      <ExecutiveBadge variant={user.status === 'active' ? 'emerald' : 'indigo'}>
                        {user.status}
                      </ExecutiveBadge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors">
                          <UserCheck size={16} />
                        </button>
                        <button className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors">
                          <UserX size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ExecutiveCard>
      </div>
    </motion.div>
  );
}



