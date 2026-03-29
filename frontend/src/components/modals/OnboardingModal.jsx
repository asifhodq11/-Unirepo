import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Copy, ArrowRight, Sparkles, Building2, Link2 } from 'lucide-react';
import { api } from '../../api/client';
import { useToast } from '../../hooks/useToast';

// ─── The agency email users need to invite ───────────────────────────────────
// Replace this with your actual Google Agency account email
const AGENCY_EMAIL = 'agency@replyiq.app';

const STEPS = [
  { id: 1, label: 'Your Business',   icon: Building2 },
  { id: 2, label: 'Connect Google',  icon: Link2 },
  { id: 3, label: 'All Set!',        icon: Sparkles },
];

export default function OnboardingModal({ isOpen, onClose, user }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [completing, setCompleting] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleComplete() {
    setCompleting(true);
    try {
      await api.patch('/settings/', { onboarding_complete: true });
      onClose();
      toast('Welcome to ReplyIQ! 🎉', 'success');
    } catch {
      toast('Could not save progress. Please try again.', 'error');
    } finally {
      setCompleting(false);
    }
  }

  function copyEmail() {
    navigator.clipboard.writeText(AGENCY_EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
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
                {step === 2 && <StepTwo email={AGENCY_EMAIL} copied={copied} onCopy={copyEmail} />}
                {step === 3 && <StepThree />}
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
                  {completing ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</> : <>Go to Dashboard <ArrowRight size={15} /></>}
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
        Step 1 of 3
      </p>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
        Welcome, {user?.business_name || 'there'}! 👋
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        Let's get your account set up. Here's what we have on file for your business:
      </p>

      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'grid', gap: '0.6rem' }}>
          <InfoRow label="Business Name" value={user?.business_name || '—'} />
          <InfoRow label="Business Type" value={user?.business_type || '—'} />
          <InfoRow label="Reply Tone"    value={user?.tone_preference || 'friendly'} />
        </div>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>
        You can update these at any time in <strong>Settings</strong>.
      </p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.825rem' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontSize: '0.825rem', fontWeight: 600, textTransform: 'capitalize' }}>{value}</span>
    </div>
  );
}

// ─── Step 2: Google Manager Access instructions ───────────────────────────────
function StepTwo({ email, copied, onCopy }) {
  return (
    <div>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.4rem' }}>
        Step 2 of 3
      </p>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
        Connect your Google Business
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        To reply to your Google reviews, you need to grant ReplyIQ access to your Google Business Profile. Here's how:
      </p>

      {[
        { n: 1, text: 'Go to your Google Business Profile at business.google.com' },
        { n: 2, text: 'Click Settings → Managers → Add manager' },
        { n: 3, text: 'Invite the ReplyIQ agency email below as a Manager' },
        { n: 4, text: 'Once you\'ve sent the invite, click Continue below' },
      ].map(({ n, text }) => (
        <div key={n} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)',
          }}>
            {n}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>{text}</p>
        </div>
      ))}

      {/* Email Copy Box */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)',
        borderRadius: '10px', padding: '0.75rem 1rem', marginTop: '0.5rem', gap: '1rem',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 600 }}>
          {email}
        </span>
        <button
          onClick={onCopy}
          style={{
            background: copied ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px',
            color: 'var(--accent)', cursor: 'pointer', padding: '0.35rem 0.75rem',
            fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem',
            transition: 'all 0.15s', flexShrink: 0,
          }}
        >
          <Copy size={13} /> {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: All set! ─────────────────────────────────────────────────────────
function StepThree() {
  return (
    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1.5rem',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))',
        border: '1px solid rgba(99,102,241,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Sparkles size={28} style={{ color: 'var(--accent)' }} />
      </div>
      <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.4rem' }}>
        Step 3 of 3
      </p>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
        You're all set!
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 1.5rem' }}>
        Once you accept the manager invitation in Google, ReplyIQ will begin detecting your reviews automatically.
      </p>

      <div style={{
        background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
        padding: '1rem', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'left',
      }}>
        {[
          '🔍 Your reviews will appear in the Dashboard',
          '🤖 AI replies are generated automatically on the Pro plan',
          '✅ Review and approve replies before they go live on Starter',
          '⚡ Adjust your daily autonomy limit in Settings anytime',
        ].map((item) => (
          <p key={item} style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', margin: '0 0 0.5rem', lineHeight: 1.5 }}>
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
