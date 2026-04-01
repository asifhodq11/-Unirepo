import { Link } from 'react-router-dom';
import { MessageSquareText, Shield, Zap } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <header style={{ 
        borderBottom: '1px solid var(--border-subtle)', 
        padding: '1rem 2rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--bg-glass-heavy)',
        backdropFilter: 'blur(12px)',
      }}>
        <Link to="/landing" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-cyan))', color: 'var(--black)', padding: '8px', borderRadius: 'var(--radius-md)', display: 'flex' }}>
            <Zap size={18} fill="currentColor" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>ReplyIQ</span>
        </Link>
        <Link to="/login" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>Sign in</Link>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Shield size={28} style={{ color: 'var(--accent)' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Privacy Policy</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '3rem' }}>
          Last updated: March 29, 2026
        </p>

        {sections.map((s) => (
          <section key={s.title} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>{s.title}</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem', margin: 0 }}>{s.body}</p>
          </section>
        ))}

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '2rem', marginTop: '3rem', display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
          <Link to="/terms" style={{ color: 'var(--accent)' }}>Terms of Service</Link>
          <Link to="/landing" style={{ color: 'var(--text-muted)' }}>← Back to home</Link>
        </div>
      </main>
    </div>
  );
}

const sections = [
  {
    title: '1. Who We Are',
    body: 'ReplyIQ ("we", "our", or "us") provides an AI-powered review reply automation service for local businesses. Our platform is accessible at replyiq.app. For any privacy-related queries, contact us at privacy@replyiq.app.',
  },
  {
    title: '2. What Data We Collect',
    body: 'We collect the information you provide when creating an account: your name, business name, business type, email address, and reply tone preference. We also collect transactional data such as the number of AI replies generated each month, your billing plan, and your Stripe customer ID. We do not store your full payment card details — these are handled exclusively by Stripe.',
  },
  {
    title: '3. How We Use Your Data',
    body: 'Your data is used solely to provide the ReplyIQ service: generating AI replies to your business reviews, enforcing plan-based usage limits, processing subscription payments, and sending you product-related communications. We do not sell, rent, or share your personal data with third parties for marketing purposes.',
  },
  {
    title: '4. Google Business Profile Data',
    body: 'When you connect your Google Business Profile, ReplyIQ accesses your public review data (reviewer name, star rating, review text) through the Google Business Profile API. This data is used exclusively to generate AI replies and is not shared with any other party. We only request the minimum permissions necessary to read reviews and post replies.',
  },
  {
    title: '5. Data Retention',
    body: 'We retain your account data for as long as your account is active. If you delete your account, your personal information is anonymised within 30 days in accordance with our data retention policy. Review and reply data may be retained in anonymised form for service improvement purposes.',
  },
  {
    title: '6. Your Rights (GDPR & CCPA)',
    body: 'You have the right to access, rectify, port, or erase the personal data we hold about you. You may request deletion of your account at any time from the Settings page. For formal data requests, contact privacy@replyiq.app. For EU residents, the lawful basis for processing is performance of contract and legitimate interests.',
  },
  {
    title: '7. Cookies',
    body: 'We use a single HttpOnly session cookie ("session_token") to authenticate your requests. This is a strictly necessary cookie and does not require consent. We do not use advertising, tracking, or analytics cookies.',
  },
  {
    title: '8. Security',
    body: 'All data is transmitted over HTTPS. Session tokens are stored in HttpOnly, Secure, SameSite=Lax cookies to prevent XSS and CSRF attacks. Passwords are never stored by ReplyIQ — authentication is handled by Supabase Auth which uses industry-standard bcrypt hashing.',
  },
  {
    title: '9. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of material changes by email or by posting a notice in the dashboard. Continued use of the service after changes constitutes your acceptance of the updated policy.',
  },
  {
    title: '10. Contact',
    body: 'For any privacy concerns or data requests, please email privacy@replyiq.app. We aim to respond within 48 hours.',
  },
];
