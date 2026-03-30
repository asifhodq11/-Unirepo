# STATE: ReplyIQ Monorepo

## Overview
- **Project**: ReplyIQ (B2B SaaS for Automated Review Responses)
- **Current Objective**: Implement the "Ultimate AI Training Intelligence (v2.0)" upgrade and begin architecture planning for the "Knowledge & Context" (V3) Layer.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide React
- **Backend**: Python (Flask)
- **Database**: Supabase (PostgreSQL)
- **AI Core**: Google Gemini (orchestrated via `app/services/ai_engine.py`)
- **Key Files**: 
  - `ai_engine.py` (The 3-Pass AI brain)
  - `admin.py` (Internal dashboard KPIs)
  - `003_create_replies.sql` (Database schema for responses)
  
## V2 Master Insights (The Trust Architecture)
Phase 1 aims to implement the "Science of Human Indistinguishability":
1. **Oxytocin Triggers**: Tangible, Unexpected, Personal, Public.
2. **Burstiness Engineering**: Targeted disruption of AI sentence rhythm.
3. **Amygdala Scan**: Strict empathy-first rule for 1-2 star reviews (Zero defensiveness).
4. **Variance Engine**: Structural tracking in the DB to prevent document-level AI uniformity.

## Immediate Priorities (Post-V2.3 Verification)
1. **[COMPLETED]** V2.3 "Brevity & Authenticity" Patch (Tone Engine, 40% reduction, Slop 3.0 removal).
2. **Next up (Launch Blockers)**: Replace simulated Google poller with real Google Business Profile API integration.
3. Fix Stripe subscription billing logic.
4. Implement essential security/legal features (email verification, password reset, legal pages).

## Known Blockers & Future Gaps (V3 Roadmap)
- AI is currently "Factually Blind" (No access to static business knowledge/menus).
- AI is currently "Visually Blind" (Cannot analyze attached review photos).
- AI lacks a "Skepticism Layer" (Will mistakenly apologize to competitor bots).
- HIPAA/Staff Privacy compliance requires an upcoming "Staff Shield" module.
