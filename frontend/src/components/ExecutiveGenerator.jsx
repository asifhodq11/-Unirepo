import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCheck, FileText, Send, AlertCircle, Copy, RotateCcw, MessageCirclePlus } from 'lucide-react';
import { ExecutiveCard, ExecutiveButton, ExecutiveBadge } from './ExecutiveComponents';
import { api } from '../api/client'; 

export const ExecutiveGenerator = () => {
  const [reviewContext, setReviewContext] = useState('');
  const [status, setStatus] = useState('idle'); // idle, generating, done, error
  const [result, setResult] = useState('');
  const [activeTone, setActiveTone] = useState('professional');
  const [rating, setRating] = useState(5);

  const tones = [
    { id: 'professional', label: 'Professional' },
    { id: 'friendly', label: 'Friendly' },
    { id: 'empathetic', label: 'Empathetic' },
  ];

  const handleGenerate = async () => {
    if (!reviewContext.trim()) return;
    setStatus('generating');
    try {
      const response = await api.post('/reviews/generate', { 
        review_text: reviewContext,
        rating: rating,
        tone: activeTone 
      });
      setResult(response.reply?.reply_text || response.reply || 'Response generated successfully.');
      setStatus('done');
    } catch (err) {
      console.error('Generation failed:', err);
      setStatus('error');
    }
  };

  return (
    <ExecutiveCard className="flex flex-col h-full bg-slate-900/60 border-slate-800" hover={false}>
      {/* Executive Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
            <MessageCirclePlus className="text-indigo-400" size={18} />
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-white tracking-tight">Response Assistant</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.15em] mt-0.5">AI-Powered Drafting</p>
          </div>
        </div>
        
        {/* Tone & Rating Controller */}
        <div className="flex items-center gap-4">
          {/* Rating Selection */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-950/50 rounded-lg border border-slate-800">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`text-sm transition-all hover:scale-110 ${rating >= star ? 'text-amber-400' : 'text-slate-700'}`}
              >
                ★
              </button>
            ))}
          </div>

          <div className="hidden sm:flex bg-slate-950/50 p-1 rounded-lg border border-slate-800">
            {tones.map((tone) => (
              <button
                key={tone.id}
                onClick={() => setActiveTone(tone.id)}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${
                  activeTone === tone.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tone.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 relative z-10">
        
        {/* Input Phase */}
        <div className="relative group flex-1 flex flex-col min-h-[160px]">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">Customer Review Input</label>
          <textarea 
            value={reviewContext}
            onChange={(e) => setReviewContext(e.target.value)}
            disabled={status === 'generating'}
            placeholder="Paste the customer feedback here for processing..."
            className="flex-1 w-full p-4 bg-slate-950/40 rounded-xl border border-slate-800 focus:border-indigo-500/50 focus:bg-slate-950/60 outline-none resize-none text-slate-200 placeholder:text-slate-600 font-body text-sm transition-all"
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{reviewContext.length} Characters</span>
            </div>
            
            <ExecutiveButton 
              variant="primary" 
              onClick={handleGenerate}
              isLoading={status === 'generating'}
              disabled={!reviewContext.trim() || status === 'generating'}
              icon={Send}
            >
              Draft Response
            </ExecutiveButton>
          </div>
        </div>

        {/* Output Area */}
        <AnimatePresence>
          {status === 'done' && result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 p-6 bg-slate-950/60 border border-indigo-500/20 rounded-xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-indigo-400" size={16} />
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Suggested Draft</span>
                </div>
                <div className="flex items-center gap-1">
                  <ExecutiveBadge variant="indigo">High Confidence</ExecutiveBadge>
                </div>
              </div>
              
              <p className="text-slate-200 font-body leading-relaxed text-sm whitespace-pre-wrap">{result}</p>
              
              <div className="mt-6 flex justify-end gap-2">
                <ExecutiveButton variant="ghost" size="sm" icon={Copy} onClick={() => navigator.clipboard.writeText(result)}>Copy</ExecutiveButton>
                <ExecutiveButton variant="ghost" size="sm" icon={RotateCcw} onClick={() => { setStatus('idle'); setReviewContext(''); }}>Reset</ExecutiveButton>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="text-red-400 shrink-0 mt-1" size={16} />
              <p className="text-sm text-red-300">Failed to generate response. Please verify account connectivity or contact support.</p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </ExecutiveCard>
  );
};



