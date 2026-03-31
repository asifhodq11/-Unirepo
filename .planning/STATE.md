# GSD Workspace State: Dashboard & Mobile UX Optimization

**Objective:** Conduct an architectural UI/UX and functional code review on `DashboardPage.jsx` and `index.css` to flag mobile rendering unoptimizations, layout breaks, and component logic errors.
**Active Tech Stack:** React, CSS Variables (Bento V3 UI framework), Framer Motion, Recharts.

## Target 4: `frontend/src/pages/DashboardPage.jsx` (Mobile UX & Component Bugs)

Deep analysis of the Dashboard layout (`app-bento-grid`, `DashboardInsights`, `LiveEngineStats`) reveals several structural and logic unoptimizations, specifically impacting the <640px mobile viewport and state handling.

### 1. Mobile Layout Deformation (UI Unoptimizations)
**Location:** `index.css` and `DashboardPage.jsx` inline classes
*   **The AI Engine Squish:** In `LiveEngineStats`, the "AI Engine Status" metrics (Router, Fallback, Models) are wrapped in `<div className="flex gap-4">`. Without `flex-wrap` or dynamic mobile stacking, these 3 blocks are violently horizontally compressed on 320px-390px screens, causing text collisions and ugly word breaks.
*   **Vertical Space Hogging:** In the `DashboardInsights` component, the "Auto-Reply Heartbeat" row relies on `<div className="grid-3 gap-6">`. In `index.css`, `.grid-3` on mobile (`max-width: 640px`) resets to `grid-template-columns: 1fr`. This horizontally centers and vertically stacks all 3 metrics, ballooning the card height and forcing the user to scroll excessively just to see recent activity.
*   **Whitespace Bloat:** Internal cards use hardcoded `style={{ minHeight: '140px' }}` which preserves too much empty vertical space on mobile when elements organically wrap.

### 2. Analytical Logic Flaws (The "Red Zero" Bug)
**Location:** `LiveEngineStats` logic calculation
*   **The Bug:** The reputation score color computes as: `const repColor = avgRating >= 4 ? 'var(--success)' : avgRating >= 3 ? 'var(--warning)' : 'var(--danger, #ef4444)';`. If a newly onboarded user has 0 reviews, `avgRating` is 0, which falls through to `var(--danger)` (red). A brand new dashboard screams "DANGER" at the user for their reputation score rather than gracefully showing a disabled/muted grey "N/A" state.
*   **Memory Leak Risk (React):** The `handleTriggerPoller` uses a bare `setTimeout` to clear its inner component `toast` state. If the user navigates away from the dashboard within 6 seconds of triggering the scan, React will throw a state update on an unmounted component warning.

### 3. Missing Safeties & Error Boundaries
*   **Toast Mismatch:** `DashboardPage.jsx` imports the global `useToast()` hook and utilizes it in `useEffect` (for successful Stripe payments), but `LiveEngineStats` relies on its own localized array state `const [toast, setToast] = useState(...)`. This fragments the UI system; all toasts should utilize the global context.


## Phase 2 Directive (For Claude 4.6 Sonnet)
You must read this document, generate a `.planning/PLAN.xml` (or Markdown Implementation Plan), and execute the fixes for the Dashboard mobile optimizations, the "Red Zero" state bug, and the localized toast cleanup. Leverage React best practices and grid optimization. Please strictly adhere to the GSD and Verification workflows.
