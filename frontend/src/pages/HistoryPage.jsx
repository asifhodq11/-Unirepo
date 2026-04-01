import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, History, Download, User,
  Loader2, CheckSquare, Square, Zap, ExternalLink,
} from 'lucide-react';
import ReviewModal from '../components/ReviewModal';
import { getPlanLimit } from '../utils/plans';
import { useToast } from '../hooks/useToast';

const STARS = [1, 2, 3, 4, 5];
const ITEM_HEIGHT = 72;

/* ── Skeleton ──────────────────────────────────────────────── */
function HistoryItemSkeleton() {
  return (
    <div className="card card-glass" style={{ marginBottom: 'var(--space-3)', minHeight: `${ITEM_HEIGHT}px` }}>
      <div className="skeleton skeleton-text w-3q" />
      <div className="skeleton skeleton-text w-half" style={{ marginTop: 'var(--space-2)' }} />
    </div>
  );
}

/* ── History Row Card — click to open modal ──────────────── */
function HistoryItem({ item, selectable, selected, onToggle, generating, onOpen }) {
  const date  = new Date(item.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const rating     = item.rating ?? 0;
  const hasName    = item.reviewer_name && item.reviewer_name.trim();
  const isPending  = item.status === 'pending';
  const hasDraft   = isPending && item.replies?.length > 0;
  const isGenerating = generating && isPending;

  function handleCardClick(e) {
    if (selectable && isPending) {
      e.stopPropagation();
      onToggle(item.id);
      return;
    }
    onOpen(item);
  }

  return (
    <motion.div
      layout="position"
      className="card card-glass"
      style={{
        cursor: 'pointer',
        height: '100%',
        minHeight: `${ITEM_HEIGHT}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 'var(--space-3) var(--space-4)',
        borderLeft: isPending ? '3px solid var(--accent)' : item.status === 'replied' ? '3px solid var(--success)' : `3px solid var(--border)`,
        outline: selected ? '1px solid var(--accent)' : '1px solid transparent',
        background: isGenerating
          ? 'linear-gradient(135deg, var(--accent-subtle), var(--accent-cyan-subtle))'
          : hasDraft
            ? 'var(--accent-subtle)'
            : item.status === 'replied'
              ? 'var(--success-subtle)'
              : 'var(--bg-glass)',
        transition: 'outline 0.15s ease, background 0.3s ease, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      whileHover={{ y: -2, outline: '1px solid var(--border)' }}
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Checkbox for bulk selection mode */}
          {selectable && isPending && !isGenerating && (
            <motion.button
              onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
              style={{ color: selected ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}
              whileTap={{ scale: 0.85 }}
            >
              {selected ? <CheckSquare size={18} /> : <Square size={18} />}
            </motion.button>
          )}

          {/* Generating pulse */}
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

          {/* Draft ready pill */}
          {hasDraft && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
              padding: '2px 7px', borderRadius: 'var(--radius-full)',
              background: 'var(--accent-subtle)', color: 'var(--accent)',
              border: '1px solid var(--accent-glow)',
            }}>
              DRAFT READY
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`badge ${
            item.status === 'replied' ? 'badge-success' :
            item.status === 'failed' ? 'badge-muted' :
            isGenerating ? 'badge-accent' : 'badge-warning'
          }`} style={{ padding: 'var(--space-1) var(--space-3)' }}>
            {isGenerating ? 'Generating…' : item.status}
          </span>
          <span className="text-xs text-muted hidden sm:inline">{date}</span>
          <ExternalLink size={14} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
        </div>
      </div>
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
  const { user, refreshUser } = useAuth();
  const plan = user?.plan ?? 'free';
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems]           = useState(undefined);
  const [total, setTotal]           = useState(0);
  const [hasMore, setHasMore]       = useState(false);
  const [page, setPage]             = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [filterRating, setFilterRating] = useState(null);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') ?? null);

  // Modal state
  const [modalItem, setModalItem] = useState(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds]     = useState(new Set());
  const [generatingIds, setGeneratingIds] = useState(new Set());
  const [isProcessing, setIsProcessing]   = useState(false);
  const toast = useToast();

  const used = user?.reply_count_this_month ?? 0;
  const limit = getPlanLimit(plan);
  const remainingCredits = Math.max(0, limit - used);

  const isUninitialized = items === undefined && !isFetching;
  const isLoading       = isFetching;
  const isEmpty         = !isFetching && Array.isArray(items) && items.length === 0;
  const hasData         = Array.isArray(items) && items.length > 0;

  // Whether we are in "bulk selection mode" (pending filter active)
  const selectionMode = filterStatus === 'pending';

  const fetchPage = useCallback(async (p) => {
    setIsFetching(true);
    try {
      const statusParam = filterStatus ? `&status=${filterStatus}` : '';
      const data = await api.get(`/reviews/history?page=${p}&per_page=20${statusParam}&t=${Date.now()}`);
      const fetched = data.items ?? [];
      setItems(fetched);
      setTotal(data.total ?? 0);
      setHasMore(data.has_more ?? false);
      setPage(p);

      // Auto-select first 10 pending when in pending view
      if (filterStatus === 'pending') {
        const pending = fetched.filter(i => i.status === 'pending');
        setSelectedIds(new Set(pending.slice(0, 10).map(i => i.id)));
      }

      // Auto-open modal if URL has ?open=ID
      const openId = searchParams.get('open');
      if (openId) {
        const target = fetched.find(i => i.id === openId);
        if (target) {
          setModalItem(target);
          // Remove ?open from URL without navigation
          searchParams.delete('open');
          setSearchParams(searchParams, { replace: true });
        }
      }
    } catch (err) {
      toast.error('Unable to reach server. Please check your internet connection or DNS settings.');
      // Keep existing items if we have them, otherwise items remain undefined (triggering skeleton)
      // Done to avoid confusing '0 Reviews' message during a temporary outage.
    } finally {
      setIsFetching(false);
    }
  }, [filterStatus, searchParams, setSearchParams]);

  useEffect(() => {
    // Only call fetchPage(1) on initial mount or when filterStatus changes
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

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
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= remainingCredits) {
          toast.warning(`Credit limit reached. You have ${remainingCredits} credits remaining.`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  }

  // ── Single Generate ──────────────────────────────
  async function handleSingleGenerate(id) {
    if (isProcessing || generatingIds.has(id)) return;
    setGeneratingIds(prev => new Set([...prev, id]));
    try {
      const result = await api.post(`/reviews/${id}/generate`);
      const updatedItem = { ...items.find(i => i.id === id), status: 'pending', replies: [result.reply] };
      setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
      // Update modal live if it's open
      if (modalItem?.id === id) setModalItem(updatedItem);
      refreshUser();
    } catch {
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'failed' } : item));
    } finally {
      setGeneratingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  // ── Manual Send ──────────────────────────────────
  async function handleSendReply(reviewId, draftId, newText) {
    if (generatingIds.has(reviewId)) return;
    setGeneratingIds(prev => new Set([...prev, reviewId]));
    try {
      const result = await api.post(`/reviews/${reviewId}/send`, {
        reply_id: draftId,
        reply_text: newText
      });
      const updatedItem = { ...items.find(i => i.id === reviewId), status: 'replied', replies: [result.reply] };
      setItems(prev => prev.map(item => item.id === reviewId ? updatedItem : item));
      // Update + close modal
      if (modalItem?.id === reviewId) {
        setModalItem(updatedItem);
        // After a short pause to show "Replied" state, close the modal
        setTimeout(() => setModalItem(null), 1200);
      }
    } catch {
      setItems(prev => prev.map(item => item.id === reviewId ? { ...item, status: 'failed' } : item));
    } finally {
      setGeneratingIds(prev => { const n = new Set(prev); n.delete(reviewId); return n; });
    }
  }

  // ── Bulk Generate (Unified Atomic API) ─────────────
  async function handleBulkGenerate() {
    if (isProcessing || selectedIds.size === 0) return;
    
    // Safety check against race conditions or stale local state
    if (selectedIds.size > remainingCredits) {
      toast.error('Insufficient credits for selected items.');
      return;
    }

    setIsProcessing(true);
    const orderedIds = (items ?? [])
      .filter(i => selectedIds.has(i.id) && i.status === 'pending')
      .map(i => i.id);

    try {
      const result = await api.post('/reviews/bulk-generate', { review_ids: orderedIds });
      
      // Update local items based on batch results
      const resultsMap = new Map((result.results || []).map(r => [r.id, r]));
      setItems(prev => (prev ?? []).map(item => {
        const batchRes = resultsMap.get(item.id);
        if (batchRes && batchRes.status === 'success') {
          return { ...item, status: 'replied', replies: [batchRes.reply] };
        }
        if (batchRes && batchRes.status === 'failed') {
          return { ...item, status: 'failed' };
        }
        return item;
      }));

      // Flush selection
      setSelectedIds(new Set());
      toast.success(result.message || 'Bulk generation complete.');
      
      await refreshUser(); // Sync the new credit count
    } catch (err) {
      toast.error(err.message || 'Bulk generation failed.');
    } finally {
      setIsProcessing(false);
    }
  }

  // Visible items — apply rating filter
  let visible = items ?? [];
  if (filterRating && hasData) visible = visible.filter(i => i.rating === filterRating);

  const pendingCount = filterStatus === 'pending' ? total : (items ?? []).filter(i => i.status === 'pending').length;

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
          <History size={32} className="text-accent" /> Review History
        </h1>
        <p className="text-secondary">
          {total} Total Reviews
          {pendingCount > 0 && (
            <span style={{ color: 'var(--warning)', marginLeft: 'var(--space-3)' }}>
              · {pendingCount} awaiting reply
            </span>
          )}
        </p>
      </motion.div>

      {/* Floating Filter Bar */}
      <motion.div
        style={{ 
          position: 'sticky', 
          top: 'var(--space-3)', 
          zIndex: 40,
          marginBottom: 'var(--space-6)',
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-2) var(--space-4)',
          boxShadow: 'var(--shadow-md)'
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status tabs */}
          <div
            className="flex items-center gap-1 p-1 rounded-full"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <button
              className="star-btn"
              style={{
                padding: 'var(--space-2) var(--space-4)', borderRadius: '999px',
                background: !filterStatus ? 'var(--bg-surface)' : 'transparent',
                color: !filterStatus ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                boxShadow: (!filterStatus && window.innerWidth > 768) ? 'var(--shadow-sm)' : 'none',
              }}
              onClick={() => setFilterStatus(null)}
            >All</button>
            <button
              className="star-btn flex items-center gap-1"
              style={{
                padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)',
                background: filterStatus === 'pending' ? 'var(--accent-subtle)' : 'transparent',
                color: filterStatus === 'pending' ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
              }}
              onClick={() => setFilterStatus(filterStatus === 'pending' ? null : 'pending')}
            >
              Pending {pendingCount > 0 && `(${pendingCount})`}
            </button>
          </div>

          {/* Star rating filter */}
          <div
            className="flex items-center gap-1 p-1 rounded-full hide-scrollbar text-xs"
            style={{ 
              background: 'var(--bg-elevated)', 
              boxShadow: '0 4px 20px var(--warning-subtle, rgba(245, 158, 11, 0.1))',
              borderColor: 'var(--warning-glow, rgba(245, 158, 11, 0.2))',
              flexWrap: 'nowrap',
              WebkitOverflowScrolling: 'touch',
              maxWidth: '100%',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
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

        <div className="flex items-center gap-3">
          {/* Selection count chip */}
          {selectionMode && selectedIds.size > 0 && (
            <span className="badge badge-accent" style={{ fontSize: '0.78rem' }}>
              {selectedIds.size} selected
            </span>
          )}

          {/* Export */}
          {hasData && !selectionMode && (
            <motion.button
              className="btn btn-secondary text-sm flex items-center gap-2"
              style={{ 
                padding: 'var(--space-2) var(--space-4)', 
                borderRadius: '999px',
                background: 'var(--bg-elevated)'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); exportToCSV(items); }}
            >
              <Download size={14} /> Export CSV
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Selection mode helper */}
      {selectionMode && pendingCount > 0 && !isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
          style={{ marginBottom: 'var(--space-4)' }}
        >
          <p className="text-xs text-muted">
            Click any review to open it, or select and bulk generate. First 10 auto-selected.
          </p>
        </motion.div>
      )}

      {/* Grid List */}
      <div className="history-grid">
        {(isUninitialized || isLoading)
          ? Array.from({ length: 6 }).map((_, i) => <HistoryItemSkeleton key={i} />)
          : isEmpty
            ? (
              <motion.div
                className="card card-glass flex flex-col items-center justify-center p-8"
                style={{ 
                  gridColumn: '1 / -1', 
                  minHeight: 250, 
                  background: 'var(--bg-elevated)',
                  border: '1px dashed var(--border)' 
                }}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div style={{
                  width: 64, height: 64, borderRadius: 'var(--radius-full)', background: 'var(--accent-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-4)'
                }}>
                  <History size={32} className="text-accent" />
                </div>
                <h3 style={{ marginBottom: 'var(--space-2)' }}>You're all caught up!</h3>
                <p className="text-secondary text-sm">New reviews will appear here automatically.</p>
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
                onOpen={setModalItem}
                plan={plan}
              />
            ))
        }
      </div>

      {/* Pagination */}
      {!isLoading && (hasMore || page > 1) && (
        <motion.div className="flex items-center justify-center gap-4" style={{ marginTop: 'var(--space-8)' }} layout>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchPage(page - 1)}>
            ← Previous
          </button>
          <span className="text-xs font-medium text-muted badge badge-muted">Page {page}</span>
          <button className="btn btn-secondary btn-sm" disabled={!hasMore} onClick={() => fetchPage(page + 1)}>
            Next →
          </button>
        </motion.div>
      )}

      {/* ── Floating Bulk Generate Bar ── */}
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
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(32px)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-full)',
              padding: 'var(--space-3) var(--space-5)',
              boxShadow: 'var(--shadow-xl), 0 0 30px var(--accent-glow)',
            }}
          >
            <div className="flex flex-col">
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {isProcessing ? 'Generating drafts…' : `${selectedIds.size} selected`}
              </span>
              {!isProcessing && (
                <span className="text-[10px] text-muted uppercase tracking-wider font-bold">
                  {remainingCredits} credits remaining
                </span>
              )}
            </div>
            <motion.button
              className="btn btn-primary flex items-center gap-2"
              style={{
                borderRadius: '999px',
                padding: 'var(--space-2) var(--space-5)',
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

      {/* ── Review Modal ── */}
      {modalItem && (
        <ReviewModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onGenerate={handleSingleGenerate}
          onSend={handleSendReply}
          generating={generatingIds.has(modalItem.id)}
        />
      )}
    </motion.div>
  );
}
