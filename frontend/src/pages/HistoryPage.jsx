import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, ChevronDown, ChevronUp, Bot, History, Download, User,
  Sparkles, Check, Loader2, CheckSquare, Square, Zap,
} from 'lucide-react';

const STARS = [1, 2, 3, 4, 5];
const ITEM_HEIGHT = 80;

/* ── Skeleton ──────────────────────────────────────────────── */
function HistoryItemSkeleton() {
  return (
    <div className="card card-glass" style={{ marginBottom: 'var(--space-3)', minHeight: `${ITEM_HEIGHT}px` }}>
      <div className="skeleton skeleton-text w-3q" />
      <div className="skeleton skeleton-text w-half" style={{ marginTop: 'var(--space-2)' }} />
    </div>
  );
}

/* ── Individual History Card ──────────────────────────────── */
function HistoryItem({ item, selectable, selected, onToggle, generating, onGenerate, plan }) {
  const [open, setOpen] = useState(false);
  const date  = new Date(item.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const rating  = item.rating ?? 0;
  const hasName = item.reviewer_name && item.reviewer_name.trim();
  const isPending  = item.status === 'pending';
  const isGenerating = generating && isPending;

  function handleCardClick(e) {
    // If in selectable mode, clicking the card toggles the checkbox
    if (selectable && isPending) {
      e.stopPropagation();
      onToggle(item.id);
      return;
    }
    setOpen(o => !o);
  }

  return (
    <motion.div
      layout
      className="card card-glass"
      style={{
        cursor: 'pointer',
        minHeight: `${ITEM_HEIGHT}px`,
        alignSelf: 'start',
        overflow: 'hidden',
        outline: selected ? '1px solid var(--accent)' : 'none',
        background: isGenerating
          ? 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.06))'
          : undefined,
        transition: 'outline 0.15s ease, background 0.3s ease',
      }}
      whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.1)' }}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Checkbox for selectable pending reviews */}
          {selectable && isPending && !isGenerating && (
            <motion.button
              onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
              style={{ color: selected ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}
              whileTap={{ scale: 0.85 }}
            >
              {selected ? <CheckSquare size={18} /> : <Square size={18} />}
            </motion.button>
          )}

          {/* Generating pulse indicator */}
          {isGenerating && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ color: 'var(--accent-cyan)', flexShrink: 0 }}
            >
              <Loader2 size={18} />
            </motion.div>
          )}

          {/* Star Rating */}
          {rating > 0 && (
            <div className="flex" style={{ gap: '2px' }}>
              {Array.from({ length: rating }).map((_, i) => (
                <Star key={i} size={14} fill="var(--accent)" stroke="var(--accent)" strokeWidth={1} />
              ))}
              {Array.from({ length: 5 - rating }).map((_, i) => (
                <Star key={`e${i}`} size={14} fill="none" stroke="var(--text-muted)" strokeWidth={1} style={{ opacity: 0.3 }} />
              ))}
            </div>
          )}

          {hasName ? (
            <span className="text-sm font-medium">{item.reviewer_name}</span>
          ) : (
            <span className="text-sm flex items-center gap-1" style={{ fontStyle: 'italic', color: 'var(--text-muted)', opacity: 0.7 }}>
              <User size={12} /> Anonymous Guest
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`badge ${
            item.status === 'replied' ? 'badge-success' :
            isGenerating ? 'badge-accent' : 'badge-muted'
          }`}>
            {isGenerating ? '✨ Generating…' : item.status}
          </span>
          <span className="text-xs text-muted hidden sm:inline">{date}</span>
          {!selectable && (
            <span className="text-muted" style={{ display: 'flex' }}>
              {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          )}
        </div>
      </div>

      {/* Expandable body — only when NOT in selection mode */}
      {!selectable && (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)' }}
            >
              {item.review_text && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <span className="text-xs text-muted" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>CUSTOMER REVIEW</span>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: '1.7', maxWidth: '65ch', fontStyle: 'italic' }}>
                    "{item.review_text}"
                  </p>
                </div>
              )}

              {/* Starter Single Generate Action */}
              {isPending && plan === 'starter' && (!item.replies || item.replies.length === 0) && (
                <div style={{ padding: 'var(--space-4)', backgroundColor: 'rgba(139,92,246,0.06)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(139,92,246,0.3)', marginBottom: 'var(--space-2)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Awaiting Human Review</h4>
                      <p className="text-xs text-muted" style={{ marginTop: '2px' }}>Review collected successfully. Click generate to create an AI draft.</p>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm flex items-center gap-2"
                      style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-cyan))' }}
                      onClick={(e) => { e.stopPropagation(); onGenerate(item.id); }}
                      disabled={isGenerating}
                    >
                      {isGenerating ? <><Loader2 size={14} className="animate-spin" /> Generating...</> : <><Sparkles size={14} /> Generate AI Reply</>}
                    </button>
                  </div>
                </div>
              )}

              {item.replies && item.replies.length > 0 && (
                <div style={{ padding: 'var(--space-3)', backgroundColor: 'rgba(24, 24, 27, 0.4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                    <span className="text-xs font-medium text-accent">AI REPLY DRAFT</span>
                    {item.replies[0].model_used && (
                      <span className="text-xs text-muted opacity-70 flex items-center gap-1">
                        <Bot size={12} /> {item.replies[0].model_used.split('/').pop()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm" style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
                    {item.replies[0].reply_text}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Inline reply reveal after generation (when in selectable mode + just generated) */}
      {selectable && item.replies && item.replies.length > 0 && (
        <AnimatePresence>
          <motion.div
            key="reply-reveal"
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)' }}
          >
            <div style={{ padding: 'var(--space-3)', backgroundColor: 'rgba(6,182,212,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-2)' }}>
                <Check size={14} style={{ color: 'var(--success)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--accent-cyan)' }}>REPLY READY</span>
              </div>
              <p className="text-sm" style={{ lineHeight: '1.6', color: 'var(--text-primary)' }}>
                {item.replies[0].reply_text}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

/* ── CSV Export ─────────────────────────────────────────────── */
function exportToCSV(items) {
  const headers = ['Date', 'Reviewer', 'Rating', 'Status', 'Review Text', 'AI Reply'];
  const rows = items.map(item => {
    const date   = new Date(item.created_at).toLocaleDateString('en-GB');
    const name   = item.reviewer_name || 'Anonymous';
    const rating = item.rating ?? '';
    const status = item.status ?? '';
    const text   = (item.review_text || '').replace(/"/g, '""');
    const reply  = item.replies?.[0]?.reply_text?.replace(/"/g, '""') || '';
    return `"${date}","${name}","${rating}","${status}","${text}","${reply}"`;
  });
  const csv  = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `replyiq-history-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Main Page ─────────────────────────────────────────────── */
export default function HistoryPage() {
  const { user } = useAuth();
  const plan = user?.plan ?? 'free';

  const [items, setItems]           = useState(undefined);
  const [total, setTotal]           = useState(0);
  const [hasMore, setHasMore]       = useState(false);
  const [page, setPage]             = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [filterRating, setFilterRating] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null); // null | 'pending'

  // Selection state
  const [selectedIds, setSelectedIds]     = useState(new Set());
  const [generatingIds, setGeneratingIds] = useState(new Set());
  const [isProcessing, setIsProcessing]   = useState(false);

  const isUninitialized = items === undefined && !isFetching;
  const isLoading       = isFetching;
  const isEmpty         = !isFetching && Array.isArray(items) && items.length === 0;
  const hasData         = Array.isArray(items) && items.length > 0;

  // Whether we are in "selection mode" (pending filter active)
  const selectionMode = filterStatus === 'pending';

  const fetchPage = useCallback(async (p) => {
    setIsFetching(true);
    try {
      const data = await api.get(`/reviews/history?page=${p}&per_page=20`);
      const fetched = data.items ?? [];
      setItems(fetched);
      setTotal(data.total ?? 0);
      setHasMore(data.has_more ?? false);
      setPage(p);

      // Auto-select first 10 pending when entering pending view
      if (filterStatus === 'pending') {
        const pending = fetched.filter(i => i.status === 'pending');
        setSelectedIds(new Set(pending.slice(0, 10).map(i => i.id)));
      }
    } catch {
      setItems([]);
    } finally {
      setIsFetching(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    setIsFetching(true);
    fetchPage(1);
  }, [fetchPage]);

  // When filter status switches to pending, re-select defaults
  useEffect(() => {
    if (filterStatus === 'pending' && hasData) {
      const pending = items.filter(i => i.status === 'pending');
      setSelectedIds(new Set(pending.slice(0, 10).map(i => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // ── Single Processor ──────────────
  async function handleSingleGenerate(id) {
    if (isProcessing || generatingIds.has(id)) return;
    setGeneratingIds(prev => new Set([...prev, id]));
    try {
      const result = await api.post(`/reviews/${id}/generate`);
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'replied', replies: [result.reply] } : item));
    } catch {
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'failed' } : item));
    } finally {
      setGeneratingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  // ── Sequential Processor (Progressive Reveal) ──────────────
  async function handleBulkGenerate() {
    if (isProcessing || selectedIds.size === 0) return;
    setIsProcessing(true);

    const orderedIds = (items ?? [])
      .filter(i => selectedIds.has(i.id) && i.status === 'pending')
      .map(i => i.id);

    for (const reviewId of orderedIds) {
      // Mark this card as "Generating…"
      setGeneratingIds(prev => new Set([...prev, reviewId]));

      try {
        const result = await api.post(`/reviews/${reviewId}/generate`);

        // Inject the reply inline into the items list → triggers re-render + spring animation
        setItems(prev =>
          (prev ?? []).map(item =>
            item.id === reviewId
              ? { ...item, status: 'replied', replies: [result.reply] }
              : item
          )
        );
        setSelectedIds(prev => { const n = new Set(prev); n.delete(reviewId); return n; });
      } catch (err) {
        // Mark card as failed but continue processing the rest
        setItems(prev =>
          (prev ?? []).map(item =>
            item.id === reviewId ? { ...item, status: 'failed' } : item
          )
        );
      } finally {
        setGeneratingIds(prev => { const n = new Set(prev); n.delete(reviewId); return n; });
      }
    }

    setIsProcessing(false);
  }

  // Visible items — apply rating + status filters
  let visible = items ?? [];
  if (filterRating && hasData) visible = visible.filter(i => i.rating === filterRating);
  if (filterStatus === 'pending' && hasData) visible = visible.filter(i => i.status === 'pending');

  const pendingCount = (items ?? []).filter(i => i.status === 'pending').length;

  return (
    <motion.div
      className="page-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      {/* Header */}
      <motion.div style={{ marginBottom: 'var(--space-8)' }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ marginBottom: 'var(--space-2)' }} className="flex items-center gap-3">
          <History size={32} className="text-accent" /> Intelligence Feed
        </h1>
        <p className="text-secondary">
          {total} Total Processed Nodes
          {pendingCount > 0 && (
            <span style={{ color: 'var(--warning)', marginLeft: 'var(--space-3)' }}>
              · {pendingCount} awaiting generation
            </span>
          )}
        </p>
      </motion.div>

      {/* Filter bar */}
      <motion.div
        className="filter-bar"
        style={{ marginBottom: 'var(--space-5)' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status tabs */}
          <div
            className="flex items-center gap-1 p-1 rounded-full"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', width: 'fit-content' }}
          >
            <button
              className="star-btn"
              style={{
                padding: 'var(--space-2) var(--space-4)', borderRadius: '999px',
                background: !filterStatus ? 'var(--bg-surface)' : 'transparent',
                color: !filterStatus ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                boxShadow: !filterStatus ? 'var(--shadow-sm)' : 'none',
              }}
              onClick={() => setFilterStatus(null)}
            >All</button>
            <button
              className="star-btn flex items-center gap-1"
              style={{
                padding: 'var(--space-2) var(--space-4)', borderRadius: '999px',
                background: filterStatus === 'pending' ? 'rgba(139,92,246,0.15)' : 'transparent',
                color: filterStatus === 'pending' ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                boxShadow: filterStatus === 'pending' ? 'var(--shadow-sm)' : 'none',
              }}
              onClick={() => setFilterStatus(filterStatus === 'pending' ? null : 'pending')}
            >
              <Sparkles size={13} /> Pending {pendingCount > 0 && `(${pendingCount})`}
            </button>
          </div>

          {/* Star rating filter */}
          <div
            className="flex items-center gap-1 p-1 rounded-full"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', width: 'fit-content' }}
          >
            <button
              className="star-btn"
              style={{
                padding: 'var(--space-2) var(--space-3)', borderRadius: '999px',
                background: !filterRating ? 'var(--bg-surface)' : 'transparent',
                color: !filterRating ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
              }}
              onClick={() => setFilterRating(null)}
            >All ★</button>
            {STARS.map(s => (
              <button
                key={s}
                className="star-btn flex items-center gap-1"
                style={{
                  padding: 'var(--space-2) var(--space-3)', borderRadius: '999px',
                  background: filterRating === s ? 'var(--bg-surface)' : 'transparent',
                  color: filterRating === s ? 'var(--accent)' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                  boxShadow: filterRating === s ? 'var(--shadow-sm)' : 'none',
                }}
                onClick={() => setFilterRating(filterRating === s ? null : s)}
              >
                <Star size={14} fill={filterRating === s ? 'currentColor' : 'none'} /> {s}
              </button>
            ))}
          </div>
        </div>

        {/* Export */}
        {hasData && !selectionMode && (
          <motion.button
            className="btn btn-secondary text-sm flex items-center gap-2"
            style={{ padding: '0.4rem 0.8rem', width: 'auto' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => { e.stopPropagation(); exportToCSV(items); }}
          >
            <Download size={14} /> Export CSV
          </motion.button>
        )}

        {/* Selection count chip */}
        {selectionMode && selectedIds.size > 0 && (
          <span className="badge badge-accent" style={{ fontSize: '0.78rem' }}>
            {selectedIds.size} selected
          </span>
        )}
      </motion.div>

      {/* Selection mode helper */}
      {selectionMode && pendingCount > 0 && !isProcessing && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-muted"
          style={{ marginBottom: 'var(--space-4)' }}
        >
          ✅ First 10 selected by default. Check or uncheck any review below.
        </motion.p>
      )}

      {/* Grid List */}
      <div className="history-grid">
        {(isUninitialized || isLoading)
          ? Array.from({ length: 6 }).map((_, i) => <HistoryItemSkeleton key={i} />)
          : isEmpty
            ? (
              <motion.div
                className="card card-glass text-center text-muted"
                style={{ gridColumn: '1 / -1' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No data streams found. Initiate first transmission.
              </motion.div>
            )
            : visible.map(item => (
              <HistoryItem
                key={item.id}
                item={item}
                selectable={selectionMode}
                selected={selectedIds.has(item.id)}
                onToggle={toggleSelect}
                generating={generatingIds.has(item.id)}
                onGenerate={handleSingleGenerate}
                plan={plan}
              />
            ))
        }
      </div>

      {/* Pagination */}
      {!isLoading && (hasMore || page > 1) && (
        <motion.div className="flex items-center justify-center gap-4" style={{ marginTop: 'var(--space-8)' }} layout>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchPage(page - 1)}>
            ← Previous Cycle
          </button>
          <span className="text-xs font-medium text-muted badge badge-muted">Page {page}</span>
          <button className="btn btn-secondary btn-sm" disabled={!hasMore} onClick={() => fetchPage(page + 1)}>
            Next Cycle →
          </button>
        </motion.div>
      )}

      {/* ── Floating Generate Selected Action Bar ── */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed',
              bottom: 'calc(var(--space-8) + env(safe-area-inset-bottom))',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 45,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              background: 'rgba(9, 9, 11, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(139,92,246,0.4)',
              borderRadius: '999px',
              padding: 'var(--space-3) var(--space-5)',
              boxShadow: '0 8px 32px rgba(139,92,246,0.3)',
            }}
          >
            <span className="text-sm text-muted">
              {isProcessing ? 'Generating replies…' : `${selectedIds.size} review${selectedIds.size > 1 ? 's' : ''} selected`}
            </span>
            <motion.button
              className="btn btn-primary flex items-center gap-2"
              style={{
                borderRadius: '999px',
                padding: 'var(--space-2) var(--space-5)',
                background: isProcessing
                  ? 'var(--bg-elevated)'
                  : 'linear-gradient(135deg, var(--accent-cyan), var(--accent))',
                border: 'none',
              }}
              disabled={isProcessing}
              whileTap={{ scale: 0.96 }}
              onClick={handleBulkGenerate}
            >
              {isProcessing ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 size={15} />
                  </motion.div>
                  Processing…
                </>
              ) : (
                <>
                  <Zap size={15} />
                  Generate Selected ({selectedIds.size})
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
