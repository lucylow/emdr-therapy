export type AIProviderKind = 'local-heuristic' | 'replay' | 'remote-seam';
export type AIReviewStatus = 'not-run' | 'review-required' | 'approved' | 'rejected';

export type AITraceEvent = { traceId: string; createdAt: string; module: string; provider: AIProviderKind; reviewStatus: AIReviewStatus; evidenceIds: string[]; metadata: Record<string, string | number | boolean> };
export type StructuredPatientState = { scenarioId: string; phase: string; simulatedSud: number; readiness: 'ready' | 'uncertain' | 'pause'; fatigue: number; groundingAvailable: boolean };
export type ExplainableFinding = { id: string; title: string; rationale: string; evidence: string[]; confidence: 'low' | 'moderate' | 'high'; reviewRequired: true };
export type AIOutputGuard = { allowed: boolean; reason: string; reviewRequired: true };

export function createTrace(module: string, provider: AIProviderKind, evidenceIds: string[] = []): AITraceEvent { return { traceId: `trace_${Date.now()}`, createdAt: new Date().toISOString(), module, provider, reviewStatus: 'review-required', evidenceIds, metadata: { trainingOnly: true } }; }
