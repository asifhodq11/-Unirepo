import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Copy, Globe, MessageSquare, Clock, Calendar, CheckCircle } from 'lucide-react';
import { ExecutiveCard, ExecutiveBadge, ExecutiveButton, ExecutivePageHeader, ExecutiveEmptyState } from '../components/ExecutiveComponents';
import { api } from '../api/client';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reviews/history?per_page=50')
      .then(data => {
        if (data.items && data.items.length > 0) {
          setHistory(data.items);
        } else {
          setHistory([]);
        }
      })
      .catch(err => {
        console.error('History fetch failed:', err);
        setHistory([]);
      })
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
      {/* Executive Page Header */}
      <ExecutivePageHeader 
        title="Review History"
        subtitle="A centralized record of all AI-generated response drafts."
        label="Activity Log"
        icon={History}
        actions={null}
      />

      {/* Grid List */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {history.length > 0 ? (
            history.map((record, index) => (
              <motion.div 
                key={record.id || index} 
                variants={itemVariants}
                layout
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <ExecutiveCard className="p-0 overflow-hidden bg-slate-900/40 border-slate-800/60" hover={true}>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr_auto] divide-y lg:divide-y-0 lg:divide-x divide-slate-800/40">
                    
                    {/* Response Content Architecture */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare size={14} className="text-slate-500" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Original Feedback</span>
                      </div>
                      <p className="text-slate-300 text-sm leading-relaxed">&quot;{record.review_text || 'No review text provided.'}&quot;</p>
                      <div className="mt-4 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50" />
                        <span className="text-xs text-slate-500 font-medium">{record.reviewer_name || 'Anonymous Guest'}</span>
                      </div>
                    </div>

                    {/* AI Output Result */}
                    <div className="p-6 bg-slate-950/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe size={14} className="text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Draft Response</span>
                      </div>
                      <p className="text-slate-200 font-body text-sm leading-relaxed">
                        {record.replies?.[0]?.reply_text || 'No response generated yet.'}
                      </p>
                    </div>

                    {/* Metadata Operations */}
                    <div className="p-6 flex flex-row lg:flex-col justify-between items-center lg:items-end gap-6 bg-slate-950/40 min-w-[180px]">
                      <div className="flex flex-col items-end gap-1.5">
                        <ExecutiveBadge variant="indigo">Final Draft</ExecutiveBadge>
                        <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                          <Clock size={12} />
                          <span className="text-xs font-medium">
                            {new Date(record.created_at).toLocaleDateString()} at {new Date(record.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <ExecutiveButton 
                          variant="ghost" 
                          size="sm" 
                          className="px-2 h-9 border border-slate-800"
                          onClick={() => navigator.clipboard.writeText(record.replies?.[0]?.reply_text || '')}
                        >
                          <Copy size={14} />
                        </ExecutiveButton>
                        {/* FLAW-002 FIX: Removed ghost "Review" button (had no onClick handler). */}
                        {/* Wire to an approval modal in a future sprint. */}
                      </div>
                    </div>
                    
                  </div>
                </ExecutiveCard>
              </motion.div>
            ))
          ) : (
            <ExecutiveEmptyState 
              title="No history found"
              message="Generate your first AI response to see it archived here for enterprise review."
              action={<ExecutiveButton onClick={() => window.location.href='/dashboard'}>Start Generating</ExecutiveButton>}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}


