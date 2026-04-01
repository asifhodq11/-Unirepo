# Project State: ReplyIQ

## Current Objective
Achieve a "Zero-Bug UI" by remediating all visual inconsistencies, hardcoded styles, and "unpleasant" component transitions identified in the Deep Audit.

## Structural Reconnaissance
- **HistoryPage**: Found discrepancy in 'Draft' vs 'Replied' plate backgrounds. Drafts are tinted purple; Replied are tinted neutral. This creates a "weird" visual weight difference.
- **Auth Pages**: `SignupPage`, `SettingsPage`, `VerifyEmailPage` still contain hardcoded `rgba` values and inconsistent radii (12px vs 10px).
- **Design Tokens**: `index.css` has been updated but coverage is not yet 100%.

## Identified UI Bugs
1. **History Plate Inconsistency**: `HistoryItem` background logic fails to provide a cohesive 'Finished' state for Replied items.
2. **Badge Padding**: Badges in Settings vs History have different internal padding (6px vs 2px).
3. **Auth Branding**: Logo containers in Auth pages use hardcoded `color: #000` and `borderRadius: 12px` instead of `var(--black)` and `var(--radius-md)`.
4. **Diagnostic Contrast**: The `NetworkHealthCheck` component's "API Live" text could be more prominent.

## Technical Context
- **Framework**: React (Vite)
- **Styling**: Vanilla CSS with CSS Variables (`index.css`)
- **Icons**: Lucide-React
- **Animations**: Framer Motion
