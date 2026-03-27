# 📜 ReplyIQ Development & Architecture Log

This log tracks all major architectural shifts, feature additions, and critical bug fixes for the ReplyIQ SaaS project.

---

## 🚀 Phase 4: Monorepo & Deterministic Deployment (Current)
**Goal:** Merge separate services into a unified, one-click deployable monorepo.

### 2026-03-27
- **[Bugfix] Graceful AI Provider Error Handling:** Added explicit exception parsing for `openai.APIStatusError`. If the AI provider (OpenRouter/OpenAI) returns a 402 "Payment Required" due to exhausted credits, the backend now returns a structured, user-friendly `AIBillingError` instead of crashing with a raw 500 response.
- **[Bugfix] History Dashboard Missing Replies:** Fixed an issue where the `/history` endpoint only returned customer reviews. Updated the backend query to perform a Supabase join on the `replies` table and updated the React `HistoryPage.jsx` UI to render the AI draft alongside the original review context.
- **[Architecture] Advanced Hybrid 2-Pass AI Pipeline:** Replaced the legacy 3-pass pipeline with a Context-Anchored generation pass (rules embedded) and an Adversarial Audit pass. This structural shift eliminates "Context Decay" and prevents the AI from hallucinating details (like "biriyani" for a tech store).
- **[Feature] Emotional Energy Routing:** Upgraded the Model Router from naive keyword matching to behavioral signal analysis (punctuation density, CAPS LOCK ratio, length, and star severity). The system now accurately routes angry customers to `gpt-4o` even if they don't use typical crisis keywords.
- **[Resiliency] Webhook Observability:** Added detailed logging to the Stripe webhook handler and aligned Supabase syntax (`table` instead of `from_`). This ensures transparent tracking of plan upgrades.
- **[DEFINITIVE FIX] Column Name Mismatch:** The `reviews` table uses `rating` (per `002_create_reviews.sql`), but the insert payload was sending `star_rating` — a column that doesn't exist. Also removed phantom `platform` column from inserts and SELECT queries. This was the true root cause of every `PGRST204` error.
- **[Fix] Supabase Schema Compliance:** Resolved `PGRST204` error by adding missing `platform` and `is_deleted` fields to review/reply inserts.
- **[BREAKTHROUGH] World-Class Debugging:** Resolved a persistent 500 error caused by a `TypeError` in the logging utility. Found a signature mismatch where `user_id` was being passed both positionally and as a keyword across the model layer.
- **[BREAKTHROUGH] Deterministic Docker Monorepo:** Implemented a multi-stage Dockerfile to build React and Python into a single container. Solved all Railway "path not found" errors.
- **[Fix] LLM Routing:** Resolved 500 error where OpenRouter was incorrectly trying to use direct Google SDK for Gemini models.
- **[Fix] Session Persistence:** Enabled `supports_credentials` in CORS to prevent "Session Expired" errors on same-domain requests.
- **[Refactor] Unified Serving:** Configured Flask to serve React `dist` folder directly, enabling single-service deployment.
- **[Migration] Monorepo Transition:** Combined `replyiq-frontend` and `replyiq-backend` into a single `-Unirepo` on GitHub.

---

## 🏗️ Phase 3: Elite Frontend & AI Specialisation
**Goal:** Evolve the functional app into a premium product with advanced design and smart features.

- **[Feature] 3-Pass Humaniser Pipeline:** Implemented Generate -> Humanise -> Audit orchestration in the AI Engine.
- **[Design] Pro Max UI/UX:** Applied typographic hierarchy, layout stability, and fluid transitions to the React dashboard.
- **[Feature] Smart Model Router:** Added logic to switch between Gemini Flash (simple) and GPT-4o (complex/crisis) based on review sentiment.
- **[Security] JWT Session management:** Implemented httpOnly session cookies for production-grade authentication.

---

## 🛠️ Phase 2: Core Engineering & Infrastructure
**Goal:** Build the robust backend and database foundations.

- **[Feature] Supabase Integration:** Finalised user profiles and review persistence layers.
- **[FinOps] Stripe Integration:** Implemented subscription management and usage-based billing logic.
- **[DevOps] Logging Infrastructure:** Added JSON-based event logging for production observability.
- **[Security] Rate Limiting & Talisman:** Enforced security headers and API rate limits per user.

---

## 🌱 Phase 1: Inception & Prototyping
**Goal:** Initial research and proof of concept.

- **[Research] SaaS Building Resources:** Gathered initial tools, MCP servers, and design inspirations.
- **[POC] 3D Landing Page:** Explored premium aesthetics with Three.js and Vite.
- **[POC] Backend API:** Created the first Flask entry points and health checks.

---

> [!NOTE]
> This log is a living document. It will be updated automatically whenever significant changes are made to the codebase.
