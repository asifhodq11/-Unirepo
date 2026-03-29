import { Link } from 'react-router-dom';
import { MessageSquareText, FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <header style={{ 
        borderBottom: '1px solid rgba(255,255,255,0.06)', 
        padding: '1rem 2rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(var(--bg-base-rgb, 10,10,18),0.92)',
        backdropFilter: 'blur(12px)',
      }}>
        <Link to="/landing" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-cyan))', color: '#000', padding: '8px', borderRadius: '10px', display: 'flex' }}>
            <MessageSquareText size={18} />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>ReplyIQ</span>
        </Link>
        <Link to="/login" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>Sign in</Link>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <FileText size={28} style={{ color: 'var(--accent)' }} />
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Terms of Service</h1>
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

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '2rem', marginTop: '3rem', display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
          <Link to="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>
          <Link to="/landing" style={{ color: 'var(--text-muted)' }}>← Back to home</Link>
        </div>
      </main>
    </div>
  );
}

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using ReplyIQ ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. These terms constitute a legally binding agreement between you and ReplyIQ.',
  },
  {
    title: '2. Description of Service',
    body: 'ReplyIQ is an AI-powered platform that generates and publishes automated replies to Google Business Profile reviews on behalf of registered businesses. The Service operates on a subscription basis with plan tiers: Free, Starter, Pro, and Ultra. Feature availability and usage limits vary by plan as described on our pricing page.',
  },
  {
    title: '3. Account Registration',
    body: 'You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activities that occur under your account. You must be at least 18 years old and have the legal authority to represent the business you register.',
  },
  {
    title: '4. Acceptable Use',
    body: 'You agree not to use the Service to post defamatory, misleading, or fraudulent replies; to impersonate other businesses or individuals; to violate Google\'s Terms of Service or review policies; or to attempt to circumvent usage limits or security measures. ReplyIQ reserves the right to suspend accounts that violate these terms.',
  },
  {
    title: '5. Payment and Billing',
    body: 'Paid plans are billed monthly in advance. All payments are processed securely by Stripe. By subscribing, you authorise ReplyIQ to charge your payment method on a recurring basis. Prices are listed in USD. Pro plan subscribers receive a 14-day free trial; no charge is made until the trial period ends. You may cancel at any time from the Settings page.',
  },
  {
    title: '6. Cancellation and Refunds',
    body: 'You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. We do not offer prorated refunds for unused time unless required by applicable law. Accounts on the Free plan may be deleted after 12 months of inactivity.',
  },
  {
    title: '7. AI-Generated Content',
    body: 'ReplyIQ uses third-party AI models (including Google Gemini and OpenAI GPT) to generate reply suggestions. You are solely responsible for reviewing and approving AI-generated replies before they are published to your Google Business Profile. ReplyIQ does not guarantee the accuracy, appropriateness, or commercial effectiveness of any generated content.',
  },
  {
    title: '8. Google Business Profile Integration',
    body: 'Use of the Google Business Profile integration requires you to grant ReplyIQ agency-level access to your Google Business account. You may revoke this access at any time through the Google Business settings. ReplyIQ acts as your agent and posts replies on your behalf — you remain responsible for all content published to your profile.',
  },
  {
    title: '9. Limitation of Liability',
    body: 'To the maximum extent permitted by law, ReplyIQ shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Service, including but not limited to loss of revenue, data, or goodwill. Our aggregate liability shall not exceed the total fees paid by you in the 3 months preceding the claim.',
  },
  {
    title: '10. Changes to Terms',
    body: 'ReplyIQ may update these Terms at any time. We will provide 14 days\' notice of material changes by email or dashboard notification. Continued use of the Service after the effective date constitutes acceptance of the revised Terms.',
  },
  {
    title: '11. Governing Law',
    body: 'These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which ReplyIQ is incorporated, without regard to its conflict of law provisions. Disputes shall be resolved through binding arbitration where permitted by law.',
  },
  {
    title: '12. Contact',
    body: 'For questions about these Terms, please contact legal@replyiq.app.',
  },
];
