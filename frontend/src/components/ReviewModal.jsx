import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Star, X, Bot, Check, Loader2, Play, User, ArrowLeft, Sparkles, Edit3, Cpu,
  CheckCircle2, Send, MessageSquare
} from 'lucide-react';
import { useResilientAction } from '../hooks/useResilientAction';
import { ProButton, ProBadge, ProCard } from './BaseComponents';

export default function ReviewModal({
  item,
  onClose,
  onGenerate,
  onSend,
  generating,
  readOnly,
}) {
  const { user, refreshUser } = useAuth();
  const [editText, setEditText] = useState('');
  const [selectedTone, setSelectedTone] = useState('friendly');
  const textareaRef = useRef(null);
  const { execute, loading: internalLoading, isSafeMode } = useResilientAction();
  const overlayRef = useRef(null);

  const draft = item?.replies?.[0];
  const hasDraft = !!draft;
  const isPending = item?.status === 'pending';
  const isReplied = item?.status === 'replied';
  const rating = item?.rating ?? 0;

  useEffect(() => {
    if (draft?.reply_text && isPending) {
      setEditText(draft.reply_text);
    }
  }, [draft, isPending]);

  useEffect(() => {
    if (hasDraft && isPending && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [hasDraft, isPending]);

  const handleInternalGenerate = async () => {
    await execute(
      async () => {
        await onGenerate(item.id, selectedTone);
        await refreshUser();
      },
      {
        loadingMessage: 'AI is thinking...',
        successMessage: 'Draft optimized successfully.',
        onSuccess: () => {
          if (textareaRef.current) textareaRef.current.focus();
        }
      }
    );
  };

  const handleInternalSend = async () => {
    await execute(
      async () => {
        await onSend(item.id, draft.id, editText);
        await refreshUser();
      },
      {
        loadingMessage: 'Posting to Google...',
        successMessage: 'Reply published.',
        onSuccess: onClose
      }
    );
  };

  if (!item) return null;

  const TONES = [
    { id: 'professional', label: 'Professional', icon: Cpu },
    { id: 'friendly', label: 'Friendly', icon: Bot },
    { id: 'concise', label: 'Concise', icon: Sparkles }
  ];

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        onClick={(e) => e.target === overlayRef.current && onClose()}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-bg-surface border border-border rounded-xl shadow-xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-bg-surface/80 backdrop-blur-xl z-10 transition-colors duration-300">
            <div className="flex items-center gap-3">
              <button 
                onClick={onClose}
                className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors text-muted"
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className="text-lg font-black text-primary tracking-tight">AI Command Center</h2>
            </div>
            <ProBadge variant={isReplied ? 'success' : isPending ? 'warning' : 'muted'}>
              {item.status}
            </ProBadge>
          </div>

          <div className="p-8 space-y-8">
            {/* Review Context Card */}
            <section>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-md bg-bg-elevated flex items-center justify-center border border-border">
                  <User size={24} className="text-muted" />
                </div>
                <div>
                  <h3 className="font-bold text-primary">{item.reviewer_name || 'Anonymous User'}</h3>
                  <div className="flex gap-0.5 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        fill={i < rating ? 'var(--accent)' : 'none'} 
                        stroke={i < rating ? 'var(--accent)' : 'var(--text-muted)'} 
                        className={i >= rating ? 'opacity-20' : ''}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-accent/5 to-transparent rounded-md opacity-0 group-hover:opacity-100 transition-opacity" />
                <p className="relative text-lg text-primary leading-relaxed italic font-medium p-4 border-l-4 border-accent/20 bg-bg-elevated rounded-r-md">
                  "{item.review_text || 'No review text provided.'}"
                </p>
              </div>
            </section>

            {/* AI Interaction Zone */}
            <section className="space-y-6">
              {!readOnly && isPending && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Select Intelligence Tone</span>
                    <div className="flex gap-2">
                       {TONES.map(tone => (
                         <button
                           key={tone.id}
                           onClick={() => setSelectedTone(tone.id)}
                           className={`
                             px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border
                             ${selectedTone === tone.id ? 'bg-accent border-accent text-bg-base shadow-sm' : 'bg-bg-elevated border-border text-text-muted hover:text-text-primary'}
                           `}
                         >
                           <tone.icon size={12} />
                           {tone.label}
                         </button>
                       ))}
                    </div>
                  </div>

                  {!hasDraft ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-lg bg-bg-surface">
                      {generating || internalLoading ? (
                        <div className="space-y-4">
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent mx-auto"
                          >
                            <Bot size={32} />
                          </motion.div>
                          <p className="text-sm font-bold text-accent animate-pulse">ReplyIQ is analyzing the review...</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <p className="text-sm text-muted max-w-xs mx-auto">Click generate to let the 4-pass AI pipeline craft the perfect response.</p>
                          <ProButton 
                            variant="primary" 
                            size="lg" 
                            icon={Sparkles} 
                            onClick={handleInternalGenerate}
                          >
                            Generate Draft
                          </ProButton>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <Edit3 size={14} className="text-accent" />
                          <span className="text-xs font-bold text-primary uppercase tracking-widest">Crafted AI Response</span>
                        </div>
                        <button 
                          onClick={handleInternalGenerate}
                          className="text-[10px] font-black text-accent hover:underline uppercase tracking-widest"
                          disabled={generating || internalLoading}
                        >
                          Regenerate with {selectedTone} tone
                        </button>
                      </div>
                      
                      <div className="relative">
                        <textarea
                          ref={textareaRef}
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          className="w-full min-h-[200px] p-4 text-sm text-text-primary bg-bg-elevated border border-border rounded-md focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors outline-none resize-none leading-relaxed"
                          placeholder="Your professional AI draft..."
                          style={{ transitionDelay: '0s' }}
                        />
                        <div className="absolute bottom-4 right-4 flex items-center gap-3">
                           <span className="text-[10px] font-black text-muted uppercase">{editText.length} chars</span>
                           {isSafeMode && <Cpu size={14} className="text-warning animate-pulse" title="Fast Mode Active" />}
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <ProButton 
                          variant="secondary" 
                          onClick={() => setEditText(draft.reply_text)}
                          disabled={internalLoading}
                        >
                          Revert
                        </ProButton>
                        <ProButton 
                          variant="primary" 
                          icon={Send} 
                          onClick={handleInternalSend}
                          isLoading={internalLoading}
                          className="px-8"
                        >
                          Post Reply
                        </ProButton>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sent View */}
              {(readOnly || isReplied) && hasDraft && (
                <div className="p-6 bg-success/5 border border-success/20 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-success" />
                    <span className="text-xs font-black text-success uppercase tracking-widest">Successfully Published</span>
                  </div>
                  <p className="text-lg text-primary leading-relaxed">
                    {draft.reply_text}
                  </p>
                  <div className="pt-4 border-t border-success/10 flex items-center justify-between">
                     <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Sent via AI Intelligence V2.3</span>
                     <ProButton variant="ghost" size="sm" icon={ExternalLink} onClick={() => window.open(item.google_link, '_blank')}>View on Google</ProButton>
                  </div>
                </div>
              )}
            </section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
