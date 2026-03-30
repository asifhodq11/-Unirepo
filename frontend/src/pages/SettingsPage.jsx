import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, CreditCard, AlertTriangle, CheckCircle, Settings, User, Activity, Zap, Shield, MessageSquare } from 'lucide-react';
import { getPlanLimitDisplay, TONE_OPTIONS, PLAN_LABELS } from '../utils/plans';
import PricingModal from '../components/modals/PricingModal';
import GoogleConnectionModal from '../components/modals/GoogleConnectionModal';

const CANCEL_REASONS = [
  'Too expensive for my needs',
  'Missing features I need',
  'Technical issues / bugs',
  'Switching to a competitor',
  'Business closed / paused',
  'Other',
];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ business_name: '', tone_preference: 'friendly' });
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading]     = useState(false);
  const [cancelLoading, setCancelLoading]     = useState(false);

  // Churn Shield state machine
  const [cancelStep, setCancelStep]     = useState(0);
  const [cancelReason, setCancelReason] = useState('');

  // Pricing & Google Modals
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal]   = useState(false);

  // Autonomy Dial (Pro plan only)
  const [autonomyLimit, setAutonomyLimit] = useState(20);
  const [autonomySaving, setAutonomySaving] = useState(false);
  const [autonomySaved, setAutonomySaved]   = useState(false);

  useEffect(() => {
    if (user?.daily_autonomy_limit) {
      setAutonomyLimit(user.daily_autonomy_limit);
    }
  }, [user]);

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

  async function handleUpgrade(targetPlan) {
    setCheckoutLoading(true); setError('');
    try {
      const data = await api.post('/payments/checkout', { plan: targetPlan });
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

  async function handleFinalCancel() {
    setCancelLoading(true); setError('');
    try {
      await api.post('/payments/cancel', { reason: cancelReason || 'User initiated' });
      await refreshUser();
      setCancelStep(0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to cancel subscription.');
    } finally { setCancelLoading(false); }
  }

  async function handleSaveAutonomy() {
    setAutonomySaving(true);
    try {
      await api.patch('/settings/', { daily_autonomy_limit: autonomyLimit });
      await refreshUser();
      setAutonomySaved(true);
      setTimeout(() => setAutonomySaved(false), 2000);
    } catch {
      setError('Failed to save daily limit.');
    } finally { setAutonomySaving(false); }
  }

  const plan = user?.plan ?? 'free';
  const used = user?.reply_count_this_month ?? 0;
  const limitDisplay = getPlanLimitDisplay(plan);

  return (
    <motion.div 
      className="page-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
    >
      <motion.div style={{ marginBottom: 'var(--space-8)' }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ marginBottom: 'var(--space-2)' }} className="flex items-center gap-3">
          <Settings size={32} className="text-accent" /> Settings
        </h1>
        <p className="text-secondary">Manage your business profile, reply tone, and subscription plan.</p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>
            <AlertTriangle size={18} /> {error}
          </motion.div>
        )}
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="alert alert-success" style={{ marginBottom: 'var(--space-5)' }}>
            <CheckCircle size={18} /> Settings saved successfully.
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2-Column Bento Grid Layout */}
      <div className="app-bento-grid">
        
        {/* Left Column: Core Settings */}
        <div className="flex flex-col gap-6">
          <motion.div className="card card-glass" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h3 style={{ marginBottom: 'var(--space-5)' }} className="flex items-center gap-2">
              <User size={18} className="text-muted" /> Business Profile
            </h3>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label" style={{ opacity: 0.7 }}>Business Name</label>
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
                <label className="form-label" style={{ opacity: 0.7 }}>Reply Tone</label>
                <div 
                  className="flex items-center gap-1 p-1 rounded-md" 
                  style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', flexWrap: 'wrap' }}
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
                {saving ? <><span className="spinner" /> Saving…</> : 'Save Changes'}
              </button>
            </form>
          </motion.div>

          <motion.div className="grid-2 gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="card card-glass flex-col justify-between" style={{ minHeight: '130px' }}>
              <div className="flex items-center gap-2 text-muted mb-2"><Activity size={16} className="text-accent-cyan" /> <span>Usage This Month</span></div>
              <div className="flex items-baseline gap-1">
                <span style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }} className="text-gradient">{used}</span>
                <span className="text-muted">/ {limitDisplay}</span>
              </div>
            </div>
            <div className="card card-glass flex-col justify-between" style={{ minHeight: '130px' }}>
              <div className="flex items-center gap-2 text-muted mb-2"><Zap size={16} className="text-success" /> <span>Google Connection</span></div>
              <div className="flex flex-col gap-2 items-start w-full">
                {user?.google_status === 'degraded' 
                  ? <>
                      <span className="badge badge-warning flex items-center gap-1 mb-1" style={{ padding: '6px 12px', fontSize: '0.8rem' }}><AlertTriangle size={14} /> Access Revoked</span>
                      <button className="btn btn-sm btn-secondary w-full flex justify-center w-full" onClick={() => setShowGoogleModal(true)}>
                        Reconnect Business
                      </button>
                    </>
                  : user?.google_connected 
                  ? <span className="badge badge-success flex items-center gap-1" style={{ padding: '6px 12px', fontSize: '0.8rem' }}><CheckCircle size={14} /> Connected</span> 
                  : <>
                      <span className="badge badge-muted mb-1" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Not connected</span>
                      <button className="btn btn-sm btn-primary w-full flex justify-center w-full" onClick={() => setShowGoogleModal(true)}>
                        Connect Business
                      </button>
                    </>
                }
              </div>
            </div>
          </motion.div>

          {/* Autonomy Dial — Pro plan only */}
          {plan === 'pro' && (
            <motion.div
              className="card card-glass"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
                <h3 className="flex items-center gap-2">
                  <Zap size={18} className="text-accent-cyan" /> Daily Reply Limit
                </h3>
                <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>PRO</span>
              </div>
              <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
                Set your daily auto-reply limit. When reached, overflow reviews are queued for manual review.
              </p>

              <div className="flex items-center gap-4" style={{ marginBottom: 'var(--space-3)' }}>
                <input
                  type="range"
                  min={5}
                  max={200}
                  step={5}
                  value={autonomyLimit}
                  onChange={e => setAutonomyLimit(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                />
                <span style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 10px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  minWidth: '52px',
                  textAlign: 'center',
                  color: 'var(--accent-cyan)',
                }}>
                  {autonomyLimit}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">replies / day</span>
                <button
                  className={`btn btn-sm ${autonomySaved ? 'btn-secondary text-success' : 'btn-primary'}`}
                  onClick={handleSaveAutonomy}
                  disabled={autonomySaving}
                  style={{ minWidth: '100px' }}
                >
                  {autonomySaving
                    ? <><span className="spinner" /> Saving…</>
                    : autonomySaved
                      ? <><span>✓</span> Saved</>
                      : 'Save Limit'
                  }
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column: Billing & Subscription */}
        <motion.div className="flex flex-col h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="card card-glass flex flex-col items-start justify-center" style={{ flex: 1, border: '1px solid var(--accent-subtle)' }}>
            <div className="flex items-center justify-between w-full mb-6">
              <h3 className="flex items-center gap-2">
                <CreditCard size={18} className="text-muted" /> Subscription Plan
              </h3>
              <span className={`badge ${
                plan === 'pro' ? 'badge-success' :
                plan === 'starter' ? 'badge-accent' : 'badge-muted'
              }`} style={{ fontSize: '0.85rem' }}>
                {PLAN_LABELS[plan]?.toUpperCase() || plan.toUpperCase()}
              </span>
            </div>
            
            {/* ── Billing Actions ─────────────────────────────── */}
            <div className="flex flex-col gap-3 w-full mt-2">
              <p className="text-sm text-secondary" style={{ lineHeight: 1.6 }}>
                {plan === 'ultra'
                  ? 'You are on the Ultra plan — the highest tier. Unlimited replies, VIP support, and custom brand models.'
                  : plan === 'pro'
                  ? 'You are on the Pro plan. Your auto-reply heartbeat runs 24/7, capped by your daily limit in settings.'
                  : plan === 'starter'
                  ? 'You are on the Starter plan. Reviews are collected automatically — you generate replies on demand.'
                  : 'You are on the Free plan. Upgrade anytime to unlock automation.'
                }
              </p>

              {user?.subscription_end && plan !== 'free' && (
                <div style={{ marginTop: '4px', fontSize: '0.85rem' }} className="flex items-center gap-1 text-muted">
                  {user.cancellation_reason ? (
                    <span className="text-warning">Plan cancels on:</span>
                  ) : (
                    <span>Current period ends:</span>
                  )}
                  <strong className="text-primary">{new Date(user.subscription_end).toLocaleDateString()}</strong>
                </div>
              )}

              {/* Single unified upgrade / manage button */}
              {plan !== 'ultra' ? (
                <button
                  id="manage-plan-btn"
                  className="btn btn-primary"
                  style={{ fontSize: '0.9rem', alignSelf: 'flex-start' }}
                  onClick={() => setShowPricingModal(true)}
                >
                  <ArrowUpRight size={16} style={{ marginRight: 6 }} />
                  Upgrade Plan
                </button>
              ) : (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: 8, padding: '8px 14px', fontSize: '0.85rem',
                  color: 'var(--accent)', fontWeight: 600,
                }}>
                  ✓ You are on Ultra — the highest tier
                </div>
              )}

              {/* Billing portal + cancel (for paid plans) */}
              {plan !== 'free' && (
                <div className="flex flex-wrap gap-3 btn-stack-mobile" style={{ marginTop: 4 }}>
                  <button id="billing-portal-btn" className="btn btn-secondary flex-1" disabled={portalLoading} onClick={handlePortal}>
                    {portalLoading ? <><span className="spinner" /> Connecting…</> : 'Billing Portal'}
                  </button>
                  <button id="cancel-plan-btn" className="btn btn-ghost btn-danger flex-1" onClick={() => setCancelStep(1)}>
                    Cancel Plan
                  </button>
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════════════
                3-STEP CHURN SHIELD
            ═══════════════════════════════════════════════════ */}
            <AnimatePresence>
              {cancelStep > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full"
                  style={{ marginTop: 'var(--space-5)' }}
                >
                  {/* Step 1: Loss Aversion */}
                  {cancelStep === 1 && (
                    <motion.div 
                      className="card" 
                      style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 'var(--space-5)' }}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '10px', borderRadius: '50%' }}>
                          <Shield size={22} style={{ color: '#ef4444' }} />
                        </div>
                        <div>
                          <h4 style={{ color: '#ef4444', marginBottom: '2px' }}>Are you sure?</h4>
                          <p className="text-xs text-muted">Cancelling will remove your AI-powered review protection</p>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                        <p className="text-sm" style={{ lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                          You've generated <strong style={{ color: 'var(--text-primary)' }}>{used} AI replies</strong> this month. 
                          Without ReplyIQ, every new review will go unanswered — and unanswered reviews 
                          reduce customer trust by up to <strong style={{ color: '#ef4444' }}>45%</strong>.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3 btn-stack-mobile">
                        <button className="btn btn-primary flex-1" onClick={() => setCancelStep(0)}>
                          Keep My Plan
                        </button>
                        <button className="btn btn-ghost text-sm flex-1" style={{ opacity: 0.6 }} onClick={() => setCancelStep(2)}>
                          Continue anyway →
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Safety Net / Downgrade Path */}
                  {cancelStep === 2 && (
                    <motion.div 
                      className="card" 
                      style={{ background: 'rgba(124, 58, 237, 0.06)', border: '1px solid rgba(124, 58, 237, 0.2)', padding: 'var(--space-5)' }}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div style={{ background: 'rgba(124, 58, 237, 0.15)', padding: '10px', borderRadius: '50%' }}>
                          <ArrowUpRight size={22} style={{ color: '#7c3aed', transform: 'rotate(180deg)' }} />
                        </div>
                        <div>
                          <h4 style={{ color: '#7c3aed', marginBottom: '2px' }}>Switch to Free</h4>
                          <p className="text-xs text-muted">Keep your history at zero cost</p>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)', border: '1px dashed rgba(124, 58, 237, 0.3)' }}>
                        <p className="text-sm" style={{ lineHeight: '1.7', color: 'var(--text-secondary)' }}>
                          Instead of cancelling, switch to the <strong style={{ color: '#7c3aed' }}>Free plan ($0/mo)</strong>. 
                          You'll keep your account data, history, and settings. 
                        </p>
                        <p className="text-xs text-muted mt-2">
                          Auto-reply and bulk generation will be disabled on the free plan.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3 btn-stack-mobile">
                        <button 
                          className="btn btn-primary flex-1"
                          onClick={() => {
                            handlePortal();
                          }}
                        >
                          Switch to Free Plan
                        </button>
                        <button className="btn btn-ghost text-sm flex-1" style={{ opacity: 0.6 }} onClick={() => setCancelStep(3)}>
                          Continue cancellation →
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Exit Survey + Final Confirm */}
                  {cancelStep === 3 && (
                    <motion.div 
                      className="card" 
                      style={{ background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)', padding: 'var(--space-5)' }}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '50%' }}>
                          <MessageSquare size={22} style={{ color: '#ef4444' }} />
                        </div>
                        <div>
                          <h4 style={{ color: '#ef4444', marginBottom: '2px' }}>One last thing</h4>
                          <p className="text-xs text-muted">Help us improve — why are you leaving?</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2" style={{ marginBottom: 'var(--space-4)' }}>
                        {CANCEL_REASONS.map(reason => (
                          <label 
                            key={reason} 
                            className="flex items-center gap-3 text-sm"
                            style={{ 
                              padding: '10px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                              background: cancelReason === reason ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                              border: cancelReason === reason ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border)',
                              transition: 'all 0.2s',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <input 
                              type="radio" 
                              name="cancel-reason" 
                              value={reason}
                              checked={cancelReason === reason}
                              onChange={() => setCancelReason(reason)}
                              style={{ accentColor: '#ef4444' }}
                            />
                            {reason}
                          </label>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-3 btn-stack-mobile">
                        <button className="btn btn-secondary flex-1" onClick={() => setCancelStep(0)}>
                          Nevermind, Keep Plan
                        </button>
                        <button 
                          id="confirm-cancel-btn" 
                          className="btn btn-danger flex-1" 
                          disabled={cancelLoading || !cancelReason} 
                          onClick={handleFinalCancel}
                          style={{ opacity: cancelReason ? 1 : 0.4 }}
                        >
                          {cancelLoading ? <><span className="spinner" /> Processing…</> : 'Confirm Cancellation'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>

      {/* Pricing Modal — mounted at page root to avoid z-index issues */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        currentPlan={plan}
      />
      
      {/* Google Connection Modal */}
      <GoogleConnectionModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
      />
    </motion.div>
  );
}
