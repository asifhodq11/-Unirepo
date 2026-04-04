import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Copy, Globe, MessageSquare } from 'lucide-react';
import { VanguardCard, VanguardBadge } from '../components/VanguardComponents';
import { api } from '../api/client';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated fetch or real fetch
    api.get('/replies/history')
      .then(data => setHistory(data.items || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    // Fallback data for layout presentation if empty
    if (history.length === 0) {
      setHistory([
        { id: 1, original_review: "The food was cold but the service was okay.", generated_reply: "We are deeply sorry that your meal did not meet our temperature standards. We've spoken with our culinary team to ensure this isolated incident doesn't happen again. We'd love to invite you back to experience our true standard of excellence.", status: "synthesized", created_at: new Date().toISOString() },
        { id: 2, original_review: "Terrible experience, would not recommend.", generated_reply: "Thank you for your candid feedback. It is clear we fell short of delivering the experience you deserve. Our management team is currently reviewing your case to implement immediate operational adjustments.", status: "synthesized", created_at: new Date(Date.now() - 3600000).toISOString() }
      ]);
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20, filter: 'blur(10px)' },
    show: { opacity: 1, x: 0, filter: 'blur(0px)' }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="text-cyan-400" size={20} />
            <h1 className="text-3xl font-display font-light text-white tracking-tight">Generation <span className="font-bold">History</span></h1>
          </div>
          <p className="text-white/40 mt-1 text-sm tracking-wide">Recent AI Replies and Activity</p>
        </div>
      </div>

      {/* Grid List */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-4">
        {history.map((record, index) => (
          <motion.div key={record.id || index} variants={itemVariants}>
            <VanguardCard className="p-0 overflow-hidden border-white/10" hover={false}>
              
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr_auto] divide-y lg:divide-y-0 lg:divide-x divide-white/10">
                
                {/* Input Sector */}
                <div className="p-6 bg-[#0A0A0A]">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={14} className="text-purple-400" />
                    <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Customer Review</span>
                  </div>
                  <p className="text-white/80 text-sm leading-relaxed">&quot;{record.original_review}&quot;</p>
                </div>

                {/* Synthesis Sector */}
                <div className="p-6 relative bg-cyan-950/20">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400/50" />
                  <div className="flex items-center gap-2 mb-3">
                    <Globe size={14} className="text-cyan-400" />
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">AI Generated Reply</span>
                  </div>
                  <p className="text-white font-body text-sm leading-relaxed">{record.generated_reply}</p>
                </div>

                {/* Meta Sector */}
                <div className="p-6 flex flex-row lg:flex-col justify-between items-center lg:items-end gap-4 min-w-[160px]">
                  <div className="flex flex-col items-end gap-2">
                    <VanguardBadge variant="cyan">{record.status || 'Active'}</VanguardBadge>
                    <span className="text-[10px] font-mono text-white/30 hidden lg:block">
                      {new Date(record.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <button className="p-2 rounded border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-colors">
                    <Copy size={16} />
                  </button>
                </div>
                
              </div>
            </VanguardCard>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}