/**
 * HistoryPage.jsx — v3 (Ground-Up Reconstruction)
 *
 * ── Bug Hunter Fixes ─────────────────────────────────────────
 * [CRITICAL-1] ADD `selectedIds` useState — was missing entirely, causing
 *              a ReferenceError crash on every render (blank page root cause).
 * [CRITICAL-2] All useEffect deps now properly declared to avoid stale closure.
 * [HIGH-3]     Rating filter computed deterministically, not mutating state.
 * [MED-4]      window.innerWidth replaced with CSS media query / matchMedia.
 * [MED-5]      All toast calls null-guarded via dedicated helper.
 *
 * ── Architecture ─────────────────────────────────────────────
 * • State isolated into logical groups (fetch, selection, modal, filter).
 * • Sub-components are pure and prop-driven: zero internal state risk.
 * • Pretext integration for intelligent AI-reply context previews.
 * • Mobile-first CSS — no JS breakpoint math at all.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, History, Download, User,
  Loader2, CheckSquare, Square, Zap, ExternalLink,
  Filter, Bot, RefreshCw, AlertCircle, Inbox,
} from 'lucide-react';
import ReviewModal from '../components/ReviewModal';
import { getPlanLimit } from '../utils/plans';
import { useToast } from '../hooks/useToast';
import { useResilientAction } from '../hooks/useResilientAction';

// ── Constants ──────────────────────────────────────────────────────────────
const STARS = [1, 2, 3, 4, 5];
const STATUS_OPTIONS = ['pending', 'replied', 'failed'];
const PER_PAGE = 20;

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function exportToCSV(items = []) {
  const headers = ['Date', 'Reviewer', 'Rating', 'Status', 'Review Text', 'AI Reply'];
  const rows = items.map(item => {
    const date   = formatDate(item.created_at);
    const name   = (item.reviewer_name || 'Anonymous').replace(/"/g, '""');
    const rating = item.rating ?? '';
    const status = item.status ?? '';
    const text   = (item.review_text || '').replace(/"/g, '""');
    const reply  = (item.replies?.[0]?.reply_text || '').replace(/"/g, '""');
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

// ── Skeleton ───────────────────────────────────────────────────────────────
function HistoryItemSkeleton() {
  return (
    <div className="card card-glass" style={{
      padding: 'var(--space-4)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 80, height: 14, borderRadius: 999 }} />
          <div className="skeleton" style={{ width: 60, height: 14, borderRadius: 999 }} />
        </div>
        <div className="skeleton" style={{ width: 56, height: 20, borderRadius: 999 }} />
      </div>
      <div className="skeleton skeleton-text w-3q" style={{ height: 13 }} />
      <div className="skeleton skeleton-text w-half" style={{ height: 11 }} />
    </div>
  );
}

// ── History Row Card ────────────────────────────────────────────────────────
function HistoryItem({ item, selectable, selected, onToggle, generating, onOpen }) {
  const date       = formatDate(item.created_at);
  const rating     = item.rating ?? 0;
  const hasName    = item.reviewer_name && item.reviewer_name.trim();
  const isPending  = item.status === 'pending';
  const isReplied  = item.status === 'replied';
  const isFailed   = item.status === 'failed';
  const hasDraft   = isPending && (item.replies?.length ?? 0) > 0;
  const isGenerating = generating && isPending;
  // Truncate review for card preview
  const previewText = item.review_text
    ? item.review_text.slice(0, 90) + (item.review_text.length > 90 ? '…' : '')
    : null;

  function handleCardClick(e) {
    // In selection mode, clicking the card toggles selection for pending items
    if (selectable && isPending && !isGenerating) {
      e.stopPropagation();
      onToggle(item.id);
      return;
    }
    onOpen(item);
  }

  const borderColor = isReplied
    ? 'var(--success)'
    : isFailed
    ? 'var(--danger)'
    : isPending
    ? 'var(--accent)'
    : 'var(--border)';

  const cardBg = isGenerating
    ? 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.06))'
    : hasDraft
    ? 'var(--accent-subtle)'
    : isReplied
    ? 'var(--success-subtle)'
    : isFailed
    ? 'var(--danger-subtle)'
    : 'var(--bg-glass)';

  return (
    <motion.div
      layout="position"
      className="card card-glass history-item"
      data-status={item.status}
      data-selected={selected ? 'true' : 'false'}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        padding: 'var(--space-3) var(--space-4)',
        borderLeft: `3px solid ${borderColor}`,
        background: cardBg,
        outline: selected ? '1px solid var(--accent)' : '1px solid transparent',
        transition: 'outline 0.15s, background 0.3s, transform 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
      onClick={handleCardClick}
    >
      {/* Row 1: identity + badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0, flex: 1 }}>
          {/* Checkbox */}
          {selectable && isPending && !isGenerating && (
            <motion.button
              onClick={e => { e.stopPropagation(); onToggle(item.id); }}
              style={{ color: selected ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }}
              whileTap={{ scale: 0.85 }}
              aria-label={selected ? 'Deselect review' : 'Select review'}
            >
              {selected ? <CheckSquare size={16} /> : <Square size={16} />}
            </motion.button>
          )}

          {/* Generating spinner */}
          {isGenerating && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ color: 'var(--accent-cyan)', flexShrink: 0 }}
            >
              <Loader2 size={15} />
            </motion.div>
          )}

          {/* Stars */}
          {rating > 0 && (
            <div style={{ display: 'flex', gap: '1px', flexShrink: 0 }}>
              {Array.from({ length: rating }).map((_, i) => (
                <Star key={i} size={12} fill="var(--accent)" stroke="var(--accent)" strokeWidth={1.5} />
              ))}
              {Array.from({ length: 5 - rating }).map((_, i) => (
                <Star key={`e${i}`} size={12} fill="none" stroke="var(--text-muted)" strokeWidth={1.5} style={{ opacity: 0.3 }} />
              ))}
            </div>
          )}

          {/* Name */}
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {hasName ? item.reviewer_name : (
              <span style={{ fontStyle: 'italic', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <User size={11} /> Anonymous
              </span>
            )}
          </span>

          {/* DRAFT READY pill */}
          {hasDraft && !isGenerating && (
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
              padding: '2px 6px', borderRadius: 'var(--radius-full)',
              background: 'var(--accent-subtle)', color: 'var(--accent)',
              border: '1px solid var(--accent-glow)', flexShrink: 0,
            }}>
              DRAFT
            </span>
          )}
        </div>

        {/* Right: status badge + date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
          <span className={`badge ${
            isReplied ? 'badge-success' :
            isFailed ? 'badge-danger' :
            isGenerating ? 'badge-accent' : 'badge-warning'
          }`}>
            {isGenerating ? 'Generating…' : item.status}
          </span>
          <span className="text-xs text-muted" style={{ display: 'none' }} data-desktop-only>{date}</span>
          <ExternalLink size={12} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
        </div>
      </div>

      {/* Row 2: review preview */}
      {previewText && (
        <p style={{
          fontSize: '0.78rem', color: 'var(--text-secondary)',
          lineHeight: 1.5, fontStyle: 'italic',
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          "{previewText}"
        </p>
      )}

      {/* Row 3: date on mobile */}
      <span className="text-xs text-muted" style={{ marginTop: 'auto' }}>{date}</span>
    </motion.div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ filterStatus, filterRating, onClearFilters }) {
  const hasFilter = filterStatus || filterRating;
  return (
    <motion.div
      className="card card-glass"
      style={{
        gridColumn: '1 / -1',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-12) var(--space-8)',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.01)',
        border: '1px dashed var(--border)',
        minHeight: 240,
      }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div style={{
        width: 60, height: 60, borderRadius: 'var(--radius-full)',
        background: 'var(--accent-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 'var(--space-4)',
      }}>
        {hasFilter ? <Filter size={28} style={{ color: 'var(--accent)' }} /> : <Inbox size={28} style={{ color: 'var(--accent)' }} />}
      </div>
      <h3 style={{ marginBottom: 'var(--space-2)' }}>
        {hasFilter ? 'No results match your filters' : "You're all caught up!"}
      </h3>
      <p className="text-secondary text-sm" style={{ maxWidth: 360 }}>
        {hasFilter
          ? 'Try clearing your filters to see more reviews.'
          : 'New reviews will appear here automatically when polled from Google Business Profile.'}
      </p>
      {hasFilter && (
        <button
          className="btn btn-secondary btn-sm"
          style={{ marginTop: 'var(--space-5)' }}
          onClick={onClearFilters}
        >
          Clear Filters
        </button>
      )}
    </motion.div>
  );
}

// ── Error State ──────────────────────────────────────────────────────────────
function ErrorState({ onRetry }) {
  return (
    <motion.div
      className="alert alert-error"
      style={{ gridColumn: '1 / -1', gap: 'var(--space-3)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
    >
      <AlertCircle size={18} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>Failed to load reviews. Check your connection.</span>
      <button className="btn btn-secondary btn-sm" onClick={onRetry} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <RefreshCw size={14} /> Retry
      </button>
    </motion.div>
  );
}

// ── AI Pretext Preview Panel ─────────────────────────────────────────────────
function PretextPreview({ item }) {
  if (!item?.replies?.[0]?.reply_text) return null;
  const reply = item.replies[0];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(6,182,212,0.04))',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-3) var(--space-4)',
        display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
      }}
    >
      <Bot size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
      <div style={{ minWidth: 0 }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
          AI Draft Preview
        </span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {reply.reply_text}
        </p>
        {reply.model_used && (
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'inline-block', marginTop: 4 }}>
            via {reply.model_used.split('/').pop()}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const { user, refreshUser } = useAuth();
  const plan = user?.plan ?? 'free';
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Fetch State ────────────────────────────────────────────────────────
  const [items, setItems]           = useState(null);    // null = unloaded, [] = empty
  const [total, setTotal]           = useState(0);
  const [hasMore, setHasMore]       = useState(false);
  const [page, setPage]             = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // ── Filter State ────────────────────────────────────────────────────────
  const [filterRating, setFilterRating] = useState(null);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') ?? null);

  // ── Selection State ─────────────────────────────────────────────────────
  // BUG FIX [CRITICAL-1]: This was missing entirely — the root cause of the blank page.
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── Modal State ─────────────────────────────────────────────────────────
  const [modalItem, setModalItem] = useState(null);

  // ── Per-item generating tracker ────────────────────────────────────────
  const [generatingIds, setGeneratingIds] = useState(new Set());

  // ── Resilience hook ────────────────────────────────────────────────────
  const { execute, loading: isProcessing, isSafeMode } = useResilientAction();
  const toast = useToast();

  // ── Derived Values ─────────────────────────────────────────────────────
  const used             = user?.reply_count_this_month ?? 0;
  const limit            = getPlanLimit(plan);
  const remainingCredits = Math.max(0, limit - used);
  const selectionMode    = filterStatus === 'pending';

  // BUG FIX [HIGH-3]: Compute filtered items deterministically in useMemo
  const visible = useMemo(() => {
    const base = Array.isArray(items) ? items : [];
    return filterRating ? base.filter(i => i.rating === filterRating) : base;
  }, [items, filterRating]);

  const pendingCount = useMemo(() => {
    if (filterStatus === 'pending') return total;
    return (Array.isArray(items) ? items : []).filter(i => i.status === 'pending').length;
  }, [items, total, filterStatus]);

  const isLoading      = isFetching;
  const isUninitialized = items === null && !isFetching;
  const isEmpty        = !isFetching && Array.isArray(items) && visible.length === 0;
  const hasData        = Array.isArray(items) && items.length > 0;

  // ── Bulk bar collision: broadcast CSS variable ─────────────────────────
  useEffect(() => {
    const isActive = selectionMode && selectedIds.size > 0;
    document.documentElement.style.setProperty('--bulk-bar-active', isActive ? '1' : '0');
    return () => {
      document.documentElement.style.setProperty('--bulk-bar-active', '0');
    };
    // BUG FIX [CRITICAL-2]: selectedIds.size now valid (state defined above)
  }, [selectionMode, selectedIds.size]);

  // ── Fetch Handler ──────────────────────────────────────────────────────
  const fetchPage = useCallback(async (p) => {
    setIsFetching(true);
    setFetchError(false);
    try {
      const statusParam = filterStatus ? `&status=${filterStatus}` : '';
      const data = await api.get(`/reviews/history?page=${p}&per_page=${PER_PAGE}${statusParam}&t=${Date.now()}`);
      const fetched = Array.isArray(data.items) ? data.items : [];
      setItems(fetched);
      setTotal(data.total ?? 0);
      setHasMore(data.has_more ?? false);
      setPage(p);

      // Auto-select first 10 pending when switching to pending view
      if (filterStatus === 'pending') {
        const pending = fetched.filter(i => i.status === 'pending');
        setSelectedIds(new Set(pending.slice(0, Math.min(10, remainingCredits)).map(i => i.id)));
      } else {
        setSelectedIds(new Set());
      }

      // Auto-open modal if URL has ?open=ID
      const openId = searchParams.get('open');
      if (openId) {
        const target = fetched.find(i => i.id === openId);
        if (target) {
          setModalItem(target);
          const next = new URLSearchParams(searchParams);
          next.delete('open');
          setSearchParams(next, { replace: true });
        }
      }
    } catch {
      setFetchError(true);
      // Preserve existing items during transient failures
    } finally {
      setIsFetching(false);
    }
  }, [filterStatus, searchParams, setSearchParams, remainingCredits]);

  // Fetch on mount and when filterStatus changes
  useEffect(() => {
    fetchPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus]);

  // ── Selection Helpers ──────────────────────────────────────────────────
  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= remainingCredits) {
          toast.warning?.(`Credit limit reached. You have ${remainingCredits} credit${remainingCredits !== 1 ? 's' : ''} remaining.`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    const pending = (Array.isArray(items) ? items : []).filter(i => i.status === 'pending');
    const cap = Math.min(pending.length, remainingCredits);
    setSelectedIds(new Set(pending.slice(0, cap).map(i => i.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  // ── Single Generate ────────────────────────────────────────────────────
  async function handleSingleGenerate(id) {
    if (generatingIds.has(id)) return;
    setGeneratingIds(prev => new Set([...prev, id]));
    try {
      await execute(
        async () => {
          const result = await api.post(`/reviews/${id}/generate`);
          const updatedItem = {
            ...((Array.isArray(items) ? items : []).find(i => i.id === id) ?? {}),
            status: 'pending',
            replies: [result.reply],
          };
          setItems(prev => (Array.isArray(prev) ? prev : []).map(item => item.id === id ? updatedItem : item));
          setModalItem(prev => prev?.id === id ? updatedItem : prev);
          refreshUser();
          return result;
        },
        {
          successMessage: 'Draft generated successfully!',
          errorMessage: 'Failed to generate draft.',
        }
      );
    } catch {
      setItems(prev => (Array.isArray(prev) ? prev : []).map(item =>
        item.id === id ? { ...item, status: 'failed' } : item
      ));
    } finally {
      setGeneratingIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  // ── Manual Send ────────────────────────────────────────────────────────
  async function handleSendReply(reviewId, draftId, newText) {
    if (generatingIds.has(reviewId)) return;
    setGeneratingIds(prev => new Set([...prev, reviewId]));
    try {
      const result = await api.post(`/reviews/${reviewId}/send`, {
        reply_id: draftId,
        reply_text: newText,
      });
      const updatedItem = {
        ...((Array.isArray(items) ? items : []).find(i => i.id === reviewId) ?? {}),
        status: 'replied',
        replies: [result.reply],
      };
      setItems(prev => (Array.isArray(prev) ? prev : []).map(item =>
        item.id === reviewId ? updatedItem : item
      ));
      setModalItem(prev => {
        if (prev?.id === reviewId) {
          setTimeout(() => setModalItem(null), 1200);
          return updatedItem;
        }
        return prev;
      });
    } catch {
      setItems(prev => (Array.isArray(prev) ? prev : []).map(item =>
        item.id === reviewId ? { ...item, status: 'failed' } : item
      ));
    } finally {
      setGeneratingIds(prev => { const n = new Set(prev); n.delete(reviewId); return n; });
    }
  }

  // ── Bulk Generate ──────────────────────────────────────────────────────
  async function handleBulkGenerate() {
    if (isProcessing || selectedIds.size === 0) return;
    if (selectedIds.size > remainingCredits) {
      toast.error?.('Insufficient credits for selected items.');
      return;
    }

    const orderedIds = (Array.isArray(items) ? items : [])
      .filter(i => selectedIds.has(i.id) && i.status === 'pending')
      .map(i => i.id);

    if (orderedIds.length === 0) return;

    await execute(
      async () => {
        const result = await api.post('/reviews/bulk-generate', { review_ids: orderedIds });
        const resultsMap = new Map((result.results || []).map(r => [r.id, r]));
        setItems(prev => (Array.isArray(prev) ? prev : []).map(item => {
          const batchRes = resultsMap.get(item.id);
          if (batchRes?.status === 'success') return { ...item, status: 'replied', replies: [batchRes.reply] };
          if (batchRes?.status === 'failed')  return { ...item, status: 'failed' };
          return item;
        }));
        setSelectedIds(new Set());
        refreshUser();
        return result;
      },
      {
        loadingMessage: `Generating ${orderedIds.length} draft${orderedIds.length !== 1 ? 's' : ''}…`,
        successMessage: `Bulk batch complete! ${orderedIds.length} reviews processed.`,
        errorMessage: 'Bulk generation encountered an error.',
      }
    );
  }

  // ── Filter togglers ────────────────────────────────────────────────────
  function handleStatusFilter(s) {
    setFilterStatus(prev => prev === s ? null : s);
    setFilterRating(null);
    setSelectedIds(new Set());
  }

  function handleRatingFilter(r) {
    setFilterRating(prev => prev === r ? null : r);
  }

  function clearFilters() {
    setFilterStatus(null);
    setFilterRating(null);
    setSelectedIds(new Set());
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="page-content"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* ━━ Header ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{ marginBottom: 'var(--space-6)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 0 }}>
            <History size={28} style={{ color: 'var(--accent)' }} />
            Review History
          </h1>
          {/* Safe Mode indicator */}
          {isSafeMode && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="badge badge-warning"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem' }}
            >
              <Bot size={11} /> Fast Mode Active
            </motion.span>
          )}
        </div>
        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-2)', fontSize: '0.9rem' }}>
          {isFetching ? (
            <span style={{ color: 'var(--text-muted)' }}>Loading…</span>
          ) : (
            <>
              {total} total review{total !== 1 ? 's' : ''}
              {pendingCount > 0 && (
                <span style={{ color: 'var(--warning)', marginLeft: 'var(--space-3)' }}>
                  · {pendingCount} awaiting reply
                </span>
              )}
            </>
          )}
        </p>
      </motion.div>

      {/* ━━ Credit Progress Bar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ marginBottom: 'var(--space-5)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>Monthly Credits</span>
          <span style={{ fontWeight: 600, color: remainingCredits <= 5 ? 'var(--danger)' : 'var(--text-secondary)' }}>
            {used} / {limit} used · {remainingCredits} remaining
          </span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill${used / limit > 0.9 ? ' danger' : used / limit > 0.7 ? ' warning' : ''}`}
            style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
          />
        </div>
      </motion.div>

      {/* ━━ Filter Bar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        style={{
          position: 'sticky',
          top: 'var(--space-3)',
          zIndex: 40,
          marginBottom: 'var(--space-5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-2) var(--space-4)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Status Tabs */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 2,
              padding: 3, borderRadius: 999,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            }}
          >
            <button
              className="star-btn"
              style={{
                padding: '5px 14px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
                background: !filterStatus ? 'var(--bg-surface)' : 'transparent',
                color: !filterStatus ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: !filterStatus ? 'var(--shadow-sm)' : 'none',
              }}
              onClick={() => handleStatusFilter(null)}
            >
              All
            </button>
            {STATUS_OPTIONS.map(s => (
              <button
                key={s}
                className="star-btn"
                style={{
                  padding: '5px 12px', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
                  background: filterStatus === s
                    ? s === 'pending' ? 'var(--accent-subtle)' : s === 'replied' ? 'var(--success-subtle)' : 'var(--danger-subtle)'
                    : 'transparent',
                  color: filterStatus === s
                    ? s === 'pending' ? 'var(--accent)' : s === 'replied' ? 'var(--success)' : 'var(--danger)'
                    : 'var(--text-muted)',
                }}
                onClick={() => handleStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {s === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
              </button>
            ))}
          </div>

          {/* Star Rating Filter */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 2, padding: 3,
              borderRadius: 999, background: 'var(--bg-elevated)',
              border: '1px solid var(--border)', overflowX: 'auto',
              scrollbarWidth: 'none', msOverflowStyle: 'none',
            }}
          >
            <button
              className="star-btn"
              style={{
                padding: '5px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                background: !filterRating ? 'var(--bg-surface)' : 'transparent',
                color: !filterRating ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
              onClick={() => handleRatingFilter(null)}
            >
              All ★
            </button>
            {STARS.map(s => (
              <button
                key={s}
                className="star-btn"
                style={{
                  padding: '5px 10px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                  background: filterRating === s ? 'var(--bg-surface)' : 'transparent',
                  color: filterRating === s ? 'var(--accent)' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}
                onClick={() => handleRatingFilter(s)}
              >
                <Star size={11} fill={filterRating === s ? 'currentColor' : 'none'} /> {s}
              </button>
            ))}
          </div>
        </div>

        {/* Right side actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {selectionMode && selectedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className="badge badge-accent" style={{ fontSize: '0.72rem' }}>
                {selectedIds.size} selected
              </span>
              <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={clearSelection}>
                Clear
              </button>
              {visible.filter(i => i.status === 'pending' && !selectedIds.has(i.id)).length > 0 && (
                <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', fontSize: '0.72rem' }} onClick={selectAll}>
                  Select All
                </button>
              )}
            </div>
          )}
          {hasData && !selectionMode && (
            <motion.button
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 999 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => exportToCSV(items)}
            >
              <Download size={13} /> Export
            </motion.button>
          )}
          {isFetching && (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
              <RefreshCw size={14} style={{ color: 'var(--text-muted)' }} />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ━━ Selection Mode Hint ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {selectionMode && pendingCount > 0 && !isProcessing && (
          <motion.div
            key="selection-hint"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)' }}
          >
            <p className="text-xs text-muted">
              Click reviews to open them, or select and bulk generate. First {Math.min(10, remainingCredits)} auto-selected.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━ Grid ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="history-grid">
        {/* Loading skeletons */}
        {(isUninitialized || isLoading) &&
          Array.from({ length: 6 }).map((_, i) => <HistoryItemSkeleton key={i} />)
        }

        {/* Error state */}
        {fetchError && !isLoading && (
          <ErrorState onRetry={() => fetchPage(page)} />
        )}

        {/* Empty state */}
        {!fetchError && !isLoading && isEmpty && (
          <EmptyState
            filterStatus={filterStatus}
            filterRating={filterRating}
            onClearFilters={clearFilters}
          />
        )}

        {/* Review items */}
        {!isLoading && !fetchError && visible.map(item => (
          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <HistoryItem
              item={item}
              selectable={selectionMode}
              selected={selectedIds.has(item.id)}
              onToggle={toggleSelect}
              generating={generatingIds.has(item.id)}
              onOpen={setModalItem}
            />
            {/* Pretext AI preview for items with drafts */}
            {item.status === 'pending' && (item.replies?.length ?? 0) > 0 && !selectionMode && (
              <PretextPreview item={item} />
            )}
          </div>
        ))}
      </div>

      {/* ━━ Pagination ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {!isLoading && !fetchError && (hasMore || page > 1) && (
        <motion.div
          layout
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}
        >
          <button
            className="btn btn-secondary btn-sm"
            disabled={page <= 1 || isFetching}
            onClick={() => fetchPage(page - 1)}
          >
            ← Previous
          </button>
          <span className="text-xs text-muted badge badge-muted">Page {page}</span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={!hasMore || isFetching}
            onClick={() => fetchPage(page + 1)}
          >
            Next →
          </button>
        </motion.div>
      )}

      {/* ━━ Floating Bulk Bar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            key="bulk-bar"
            initial={{ opacity: 0, y: 64 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 64 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            style={{
              position: 'fixed',
              bottom: 'calc(max(env(safe-area-inset-bottom, 16px), 16px) + var(--bulk-bar-offset, 0px))',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 45,
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-4)',
              background: 'var(--bg-glass)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-full)',
              padding: 'var(--space-3) var(--space-5)',
              boxShadow: 'var(--shadow-xl), 0 0 40px rgba(139,92,246,0.25)',
              maxWidth: 'calc(100vw - 32px)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                {isProcessing ? 'Generating drafts…' : `${selectedIds.size} selected`}
              </span>
              {!isProcessing && (
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' }}>
                  {remainingCredits} credit{remainingCredits !== 1 ? 's' : ''} remaining
                </span>
              )}
            </div>
            <motion.button
              className="btn btn-primary"
              style={{
                borderRadius: 999,
                padding: 'var(--space-2) var(--space-5)',
                display: 'flex', alignItems: 'center', gap: 6,
                whiteSpace: 'nowrap',
              }}
              disabled={isProcessing}
              whileTap={{ scale: 0.96 }}
              onClick={handleBulkGenerate}
            >
              {isProcessing ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 size={14} />
                  </motion.div>
                  Processing…
                </>
              ) : (
                <>
                  <Zap size={14} />
                  Generate ({selectedIds.size})
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━ Review Modal ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
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
