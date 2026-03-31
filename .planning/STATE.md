# GSD STATE: ReplyIQ Hardening & Serious Testing

## 1. Technical Landscape
- **Monorepo**: `replyiq-monorepo`
- **Backend (Python/Flask)**: `app/` directory.
- **Frontend (Vite/React)**: `frontend/` directory.
- **Database (Supabase/Postgres)**: Relies on RPCs for sensitive Auth-bypass operations.

## 2. Source of Truth
### Critical Logic Components
- **Signup Profile Creation**: `app/routes/auth.py` calls the `create_user_profile` RPC in Supabase to bypass standard RLS (which fails in server-side signups).
- **Onboarding Redirect**: `frontend/src/pages/SignupPage.jsx` handles the transition to `/verify-email?email=...`.
- **Poller Mutex Lock**: `run_poller.py` utilizes the `poller_lock` table and `acquire_poller_lock` RPC to prevent concurrent AI generations.

### Existing Tests
- **Framework**: `pytest`
- **Coverage**: ~70% (mostly unit tests with heavy mocking).
- **Gaps**: No integration tests for real DB state (RLS/Mutex) and no E2E tests for the redirect flow.

## 3. Objective
Implement a "Serious" testing suite that verifies the actual integration between:
1.  Frontend Redirects.
2.  Backend RPC Security.
3.  Distributed Lock concurrency.

---
**Phase 1 Research Complete.**
> [!IMPORTANT]
> User: Please switch to **Claude 4.6 Sonnet** (or your preferred Execution model) for **Phase 2: Planning**.
