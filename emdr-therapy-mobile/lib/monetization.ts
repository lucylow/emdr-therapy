export type SubscriptionTier = 'free' | 'basic' | 'professional' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';
export type SubscriptionLifecycle = 'preview' | 'pending' | 'verified' | 'expired';

export const SUBSCRIPTION_LIFECYCLE_LABELS: Record<SubscriptionLifecycle, string> = {
  preview: 'Preview only',
  pending: 'Pending verification',
  verified: 'Verified subscription',
  expired: 'Expired subscription',
};

export function isProductionEntitled(state: SubscriptionLifecycle) { return state === 'verified'; }
export function lifecycleTone(state: SubscriptionLifecycle) { return state === 'verified' ? 'success' : state === 'expired' ? 'warning' : 'neutral'; }

export type PlanLimitKey = 'clinicians' | 'clientsPerClinician' | 'sessionsPerMonth' | 'aiNotesPerMonth';
export type SubscriptionPlan = { id: string; tier: SubscriptionTier; name: string; description: string; priceMonthly: number; priceAnnual: number; features: string[]; limits: Record<PlanLimitKey, number> };

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  { id: 'plan_free', tier: 'free', name: 'Free', description: 'Core training tools for individual learners.', priceMonthly: 0, priceAnnual: 0, features: ['Visual BLS', 'Grounding library', 'Scenario previews', 'Basic local history'], limits: { clinicians: 1, clientsPerClinician: 3, sessionsPerMonth: 20, aiNotesPerMonth: 0 } },
  { id: 'plan_basic', tier: 'basic', name: 'Basic', description: 'More room for supervised practice.', priceMonthly: 19.99, priceAnnual: 199.99, features: ['Everything in Free', 'Expanded scenario catalog', 'Advanced telemetry views', 'Extended local history'], limits: { clinicians: 1, clientsPerClinician: 25, sessionsPerMonth: 100, aiNotesPerMonth: 25 } },
  { id: 'plan_professional', tier: 'professional', name: 'Professional', description: 'Training intelligence and documentation drafts for review.', priceMonthly: 49.99, priceAnnual: 499.99, features: ['Everything in Basic', 'Documentation assistant drafts', 'Supervisor replay tools', 'Priority training support'], limits: { clinicians: 5, clientsPerClinician: 100, sessionsPerMonth: 500, aiNotesPerMonth: 250 } },
  { id: 'plan_enterprise', tier: 'enterprise', name: 'Enterprise', description: 'Governed training infrastructure for programs and institutions.', priceMonthly: 99.99, priceAnnual: 999.99, features: ['Everything in Professional', 'Admin and cohort controls', 'Audit and governance support', 'Contracted deployment review'], limits: { clinicians: 999, clientsPerClinician: 999, sessionsPerMonth: 9999, aiNotesPerMonth: 9999 } },
];

export function getPlan(tier: SubscriptionTier) { return SUBSCRIPTION_PLANS.find((plan) => plan.tier === tier) ?? SUBSCRIPTION_PLANS[0]; }
export function hasFeature(plan: SubscriptionPlan, feature: string) { return plan.features.some((item) => item.toLowerCase().includes(feature.toLowerCase())); }
export function hasRemaining(plan: SubscriptionPlan, key: PlanLimitKey, usage: number) { return usage < plan.limits[key]; }
export const SAFETY_FEATURES = ['Grounding library', 'Crisis resources', 'Stop-to-grounding controls', 'Local data deletion'];
export const MONETIZATION_BOUNDARY = 'This prototype shows plan concepts only. No payment has been processed, no subscription is active, and safety resources are never paywalled.';
export const BILLING_BOUNDARY = 'Future billing must use approved App Store or Google Play purchase flows, server-side receipt validation, transparent cancellation and refund handling, and a verified subscription state. A local preview must never unlock production access by itself.';
export function isVerifiedSubscriptionState(state: SubscriptionLifecycle | 'unknown') { return state === 'verified'; }
export function canUseFeature(tier: SubscriptionTier, requiredTier: SubscriptionTier, state: SubscriptionLifecycle | 'unknown' = 'preview') { return state === 'preview' ? rankPreview(tier) >= rankPreview(requiredTier) : state === 'verified' && rankPreview(tier) >= rankPreview(requiredTier); }
function rankPreview(tier: SubscriptionTier) { return { free: 0, basic: 1, professional: 2, enterprise: 3 }[tier]; }
