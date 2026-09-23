import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getPreferences, savePreferences } from './session-store';
import { getPlan, SAFETY_FEATURES, type SubscriptionLifecycle, type SubscriptionPlan, type SubscriptionTier } from './monetization';

type SubscriptionContextValue = { tier: SubscriptionTier; plan: SubscriptionPlan; lifecycle: SubscriptionLifecycle; isPreview: true; setPreviewTier: (tier: SubscriptionTier) => Promise<void>; isSafetyFeature: (feature: string) => boolean };
const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);
const key = 'previewSubscriptionTier';

export function SubscriptionProvider({ children }: { children: ReactNode }) { const [tier, setTier] = useState<SubscriptionTier>('free'); const lifecycle: SubscriptionLifecycle = 'preview'; useEffect(() => { getPreferences().then((prefs) => { const saved = prefs.previewSubscriptionTier; if (saved) setTier(saved); }); }, []); const value = useMemo(() => ({ tier, plan: getPlan(tier), lifecycle, isPreview: true as const, setPreviewTier: async (nextTier: SubscriptionTier) => { setTier(nextTier); await savePreferences({ previewSubscriptionTier: nextTier }); }, isSafetyFeature: (feature: string) => SAFETY_FEATURES.some((item) => item.toLowerCase() === feature.toLowerCase()) }), [tier, lifecycle]); return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>; }
export function useSubscriptionPreview() { const context = useContext(SubscriptionContext); if (!context) throw new Error('useSubscriptionPreview must be used inside SubscriptionProvider'); return context; }
