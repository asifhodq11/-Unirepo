/**
 * Shared plan constants — single source of truth for all frontend components.
 * Must stay aligned with backend usage_service.py PLAN_LIMITS.
 */

export const PLAN_LIMITS = {
  free: 5,
  starter: 100,
  pro: Infinity,
};

export function getPlanLimit(plan) {
  return PLAN_LIMITS[plan] ?? 5;
}

export function getPlanLimitDisplay(plan) {
  if (plan === 'pro') return '∞';
  return String(getPlanLimit(plan));
}

export const PLAN_LABELS = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
};

export const TONE_OPTIONS = ['friendly', 'professional', 'formal', 'casual'];
