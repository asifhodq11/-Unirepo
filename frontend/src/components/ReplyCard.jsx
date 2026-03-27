import { useState, useRef, useEffect } from 'react';

export default function ReplyCard({ reply, review }) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef(null);

  // Scroll into view on mount (smooth expand — prevent page jump)
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reply.reply_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = reply.reply_text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const starLabel = '⭐'.repeat(review.star_rating);
  const modelLabel = reply.model_used?.split('/').pop() ?? 'AI';
  const ms = reply.generation_ms ?? 0;
  const secs = (ms / 1000).toFixed(1);

  return (
    <div ref={cardRef} className="t-dissolve">
      {/* Review context bar */}
      <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-3)' }}>
        <span style={{ fontSize: '1rem', letterSpacing: '-2px' }}>{starLabel}</span>
        {review.reviewer_name && (
          <span className="text-sm text-muted">— {review.reviewer_name}</span>
        )}
        <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Reply ready</span>
      </div>

      {/* Reply output — cooler teal "Result Zone" distinct from action indigo */}
      <div className="reply-output">
        <p className="reply-text" id="reply-text-output">{reply.reply_text}</p>

        <div className="reply-meta">
          <div className="flex items-center gap-3">
            <span>🤖 {modelLabel}</span>
            <span>⏱ {secs}s</span>
          </div>
          <button
            id="copy-reply-btn"
            className={`btn btn-sm ${copied ? 'btn-secondary' : 'btn-primary'}`}
            onClick={handleCopy}
          >
            {copied ? '✓ Copied!' : '📋 Copy reply'}
          </button>
        </div>
      </div>

      {/* Tip */}
      <p className="text-xs text-muted" style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
        <span>💡</span> This reply passed a 3-pass humaniser pipeline — always read before posting.
      </p>
    </div>
  );
}
