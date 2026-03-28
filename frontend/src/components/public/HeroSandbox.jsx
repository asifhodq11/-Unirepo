import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Bot, Lock, Code2, Terminal, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MOCK_RESPONSE = `Hi there, we're extremely sorry to hear about your experience. Quality is our absolute top priority, and it sounds like we missed the mark this time. We would love the opportunity to make this right. Please reach out to our management team directly so we can resolve this for you immediately. We value your feedback and hope to see you again.`;

export default function HeroSandbox() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("The food was cold and the service took entirely too long. I won't be coming back.");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [email, setEmail] = useState('');

  // Auto-typing effect
  useEffect(() => {
    if (isGenerating && displayedText.length < MOCK_RESPONSE.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + MOCK_RESPONSE[displayedText.length]);
      }, 12); // Slightly faster typing for Pro feel
      return () => clearTimeout(timeout);
    } else if (isGenerating && displayedText.length === MOCK_RESPONSE.length) {
      setIsGenerating(false);
      setHasGenerated(true);
    }
  }, [isGenerating, displayedText]);

  function handleGenerate() {
    if (!inputText.trim() || isGenerating) return;
    setDisplayedText('');
    setHasGenerated(false);
    setIsGenerating(true);
  }

  function handleUnlock(e) {
    e.preventDefault();
    if (email) {
      navigate(`/signup?email=${encodeURIComponent(email)}`);
    } else {
      navigate('/signup');
    }
  }

  const showBlur = hasGenerated || (isGenerating && displayedText.length > MOCK_RESPONSE.length * 0.4);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} /* Custom spring curve */
      style={{
        background: 'rgba(9, 9, 11, 0.4)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 40px rgba(139,92,246,0.05)',
        width: '100%', maxWidth: '640px', margin: '0 auto',
        position: 'relative',
        display: 'flex', flexDirection: 'column',
      }}
    >
      
      {/* IDE Header (macOS style dots) */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '12px 16px', background: 'rgba(255,255,255,0.02)', 
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56', border: '1px solid #e0443e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', border: '1px solid #dea123' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f', border: '1px solid #1aab29' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Code2 size={12} /> reply_engine.ts
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Search size={14} />
          <Terminal size={14} />
        </div>
      </div>

      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        
        {/* Input Area */}
        <div style={{ position: 'relative' }}>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            disabled={isGenerating || hasGenerated}
            style={{
              width: '100%', minHeight: '120px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: '1.05rem',
              lineHeight: 1.6,
              resize: 'none'
            }}
            placeholder="Paste a negative review here..."
          />
          <div style={{ position: 'absolute', bottom: -12, right: 0, opacity: (isGenerating || hasGenerated) ? 0 : 1, transition: 'opacity 0.3s' }}>
             <span className="text-muted text-xs" style={{ fontFamily: 'monospace' }}>// Input unstructured text</span>
          </div>
        </div>

        {/* Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
             {/* Fake rating stars for context */}
             {[1,2,3,4,5].map(i => (
                <div key={i} style={{ width: 18, height: 18, borderRadius: '4px', background: i === 1 ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Star size={10} fill={i === 1 ? 'var(--danger)' : 'none'} stroke={i === 1 ? 'var(--danger)' : 'var(--text-muted)'} style={{ opacity: i === 1 ? 1 : 0.3 }} />
                </div>
              ))}
          </div>

          {!hasGenerated && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !inputText}
              style={{ 
                padding: '8px 24px', borderRadius: '8px',
                background: isGenerating ? 'var(--bg-elevated)' : 'var(--text-primary)',
                color: isGenerating ? 'var(--text-muted)' : 'var(--bg-base)',
                border: 'none', cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: isGenerating ? 'none' : '0 0 20px rgba(255,255,255,0.2), inset 0 2px 4px rgba(255,255,255,0.5)',
                transition: 'all 0.2s cubic-bezier(0.25,1,0.5,1)'
              }}
              onMouseOver={e => !isGenerating && (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseOut={e => !isGenerating && (e.currentTarget.style.transform = 'scale(1)')}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2"><div className="spinner" style={{ width: 14, height: 14, borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }} /> Analyzing...</span>
              ) : (
                <span className="flex items-center gap-2"><Sparkles size={14} /> Generate Reply <kbd style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.7rem', color: 'rgba(0,0,0,0.6)', marginLeft: 4 }}>⌘↵</kbd></span>
              )}
            </button>
          )}
        </div>

        {/* Output Area */}
        <AnimatePresence>
          {(isGenerating || hasGenerated) && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 'var(--space-2)' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                background: 'rgba(0,0,0,0.3)', // Darker well for the output
                border: '1px solid rgba(139,92,246,0.2)', // Violet border
                borderRadius: '16px',
                padding: 'var(--space-5)',
                minHeight: '160px',
                position: 'relative',
                boxShadow: 'inset 0 4px 24px rgba(0,0,0,0.5)'
              }}>
                 {/* Output Header */}
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, opacity: 0.8 }}>
                    <Bot size={14} color="var(--accent-cyan)" />
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Output Streaming...</span>
                 </div>

                <p style={{ 
                  fontSize: '0.95rem', lineHeight: '1.8', color: 'var(--text-primary)',
                  filter: showBlur ? 'blur(6px)' : 'none',
                  transition: 'filter 0.6s cubic-bezier(0.25,1,0.5,1)',
                  userSelect: 'none',
                  opacity: 0.95
                }}>
                  {displayedText}
                  {isGenerating && !showBlur && <span style={{ display: 'inline-block', width: 6, height: 16, background: 'var(--accent-cyan)', marginLeft: 4, animation: 'pulse 1s infinite' }} />}
                </p>
                
                {/* Friction Hack Blur Overlay */}
                <AnimatePresence>
                  {showBlur && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, rgba(3,7,18,0) 0%, rgba(3,7,18,0.7) 30%, rgba(3,7,18,0.95) 80%)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                        padding: 'var(--space-6)',
                        borderRadius: '16px',
                        zIndex: 10
                      }}
                    >
                      <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-3)', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}>
                           <Lock size={20} style={{ color: 'var(--text-primary)' }} />
                        </div>
                        <h4 style={{ color: '#fff', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Unlock Premium Reply</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sign up free to view & deploy this response instantly.</p>
                      </div>
                      
                      <form onSubmit={handleUnlock} style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: 320 }}>
                        <input
                          type="email"
                          required
                          placeholder="name@company.com"
                          className="form-input"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          style={{ 
                            flex: 1, background: 'rgba(0,0,0,0.5)', 
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#fff', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                            padding: '10px 14px'
                          }}
                        />
                        <button type="submit" style={{
                           background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent))',
                           border: 'none', borderRadius: '8px', padding: '0 16px',
                           color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                           cursor: 'pointer', boxShadow: '0 4px 20px var(--accent-glow)'
                        }}>
                          <ArrowRight size={18} />
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
