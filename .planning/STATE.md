# ReplyIQ — Current State & Action Pathway (GSD Phase 1)

## System Overview
- **Backend:** Flask / Python
- **Frontend:** React / Vite (Glassmorphic UI)
- **Database / Auth:** Supabase (PostgreSQL)
- **Billing:** Stripe
- **AI Engine:** Gemini/OpenAI (Two-pass architecture with de-botting)

## Context from `competitive_analysis.md` & Recent Work
The project has successfully completed a massive execution wave (Phase 3) that shipped Auth completeness (Password Reset), Legal Pages, Billing Integrity (14-day trials, idempotency), and a 3-Step Onboarding Wizard.

### Resolved Blockers (Recently Fixed)
- ✅ **Stripe Plans:** Prices and plans perfectly synced.
- ✅ **Auth Completeness (Password Reset):** `/forgot-password` and `/reset-password` implemented securely.
- ✅ **Legal Pages:** Privacy Policy and Terms of Service endpoints/pages added.
- ✅ **Webhook Idempotency:** DB-backed idempotency using the `processed_webhooks` table.
- ✅ **14-Day Trial Logic:** Pro plan 14-day trial active.
- ✅ **Auth Completeness (Email Verification):** Backend handles 202 on signup, redirect handler set for /auth/callback, login-guard shows verification banner.

### Remaining Critical Path (The Pathway to Proceed)

#### 🔴 Existential Blockers (Must Fix Immediately)
1. **Internal Admin Panel (Business Intelligence):** We have implemented AI Cost Tracking and usage constraints, but there is no UI to view these cross-platform metrics without manually checking the Supabase tables. We need a secure `/admin` route on both frontend and backend to calculate total margins, monitor user plan distribution, and track system health.

#### 🟢 Technical Debt
2. **Google Business Profile Integration (The Engine):** *Deferred.* Currently uses `mock_google.py`. We must replace this with the real Google Agency Manager Access flow (OAuth for the agency, real API fetching/posting).

## Handover Instructions for Phase 4 (Verification)
The verification model (Gemini Flash) should audit the new AuthCallbackPage logic and verify that the session cookie is correctly set in the backend /verify-email endpoint. Once confirmed, the GSD cycle for Email Verification is officially closed.
