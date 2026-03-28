import { Link, useNavigate } from 'react-router-dom';
import { Bot, ChevronRight } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';

export default function PublicHeader() {
  const navigate = useNavigate();

  return (
    <header 
      className="public-header-pill"
      style={{
        position: 'fixed',
        top: 'calc(var(--space-4) + env(safe-area-inset-top, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        width: '90%',
        maxWidth: '800px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Refined Glassmorphism
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid var(--border)',
        borderRadius: '999px',
        padding: '8px 8px 8px 20px',
        boxShadow: 'var(--shadow-lg), inset 0 1px 0 rgba(255,255,255,0.05)',
        transition: 'var(--transition)',
      }}
    >
      
      {/* Brand / Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
        <div style={{
          width: 28, height: 28,
          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent))',
          borderRadius: '50%', // Circle logo container inside the pill
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 12px var(--accent-glow)',
          color: '#fff',
        }}>
          <Bot size={16} />
        </div>
        <span style={{ 
          fontWeight: 700, 
          fontSize: '1.05rem', 
          color: 'var(--text-primary)', 
          letterSpacing: '-0.03em',
          transform: 'translateY(1px)' // Optical alignment
        }}>
          ReplyIQ
        </span>
      </Link>

      {/* Center Nav Links (Hidden on mobile) */}
      <nav style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'center' }} className="hide-on-mobile">
        <a href="#features" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, transition: 'color 0.2s', textDecoration: 'none' }} onMouseOver={e => e.target.style.color='var(--text-primary)'} onMouseOut={e => e.target.style.color='var(--text-secondary)'}>Features</a>
        <a href="#how-it-works" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, transition: 'color 0.2s', textDecoration: 'none' }} onMouseOver={e => e.target.style.color='var(--text-primary)'} onMouseOut={e => e.target.style.color='var(--text-secondary)'}>How it Works</a>
        <a href="#pricing" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500, transition: 'color 0.2s', textDecoration: 'none' }} onMouseOver={e => e.target.style.color='var(--text-primary)'} onMouseOut={e => e.target.style.color='var(--text-secondary)'}>Pricing</a>
      </nav>

      {/* CTA Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <ThemeToggle />
        <button 
          onClick={() => navigate('/login')}
          style={{ 
            background: 'transparent', border: 'none', color: 'var(--text-secondary)', 
            fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: '0 12px',
            transition: 'color 0.2s'
          }}
          onMouseOver={e => e.target.style.color='var(--text-primary)'}
          onMouseOut={e => e.target.style.color='var(--text-secondary)'}
        >
          Log in
        </button>
        <button 
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--text-primary)', color: 'var(--bg-base)',
            border: 'none', borderRadius: '999px',
            padding: '8px 16px', fontSize: '0.85rem', fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 14px rgba(255,255,255,0.1)'
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,255,255,0.2)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(255,255,255,0.1)'; }}
        >
          Start Free <ChevronRight size={14} style={{ opacity: 0.7 }} />
        </button>
      </div>
      
    </header>
  );
}
