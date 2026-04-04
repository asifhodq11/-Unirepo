import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCheck, FileText, Send, AlertCircle } from 'lucide-react';
import { VanguardCard, VanguardButton } from './VanguardComponents';
import { api } from '../api/client'; 

export const VanguardGenerator = () => {
  const [reviewContext, setReviewContext] = useState('');
  const [status, setStatus] = useState('idle'); // idle, generating, done, error
  const [result, setResult] = useState('');

  const handleGenerate = async () => {
    if (!reviewContext.trim()) return;
    setStatus('generating');
    try {
      // Direct integration with the generalized API client
      const response = await api.post('/replies/generate', { original_review: reviewContext, style: 'balanced' });
      setResult(response.generated_reply || response.reply || 'Synthesis successful (fallback display).');
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <VanguardCard className="flex flex-col h-full bg-gradient-to-b from-white/[0.05] to-transparent border-t-white/10">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-cyan-400/10 rounded-full border border-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
          <Sparkles className="text-cyan-400" size={20} />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold text-white tracking-tight">Neural Core</h2>
          <p className="text-xs text-white/40 tracking-widest uppercase font-mono mt-1">Generation Engine Active</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 relative z-10">
        
        {/* Input Phase */}
        <div className="relative group flex-1 min-h-[160px]">
          <div className="absolute inset-0 bg-white/5 rounded-2xl group-hover:bg-white/10 transition-colors duration-300 border border-white/5 group-hover:border-white/20" />
          <textarea 
            value={reviewContext}
            onChange={(e) => setReviewContext(e.target.value)}
            disabled={status === 'generating'}
            placeholder="Paste the customer review here..."
            className="w-full h-full min-h-[160px] p-6 bg-transparent border-none outline-none resize-none text-white/90 placeholder:text-white/20 font-body text-base leading-relaxed"
          />
          
          <div className="absolute bottom-4 right-4 flex items-center gap-4">
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{reviewContext.length} bytes</span>
            
            <VanguardButton 
              variant="neon" 
              onClick={handleGenerate}
              isLoading={status === 'generating'}
              disabled={!reviewContext.trim() || status === 'generating'}
              icon={status === 'done' ? CheckCheck : Send}
            >
              {status === 'done' ? 'Synthesized' : 'Process'}
            </VanguardButton>
          </div>
        </div>

        {/* Output Matrix */}
        <AnimatePresence>
          {status === 'done' && result && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-6 bg-cyan-950/30 border border-cyan-400/20 rounded-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400/0 via-cyan-400 to-cyan-400/0 opacity-50" />
              
              <div className="flex items-center gap-2 mb-4">
                <FileText className="text-cyan-400" size={16} />
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Optimized Output</span>
              </div>
              
              <p className="text-white/90 font-body leading-relaxed">{result}</p>
              
              <div className="mt-6 flex justify-end gap-3">
                <VanguardButton variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(result)}>Copy to Clipboard</VanguardButton>
                <VanguardButton variant="ghost" size="sm" onClick={() => { setResult(''); setStatus('idle'); setReviewContext(''); }}>Reset Core</VanguardButton>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-red-950/30 border border-red-500/20 rounded-2xl flex items-start gap-3"
            >
              <AlertCircle className="text-red-400 shrink-0 mt-1" size={16} />
              <p className="text-sm text-red-200">The neural link failed. Please check your data connection or API integrity.</p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </VanguardCard>
  );
};
