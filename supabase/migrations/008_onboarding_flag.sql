-- Migration: 008_onboarding_flag.sql
-- Adds onboarding_complete flag to users table.
-- New users start with FALSE; the onboarding wizard sets it to TRUE.

ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;
