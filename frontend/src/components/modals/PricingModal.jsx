import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Zap, Star, ArrowRight, Crown } from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../hooks/useToast';

// ─── Plan Definitions ────────────────────────────────────────────
const PLANS = [
  {
    key: 'free',
    name: 'Free Tier',
    tagline: 'Kick the tires',
    price: '$0',
    period: '/mo',
    features: ['5 manual AI replies', 'History dashboard'],
    buttonLabel: 'Start Free',
    highlight: false,
    icon: <Star size={18} />,
  },
  {
    key: 'starter',
    name: 'Starter',
    tagline: 'Semi-automation',
    price: '$19',
    period: '/mo',
    features: ['100 AI replies/mo', 'Manual hold & review', 'Tone customization'],
    buttonLabel: 'Get Starter',
    highlight: false,
    icon: <Zap size={18} />,
  },
  {
    key: 'pro',
    name: 'Pro',
    tagline: 'Zero-touch operations',
    price: '$25',
    period: '/mo',
    features: ['100 Autonomous replies', 'Fully automated publishing', 'Smart circuit breakers'],
    buttonLabel: 'Upgrade to Pro',
    highlight: true,
    icon: <ArrowRight size={18} />,
  },
  {
    key: 'ultra',
    name: 'Ultra',
    tagline: 'Scale without limits',
    price: '$59',
    period: '/mo',
    features: ['Unlimited auto replies (500)', 'VIP dedicated support', 'Custom brand models'],
    buttonLabel: 'Go Ultra',
    highlight: false,
    icon: <Crown size={18} />,
  },
];

// ─── Plan Tier Order (for upgrade/downgrade logic) ───────────────
const PLAN_ORDER = ['free', 'starter', 'pro', 'ultra'];


// ─── Component ───────────────────────────────────────────────────
export default function PricingModal({ isOpen, onClose, currentPlan = 'free' }) {
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState(null);

  async function handleUpgrade(planKey) {
    if (planKey === currentPlan || planKey === 'free') return;

    setLoadingPlan(planKey);
    try {
      const data = await api.post('/payments/checkout', { plan: planKey });
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast('Could not start checkout. Please try again.', 'error');
      }
    } catch (err) {
      toast(err.message || 'Checkout failed. Please try again.', 'error');
    } finally {
      setLoadingPlan(null);
    }
  }

  function getButtonProps(plan, currentPlan, loadingPlan) {
    const cardIdx    = PLAN_ORDER.indexOf(plan.key);
    const currentIdx = PLAN_ORDER.indexOf(currentPlan || 'free');

    // ── Current plan ────────────────────────────────────────────
    if (plan.key === currentPlan) {
      return {
        label: '✓ Current Plan',
        disabled: true,
        style: {
          background: 'rgba(99,102,241,0.12)',
          color: 'var(--accent)',
          border: '1px solid rgba(99,102,241,0.3)',
          cursor: 'default',
          fontWeight: 700,
        },
      };
    }

    // ── Lower tier — cannot downgrade, show grayed out ──────────
    if (cardIdx < currentIdx) {
      return {
        label: plan.name,          // just the plan name, no confusing text
        disabled: true,
        style: {
          background: 'rgba(255,255,255,0.03)',
          color: 'var(--text-muted)',
          border: '1px solid rgba(255,255,255,0.06)',
          cursor: 'not-allowed',
          opacity: 0.5,
        },
      };
    }

    // ── Higher tier — upgrade path ──────────────────────────────
    const isLoading = loadingPlan === plan.key;
    return {
      label: isLoading ? 'Redirecting…' : plan.buttonLabel,
      disabled: isLoading || !!loadingPlan,
      spinner: isLoading,
      style: plan.highlight
        ? {
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 700,
          }
        : {
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          },
    };
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="pricing-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 9998,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal Panel */}
          <motion.div
            key="pricing-modal"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1rem',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                pointerEvents: 'all',
                width: '100%', maxWidth: 1000,
                maxHeight: '90vh', overflowY: 'auto',
                background: 'var(--bg-base)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                padding: '2rem',
                position: 'relative',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '0.25rem' }}>
                    Choose Your Plan
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    Costing a fraction of a single lost customer.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50%', width: 36, height: 36,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseOut={e  => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Plan Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '1rem',
                alignItems: 'stretch',
              }}>
                {PLANS.map((plan) => {
                  const cardIdx    = PLAN_ORDER.indexOf(plan.key);
                  const currentIdx = PLAN_ORDER.indexOf(currentPlan || 'free');
                  const btnProps = getButtonProps(plan, currentPlan, loadingPlan);
                  const isCurrent   = plan.key === currentPlan;
                  const isHighlight = plan.highlight && !isCurrent && cardIdx > currentIdx;

                  return (
                    <motion.div
                      key={plan.key}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: PLAN_ORDER.indexOf(plan.key) * 0.07 }}
                      style={{
                        borderRadius: '16px',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0',
                        position: 'relative',
                        overflow: 'hidden',
                        border: isCurrent
                          ? '2px solid var(--accent)'
                          : isHighlight
                          ? '1px solid var(--accent)'
                          : '1px solid var(--border)',
                        background: isCurrent
                          ? 'var(--bg-elevated)'
                          : isHighlight
                          ? 'var(--bg-surface)'
                          : 'var(--bg-base)',
                        transform: isHighlight ? 'translateY(-4px)' : 'none',
                      }}
                    >
                      {/* Top beam for highlighted */}
                      {isHighlight && (
                        <div style={{
                          position: 'absolute', top: 0, left: '20%', right: '20%', height: 1,
                          background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
                        }} />
                      )}

                      {/* Current badge */}
                      {isCurrent && (
                        <div style={{
                          position: 'absolute', top: 12, right: 12,
                          background: 'rgba(99,102,241,0.2)', color: 'var(--accent)',
                          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                          padding: '3px 8px', borderRadius: 999, textTransform: 'uppercase',
                        }}>
                          Your Plan
                        </div>
                      )}

                      {/* Plan Name */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <p style={{
                          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                          textTransform: 'uppercase', marginBottom: '0.15rem',
                          color: isHighlight || isCurrent ? 'var(--accent)' : 'var(--text-muted)',
                        }}>
                          {plan.name}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                          {plan.tagline}
                        </p>
                        <div style={{ fontSize: plan.highlight ? '2.25rem' : '2rem', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
                          {plan.price}
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                            {plan.period}
                          </span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0.75rem 0' }} />

                      {/* Features */}
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', flexGrow: 1 }}>
                        {plan.features.map((feat) => (
                          <li key={feat} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            <CheckCircle2
                              size={13}
                              style={{ flexShrink: 0, marginTop: 2, color: isCurrent || isHighlight ? 'var(--accent)' : 'var(--text-muted)' }}
                            />
                            {feat}
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <button
                        disabled={btnProps.disabled}
                        onClick={() => handleUpgrade(plan.key)}
                        style={{
                          width: '100%',
                          padding: '0.65rem 1rem',
                          borderRadius: '10px',
                          border: 'none',
                          cursor: btnProps.disabled ? 'not-allowed' : 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          transition: 'all 0.15s',
                          opacity: btnProps.disabled && !isCurrent ? 0.5 : 1,
                          ...btnProps.style,
                        }}
                      >
                        {btnProps.spinner && <span className="spinner" style={{ width: 14, height: 14 }} />}
                        {btnProps.label}
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer Note */}
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1.5rem' }}>
                All plans include a 14-day money-back guarantee · Cancel anytime · Billed monthly
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
