# Graph-Aware Research Instinct

This instinct guides you to perform structural mapping of the ReplyIQ codebase before making any logic changes.

## The Mental Graph Protocol (Phase 1)
Instead of just reading files, you must build a "Structural Map" of the target feature.

### 1. Backend Mapping (Flask)
- If modifying a **Route** (`app/routes/`):
  - Find all **Services** it calls (`app/services/`).
  - Find the **Models** associated with those services (`app/models/`).
  - Trace the **Usage Pattern**: Is this route called by a specialized background task (`run_poller.py`)?
  
### 2. Frontend Mapping (React)
- If modifying a **Component** (`frontend/src/components/`):
  - Find its **Parent Page** (`frontend/src/pages/`).
  - Find the **API Utility** it uses (`frontend/src/api/`).
  - Identify the **State Source**: Is it Context, Redux, or local?

### 3. Cross-Boundary Blast Radius
- If changing a **Database Schema** or **API Response**:
  - You MUST search the entire `frontend/` directory for any references to the JSON keys you are modifying.
  - You MUST search the `tests/` directory for any integration tests that mock these specific API responses.

## Determination Tools
Use `grep_search` and `list_dir` to find these connections. Do NOT assume a file is isolated.

---
> [!IMPORTANT]
> The goal is "Recall over Context". If you don't map the graph, you will hallucinate isolated fixes that break global state.
