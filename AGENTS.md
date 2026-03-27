# 🚀 ReplyIQ: Antigravity Agent Orchestration Rules

This file defines the project vision and model routing preferences for the Antigravity Agent Manager.

## 🎯 Model Routing Preferences (Automatic Handover)
Antigravity should prefer these models based on the `task_boundary` name:

- **Researching/Searching/Analyzing:** `Gemini 3.1 Pro` (2M Context)
- **Architecture/Discussing/Trade-offs:** `Gemini 3 Pro`
- **Planning/Designing/Spec-Writing:** `Claude 4.6 Sonnet (Thinking Mode)`
- **Implementing/Coding/Bug-fixing:** `Claude 4.6 Opus`
- **Verifying/Testing/Checking:** `Gemini 3 Flash`
- **Auditing/Summarizing/Documentation:** `GPT-OSS-120B`

## 🏗️ Project Architecture: ReplyIQ
- **Framework:** Flask (Backend) + React (Frontend - Vite)
- **Database:** Supabase (PostgreSQL + Realtime)
- **Payments:** Stripe (Usage-based billing)
- **Deployment:** Railway / Docker Monorepo

## 🛠️ State Protocols
- Always check `.planning/STATE.md` before starting a new `task_boundary`.
- Every major architectural decision must be logged in `DECISIONS.md`.
- All model handovers MUST preserve the session context via the `.planning/` buffer.

---
> [!NOTE]
> These rules are active for all agents working in the `replyiq-monorepo` workspace.
