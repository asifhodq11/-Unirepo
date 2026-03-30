/**
 * Shared plan constants — single source of truth for all frontend components.
 * Must stay aligned with backend usage_service.py PLAN_LIMITS.
 *
 * Free     =   5 replies/month (manual AI replies only)
 * Starter  = 100 replies/month (manual hold & review)
 * Pro      = 100 replies/month (autonomous replies)
 * Ultra    = 500 replies/month (unlimited auto replies — 500 cap)
 */

export const PLAN_LIMITS = {
  free:    5,
  starter: 100,
  pro:     100,
  ultra:   500,
};

export function getPlanLimit(plan) {
  return PLAN_LIMITS[plan] ?? 5;
}

export function getPlanLimitDisplay(plan) {
  if (plan === 'ultra') return '500';
  return String(getPlanLimit(plan));
}

export const PLAN_LABELS = {
  free:    'Free',
  starter: 'Starter',
  pro:     'Pro',
  ultra:   'Ultra',
};

export const TONE_OPTIONS = ['friendly', 'professional', 'formal', 'casual', 'empathetic'];
