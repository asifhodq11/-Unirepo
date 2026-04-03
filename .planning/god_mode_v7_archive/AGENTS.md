# 🚀 ReplyIQ: GSD Superpowered Orchestration Rules

This file defines the project vision and model selection preferences for a high-performance, manual-handover experience.

## 🎯 Manual Model Preferences (GSD Superpowered)
When prompts ask for a handover, the user should manually select these models:

- **Phase 1 (Research):** `Gemini 3.1 Pro` -> **[GRAPH-AWARE RESEARCH]**
- **Phase 2 (Planning):** `Claude 4.6 Sonnet` -> **[SOCRATIC DESIGN MODE]**
- **Phase 3 (Execution):** `Claude 4.6 Sonnet` -> **[RED-GREEN-REFACTOR TDD]**
- **Phase 4 (Verification):** `Gemini 3 Flash` -> **[GRAPH-BASED REGRESSION]**

---

## 🛠️ The "Right Brain" Audit
Every model in this workspace MUST check its suitability before starting:
- **Badge:** `🤖 [MODEL]: I am the [CORRECT/FALLBACK/WRONG] brain for Phase [N].`
- **Advice:** If the wrong model is selected, the model must advise a switch before proceeding.

---

## 🏗️ Project Architecture: ReplyIQ
- **Framework:** Flask (Backend) + React (Frontend - Vite)
- **Database:** Supabase (PostgreSQL + Realtime)
- **Payments:** Stripe (Usage-based billing)
- **Deployment:** Railway / Docker Monorepo

---

## 🆘 The Superpower Guardrails
- **Atomic Tasks:** Phase 2 must break work into 2-5 minute execution units.
- **Socratic Hook:** Phase 2 MUST ask the user 2 probing questions before finishing the `PLAN.xml`.
- **TDD Requirement:** Phase 3 MUST write failing tests for all logic changes.
- **Graph Check:** Phase 4 MUST use the structure map to verify remote impact.

---
> [!IMPORTANT]
> These rules are active for all models working in the `replyiq-monorepo` workspace.
