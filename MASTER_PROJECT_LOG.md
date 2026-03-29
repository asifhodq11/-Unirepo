# 📜 ReplyIQ Master Project Evolution Log

This is the definitive, consolidated chronological record of the ReplyIQ (Unirepo) project, synthesized from all historical chat logs, planning artifacts, and architectural decisions. 

> [!IMPORTANT]
> This log overrides all previous "Phase" numbering systems and corrects "false logs" where completion was prematurely claimed.

---

## 🚀 The Timeline of Evolution

### Phase 0: The Inception (Mar 10)
*   **Objective**: Validating the "Zero Budget" SaaS model.
*   **Key Decisions**: 
    - Selected **Vite + React** for the frontend and **Flask** for the backend.
    - Chose **Supabase** for DB/Auth and **Stripe** for payments.
    - Established the "Pro Max" / "Anti-Slop" design standards with **Three.js** POCs.
*   **Key ID**: `3cf688fb`, `5f5aef8e`.

### Phase 1-2: Backend Foundation (Mar 17)
*   **Objective**: Building the resilient core.
*   **Key Decisions**: 
    - Implemented a "Strict Fail-Fast" `config.py`.
    - Created the first 5 SQL migrations (Users, Reviews, Replies, Tokens, Poller Logs).
    - Established the **"ReplyIQ Bible"** as the core vision document.
*   **Key ID**: `f8dc3f5c`.

### Phase 3-4: Intelligence & Auth (Mar 18)
*   **Objective**: Secure user flows and AI generation.
*   **Key Decisions**: 
    - Implemented **JWT-based Authentication** via `httpOnly` cookies.
    - Built the **3-Pass AI Pipeline** (Generate -> Humanize -> Audit).
    - Introduced **Emotional Energy Routing** (Model routing based on star severity).
*   **Key ID**: `f8dc3f5c`.

### Phase 5-7: The SaaS Shell (Mar 22-23)
*   **Objective**: Completing the business cycle.
*   **Key Decisions**: 
    - Integrated **Stripe Checkout** for Pro/Starter tiers.
    - Built the **Approvals & Token system** to prevent AI waste.
    - Implemented Paginated History and soft-delete logic.
*   **Key ID**: `f8dc3f5c`.

### Phase 8-9: Production Hardening (Mar 23-24)
*   **Objective**: Legal and Operational readiness.
*   **Key Decisions**: 
    - Created **Railway-compatible Cron Jobs** (Review Poller + Monthly Resets).
    - Implemented **GDPR Anonymization** and OWASP security headers.
    - **FALSE LOG ALERT**: Mar 24 was logged as "✅ COMPLETE" in `DECISIONS.md`, but the project was still fragmented in separate repos.
*   **Key ID**: `f8dc3f5c`.

### Phase 10: The "Unirepo" Pivot (Mar 27)
*   **Objective**: Deterministic Deployment.
*   **Key Decisions**: 
    - **The Great Consolidation**: Merged `replyiq-frontend` and `replyiq-backend` into a single monorepo.
    - **Hybrid 2-Pass AI Switch**: Replaced the stilted 3-pass pipeline with a Context-Anchored 2-pass system.
    - **Schema Repair**: Fixed the critical `rating` vs `star_rating` database mismatch crasher.
*   **Key ID**: `b7c994d3`, `a69b46eb`.

### Phase 11: Product Polish (Mar 28)
*   **Objective**: Professional Trust Architecture.
*   **Key Decisions**: 
    - **Lead Capture Sandbox**: Integrated the interactive hero demo with the Supabase `leads` table.
    - **Glassmorphic Pro Max UI**: Standardized high-blur, theme-aware CSS variables.
    - **Security Lock**: Implemented `RootDispatcher` to force login/signup for the dashboard.
*   **Key ID**: `b7c994d3`.

### Phase 12: Mobile Optimization (Current)
*   **Objective**: Universal Responsiveness.
*   **Key Decisions**: 
    - Implemented **Fluid Spacing Scales** and responsive typography.
    - Refined Light Mode color bleeding on pricing cards.
    - Compacted the navigation pill for mobile viewports.

---

## 🏛️ Central Decision Records (ADRs)

| # | Topic | Resolution |
|---|---|---|
| 01 | **Google API Path** | **Simulated Engine**: Switched to a Simulation + Email Intercept model to bypass Google's strict domain/entity approval requirements for V1. |
| 02 | **AI Model Strategy** | **Hybrid Handoff**: Using Gemini-Flash for 5-star routine replies; GPT-4o for complex 1-star crises. |
| 03 | **UI Aesthetic** | **Obsidian Glass**: Deep midnight bg (`#09090b`), high blur (32px), and Cyan/Violet mesh gradients. |

---

> [!NOTE]
> This log is now the **Primary Source of Truth**. Any further development phases must append to this list.
