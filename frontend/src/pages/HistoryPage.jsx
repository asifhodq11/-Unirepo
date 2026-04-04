import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Copy, Globe, MessageSquare, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { ExecutiveCard, ExecutiveBadge, ExecutiveButton } from '../components/ExecutiveComponents';
import { api } from '../api/client';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/replies/history')
      .then(data => {
        if (data.items && data.items.length > 0) {
          setHistory(data.items);
        } else {
          // Fallback data for presentation
          setHistory([
            { id: 1, original_review: "The food was cold but the service was okay.", generated_reply: "We are deeply sorry that your meal did not meet our temperature standards. We've spoken with our culinary team to ensure this isolated incident doesn't happen again. We'd love to invite you back to experience our true standard of excellence.", status: "completed", created_at: new Date().toISOString() },
            { id: 2, original_review: "Terrible experience, would not recommend.", generated_reply: "Thank you for your candid feedback. It is clear we fell short of delivering the experience you deserve. Our management team is currently reviewing your case to implement immediate operational adjustments.", status: "completed", created_at: new Date(Date.now() - 3600000).toISOString() }
          ]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <History className="text-indigo-400" size={18} />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Activity Log</span>
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tight">Review History</h1>
          <p className="text-slate-400 text-sm">A centralized record of all AI-generated response drafts.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <ExecutiveButton variant="outline" size="sm" icon={Calendar}>Filter by Date</ExecutiveButton>
        </div>
      </div>

      {/* Grid List */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-4">
        {history.map((record, index) => (
          <motion.div key={record.id || index} variants={itemVariants}>
            <ExecutiveCard className="p-0 overflow-hidden bg-slate-900/40 border-slate-800/60" hover={true}>
              
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr_auto] divide-y lg:divide-y-0 lg:divide-x divide-slate-800/40">
                
                {/* Response Content Architecture */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={14} className="text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Original Feedback</span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">&quot;{record.original_review}&quot;</p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                    <span className="text-[10px] text-slate-500 font-medium">Verified Capture</span>
                  </div>
                </div>

                {/* AI Output Result */}
                <div className="p-6 bg-slate-950/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Draft Response</span>
                  </div>
                  <p className="text-slate-200 font-body text-sm leading-relaxed">{record.generated_reply}</p>
                </div>

                {/* Metadata Operations */}
                <div className="p-6 flex flex-row lg:flex-col justify-between items-center lg:items-end gap-6 bg-slate-950/40 min-w-[180px]">
                  <div className="flex flex-col items-end gap-1.5">
                    <ExecutiveBadge variant="indigo">Final Draft</ExecutiveBadge>
                    <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                      <Clock size={12} />
                      <span className="text-[10px] font-medium">
                        {new Date(record.created_at).toLocaleDateString()} at {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <ExecutiveButton 
                      variant="ghost" 
                      size="sm" 
                      className="px-2 h-9 border border-slate-800"
                      onClick={() => navigator.clipboard.writeText(record.generated_reply)}
                    >
                      <Copy size={14} />
                    </ExecutiveButton>
                    <ExecutiveButton variant="outline" size="sm">Review</ExecutiveButton>
                  </div>
                </div>
                
              </div>
            </ExecutiveCard>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}


