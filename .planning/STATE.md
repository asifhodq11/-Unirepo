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

## Immediate V2 Priorities (Preparation for Phase 2: Claude Sonnet)
1. DB Migration: Add `opener_type`, `structure_tag` to `replies`, and `business_register` to `users`.
2. Pipeline Overhaul: Re-architect the prompts in `ai_engine.py` to support *Signal Extraction* (Pass 0), *Weighted Generation* (Pass 1), *Humanisation* (Pass 2), and *Cognitive Audit* (Pass 3).

## Known Blockers & Future Gaps (V3 Roadmap)
- AI is currently "Factually Blind" (No access to static business knowledge/menus).
- AI is currently "Visually Blind" (Cannot analyze attached review photos).
- AI lacks a "Skepticism Layer" (Will mistakenly apologize to competitor bots).
- HIPAA/Staff Privacy compliance requires an upcoming "Staff Shield" module.
