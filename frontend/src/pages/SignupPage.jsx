import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

const TONE_OPTIONS = ['friendly', 'professional', 'casual'];
const BUSINESS_TYPES = [
  'Restaurant', 'Hotel', 'Retail Store', 'Café', 'Salon/Spa',
  'Medical Practice', 'Legal Firm', 'Gym/Fitness', 'Automotive', 'Other',
];

export default function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
    business_name: '',
    business_type: '',
    tone_preference: 'friendly',
  });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await signup(form);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page" style={{ padding: '2rem 1rem' }}>
      <div className="auth-card" style={{ maxWidth: '480px' }}>
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">💬</div>
          <span className="auth-logo-name">ReplyIQ</span>
        </div>

        <h2 style={{ marginBottom: '0.25rem' }}>Start for free</h2>
        <p className="text-sm text-muted" style={{ marginBottom: '1.75rem' }}>
          Turn reviews into authentic, human replies — instantly.
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Business info */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Business name</label>
              <input
                id="signup-business-name"
                type="text"
                className="form-input"
                placeholder="Bella Italia"
                value={form.business_name}
                onChange={set('business_name')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business type</label>
              <select
                id="signup-business-type"
                className="form-input form-select"
                value={form.business_type}
                onChange={set('business_type')}
                required
              >
                <option value="" disabled>Select…</option>
                {BUSINESS_TYPES.map(t => (
                  <option key={t} value={t.toLowerCase()}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tone preference */}
          <div className="form-group">
            <label className="form-label">Reply tone</label>
            <div className="flex gap-2">
              {TONE_OPTIONS.map(t => (
                <button
                  key={t}
                  type="button"
                  id={`tone-${t}`}
                  onClick={() => setForm(f => ({ ...f, tone_preference: t }))}
                  className={`btn btn-sm ${form.tone_preference === t ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, textTransform: 'capitalize' }}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="form-hint">You can change this later in settings.</p>
          </div>

          <hr className="divider" />

          {/* Account credentials */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              id="signup-email"
              type="email"
              className="form-input"
              placeholder="you@business.com"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="signup-password"
              type="password"
              className="form-input"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set('password')}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <button
            id="signup-submit"
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={loading}
            style={{ marginTop: '0.25rem' }}
          >
            {loading ? <><span className="spinner" /> Creating account…</> : 'Create free account'}
          </button>
        </form>

        <p className="text-sm text-center text-muted" style={{ marginTop: '1.25rem' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium" style={{ color: 'var(--accent-hover)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
