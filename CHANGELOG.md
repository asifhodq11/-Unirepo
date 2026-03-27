# 📜 ReplyIQ Development & Architecture Log

This log tracks all major architectural shifts, feature additions, and critical bug fixes for the ReplyIQ SaaS project.

---

## 🚀 Phase 4: Monorepo & Deterministic Deployment (Current)
**Goal:** Merge separate services into a unified, one-click deployable monorepo.

### 2026-03-27
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
