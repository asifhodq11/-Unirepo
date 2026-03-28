/**
 * ReviewModal.jsx
 * Full-screen overlay modal for viewing, generating, editing, and sending review replies.
 * Used by both HistoryPage (generate + edit) and DashboardPage (read-only for replied).
 */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, X, Bot, Check, Loader2, Play, User, ArrowLeft,
} from 'lucide-react';

export default function ReviewModal({
  item,          // the review object
  onClose,       // fn() to close the modal
  onGenerate,    // fn(reviewId) → Promise — generate AI draft
  onSend,        // fn(reviewId, replyId, text) → Promise — confirm and send
  generating,    // boolean — is this review currently generating?
  readOnly,      // boolean — if true, no edit/generate actions visible
}) {
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
          background: 'rgba(3, 7, 18, 0.85)',
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
            background: 'rgba(9, 9, 15, 0.97)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(139,92,246,0.1)',
          }}
        >
          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm flex items-center gap-2"
              style={{ color: 'var(--text-muted)', padding: '6px 10px' }}
            >
              <ArrowLeft size={16} /> Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span className={`badge ${
                isReplied ? 'badge-success' :
                isPending ? 'badge-warning' : 'badge-muted'
              }`}>
                {item.status?.toUpperCase()}
              </span>
              <button
                onClick={onClose}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--text-muted)', padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Reviewer Info ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <User size={20} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                {hasName ? item.reviewer_name : 'Anonymous Guest'}
              </span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {Array.from({ length: rating }).map((_, i) => (
                  <Star key={i} size={14} fill="var(--accent)" stroke="var(--accent)" />
                ))}
                {Array.from({ length: 5 - rating }).map((_, i) => (
                  <Star key={`e${i}`} size={14} fill="none" stroke="var(--text-muted)" style={{ opacity: 0.3 }} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Review Text ── */}
          {item.review_text && (
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
            }}>
              <span style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 'var(--space-2)', textTransform: 'uppercase' }}>
                Customer Review
              </span>
              <p style={{ fontSize: '0.95rem', lineHeight: '1.75', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "{item.review_text}"
              </p>
            </div>
          )}

          {/* ── Reply Section ── */}
          {!readOnly && (
            <>
              {/* No draft yet: show Generate button */}
              {isPending && !hasDraft && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--space-4)',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    No reply generated yet
                  </span>
                  <button
                    className="btn btn-secondary flex items-center gap-2"
                    onClick={() => onGenerate(item.id)}
                    disabled={generating}
                    style={{ width: 'auto', padding: '8px 18px' }}
                  >
                    {generating
                      ? <><Loader2 size={15} className="animate-spin" /> Generating…</>
                      : <><Play size={15} /> Generate Reply</>
                    }
                  </button>
                </div>
              )}

              {/* Generating indicator */}
              {isPending && !hasDraft && generating && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--accent)' }}>
                  <Loader2 size={16} className="animate-spin" />
                  <span style={{ fontSize: '0.85rem' }}>AI is writing your reply…</span>
                </div>
              )}

              {/* Draft ready: editable textarea + Send */}
              {isPending && hasDraft && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' }}>
                      Edit Draft
                    </span>
                    {draft.model_used && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Bot size={11} /> {draft.model_used.split('/').pop()}
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      ref={textareaRef}
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      className="form-input"
                      disabled={generating}
                      style={{
                        minHeight: '120px',
                        resize: 'vertical',
                        fontSize: '0.95rem',
                        lineHeight: '1.65',
                        border: '1px solid rgba(139,92,246,0.35)',
                        background: 'rgba(139,92,246,0.04)',
                        transition: 'border-color 0.2s',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.7)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(139,92,246,0.35)'}
                      placeholder="Edit the AI-generated reply here…"
                    />
                    <div style={{
                      position: 'absolute', bottom: '10px', right: '12px',
                      fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.5,
                    }}>
                      {editText.length} chars
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-primary flex items-center gap-2"
                      onClick={() => onSend(item.id, draft.id, editText)}
                      disabled={generating || !editText.trim()}
                      style={{ width: 'auto', padding: '10px 24px' }}
                    >
                      {generating
                        ? <><Loader2 size={15} className="animate-spin" /> Sending…</>
                        : <><Check size={15} /> Send Reply</>
                      }
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Read-only sent reply (for Replied items) ── */}
          {(readOnly || isReplied) && hasDraft && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <Check size={14} style={{ color: 'var(--success)' }} />
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--success)', textTransform: 'uppercase' }}>
                  Sent Reply
                </span>
              </div>
              <p style={{ fontSize: '0.95rem', lineHeight: '1.65', color: 'var(--text-primary)' }}>
                {draft.reply_text}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
