import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';

const TONE_OPTIONS = ['friendly', 'professional', 'casual'];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ business_name: '', tone_preference: 'friendly' });
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading]     = useState(false);
  const [cancelLoading, setCancelLoading]     = useState(false);
  const [showCancel, setShowCancel]           = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        business_name:   user.business_name  ?? '',
        tone_preference: user.tone_preference ?? 'friendly',
      });
    }
  }, [user]);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess(false);
    try {
      await api.patch('/settings/', form);
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save settings.');
    } finally { setSaving(false); }
  }

  async function handleUpgrade() {
    setCheckoutLoading(true); setError('');
    try {
      const data = await api.post('/payments/checkout', { plan: 'starter' });
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start checkout.');
      setCheckoutLoading(false);
    }
  }

  async function handlePortal() {
    setPortalLoading(true); setError('');
    try {
      const data = await api.get('/payments/portal');
      window.location.href = data.portal_url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not open billing portal.');
      setPortalLoading(false);
    }
  }

  async function handleCancel() {
    setCancelLoading(true); setError('');
    try {
      await api.post('/payments/cancel', { reason: 'User initiated' });
      await refreshUser();
      setShowCancel(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to cancel subscription.');
    } finally { setCancelLoading(false); }
  }

  const plan = user?.plan ?? 'free';

  return (
    <div className="page-content">
      <h1 style={{ marginBottom: 'var(--space-2)' }}>Settings</h1>
      <p className="text-secondary" style={{ marginBottom: 'var(--space-8)' }}>Manage your business profile and subscription.</p>

      {error   && <div className="alert alert-error t-smash-cut"   style={{ marginBottom: 'var(--space-5)' }}><span>⚠</span> {error}</div>}
      {success && <div className="alert alert-success t-dissolve" style={{ marginBottom: 'var(--space-5)' }}><span>✓</span> Settings saved.</div>}

      {/* Profile */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-5)' }}>Business Profile</h3>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label">Business name</label>
            <input
              id="settings-business-name"
              type="text"
              className="form-input"
              value={form.business_name}
              onChange={e => set('business_name')(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Reply tone</label>
            <div className="flex gap-2">
              {TONE_OPTIONS.map(t => (
                <button
                  key={t}
                  type="button"
                  id={`tone-setting-${t}`}
                  onClick={() => set('tone_preference')(t)}
                  className={`btn btn-sm ${form.tone_preference === t ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, textTransform: 'capitalize' }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button id="save-settings" type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start' }}>
            {saving ? <><span className="spinner" /> Saving…</> : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Read-only stats */}
      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Usage & Plan</h3>
        <div className="grid-3" style={{ marginBottom: 'var(--space-3)' }}>
          {[
            { label: 'Plan',              value: <span className={`badge ${plan === 'starter' ? 'badge-accent' : 'badge-muted'}`}>{plan}</span> },
            { label: 'Replies this month', value: user?.reply_count_this_month ?? 0 },
            { label: 'Google status',     value: user?.google_connected ? <span className="badge badge-success">Connected</span> : <span className="badge badge-muted">Not connected</span> },
          ].map(({ label, value }) => (
            <div key={label} className="card" style={{ background: 'var(--bg-elevated)', textAlign: 'center', contain: 'layout' }}>
              <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-1)' }}>{label}</p>
              <div className="font-medium">{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Billing — pre-allocated region for CLS */}
      <div className="card" style={{ minHeight: '140px', contain: 'layout' }}>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Billing</h3>
        {plan === 'free' ? (
          <div>
            <div className="alert alert-info" style={{ marginBottom: 'var(--space-4)' }}>
              <span>🚀</span>
              <div>
                <strong>Upgrade to Starter</strong>
                <p className="text-sm" style={{ marginTop: 'var(--space-1)', color: 'inherit', opacity: 0.85 }}>
                  Get 100 replies/month, priority processing, and approval workflows.
                </p>
              </div>
            </div>
            <button id="upgrade-btn" className="btn btn-primary" disabled={checkoutLoading} onClick={handleUpgrade}>
              {checkoutLoading ? <><span className="spinner" /> Redirecting…</> : '⚡ Upgrade to Starter'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button id="billing-portal-btn" className="btn btn-secondary" disabled={portalLoading} onClick={handlePortal}>
              {portalLoading ? <><span className="spinner" /> Opening…</> : '💳 Manage Billing'}
            </button>
            <button id="cancel-plan-btn" className="btn btn-ghost btn-danger" onClick={() => setShowCancel(true)}>
              Cancel plan
            </button>
          </div>
        )}

        {/* Cancel confirmation — smash-cut in, dissolve out */}
        {showCancel && (
          <div className="alert alert-error t-smash-cut" style={{ marginTop: 'var(--space-4)', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
            <p className="text-sm"><strong>Are you sure?</strong> Your plan stays active until the end of the billing period.</p>
            <div className="flex gap-2">
              <button id="confirm-cancel-btn" className="btn btn-danger btn-sm" disabled={cancelLoading} onClick={handleCancel}>
                {cancelLoading ? <><span className="spinner" /> Cancelling…</> : 'Yes, cancel'}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowCancel(false)}>Keep plan</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
