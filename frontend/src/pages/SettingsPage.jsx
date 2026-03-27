import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, CreditCard, AlertTriangle, CheckCircle, Settings, User, Activity, Zap } from 'lucide-react';

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
    <motion.div 
      className="page-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <motion.div style={{ marginBottom: 'var(--space-8)' }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ marginBottom: 'var(--space-2)' }} className="flex items-center gap-3">
          <Settings size={32} className="text-accent" /> Control Center
        </h1>
        <p className="text-secondary">Manage your business profile, telemetry, and active intelligence plan.</p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>
            <AlertTriangle size={18} /> {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="alert alert-success" style={{ marginBottom: 'var(--space-5)' }}>
            <CheckCircle size={18} /> Settings synchronized via uplink.
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2-Column Bento Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) minmax(350px, 1fr)', gap: 'var(--space-6)', alignItems: 'start' }}>
        
        {/* Left Column: Core Settings */}
        <div className="flex flex-col gap-6">
          <motion.div className="card card-glass" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h3 style={{ marginBottom: 'var(--space-5)' }} className="flex items-center gap-2">
              <User size={18} className="text-muted" /> Business Profile
            </h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label" style={{ opacity: 0.7 }}>Business Identity</label>
                <input
                  id="settings-business-name"
                  type="text"
                  className="form-input"
                  value={form.business_name}
                  onChange={e => set('business_name')(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ opacity: 0.7 }}>Primary Personality Matrix</label>
                <div 
                  className="flex items-center gap-1 p-1 rounded-full" 
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                >
                  {TONE_OPTIONS.map(t => (
                    <button
                      key={t}
                      type="button"
                      id={`tone-setting-${t}`}
                      onClick={() => set('tone_preference')(t)}
                      className="star-btn flex items-center justify-center"
                      style={{ 
                        flex: 1, padding: 'var(--space-2)', borderRadius: '999px',
                        background: form.tone_preference === t ? 'var(--bg-surface)' : 'transparent',
                        color: form.tone_preference === t ? 'var(--text-primary)' : 'var(--text-muted)',
                        boxShadow: form.tone_preference === t ? 'var(--shadow-sm)' : 'none',
                        textTransform: 'capitalize', fontSize: '0.85rem', fontWeight: 500,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button id="save-settings" type="submit" className="btn btn-primary mt-2" disabled={saving}>
                {saving ? <><span className="spinner" /> Syncing…</> : 'Save Configuration'}
              </button>
            </form>
          </motion.div>

          <motion.div className="grid-2 gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="card card-glass flex-col justify-between" style={{ minHeight: '130px' }}>
              <div className="flex items-center gap-2 text-muted mb-2"><Activity size={16} className="text-accent-cyan" /> <span>Replies Cycle</span></div>
              <div className="flex items-baseline gap-1">
                <span style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }} className="text-gradient">{user?.reply_count_this_month ?? 0}</span>
                <span className="text-muted">/ {plan === 'starter' ? '100' : '3'}</span>
              </div>
            </div>
            <div className="card card-glass flex-col justify-between" style={{ minHeight: '130px' }}>
              <div className="flex items-center gap-2 text-muted mb-2"><Zap size={16} className="text-success" /> <span>Google Hook</span></div>
              <div>
                {user?.google_connected 
                  ? <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Active Sync</span> 
                  : <span className="badge badge-muted" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Not connected</span>
                }
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Billing & Subscription */}
        <motion.div className="flex flex-col h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="card card-glass flex flex-col items-start justify-center" style={{ flex: 1, border: '1px solid var(--accent-subtle)' }}>
            <div className="flex items-center justify-between w-full mb-6">
              <h3 className="flex items-center gap-2">
                <CreditCard size={18} className="text-muted" /> Active Protocol
              </h3>
              <span className={`badge ${plan === 'starter' ? 'badge-accent' : 'badge-muted'}`} style={{ fontSize: '0.85rem' }}>
                {plan === 'starter' ? 'STARTER TIER' : 'FREE TIER'}
              </span>
            </div>
            
            {plan === 'free' ? (
              <div className="w-full">
                <div className="alert flex items-start gap-4" style={{ marginBottom: 'var(--space-6)', background: 'transparent', border: '1px dashed var(--accent)', padding: 'var(--space-5)' }}>
                  <div style={{ background: 'var(--accent)', color: '#000', padding: '10px', borderRadius: '50%' }}>
                    <Rocket size={24} />
                  </div>
                  <div>
                    <h4 className="text-gradient" style={{ marginBottom: '4px' }}>Level Up to Starter</h4>
                    <p className="text-sm text-secondary" style={{ lineHeight: '1.6' }}>
                      Unlock 100 intelligent replies per month, priority queue processing, and automated approval workflows.
                    </p>
                  </div>
                </div>
                <button id="upgrade-btn" className="btn btn-primary w-full" style={{ padding: '16px', fontSize: '1rem', background: 'linear-gradient(45deg, var(--accent), var(--accent-cyan))' }} disabled={checkoutLoading} onClick={handleUpgrade}>
                  {checkoutLoading ? <><span className="spinner" /> Authorizing Gateway…</> : '⚡ Engage Starter Protocol'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 w-full mt-4">
                <p className="text-sm text-secondary mb-4">You are currently operating on the high-bandwidth Starter tier. Manage your billing details or downgrade through the secure portal.</p>
                <div className="flex gap-3 mt-auto">
                  <button id="billing-portal-btn" className="btn btn-secondary flex-1" disabled={portalLoading} onClick={handlePortal}>
                    {portalLoading ? <><span className="spinner" /> Connecting…</> : 'Access Billing Portal'}
                  </button>
                  <button id="cancel-plan-btn" className="btn btn-ghost btn-danger" onClick={() => setShowCancel(true)}>
                    Terminate Plan
                  </button>
                </div>
              </div>
            )}

            <AnimatePresence>
              {showCancel && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full"
                >
                  <div className="alert alert-error" style={{ marginTop: 'var(--space-5)', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                    <p className="text-sm"><strong>⚠️ Attention:</strong> Down-leveling to the Free Tier will restrict you to 3 operations per cycle. Your current plan stays active until cycle end.</p>
                    <div className="flex gap-2 w-full">
                      <button id="confirm-cancel-btn" className="btn btn-danger flex-1" disabled={cancelLoading} onClick={handleCancel}>
                        {cancelLoading ? <><span className="spinner" /> Processing…</> : 'Confirm Termination'}
                      </button>
                      <button className="btn btn-secondary flex-1" onClick={() => setShowCancel(false)}>Abort</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
