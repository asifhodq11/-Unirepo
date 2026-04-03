import { motion } from 'framer-motion';
import { Sparkles, Brain, Zap, ArrowRight, ShieldCheck, CheckCircle2, Bot, Layers, Network, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/public/PublicHeader';
import HeroSandbox from '../components/public/HeroSandbox';

// Ambient Background Mesh Component
// Uses pure CSS animation (GPU compositor thread) instead of framer-motion (JS main thread).
function AmbientBackground() {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      overflow: 'hidden', zIndex: 0, pointerEvents: 'none',
      background: 'var(--bg-base)'
    }}>
      {/* GPU-composited ambient orb — no JS animation loop needed */}
      <div className="ambient-orb-primary" />
      <div style={{ 
        position: 'absolute', bottom: '-10%', left: '-10%', width: '50%', height: '50%', 
        background: 'radial-gradient(circle, var(--text-dim) 0%, transparent 60%)',
        filter: 'blur(120px)',
        pointerEvents: 'none'
      }} />
      {/* Premium Grain Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        opacity: 0.04, mixBlendMode: 'overlay'
      }} />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)', position: 'relative', overflowX: 'hidden' }}>
      <AmbientBackground />
      <PublicHeader />

      {/* Extreme Typography Hero Section */}
      <section style={{ 
        paddingTop: 'calc(var(--space-16) * 3)', 
        paddingBottom: 'var(--space-16)',
        position: 'relative', zIndex: 10
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 900, margin: '0 auto', marginBottom: 'var(--space-12)' }}>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div style={{ 
                display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)', 
                background: 'var(--bg-glass)', padding: 'var(--space-1) var(--space-4)', 
                borderRadius: 'var(--radius-full)', border: '1px solid var(--border)', 
                marginBottom: 'var(--space-8)',
                boxShadow: 'var(--shadow-md), inset 0 1px 0 rgba(255,255,255,0.05)'
              }}>
                <div style={{ width: 6, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-cyan)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  ReplyIQ Engine v2.0 is Live
                </span>
              </div>
              
              <h1 style={{ 
                fontSize: 'clamp(3.5rem, 7vw, 6.5rem)', 
                lineHeight: 1.05, 
                marginBottom: 'var(--space-6)', 
                letterSpacing: '-0.05em', // Extreme tracking tight
                fontWeight: 800 
              }}>
                Silence the noise.<br/>
                <span style={{ 
                  background: 'linear-gradient(135deg, var(--text-primary) 20%, var(--text-muted) 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  Automate the reputation.
                </span>
              </h1>
              
              <p style={{ 
                fontSize: 'clamp(1.1rem, 2vw, 1.35rem)', 
                color: 'var(--text-secondary)', 
                maxWidth: 680, margin: '0 auto', 
                lineHeight: 1.6, fontWeight: 400, letterSpacing: '-0.01em'
              }}>
                Unanswered 3-star reviews are bleeding your revenue. 
                ReplyIQ autonomously routes, generates, and deploys high-context, empathetic responses while you sleep.
              </p>
            </motion.div>
          </div>

          <HeroSandbox />
          
        </div>
      </section>

      {/* The Pro-Max Asymmetrical Bento Grid */}
      <section id="features" style={{ padding: 'var(--space-16) 0', position: 'relative', zIndex: 10 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', marginBottom: 'var(--space-4)' }}>Engineered for outcome.</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto' }}>
              We removed complex dashboards and focused entirely on the only absolute metric: <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Zero touch operations.</strong>
            </p>
          </div>

          <div className="landing-bento">
            
            {/* Massive Card: Hybrid Router (Spans 8 cols) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6 }}
              className="card-glass bento-hero" 
              style={{ 
                padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', 
                justifyContent: 'flex-end', minHeight: 380, position: 'relative', overflow: 'hidden' 
              }}
            >
              {/* Absolute background graphic */}
              <div style={{ position: 'absolute', top: -50, right: -50, opacity: 0.05, transform: 'rotate(15deg)' }}>
                 <Network size={300} />
              </div>
              <div style={{ position: 'absolute', top: '24px', left: '32px' }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--bg-glass-heavy)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  <Brain size={24} />
                </div>
              </div>
              
              <div style={{ position: 'relative', zIndex: 2, maxWidth: '80%' }}>
                <h3 style={{ fontSize: '1.75rem', letterSpacing: '-0.03em', marginBottom: 'var(--space-2)' }}>Multi-Modal Hybrid Routing</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
                  Not all reviews require frontier models. ReplyIQ routes complex 1-star complaints to GPT-4o for deep empathy, and simple 5-star praise to lightweight models for sub-second execution. <span style={{ color: 'var(--text-primary)' }}>Optimal cost, maximum emotional resonance.</span>
                </p>
              </div>
            </motion.div>

            {/* Tall Card: Autopilot (Spans 4 cols, 2 rows) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: 0.1 }}
              className="card-glass bento-tall" 
              style={{ 
                padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', 
                position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(180deg, var(--accent-subtle) 0%, var(--bg-surface) 100%)',
                boxShadow: 'var(--shadow-lg), inset 0 1px 0 var(--border-subtle)'
              }}
            >
              <div style={{ 
                position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)', 
                width: '120%', height: '200px', background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: 0 
              }} />

              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--bg-glass-heavy)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', marginBottom: 'var(--space-6)', position: 'relative', zIndex: 2 }}>
                <Zap size={24} />
              </div>
              <h3 style={{ fontSize: '1.75rem', letterSpacing: '-0.03em', marginBottom: 'var(--space-2)', position: 'relative', zIndex: 2 }}>Zero-Click Autopilot</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, position: 'relative', zIndex: 2 }}>
                Configure your autonomy dial. Auto-publish perfect responses for 4 & 5-star reviews instantly to game the SEO algorithm. Hold critical 1-star strikes in a queue for your one-click manual approval.
              </p>
              
              {/* Autonomy Dial Widget */}
              <div style={{ marginTop: 'auto', background: 'var(--bg-black-40)', border: '1px solid var(--border-subtle)', padding: 'var(--space-5)', borderRadius: 'var(--radius-lg)', position: 'relative', zIndex: 2 }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-muted" style={{ letterSpacing: '0.05em', color: 'var(--text-muted)' }}>CIRCUIT BREAKER</span>
                      <span className="badge badge-success" style={{ background: 'var(--bg-glass-heavy)', color: 'var(--success)' }}>Active: 4+ Stars</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-glass)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '80%', background: 'linear-gradient(90deg, var(--accent), var(--accent-cyan))', borderRadius: 'var(--radius-full)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                       <span>Manual Hold</span>
                       <span>Auto-Deploy</span>
                    </div>
                 </div>
              </div>
            </motion.div>

            {/* Small Card: Compounding (Spans 4 cols) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: 0.2 }}
              className="card-glass bento-small" 
              style={{ padding: 'var(--space-6)', minHeight: 240, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
               <div className="flex items-center gap-3 mb-4">
                 <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <ShieldCheck size={20} />
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>SEO Compounding</span>
               </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Google's algorithms reward active engagement. A 100% immediate reply rate signals operational excellence, raising your local search ranking automatically.
              </p>
            </motion.div>

            {/* Small Card: Integrations (Spans 4 cols) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, delay: 0.3 }}
              className="card-glass bento-small" 
              style={{ padding: 'var(--space-6)', minHeight: 240, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
               <div className="flex items-center gap-3 mb-4">
                 <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Layers size={20} />
                </div>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Unified Inbox</span>
               </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Google Analytics, Yelp, TripAdvisor. All aggregated into a single, high-performance data stream. One dashboard, absolute control.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Pricing anchored by 'Pro Max' */}
      <section id="pricing" style={{ padding: 'var(--space-16) 0', position: 'relative', zIndex: 10 }}>
        <div className="container" style={{ maxWidth: 1000 }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-12)' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', marginBottom: 'var(--space-2)' }}>Asymmetric ROI.</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Costing a fraction of a single lost customer.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-4)', alignItems: 'center' }}>
            
            {/* Free Tier */}
            <div className="card-glass" style={{ padding: 'var(--space-6)', border: '1px solid var(--border-subtle)', background: 'var(--bg-glass)', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
              <div className="mb-6">
                 <h3 className="text-muted text-xs uppercase tracking-widest font-bold mb-1">Free Tier</h3>
                 <p className="text-xs text-secondary mb-2">Kick the tires</p>
                 <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em' }}>$0<span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></div>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 'var(--space-6)' }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-8) 0', display: 'flex', flexDirection: 'column', gap: 12, flexGrow: 1 }}>
                <li className="flex items-start gap-3 text-xs color: var(--text-secondary)"><CheckCircle2 size={14} className="text-muted shrink-0 mt-0.5" /> 5 manual AI replies</li>
                <li className="flex items-start gap-3 text-xs color: var(--text-secondary)"><CheckCircle2 size={14} className="text-muted shrink-0 mt-0.5" /> History dashboard</li>
              </ul>
              <Link to="/signup?plan=free" className="btn btn-secondary btn-full" style={{ padding: '10px', fontSize: '0.85rem', background: 'var(--bg-white-05)', marginTop: 'auto' }}>Start Free</Link>
            </div>

            {/* Starter */}
            <div className="card-glass" style={{ padding: 'var(--space-6)', border: '1px solid var(--border-subtle)', background: 'var(--bg-glass)', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
              <div className="mb-6">
                 <h3 className="text-muted text-xs uppercase tracking-widest font-bold mb-1">Starter</h3>
                 <p className="text-xs text-secondary mb-2">Semi-automation</p>
                 <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em' }}>$19<span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></div>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 'var(--space-6)' }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-8) 0', display: 'flex', flexDirection: 'column', gap: 12, flexGrow: 1 }}>
                <li className="flex items-start gap-3 text-xs color: var(--text-secondary)"><CheckCircle2 size={14} className="text-muted shrink-0 mt-0.5" /> 100 AI replies/mo</li>
                <li className="flex items-start gap-3 text-xs color: var(--text-secondary)"><CheckCircle2 size={14} className="text-muted shrink-0 mt-0.5" /> Manual hold & review</li>
                <li className="flex items-start gap-3 text-xs color: var(--text-secondary)"><CheckCircle2 size={14} className="text-muted shrink-0 mt-0.5" /> Tone customization</li>
              </ul>
              <Link to="/signup?plan=starter" className="btn btn-secondary btn-full" style={{ padding: '10px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', marginTop: 'auto' }}>Get Starter</Link>
            </div>

            {/* Pro - Highlighted */}
            <div className="card-glass" style={{ 
              padding: 'var(--space-6)', 
              border: '1px solid var(--accent)', 
              boxShadow: 'var(--shadow-xl), 0 0 40px var(--accent-glow)',
              background: 'linear-gradient(180deg, var(--accent-subtle) 0%, var(--bg-base) 100%)',
              minHeight: '400px', display: 'flex', flexDirection: 'column',
              position: 'relative', zIndex: 10,
              transform: 'scale(1.02)'
            }}>
               <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 1, background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />
              
              <div className="mb-6">
                 <h3 className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: 'var(--accent)' }}>Pro</h3>
                 <p className="text-xs text-secondary mb-2">Zero-touch operations</p>
                 <div style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em' }}>$25<span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></div>
              </div>
               <div style={{ height: 1, background: 'var(--border-subtle)', marginBottom: 'var(--space-6)' }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-8) 0', display: 'flex', flexDirection: 'column', gap: 12, flexGrow: 1 }}>
                <li className="flex items-start gap-3 text-xs font-medium"><CheckCircle2 size={14} className="text-accent shrink-0 mt-0.5" /> 100 Autonomous replies</li>
                <li className="flex items-start gap-3 text-xs font-medium"><CheckCircle2 size={14} className="text-accent shrink-0 mt-0.5" /> Fully automated publishing</li>
                <li className="flex items-start gap-3 text-xs font-medium"><CheckCircle2 size={14} className="text-accent shrink-0 mt-0.5" /> Smart circuit breakers</li>
              </ul>
              <Link to="/signup?plan=pro" className="btn btn-full" style={{ padding: '12px', fontSize: '0.9rem', background: 'var(--accent)', color: '#fff', fontWeight: 700, marginTop: 'auto', borderRadius: '8px' }}>Start 14-Day Trial</Link>
            </div>

            {/* Ultra */}
            <div className="card-glass" style={{ padding: 'var(--space-6)', border: '1px solid var(--border-subtle)', background: 'var(--bg-white-05)', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
              <div className="mb-6">
                 <h3 className="text-muted text-xs uppercase tracking-widest font-bold mb-1" style={{ color: 'var(--text-primary)'}}>Ultra</h3>
                 <p className="text-xs text-secondary mb-2">Scale without limits</p>
                 <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em' }}>$59<span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span></div>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 'var(--space-6)' }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 var(--space-8) 0', display: 'flex', flexDirection: 'column', gap: 12, flexGrow: 1 }}>
                <li className="flex items-start gap-3 text-xs color: var(--text-primary)"><CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" /> Unlimited auto replies (500)</li>
                <li className="flex items-start gap-3 text-xs color: var(--text-secondary)"><CheckCircle2 size={14} className="text-muted shrink-0 mt-0.5" /> VIP dedicated support</li>
                <li className="flex items-start gap-3 text-xs color: var(--text-secondary)"><CheckCircle2 size={14} className="text-muted shrink-0 mt-0.5" /> Custom brand models</li>
              </ul>
              <Link to="/signup?plan=ultra" className="btn btn-secondary btn-full" style={{ padding: '10px', fontSize: '0.85rem', background: 'var(--bg-white-10)', color: 'var(--text-primary)', marginTop: 'auto' }}>Go Ultra</Link>
            </div>

          </div>
        </div>
      </section>

      {/* Massive Exit Action CTA */}
      <section style={{ padding: 'var(--space-16) 0', textAlign: 'center', position: 'relative', zIndex: 10 }}>
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="card-glass" 
            style={{ 
              maxWidth: 900, margin: '0 auto', padding: 'var(--space-12) var(--space-6)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', 
              background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-elevated) 100%)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-xl), 0 20px 80px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-lg)', background: 'var(--bg-glass-heavy)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-6)' }}>
              <Bot size={32} className="text-primary" />
            </div>
            
            <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', letterSpacing: '-0.05em', marginBottom: 'var(--space-8)', fontWeight: 800 }}>
              Deploy ReplyIQ today.
            </h2>
            
            <Link to="/signup" className="btn btn-primary" style={{ padding: '18px 42px', fontSize: '1.2rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
              Start Automating Free <ArrowRight size={20} style={{ marginLeft: 12 }} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer style={{ padding: 'var(--space-6) 0', borderTop: '1/px solid var(--border-subtle)', textAlign: 'center', position: 'relative', zIndex: 10, background: 'var(--bg-base)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <span>© 2026 ReplyIQ. Engine Online.</span>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Link to="/privacy" style={{ cursor: 'pointer', color: 'var(--text-muted)', textDecoration: 'none' }} onMouseOver={e=>e.target.style.color='var(--text-primary)'} onMouseOut={e=>e.target.style.color='var(--text-muted)'}>Privacy</Link>
            <Link to="/terms"   style={{ cursor: 'pointer', color: 'var(--text-muted)', textDecoration: 'none' }} onMouseOver={e=>e.target.style.color='var(--text-primary)'} onMouseOut={e=>e.target.style.color='var(--text-muted)'}>Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
