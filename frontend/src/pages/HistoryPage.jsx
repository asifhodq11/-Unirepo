import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronDown, ChevronUp, Bot, History, Download, User } from 'lucide-react';

const STARS = [1, 2, 3, 4, 5];
const ITEM_HEIGHT = 80;

function HistoryItemSkeleton() {
  return (
    <div className="card card-glass" style={{ marginBottom: 'var(--space-3)', minHeight: `${ITEM_HEIGHT}px` }}>
      <div className="skeleton skeleton-text w-3q" />
      <div className="skeleton skeleton-text w-half" style={{ marginTop: 'var(--space-2)' }} />
    </div>
  );
}

function HistoryItem({ item }) {
  const [open, setOpen] = useState(false);
  const date  = new Date(item.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const rating = item.rating ?? 0;
  const hasName = item.reviewer_name && item.reviewer_name.trim();

  return (
    <motion.div
      layout
      className="card card-glass"
      style={{ cursor: 'pointer', minHeight: `${ITEM_HEIGHT}px`, alignSelf: 'start', overflow: 'hidden' }}
      whileHover={{ scale: 1.01, borderColor: 'rgba(255,255,255,0.1)' }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Star Rating Display */}
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
          {/* Reviewer Name */}
          {hasName ? (
            <span className="text-sm font-medium">{item.reviewer_name}</span>
          ) : (
            <span className="text-sm flex items-center gap-1" style={{ fontStyle: 'italic', color: 'var(--text-muted)', opacity: 0.7 }}>
              <User size={12} /> Anonymous Guest
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${item.status === 'replied' ? 'badge-success' : 'badge-muted'}`}>
            {item.status}
          </span>
          <span className="text-xs text-muted hidden sm:inline">{date}</span>
          <span className="text-muted" style={{ display: 'flex' }}>
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>
      </div>

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
    </motion.div>
  );
}

/* ── CSV Export Utility ── */
function exportToCSV(items) {
  const headers = ['Date', 'Reviewer', 'Rating', 'Status', 'Review Text', 'AI Reply'];
  const rows = items.map(item => {
    const date = new Date(item.created_at).toLocaleDateString('en-GB');
    const name = item.reviewer_name || 'Anonymous';
    const rating = item.rating ?? '';
    const status = item.status ?? '';
    const text = (item.review_text || '').replace(/"/g, '""');
    const reply = item.replies?.[0]?.reply_text?.replace(/"/g, '""') || '';
    return `"${date}","${name}","${rating}","${status}","${text}","${reply}"`;
  });

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `replyiq-history-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryPage() {
  const [items, setItems]       = useState(undefined);
  const [total, setTotal]       = useState(0);
  const [hasMore, setHasMore]   = useState(false);
  const [page, setPage]         = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [filterRating, setFilterRating] = useState(null);

  const isUninitialized = items === undefined && !isFetching;
  const isLoading       = isFetching;
  const isEmpty         = !isFetching && Array.isArray(items) && items.length === 0;
  const hasData         = Array.isArray(items) && items.length > 0;

  const fetchPage = useCallback(async (p) => {
    setIsFetching(true);
    try {
      const data = await api.get(`/reviews/history?page=${p}&per_page=20`);
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setHasMore(data.has_more ?? false);
      setPage(p);
    } catch {
      setItems([]);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    setIsFetching(true);
    fetchPage(1);
  }, [fetchPage]);

  // Filter uses the correct field name: `rating` (not `star_rating`)
  const visible = filterRating && hasData
    ? items.filter(i => i.rating === filterRating)
    : (items ?? []);

  return (
    <motion.div 
      className="page-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <motion.div style={{ marginBottom: 'var(--space-8)' }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ marginBottom: 'var(--space-2)' }} className="flex items-center gap-3">
          <History size={32} className="text-accent" /> Intelligence Feed
        </h1>
        <p className="text-secondary">{total} Total Processed Nodes — Click any row to expand telemetry.</p>
      </motion.div>

      {/* Filter bar + Export */}
      <motion.div 
        className="flex items-center justify-between" 
        style={{ marginBottom: 'var(--space-5)' }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div 
          className="flex items-center gap-1 p-1 rounded-full" 
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', width: 'fit-content' }}
        >
          <button
            className="star-btn"
            style={{ 
              padding: 'var(--space-2) var(--space-4)', borderRadius: '999px',
              background: !filterRating ? 'var(--bg-surface)' : 'transparent',
              color: !filterRating ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
              boxShadow: !filterRating ? 'var(--shadow-sm)' : 'none'
            }}
            onClick={() => setFilterRating(null)}
          >All</button>
          
          {STARS.map(s => (
            <button
              key={s}
              className="star-btn flex items-center gap-1"
              style={{ 
                padding: 'var(--space-2) var(--space-3)', borderRadius: '999px',
                background: filterRating === s ? 'var(--bg-surface)' : 'transparent',
                color: filterRating === s ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'all 0.2s',
                boxShadow: filterRating === s ? 'var(--shadow-sm)' : 'none'
              }}
              onClick={() => setFilterRating(filterRating === s ? null : s)}
            >
              <Star size={14} fill={filterRating === s ? "currentColor" : "none"} /> {s}
            </button>
          ))}
        </div>

        {/* Export CSV button */}
        {hasData && (
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
      </motion.div>

      {/* Grid List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 'var(--space-4)', alignItems: 'start' }}>
        {(isUninitialized || isLoading)
          ? Array.from({ length: 6 }).map((_, i) => <HistoryItemSkeleton key={i} />)
          : isEmpty
            ? <motion.div className="card card-glass text-center text-muted" style={{ gridColumn: '1 / -1' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>No data streams found. Initiate first transmission.</motion.div>
            : visible.map(item => <HistoryItem key={item.id} item={item} />)
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
    </motion.div>
  );
}
