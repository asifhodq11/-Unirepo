import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Bot, Clock, Lightbulb, Copy, Check } from 'lucide-react';

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

  const modelLabel = reply.model_used?.split('/').pop() ?? 'AI';
  const ms = reply.generation_ms ?? 0;
  const secs = (ms / 1000).toFixed(1);

  return (
    <motion.div 
      ref={cardRef} 
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, type: "spring", bounce: 0.4 }}
    >
      {/* Review context bar */}
      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-3)' }}>
        <div className="flex text-accent">
          {Array.from({ length: review.star_rating }).map((_, i) => (
            <Star key={i} size={16} fill="currentColor" />
          ))}
        </div>
        {review.reviewer_name && (
          <span className="text-sm text-muted">— {review.reviewer_name}</span>
        )}
        <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Reply ready</span>
      </div>

      {/* Reply output — cooler teal "Result Zone" distinct from action indigo */}
      <div className="reply-output">
        <p className="reply-text" id="reply-text-output">{reply.reply_text}</p>

        <div className="reply-meta">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 font-medium"><Bot size={14} /> {modelLabel}</span>
            <span className="flex items-center gap-1"><Clock size={14} /> {secs}s</span>
          </div>
          <button
            id="copy-reply-btn"
            className={`btn btn-sm ${copied ? 'btn-secondary text-success' : 'btn-primary'}`}
            onClick={handleCopy}
            style={{ width: '130px' }}
          >
            {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy reply</>}
          </button>
        </div>
      </div>

      {/* Tip */}
      <p className="text-xs text-muted" style={{ marginTop: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
        <Lightbulb size={14} className="text-warning" /> This reply passed a 3-pass humaniser pipeline — always read before posting.
      </p>
    </motion.div>
  );
}
