import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const STARS = [1, 2, 3, 4, 5];

const STAR_HINTS = {
  1: '😤 Angry — needs empathy first',
  2: '😞 Disappointed — offer resolution',
  3: '😐 Mixed — acknowledge both sides',
  4: '🙂 Positive — reinforce the good',
  5: '🤩 Excellent — express real gratitude',
};

export default function ReplyGenerator({ onGenerate, loading, disabled, slow }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    rating: 5,
    review_text: '',
    reviewer_name: '',
    google_review_id: '',
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setRating = (r) => setForm(f => ({ ...f, rating: r }));

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      google_review_id: form.google_review_id || `manual_${Date.now()}`,
    };
    onGenerate(payload);
  }

  return (
    <div className="card" style={{ contain: 'layout' }}>
      {/* Business context strip — spacing: space-5 bottom (one step from card padding space-6) */}
      <div
        className="flex items-center gap-2"
        style={{ marginBottom: 'var(--space-5)', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border)' }}
      >
        <span className="text-xs text-muted">Replying as:</span>
        <span className="badge badge-accent">{user?.business_name ?? 'Your Business'}</span>
        <span className="badge badge-muted" style={{ textTransform: 'capitalize' }}>{user?.tone_preference ?? 'friendly'}</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Star rating */}
        <div className="form-group">
          <label className="form-label">Star rating</label>
          <div className="star-group">
            {STARS.map(s => (
              <button
                type="button"
                key={s}
                id={`star-${s}`}
                className={`star-btn ${form.rating >= s ? 'active' : ''}`}
                onClick={() => setRating(s)}
                aria-label={`${s} star${s > 1 ? 's' : ''}`}
              >
                ⭐
              </button>
            ))}
          </div>
          {form.rating && (
            <p className="form-hint">{STAR_HINTS[form.rating]}</p>
          )}
        </div>

        {/* Review text */}
        <div className="form-group">
          <label className="form-label">Review text <span className="text-muted">(optional)</span></label>
          <textarea
            id="review-text"
            className="form-textarea"
            placeholder="Paste the customer's review here… or leave empty for rating-only replies."
            value={form.review_text}
            onChange={set('review_text')}
            rows={4}
          />
        </div>

        {/* Reviewer name */}
        <div className="form-group">
          <label className="form-label">Reviewer name <span className="text-muted">(optional)</span></label>
          <input
            id="reviewer-name"
            type="text"
            className="form-input"
            placeholder="Sarah M."
            value={form.reviewer_name}
            onChange={set('reviewer_name')}
          />
          <p className="form-hint">Used to personalise the reply.</p>
        </div>

        {/* Submit */}
        <button
          id="generate-submit"
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading || disabled}
          style={{ alignSelf: 'flex-start', minWidth: '180px' }}
        >
          {loading ? (
            <>
              <span className="spinner" />
              {slow ? 'Still generating…' : 'Generating…'}
            </>
          ) : '✨ Generate Reply'}
        </button>
      </form>
    </div>
  );
}
