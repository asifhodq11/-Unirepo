import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, Sparkles, Building2, Search, Bot, Zap, X } from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';

const STEPS = [
  { id: 1, label: 'Your Business',   icon: Building2 },
  { id: 2, label: 'All Set!',        icon: Sparkles },
];

export default function OnboardingModal({ isOpen, onClose, user }) {
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [completing, setCompleting] = useState(false);

  async function handleComplete() {
    setCompleting(true);
    try {
      await api.patch('/settings/', { onboarding_complete: true });
      // Crucial: Update our global auth state so the modal 
      // doesn't re-trigger when they navigate around Dashboard
      await refreshUser(); 
      onClose();
      toast('Welcome to ReplyIQ!', 'success');
    } catch {
      toast('Could not save progress. Please try again.', 'error');
    } finally {
      setCompleting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="onboarding-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Modal */}
      <motion.div
        key="onboarding-modal"
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
          pointerEvents: 'none',
        }}
      >
        <div style={{
          pointerEvents: 'all',
          width: '100%', maxWidth: 520,
          background: 'var(--bg-base)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          boxShadow: '0 40px 120px rgba(0,0,0,0.8)',
          overflow: 'hidden',
        }}>
          {/* Progress Bar */}
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              animate={{ width: `${(step / STEPS.length) * 100}%` }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              style={{ height: '100%', background: 'var(--accent)', borderRadius: 999 }}
            />
          </div>

          <button 
            onClick={onClose}
            className="btn btn-ghost"
            style={{ 
              position: 'absolute', top: '1rem', right: '1rem', 
              padding: '0.4rem', color: 'var(--text-muted)' 
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>

          <div style={{ padding: '2rem' }}>
            {/* Step Indicators */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
              {STEPS.map((s) => {
                const Icon = s.icon;
                const isActive   = s.id === step;
                const isComplete = s.id < step;
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: isActive ? 1 : undefined }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      background: isComplete ? 'var(--accent)' : isActive ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                      border: isActive ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                      color: isComplete ? '#fff' : isActive ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: '0.7rem', fontWeight: 700,
                    }}>
                      {isComplete ? <CheckCircle2 size={14} /> : <Icon size={13} />}
                    </div>
                    {isActive && (
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
                        {s.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {step === 1 && <StepOne user={user} />}
                {step === 2 && <StepThree />}
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              {step > 1 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  style={{
                    padding: '0.6rem 1.2rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem',
                  }}
                >
                  Back
                </button>
              )}
              {step < STEPS.length ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  style={{
                    padding: '0.6rem 1.4rem', borderRadius: '10px', border: 'none',
                    background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                    fontSize: '0.875rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}
                >
                  Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  style={{
                    padding: '0.6rem 1.4rem', borderRadius: '10px', border: 'none',
                    background: 'var(--accent)', color: '#fff', cursor: completing ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    opacity: completing ? 0.7 : 1,
                  }}
                >
                  {completing ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Committing…</> : <>Go to Dashboard <ArrowRight size={15} /></>}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Step 1: Business confirmation ───────────────────────────────────────────
function StepOne({ user }) {
  return (
    <div>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.4rem' }}>
        Step 1 of 2
      </p>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
        Welcome, {user?.business_name || 'there'}!
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        Let's get your account set up. Here's what we have on file for your business profile:
      </p>

      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          <InfoRow label="Business Name" value={user?.business_name || '—'} />
          <InfoRow label="Industry" value={user?.business_type || '—'} />
          <InfoRow label="Brand Tone" value={user?.tone_preference || 'friendly'} />
        </div>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
        You can update these guidelines at any time in <strong>Settings</strong>.
      </p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontSize: '0.825rem', fontWeight: 600, textTransform: 'capitalize' }}>{value}</span>
    </div>
  );
}

// ─── Step 2: All set! ─────────────────────────────────────────────────────────
function StepThree() {
  const finalList = [
    { icon: Search, color: 'var(--accent-cyan)',   text: 'Reviews appear instantly in your Dashboard.' },
    { icon: Bot,    color: 'var(--accent)',        text: 'AI replies are generated automatically on the Pro plan.' },
    { icon: CheckCircle2, color: 'var(--success)', text: 'Review and approve replies before they go live on Starter.' },
    { icon: Zap,    color: 'var(--warning)',       text: 'Adjust your daily autonomy limit in Settings anytime.' },
  ];

  return (
    <div style={{ padding: '0.5rem 0' }}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.4rem' }}>
        Step 2 of 2
      </p>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
        Your workspace is ready.
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
        ReplyIQ is armed to begin detecting your reviews.
      </p>

      <div style={{
        background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
        padding: '1.25rem', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'left',
        display: 'flex', flexDirection: 'column', gap: '1rem'
      }}>
        {finalList.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
             <item.icon size={16} strokeWidth={2.5} style={{ color: item.color, marginTop: '2px', flexShrink: 0 }} />
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
               {item.text}
             </p>
          </div>
        ))}
      </div>
    </div>
  );
}
