# GSD Phase 1: Research (STATE.md)

## 🏗️ Project Architecture
- **Monorepo Structure**: Root contains Python/Flask backend; `frontend/` contains a Vite-powered application.
- **Backend (Flask)**: 
  - Framework: Flask 3.1.3
  - Auth/DB: Supabase
  - Payments: Stripe 11.5.0
  - AI: OpenAI & Breaker patterns
- **Frontend (Vite)**: 
  - Packaging: `package.json` found in `frontend/`.
  - Tooling: ESLint, Vite.

## 🚩 Security Status (Critical)
- **Verified Leak**: A GitHub PAT (`ghp_...`) is embedded in `d:\Automation & Ai\SAAs V2\replyiq-monorepo\.git\config`.
- **Status**: User has deleted the token from GitHub. Local config still needs cleaning to prevent accidental propagation or "Config Poisoning."

## ⚔️ Audit Engine (The Sentinel)
- **Installed Tools**:
  - `semgrep` (v1.157.0) — Static Layer.
  - `trufflehog` (v3.94.2) — Secret Layer.
- **Status**: The **Master Codex** is Level 8. The **`/gsd-audit`** skill is upgraded to the Tri-Force model (Semgrep + TruffleHog + Shannon).

## 🎯 Objective: Sentinel Finalization (V9.6)
1. **Remediate**: Secure `.git/config` by stripping the leaked token.
2. **Scan**: Complete the full Hybrid Audit (Semgrep/TruffleHog).
3. **Evolve**: Sync all global skills to the Level 8 standard.
