import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const STARS = [1, 2, 3, 4, 5];
const ITEM_HEIGHT = 72; // standardized for CLS prevention

function HistoryItemSkeleton() {
  return (
    <div className="card" style={{ marginBottom: 'var(--space-3)', minHeight: `${ITEM_HEIGHT}px` }}>
      <div className="skeleton skeleton-text w-3q" />
      <div className="skeleton skeleton-text w-half" style={{ marginTop: 'var(--space-2)' }} />
    </div>
  );
}

function HistoryItem({ item }) {
  const [open, setOpen] = useState(false);
  const stars = '⭐'.repeat(item.star_rating);
  const date  = new Date(item.created_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div
      className="card"
      style={{ marginBottom: 'var(--space-3)', cursor: 'pointer', minHeight: `${ITEM_HEIGHT}px` }}
      onClick={() => setOpen(o => !o)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span style={{ letterSpacing: '-2px', fontSize: '0.85rem' }}>{stars}</span>
          {item.reviewer_name && (
            <span className="text-sm font-medium">{item.reviewer_name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${item.status === 'replied' ? 'badge-success' : 'badge-muted'}`}>
            {item.status}
          </span>
          <span className="text-xs text-muted">{date}</span>
          <span className="text-muted" style={{ fontSize: '0.75rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && item.review_text && (
        <div className="t-dissolve" style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: '1.7', maxWidth: '65ch' }}>
            {item.review_text}
          </p>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [items, setItems]       = useState(undefined); // undefined = uninitialized
  const [total, setTotal]       = useState(0);
  const [hasMore, setHasMore]   = useState(false);
  const [page, setPage]         = useState(1);
  const [isFetching, setIsFetching] = useState(false);
  const [filterRating, setFilterRating] = useState(null);

  // Correct 4-state model: uninitialized vs empty vs loading vs loaded
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

  // Start in LOADING state (not EMPTY) to prevent flash-of-wrong-state
  useEffect(() => {
    setIsFetching(true);
    fetchPage(1);
  }, [fetchPage]);

  const visible = filterRating && hasData
    ? items.filter(i => i.star_rating === filterRating)
    : (items ?? []);

  return (
    <div className="page-content">
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>Review History</h1>
        <p className="text-secondary">{total} total reviews — click any row to expand.</p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-5)' }}>
        <span className="text-xs text-muted">Filter:</span>
        <button
          className={`btn btn-sm ${!filterRating ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterRating(null)}
        >All</button>
        {STARS.map(s => (
          <button
            key={s}
            id={`filter-star-${s}`}
            className={`btn btn-sm ${filterRating === s ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterRating(filterRating === s ? null : s)}
          >
            {'⭐'.repeat(s)}
          </button>
        ))}
      </div>

      {/* List — standardized heights for zero CLS */}
      {(isUninitialized || isLoading)
        ? Array.from({ length: 4 }).map((_, i) => <HistoryItemSkeleton key={i} />)
        : isEmpty
          ? <div className="card text-center text-muted t-dissolve">No reviews yet. Generate your first reply!</div>
          : visible.map(item => <HistoryItem key={item.id} item={item} />)
      }

      {/* Pagination */}
      {!isLoading && (hasMore || page > 1) && (
        <div className="flex items-center gap-3" style={{ marginTop: 'var(--space-5)' }}>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => fetchPage(page - 1)}>
            ← Prev
          </button>
          <span className="text-xs text-muted">Page {page}</span>
          <button className="btn btn-secondary btn-sm" disabled={!hasMore} onClick={() => fetchPage(page + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
