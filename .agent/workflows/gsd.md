---
description: Start a new GSD-orchestrated project cycle using the 6-model manual handover strategy.
---

# /gsd:start <objective>

1. **Initialize the GSD Memory Structure**
   // turbo
   Create `.planning/` directory if it doesn't exist.

2. **Phase 1: Research (Gemini 3.1 Pro)**
   - Model must scan the workspace and identify the tech stack.
   - Model must write the current "source of truth" to `.planning/STATE.md`.
   - **MUST STOP:** The model will finish its research and ask the user to switch to **Claude 4.6 Sonnet** for Phase 2.

3. **Phase 2: Planning (Claude 4.6 Sonnet)**
   - Model must read the `.planning/STATE.md` from Phase 1.
   - Model must generate the `PLAN.xml` for the task.
   - **MUST STOP:** The model will finish the plan and ask the user to switch to the Execution model.

4. **Phase 3: Execution (Claude Sonnet/Opus)**
   - Model executes the changes wave-by-wave.
   - Model commits every successful change.
   - **MUST STOP:** The model will finish execution and ask for a Verification model (Gemini Flash).

5. **Phase 4: Verification (Gemini 3 Flash)**
   - Final audit and test run.

---
> [!IMPORTANT]
> This command only works if you MANUALLY switch the model in the Antigravity dropdown at each prompt.
