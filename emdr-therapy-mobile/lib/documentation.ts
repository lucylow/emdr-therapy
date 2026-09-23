import type { TrainingPhase } from './training-model';

export type DocumentationStatus = 'consent-required' | 'draft' | 'needs-review' | 'approved';
export type DocumentationRetryState = 'idle' | 'fallback' | 'retry-failed';
export function getDocumentationRetryMessage(state: DocumentationRetryState): string { return state === 'retry-failed' ? 'The draft service is still unavailable. The preview remains local and is not a clinical record.' : 'A deterministic training preview is shown because a draft could not be created.'; }
export function formatDocumentationRetryAttempt(attempt: number): string { return attempt > 0 ? `Retry attempt ${attempt}` : 'Initial draft attempt'; }

export type DocumentationDraft = {
  id: string;
  createdAt: string;
  status: DocumentationStatus;
  source: 'de-identified transcript' | 'structured session summary';
  phases: TrainingPhase[];
  sud?: { initial?: number; final?: number };
  bls?: { mode: string; sets: number };
  clientResponse: string;
  interventions: string;
  riskLanguage: string;
  followUp: string;
  reviewNotes: string;
};

let forceDocumentationFallback = false;
/** Test-only hook; production callers should leave this disabled. */
export function setDocumentationFallbackMode(enabled: boolean): void { forceDocumentationFallback = enabled; }

export const DOCUMENTATION_BOUNDARY = 'Drafting aid for clinician training only. Generated or extracted text is not a verified clinical record and requires clinician review, correction, and approval before any clinical-record use.';

export function createDocumentationDraft(consentGiven: boolean): DocumentationDraft {
  if (forceDocumentationFallback) throw new Error('simulated documentation fallback');
  return {
    id: `doc_${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: consentGiven ? 'needs-review' : 'consent-required',
    source: 'structured session summary',
    phases: ['Preparation', 'Assessment', 'Desensitization', 'Closure'],
    clientResponse: 'Add only a de-identified description of the simulated patient response.',
    interventions: 'Add the intervention used and the reason it was selected.',
    riskLanguage: 'Document observed safety language and escalation decisions; do not infer risk.',
    followUp: 'Add the supervised training follow-up plan.',
    reviewNotes: '',
  };
}
