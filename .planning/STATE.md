# Project State: ReplyIQ Glass & Theme Overhaul

## Current Focus
Extending the "Pro Max" glassmorphism aesthetic across the entire application and implementing a unified Dark/Light theme system.

## Status Summary
- [x] **Redesign Phase 1**: Landing Page V2 (Pro Aesthetic).
- [x] **Redesign Phase 2**: 4-Tier Pricing implementation.
- [/] **Redesign Phase 3**: Theme Engine & App-wide Glassmorphism (In Progress).
- [ ] **Functional Phase 1**: Lead Capture integration (Pending).

## Proposals & Decisions
- **D-001**: Separate Marketing (`/landing`) from App (`/`). **[Approved]**
- **D-002**: Implement global `ThemeContext` using CSS variables for runtime switching. **[Proposed]**
- **D-003**: Apply `backdrop-filter: blur(24px)` to all dashboard layout containers. **[Proposed]**

## Active Tasks
- [ ] Create `ThemeContext.jsx` and `useTheme.js` hook.
- [ ] Sync `index.css` with semantic theme overrides.
- [ ] Add `ThemeToggle` to Public Header and App Sidebar.
- [ ] Shift Landing Page to `/landing` and App to `/`.
