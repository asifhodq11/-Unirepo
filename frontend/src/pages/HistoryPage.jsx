import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Star, History, Download, User, 
  Loader2, CheckSquare, Square, Zap, ExternalLink, 
  Filter, Bot, RefreshCw, AlertCircle, Inbox,
  ChevronLeft, ChevronRight, MoreVertical, Trash2
} from 'lucide-react';
import { 
  ProCard, ProButton, ProBadge, ProStat, ProRow, ProFilterGroup 
} from '../components/BaseComponents';
const ReviewModal = lazy(() => import('../components/ReviewModal'));
import { getPlanLimit } from '../utils/plans';
import { useToast } from '../hooks/useToast';
import { useResilientAction } from '../hooks/useResilientAction';

const PER_PAGE = 20;

function EmptyState({ hasFilters, onClear }) {
  return (
    <div className="py-24 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-lg bg-bg-surface mt-4">
      <div className="w-12 h-12 rounded-md bg-bg-elevated border border-border flex items-center justify-center text-text-muted mb-4">
        {hasFilters ? <Filter size={24} /> : <Inbox size={24} />}
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">
        {hasFilters ? 'No matches found' : 'History is empty'}
      </h3>
      <p className="text-sm text-text-secondary max-w-xs mb-6">
        {hasFilters 
          ? 'Try adjusting your filters or search query to find what you are looking for.' 
          : 'Your review history will appear here once the AI engine begins processing incoming reviews.'}
      </p>
      {hasFilters && (
        <ProButton variant="secondary" onClick={onClear}>Clear All Filters</ProButton>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { execute, loading: isProcessing } = useResilientAction();

  // ── State ──
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || null);
  const [filterRating, setFilterRating] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedReview, setSelectedReview] = useState(null);

  const plan = user?.plan || 'free';
  const limit = getPlanLimit(plan);
  const used = user?.reply_count_this_month || 0;
  const remaining = Math.max(0, limit - used);

  // ── Fetching Logic ──
  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const statusQ = filterStatus ? `&status=${filterStatus}` : '';
      const ratingQ = filterRating ? `&rating=${filterRating}` : '';
      const res = await api.get(`/reviews/history?page=${p}&per_page=${PER_PAGE}${statusQ}${ratingQ}`);
      setItems(res.items || []);
      setTotal(res.total || 0);
      setPage(p);
    } catch (err) {
      toast.error('Failed to sync history.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterRating]);

  useEffect(() => {
    fetchData(1);
    setSelectedIds(new Set());
  }, [filterStatus, filterRating, fetchData]);

  // Handle URL deep links
  useEffect(() => {
    const openId = searchParams.get('open');
    if (openId && items.length > 0) {
      const item = items.find(i => i.id === openId);
      if (item) setSelectedReview(item);
    }
  }, [items, searchParams]);

  // ── Handlers ──
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= remaining && filterStatus === 'pending') {
          toast.warning(`Credit limit reached (${remaining} remaining)`);
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    const targetIds = items.filter(i => i.status === 'pending').map(i => i.id);
    const capped = targetIds.slice(0, remaining);
    setSelectedIds(new Set(capped));
  };

  const handleBulkGenerate = async () => {
    if (selectedIds.size === 0) return;
    await execute(
      () => api.post('/reviews/bulk-generate', { review_ids: Array.from(selectedIds) }),
      {
        loadingMessage: `Processing ${selectedIds.size} reviews...`,
        successMessage: 'Bulk generation complete.',
        onSuccess: () => {
          fetchData(page);
          setSelectedIds(new Set());
          refreshUser();
        }
      }
    );
  };

  const exportCSV = () => {
    const headers = ['Reviewer', 'Rating', 'Status', 'Review', 'Reply'];
    const rows = items.map(i => [
      i.reviewer_name || 'Anonymous',
      i.rating,
      i.status,
      `"${(i.review_text || '').replace(/"/g, '""')}"`,
      `"${(i.replies?.[0]?.reply_text || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `replyiq_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen pb-32">
      {/* Header */}
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Review History</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-secondary font-medium tracking-wide bg-bg-surface px-2 py-1 rounded border border-border">
              {total} Total Reviews
            </span>
            <div className="w-1 h-1 rounded-full bg-border" />
            <span className={`text-xs font-semibold uppercase tracking-wider ${remaining < 5 ? 'text-danger' : 'text-accent'}`}>
              {remaining} Credits Remaining
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ProButton variant="secondary" size="sm" icon={Download} onClick={exportCSV}>
            Export CSV
          </ProButton>
          <ProButton variant="secondary" size="sm" icon={RefreshCw} onClick={() => fetchData(page)} isLoading={loading} />
        </div>
      </header>

      {/* Filters Hub */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 sticky top-4 z-30 px-4 py-3 bg-bg-surface border border-border rounded shadow-sm">
        <div className="flex items-center gap-4">
          <ProFilterGroup>
            {['all', 'pending', 'replied', 'failed'].map(s => {
              const active = (s === 'all' && !filterStatus) || filterStatus === s;
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s === 'all' ? null : s)}
                  className={`
                    px-4 py-1.5 rounded-md text-sm font-medium transition-colors
                    ${active ? 'bg-bg-elevated text-text-primary border border-border shadow-sm' : 'text-text-muted hover:text-text-primary border border-transparent'}
                  `}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              );
            })}
          </ProFilterGroup>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-1">
            {[5, 4, 3, 2, 1].map(r => (
              <button
                key={r}
                onClick={() => setFilterRating(filterRating === r ? null : r)}
                className={`
                  w-8 h-8 rounded-lg flex items-center justify-center transition-all
                  ${filterRating === r ? 'bg-accent/10 border-accent text-accent' : 'border border-transparent text-muted hover:bg-white/5'}
                `}
              >
                <Star size={14} fill={filterRating === r ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black text-muted uppercase">Page {page} of {Math.ceil(total / PER_PAGE) || 1}</span>
          <div className="flex items-center gap-1">
            <ProButton 
              variant="secondary" 
              size="sm" 
              disabled={page === 1} 
              onClick={() => fetchData(page - 1)}
              icon={ChevronLeft}
            />
            <ProButton 
              variant="secondary" 
              size="sm" 
              disabled={page * PER_PAGE >= total} 
              onClick={() => fetchData(page + 1)}
              icon={ChevronRight}
            />
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 w-full animate-pulse bg-white/5 rounded-xl border border-border" />
          ))
        ) : items.length > 0 ? (
          items.map(item => (
            <ProRow 
              key={item.id} 
              selected={selectedIds.has(item.id)}
              onClick={() => setSelectedReview(item)}
              className="group"
            >
              <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto_100px_auto] md:grid-cols-[auto_auto_minmax(0,1fr)_120px_100px_auto] items-center gap-4 w-full">
                {/* 1. Selection Checkbox */}
                <div className="flex items-center justify-center w-6">
                  {item.status === 'pending' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleSelect(item.id); }}
                      className={`
                        w-6 h-6 rounded flex items-center justify-center transition-all
                        ${selectedIds.has(item.id) ? 'bg-accent text-white border-accent' : 'border-2 border-border hover:border-accent/40'}
                      `}
                    >
                      {selectedIds.has(item.id) && <CheckSquare size={14} />}
                    </button>
                  )}
                </div>
                
                {/* 2. Avatar */}
                <div className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center border border-border group-hover:border-accent/20">
                  <User size={18} className="text-muted" />
                </div>

                {/* 3. Main Content (Name & Review) */}
                <div className="min-w-0 pr-4">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-bold text-primary truncate max-w-[200px]">{item.reviewer_name || 'Anonymous User'}</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={10} 
                          fill={i < item.rating ? 'var(--accent)' : 'none'} 
                          stroke={i < item.rating ? 'var(--accent)' : 'var(--text-muted)'} 
                          className={i >= item.rating ? 'opacity-30' : ''}
                        />
                      ))}
                    </div>
                  </div>
                  <p 
                    className="text-xs text-secondary line-clamp-2 max-w-3xl leading-relaxed"
                    style={{ contain: 'layout paint' }}
                  >
                    "{item.review_text || 'No review text provided.'}"
                  </p>
                </div>

                {/* 4. Date (Hidden on mobile) */}
                <div className="hidden md:flex flex-col items-end justify-center">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Received</span>
                  <span className="text-xs font-semibold text-primary">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {/* 5. Status Badge */}
                <div className="flex justify-end">
                  <ProBadge 
                    variant={
                      item.status === 'replied' ? 'success' : 
                      item.status === 'failed' ? 'danger' : 
                      item.status === 'pending' ? 'warning' : 'muted'
                    }
                  >
                    {item.status}
                  </ProBadge>
                </div>

                {/* 6. Context Menu */}
                <div className="flex justify-end pr-2">
                  <MoreVertical size={16} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </ProRow>
          ))
        ) : (
          <EmptyState 
            hasFilters={!!(filterStatus || filterRating)} 
            onClear={() => { setFilterStatus(null); setFilterRating(null); }} 
          />
        )}
      </div>

      {/* Floating Bulk Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-4 bg-bg-elevated text-text-primary rounded-lg shadow-md flex items-center gap-6 border border-border w-11/12 max-w-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-accent text-bg-base flex items-center justify-center font-bold">
                {selectedIds.size}
              </div>
              <div className="text-sm">
                <p className="font-semibold text-text-primary tracking-tight">Reviews Selected</p>
                <p className="text-xs text-text-secondary">Ready for processing</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-border mx-auto" />
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSelectedIds(new Set())}
                className="px-4 py-2 text-sm font-medium hover:bg-bg-surface rounded-md transition-colors text-text-secondary border border-transparent hover:border-border"
              >
                Cancel
              </button>
              <ProButton 
                onClick={handleBulkGenerate} 
                isLoading={isProcessing}
                variant="primary"
              >
                Process Batch
              </ProButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={null}>
        {selectedReview && (
          <ReviewModal 
            item={selectedReview} 
            onClose={() => setSelectedReview(null)} 
            onSuccess={() => fetchData(page)}
          />
        )}
      </Suspense>
    </div>
  );
}
