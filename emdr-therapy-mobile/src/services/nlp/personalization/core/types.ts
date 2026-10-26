/**
 * Public types for the local-first insights and personalization layer.
 * All timestamps are ISO-8601 UTC strings. Raw journal/chat messages are deliberately
 * absent from persistent record types.
 */
export type ISODate = string;
export type Identifier = string;
export type LanguageCode = 'en' | 'fr' | 'es';
export type PreferenceOrigin = 'explicit' | 'accepted-suggestion' | 'observed';
export type PreferenceStatus = 'active' | 'pending-review' | 'rejected' | 'cleared';
export type ThemeId =
  | 'daily-routines'
  | 'sleep-and-energy'
  | 'relationships-and-connection'
  | 'work-and-demands'
  | 'uncertainty-and-change'
  | 'self-compassion'
  | 'body-and-senses'
  | 'nature-and-outdoors'
  | 'creative-activities'
  | 'movement-and-rest'
  | 'other';
export type SupportToolId =
  | 'grounding-5-4-3-2-1'
  | 'paced-breathing'
  | 'orientation-to-room'
  | 'gentle-stretch'
  | 'quiet-pause'
  | 'sensory-preferences'
  | 'short-reflection'
  | 'kind-self-talk'
  | 'water-break'
  | 'contact-support'
  | 'none';
export type PreferenceKey =
  | 'language'
  | 'responseLength'
  | 'tone'
  | 'visualTheme'
  | 'reducedMotion'
  | 'soundEnabled'
  | 'hapticsEnabled'
  | 'captionsEnabled'
  | 'fontScale'
  | 'suggestionDensity'
  | 'preferredSupportTools';
export type PreferenceScalar = string | number | boolean;
export type PreferenceValue = PreferenceScalar | PreferenceScalar[];

export interface PreferenceEntry {
  readonly key: PreferenceKey;
  readonly value: PreferenceValue;
  readonly origin: PreferenceOrigin;
  readonly status: PreferenceStatus;
  readonly confidence: number;
  readonly evidenceCount: number;
  readonly firstSeenAt: ISODate;
  readonly lastSeenAt: ISODate;
  readonly userConfirmedAt?: ISODate;
  readonly explanationCode: string;
  readonly revision: number;
}

export interface PreferenceProposal {
  readonly id: Identifier;
  readonly key: PreferenceKey;
  readonly proposedValue: PreferenceValue;
  readonly confidence: number;
  readonly evidenceCount: number;
  readonly createdAt: ISODate;
  readonly expiresAt: ISODate;
  readonly explanationCode: string;
  readonly requiresConfirmation: true;
}

export interface ProfileSnapshot {
  readonly schemaVersion: number;
  readonly profileId: Identifier;
  readonly createdAt: ISODate;
  readonly updatedAt: ISODate;
  readonly preferences: Readonly<Partial<Record<PreferenceKey, PreferenceEntry>>>;
  readonly dismissedProposalIds: readonly Identifier[];
  readonly acceptedProposalIds: readonly Identifier[];
  readonly settings: ProfileSettings;
}

export interface ProfileSettings {
  readonly personalizationEnabled: boolean;
  readonly insightsEnabled: boolean;
  readonly reflectionThemesEnabled: boolean;
  readonly usageLearningEnabled: boolean;
  readonly retentionDays: number;
  readonly language: LanguageCode;
}

export interface CheckInRecord {
  readonly id: Identifier;
  readonly createdAt: ISODate;
  /** Voluntarily selected, user-defined settledness rating; not a clinical scale. */
  readonly settlednessRating?: number;
  /** Whether the person chose to log this as a pre- or post-activity reflection. */
  readonly phase: 'before' | 'after' | 'standalone';
  readonly activityId?: SupportToolId;
  /** Opaque per-activity grouping token; no timestamp/diagnosis is encoded in this ID. */
  readonly sessionGroupId?: Identifier;
  /** User's optional helpfulness rating for a tool; distinct from the settledness rating. */
  readonly helpfulnessRating?: number;
  /** Whitelisted, non-clinical tags selected by the user. */
  readonly selectedThemes: readonly ThemeId[];
  /** Explicit permission for inclusion in aggregate trend summaries. */
  readonly aggregateConsent: boolean;
}

export interface ActivityFeedbackRecord {
  readonly id: Identifier;
  readonly createdAt: ISODate;
  readonly activityId: SupportToolId;
  readonly helpfulness: 1 | 2 | 3 | 4 | 5;
  readonly skipped?: boolean;
  readonly source: 'explicit-rating' | 'explicit-skip';
}

export interface ThemeCount {
  readonly themeId: ThemeId;
  readonly count: number;
  readonly source: 'user-selected-tag' | 'opt-in-reflection-extraction';
  /** UTC day bucket enables deletion under the configured retention policy. */
  readonly day?: string;
  readonly updatedAt?: ISODate;
}

export interface ThemeExtractionResult {
  readonly counts: readonly ThemeCount[];
  readonly tokenCount: number;
  readonly matchedTokenCount: number;
  readonly confidence: number;
  readonly rawTextStored: false;
  readonly needsReview: boolean;
}

export interface InsightEvidence {
  readonly metric: string;
  readonly sampleSize: number;
  readonly windowStart: ISODate;
  readonly windowEnd: ISODate;
  readonly value?: number;
  readonly baselineValue?: number;
  readonly confidence: 'low' | 'moderate' | 'higher';
}

export interface InsightCard {
  readonly id: Identifier;
  readonly kind: 'pattern' | 'reflection' | 'preference' | 'usage';
  readonly title: string;
  readonly body: string;
  readonly createdAt: ISODate;
  readonly evidence: readonly InsightEvidence[];
  readonly limitations: readonly string[];
  readonly actions: readonly InsightAction[];
  readonly requiresUserOptIn: boolean;
}

export interface InsightAction {
  readonly id: 'view-details' | 'dismiss' | 'adjust-preferences' | 'export-data' | 'clear-history' | 'open-grounding' | 'open-breathing';
  readonly label: string;
}

export interface RecommendationContext {
  readonly now: ISODate;
  readonly language: LanguageCode;
  readonly availableActivityIds: readonly SupportToolId[];
  readonly reducedMotion: boolean;
  readonly soundEnabled: boolean;
  readonly userRequestedSuggestions: boolean;
  readonly explicitAvoidList: readonly SupportToolId[];
  readonly selectedThemes: readonly ThemeId[];
}

export interface ActivityRecommendation {
  readonly activityId: SupportToolId;
  readonly score: number;
  readonly confidence: number;
  readonly reasons: readonly string[];
  readonly caveats: readonly string[];
  readonly requiresExplicitSelection: true;
}

export interface PersonalizationEvent {
  readonly eventId: Identifier;
  readonly createdAt: ISODate;
  readonly category:
    | 'preference-confirmed'
    | 'preference-cleared'
    | 'proposal-dismissed'
    | 'insight-opened'
    | 'insight-dismissed'
    | 'recommendation-shown'
    | 'recommendation-selected'
    | 'data-exported'
    | 'history-cleared'
    | 'consent-changed';
  readonly code: string;
  /** Count-only event: do not add free text, user IDs from other systems, or message bodies. */
  readonly attributes: Readonly<Record<string, string | number | boolean>>;
}

export interface PersonalizationConsent {
  readonly personalization: boolean;
  readonly aggregateInsights: boolean;
  readonly reflectionThemeExtraction: boolean;
  readonly usageLearning: boolean;
  readonly updatedAt: ISODate;
}

export interface LocalDataBundle {
  readonly format: 'emdr-flow-local-data';
  readonly formatVersion: 1;
  readonly exportedAt: ISODate;
  readonly profile: ProfileSnapshot;
  readonly checkIns: readonly CheckInRecord[];
  readonly activityFeedback: readonly ActivityFeedbackRecord[];
  readonly themeCounts: readonly ThemeCount[];
  readonly events: readonly PersonalizationEvent[];
}

export interface PersonalizationSnapshot {
  readonly profile: ProfileSnapshot;
  readonly checkIns: readonly CheckInRecord[];
  readonly activityFeedback: readonly ActivityFeedbackRecord[];
  readonly themeCounts: readonly ThemeCount[];
  readonly generatedAt: ISODate;
}

export interface OperationResult<T> {
  readonly ok: boolean;
  readonly value?: T;
  readonly errorCode?:
    | 'invalid-input'
    | 'consent-required'
    | 'not-found'
    | 'storage-error'
    | 'expired'
    | 'unsupported-version'
    | 'conflict'
    | 'disabled';
}

export interface AuditSummary {
  readonly profilePreferenceCount: number;
  readonly checkInCount: number;
  readonly activityFeedbackCount: number;
  readonly aggregateThemeCount: number;
  readonly eventCount: number;
  readonly containsRawJournalText: false;
  readonly containsRawChatText: false;
}
