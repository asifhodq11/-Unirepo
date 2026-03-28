/**
 * ReviewModal.jsx
 * Full-screen overlay modal for viewing, generating, editing, and sending review replies.
 * Used by both HistoryPage (generate + edit) and DashboardPage (read-only for replied).
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  Star, X, Bot, Check, Loader2, Play, User, ArrowLeft, Sparkles, Edit3
} from 'lucide-react';

export default function ReviewModal({
  item,          // the review object
  onClose,       // fn() to close the modal
  onGenerate,    // fn(reviewId) → Promise — generate AI draft
  onSend,        // fn(reviewId, replyId, text) → Promise — confirm and send
  generating,    // boolean — is this review currently generating?
  readOnly,      // boolean — if true, no edit/generate actions visible
}) {
  const { refreshUser } = useAuth();
  const [editText, setEditText] = useState('');
  const textareaRef = useRef(null);
  const overlayRef = useRef(null);

  const draft = item?.replies?.[0];
  const hasDraft = !!draft;
  const isPending = item?.status === 'pending';
  const isReplied = item?.status === 'replied';
  const rating = item?.rating ?? 0;
  const hasName = item?.reviewer_name && item.reviewer_name.trim();

  // Populate textarea when draft arrives
  useEffect(() => {
    if (draft?.reply_text && isPending) {
      setEditText(draft.reply_text);
    }
  }, [draft, isPending]);

  // Focus textarea after draft arrives
  useEffect(() => {
    if (hasDraft && isPending && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [hasDraft, isPending]);

  // Call refreshUser on significant actions to sync usage counters
  async function handleInternalGenerate() {
    await onGenerate(item.id);
    await refreshUser();
  }

  async function handleInternalSend() {
    await onSend(item.id, draft.id, editText);
    await refreshUser();
  }

  // Click-outside to close
  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  // ESC key to close
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!item) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        key="modal-overlay"
        onClick={handleOverlayClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-4)',
          background: 'var(--modal-overlay, rgba(3, 7, 18, 0.85))',
          backdropFilter: 'blur(8px)',
        }}
      >
        <motion.div
          key="modal-panel"
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 24 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '660px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'var(--modal-bg, rgba(9, 9, 15, 0.7))',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm flex items-center gap-2"
              style={{ color: 'var(--text-muted)', background: 'var(--bg-glass)', padding: '6px 12px' }}
            >
              <ArrowLeft size={16} /> Close
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span className={`badge ${
                isReplied ? 'badge-success' :
                isPending ? 'badge-warning' : 'badge-muted'
              }`} style={{ letterSpacing: '0.05em', fontWeight: 700 }}>
                {item.status?.toUpperCase()}
              </span>
              <button
                onClick={onClose}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--text-muted)', padding: '6px', borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            {/* ── Context Area (Reviewer + Star) ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-surface))',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <User size={22} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  {hasName ? item.reviewer_name : 'Anonymous Guest'}
                </span>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} size={15} fill="var(--accent)" stroke="var(--accent)" />
                  ))}
                  {Array.from({ length: 5 - rating }).map((_, i) => (
                    <Star key={`e${i}`} size={15} fill="none" stroke="var(--text-muted)" style={{ opacity: 0.25 }} />
                  ))}
                </div>
              </div>
            </div>

            {/* ── Customer Review Card ── */}
            {item.review_text && (
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
                position: 'relative',
              }}>
                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', 
                  color: 'var(--text-muted)', marginBottom: 'var(--space-3)', textTransform: 'uppercase' 
                }}>
                  Customer Feedback
                </span>
                <p style={{ fontSize: '1rem', lineHeight: '1.8', color: 'var(--text-secondary)', fontStyle: 'italic', fontWeight: 400 }}>
                  "{item.review_text}"
                </p>
              </div>
            )}

            {/* ── AI Reply Section ── */}
            {!readOnly && (
              <div className="flex flex-col gap-4">
                {/* No draft yet: show Generate button */}
                {isPending && !hasDraft && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', items: 'center', gap: 'var(--space-4)',
                    padding: 'var(--space-8) var(--space-4)',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'center',
                  }}>
                    <div style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                      <Bot size={40} style={{ margin: '0 auto var(--space-3)' }} />
                      <p className="text-sm">Ready to generate an AI-powered response.</p>
                    </div>
                    <button
                      className="btn btn-primary flex items-center gap-2"
                      onClick={handleInternalGenerate}
                      disabled={generating}
                      style={{ width: 'auto', margin: '0 auto', padding: '10px 28px', fontSize: '0.95rem' }}
                    >
                      {generating
                        ? <><Loader2 size={18} className="animate-spin" /> Analyzing Thinking…</>
                        : <><Sparkles size={18} /> Generate AI Response</>
                      }
                    </button>
                  </div>
                )}

                {/* Draft ready: prominent editable area */}
                {isPending && hasDraft && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="flex items-center gap-3">
                        <span style={{ 
                          fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', 
                          color: 'var(--accent)', textTransform: 'uppercase',
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                          <Edit3 size={13} /> Review & Edit Reply
                        </span>
                        <motion.span 
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          style={{ fontSize: '0.65rem', background: 'var(--accent-subtle)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}
                        >
                          EDITABLE
                        </motion.span>
                      </div>
                      {draft.model_used && (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: '4px' }}>
                          <Bot size={12} /> {draft.model_used.split('/').pop()}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ 
                      position: 'relative',
                      borderRadius: 'var(--radius-lg)',
                      padding: '2px',
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.2))',
                      boxShadow: '0 8px 24px rgba(139,92,246,0.15)',
                    }}>
                      <textarea
                        ref={textareaRef}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        className="form-input"
                        disabled={generating}
                        style={{
                          minHeight: '180px',
                          resize: 'vertical',
                          fontSize: '1rem',
                          lineHeight: '1.7',
                          border: 'none',
                          background: 'var(--bg-surface)',
                          padding: 'var(--space-5)',
                          borderRadius: 'calc(var(--radius-lg) - 2px)',
                          color: 'var(--text-primary)',
                          transition: 'all 0.3s ease',
                          caretColor: 'var(--accent)',
                        }}
                        onFocus={e => e.target.parentElement.style.background = 'linear-gradient(135deg, var(--accent), var(--accent-cyan))'}
                        onBlur={e => e.target.parentElement.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.2))'}
                        placeholder="Customize the response to your liking…"
                      />
                      <div style={{
                        position: 'absolute', bottom: '12px', right: '16px',
                        fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600,
                      }}>
                        {editText.length} characters
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                      <button
                        className="btn btn-primary flex items-center gap-2"
                        onClick={handleInternalSend}
                        disabled={generating || !editText.trim()}
                        style={{ width: 'auto', padding: '12px 32px', fontSize: '1rem', fontWeight: 700 }}
                      >
                        {generating
                          ? <><Loader2 size={18} className="animate-spin" /> Sending…</>
                          : <><Check size={18} /> Confirm & Send Reply</>
                        }
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Read-only sent reply (for Replied items) ── */}
            {(readOnly || isReplied) && hasDraft && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.04)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-5)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                  <Check size={16} style={{ color: 'var(--success)' }} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--success)', textTransform: 'uppercase' }}>
                    Replied To Customer
                  </span>
                </div>
                <p style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                  {draft.reply_text}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
