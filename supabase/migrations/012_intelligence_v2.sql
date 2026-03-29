-- ============================================================
-- Migration 012: intelligence_v2
-- Adds Variance Engine tracking and Quality Scoring to the
-- replies table, and business register classification to users.
--
-- Part of: Ultimate AI Intelligence v2.0 upgrade.
-- Run this in Supabase SQL Editor before deploying the new ai_engine.py.
-- ============================================================

-- ── REPLIES TABLE ───────────────────────────────────────────

-- Tracks which opener pattern was used (for rotation / variance enforcement)
-- Values: 'name' | 'experience' | 'item' | 'reaction' | 'question'
ALTER TABLE public.replies
ADD COLUMN opener_type TEXT;

-- Tracks which structural pattern was used (for rotation / variance enforcement)
-- Values: 'A' | 'B' | 'C' | 'D'
ALTER TABLE public.replies
ADD COLUMN structure_tag TEXT;

-- Quality score computed by Pass 3 Cognitive Audit (0–24 scale).
-- Replies scoring < 15 should be flagged for human review before posting.
ALTER TABLE public.replies
ADD COLUMN quality_score SMALLINT DEFAULT 0;

-- Index for analytics queries (e.g. average quality by business, by plan)
CREATE INDEX idx_replies_quality_score ON public.replies (quality_score);

-- Index for variance engine lookups (most recent openers/structures per user)
CREATE INDEX idx_replies_variance ON public.replies (user_id, opener_type, structure_tag, created_at DESC);


-- ── USERS TABLE ─────────────────────────────────────────────

-- Controls the Tonal Register Library used during generation.
-- The AI applies different "tonal permissions" per business type.
-- Values: 'restaurant' | 'salon' | 'gym' | 'medical' | 'automotive' | 'hotel'
-- Default: 'restaurant' (most permissive, warmest tone)
ALTER TABLE public.users
ADD COLUMN business_register TEXT DEFAULT 'restaurant';
