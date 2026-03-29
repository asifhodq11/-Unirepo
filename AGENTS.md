# 🚀 ReplyIQ: GSD 100x Orchestration Rules

This file defines the project vision and model selection preferences for a high-performance, manual-handover experience.

## 🎯 Manual Model Preferences (GSD 100x)
When prompts ask for a handover, the user should manually select these models:

- **Phase 1 (Research):** `Gemini 3.1 Pro` -> **[DEEP RESEARCH MODE]**
- **Phase 2 (Planning):** `Claude 4.6 Sonnet` -> **[SYSTEM / EXECUTION MODE]**
- **Phase 3 (Execution):** `Claude 4.6 Sonnet` -> **[PRECISION / NON-GENERIC MODE]** + **[RALPH / CLOSURE LOOP]**
- **Phase 4 (Verification):** `Gemini 3 Flash` -> **[CODERABBIT / AUDITOR MODE]**

---

## 🛠️ The "Right Brain" Audit
Every model in this workspace MUST check its suitability before starting:
- **Badge:** `🤖 [MODEL]: I am the [CORRECT/FALLBACK/WRONG] brain for Phase [N].`
- **Advice:** If the wrong model is selected, the model must advise a switch before proceeding.

---

## 🆘 Claude Quota Fallback
If the user specifies **"Claude quota over"**:
- **Substitute:** `Gemini 3.1 Pro` becomes the primary brain for Phase 2 & 3.
- **Logic:** Gemini must adopt a **High Reasoning** persona using recursive thinking to match Claude-level quality.

---

## 🏗️ Project Architecture: ReplyIQ
- **Framework:** Flask (Backend) + React (Frontend - Vite)
- **Database:** Supabase (PostgreSQL + Realtime)
- **Payments:** Stripe (Usage-based billing)
- **Deployment:** Railway / Docker Monorepo

---
> [!NOTE]
> These rules are active for all models working in the `replyiq-monorepo` workspace.
