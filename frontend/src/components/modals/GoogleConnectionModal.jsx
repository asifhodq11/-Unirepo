import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ShieldCheck, CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';

export default function GoogleConnectionModal({ isOpen, onClose }) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(false);

  async function handleVerify() {
    setVerifying(true);
    try {
      // Force a refresh of the user object to check if Admin flipped the switch
      await refreshUser();
      
      // Delay just slightly for UX
      setTimeout(() => {
        if (user?.google_connected) {
          toast('Successfully connected to Google Business!', 'success');
          onClose();
        } else {
          toast('Not connected yet. If you accepted the email, give it a few minutes.', 'warning');
        }
        setVerifying(false);
      }, 800);
      
    } catch {
      toast('Verification check failed.', 'error');
      setVerifying(false);
    }
  }

  function handleOpenGmail() {
    // Deep link into Gmail searching for all versions of Google Business Profile invitation emails
    const query = encodeURIComponent('from:google.com "Business Profile" ("Manager" OR "invitation")');
    window.open(`https://mail.google.com/mail/u/0/#search/${query}`, '_blank');
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="google-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)'
        }}
      />

      <motion.div
        key="google-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="modal-container"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', padding: '1rem'
        }}
      >
        <div style={{
          background: 'var(--bg-base)', border: '1px solid var(--border)',
          borderRadius: '24px', width: '100%', maxWidth: '520px',
          pointerEvents: 'all', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
        }}>
          {/* Header */}
          <div style={{
            padding: '1.5rem 1.5rem 1rem', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--bg-surface)'
          }}>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-accent uppercase tracking-widest mb-1">One-Click Setup</span>
              <h2 className="text-lg font-bold m-0 flex items-center gap-2">
                Connect Google Business
              </h2>
            </div>
            <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.4rem' }}>
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.5rem' }}>
            <p className="text-sm text-secondary mb-6" style={{ lineHeight: 1.6 }}>
              We've handled the complicated API configuration. To securely grant ReplyIQ access, 
              simply approve the official manager invitation sent to <strong>{user?.email}</strong>.
            </p>

            {/* Checklist */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="card" style={{ padding: '1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="flex items-start gap-4">
                  <div className="icon-wrapper" style={{ flexShrink: 0, background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}>
                    <Mail size={18} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold mb-1">1. Check your email</h4>
                    <p className="text-xs text-muted mb-3 leading-relaxed">
                      We've initiated the sync. Open your inbox and look for an official invitation from Google.
                    </p>
                    <button onClick={handleOpenGmail} className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                      <ExternalLink size={14} className="mr-2" /> Open Gmail Inbox
                    </button>
                  </div>
                </div>
              </div>

              <div className="card" style={{ padding: '1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="flex items-start gap-4">
                  <div className="icon-wrapper" style={{ flexShrink: 0, background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold mb-1">2. Click Approve</h4>
                    <p className="text-xs text-muted m-0 leading-relaxed">
                      Inside the email, Google will ask if you want to grant <strong>ReplyIQ Agency</strong> manager access. 
                      Click the <span className="text-accent font-bold">Approve</span> button.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Alert */}
            <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(99,102,241,0.08)', border: '1px dashed rgba(99,102,241,0.3)' }}>
              <CheckCircle2 size={24} className="text-accent" style={{ flexShrink: 0 }} />
              <p className="text-xs m-0" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Once approved, return here and verify the connection. It may take our servers up to 60 seconds to detect the sync.
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 mt-4">
              <button onClick={onClose} className="btn btn-secondary flex-1" style={{ padding: '0.75rem' }}>
                Cancel
              </button>
              <button 
                onClick={handleVerify} 
                className="btn btn-primary flex-1" 
                style={{ padding: '0.75rem' }}
                disabled={verifying}
              >
                {verifying ? <><span className="spinner" /> Verifying</> : <>Verify Connection <ArrowRight size={16} className="ml-2" /></>}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
