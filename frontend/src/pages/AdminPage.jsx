import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Activity, HardDrive, Search, Filter, MoreHorizontal, UserCheck, UserX } from 'lucide-react';
import { VanguardCard, VanguardStat, VanguardBadge, VanguardButton } from '../components/VanguardComponents';
import { api } from '../api/client';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Stagger variants for the bento grid
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    show: { opacity: 1, scale: 1 }
  };

  useEffect(() => {
    // In a real app, we'd fetch actual user data here
    // api.get('/admin/users').then(...)
    
    // Mock data for immersive visualization
    setUsers([
      { id: 'usr_01', email: 'commander@vanguard.io', role: 'root', joined: '2026-03-01', status: 'active' },
      { id: 'usr_02', email: 'agent.smith@matrix.net', role: 'admin', joined: '2026-03-15', status: 'active' },
      { id: 'usr_03', email: 'guest.beta@network.com', role: 'user', joined: '2026-04-02', status: 'suspended' },
    ]);
    setLoading(false);
  }, []);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-24"
    >
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-purple-400" size={24} />
            <h1 className="text-4xl font-display font-light text-white tracking-tight">System Core <span className="font-bold">Admin</span></h1>
          </div>
          <p className="text-white/40 mt-2 text-sm tracking-wide font-mono uppercase">Global Registry & Node Oversight</p>
        </div>
        <div className="flex gap-3">
          <VanguardButton variant="ghost" size="sm">Export Telemetry</VanguardButton>
          <VanguardButton variant="neon" size="sm">Emergency Lock</VanguardButton>
        </div>
      </div>

      {/* Real-time Health Hybrid (Stats + Visuals) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <VanguardStat label="Total Nodes" value="1,284" subValue="+12.4% vs last cycle" icon={Users} />
        <VanguardStat label="Neural Latency" value="24ms" subValue="Region: US-EAST-1" icon={Activity} delay={0.1} />
        <VanguardStat label="Synthesis Load" value="88%" subValue="Critical Threshold: 95%" icon={HardDrive} delay={0.2} />
        
        <VanguardCard className="flex flex-col justify-center p-6 bg-emerald-500/5 transition-all" delay={0.3}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Protocol Stable</span>
          </div>
          <p className="text-sm text-white/60">All backend clusters are operating within nominal Vanguard parameters.</p>
        </VanguardCard>
      </div>

      {/* User Management Hybrid (Table inside Glass) */}
      <VanguardCard className="p-0 border-white/5 overflow-hidden" delay={0.4}>
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/[0.02]">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
              type="text" 
              placeholder="Search user ID or email..."
              className="w-full bg-black/40 border border-white/10 rounded-full py-2.5 pl-12 pr-6 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-400/50 transition-all font-body"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <VanguardButton variant="ghost" size="sm" icon={Filter}>Filter</VanguardButton>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.03]">
                <th className="px-6 py-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">Profile</th>
                <th className="px-6 py-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">Registry Date</th>
                <th className="px-6 py-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center border border-white/10 font-bold text-white/80">
                        {user.email[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{user.email}</span>
                        <span className="text-[10px] font-mono text-white/30 uppercase tracking-tighter">{user.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <VanguardBadge variant={user.role === 'root' ? 'purple' : 'white'}>{user.role}</VanguardBadge>
                  </td>
                  <td className="px-6 py-5 text-sm text-white/40 font-mono">
                    {user.joined}
                  </td>
                  <td className="px-6 py-5">
                    <VanguardBadge variant={user.status === 'active' ? 'emerald' : 'purple'}>
                      {user.status}
                    </VanguardBadge>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                        <UserCheck size={16} />
                      </button>
                      <button className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-red-400 transition-colors">
                        <UserX size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </VanguardCard>
    </motion.div>
  );
}
