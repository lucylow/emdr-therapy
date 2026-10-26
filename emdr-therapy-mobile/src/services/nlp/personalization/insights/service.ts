import type { PersonalizationRepository } from '../store/contracts.ts';
import type { InsightCard, ProfileSnapshot } from '../core/types.ts';
import { buildSettlednessTrend } from './trend.ts';
import { buildWeeklyDigest } from './weekly-digest.ts';
import { suppressDuplicateInsights } from './suppression.ts';
import { applyRetention } from '../privacy/retention.ts';

export interface InsightsServiceOptions {
  readonly repository: PersonalizationRepository;
  readonly getProfile: () => Promise<ProfileSnapshot>;
  readonly clock?: () => Date;
}

export interface InsightsResponse {
  readonly enabled: boolean;
  readonly cards: readonly InsightCard[];
  readonly suppressedReason?: 'insights-disabled' | 'consent-disabled';
  readonly generatedAt: string;
}

export class InsightsService {
  private readonly options: InsightsServiceOptions;
  constructor(options: InsightsServiceOptions) { this.options = options; }

  async getInsights(consentEnabled: boolean, seenIds: ReadonlySet<string> = new Set()): Promise<InsightsResponse> {
    const now = (this.options.clock ?? (() => new Date()))();
    const profile = await this.options.getProfile();
    if (!profile.settings.insightsEnabled) return { enabled: false, cards: [], suppressedReason: 'insights-disabled', generatedAt: now.toISOString() };
    if (!consentEnabled) return { enabled: false, cards: [], suppressedReason: 'consent-disabled', generatedAt: now.toISOString() };
    const records = (await this.options.repository.listCheckIns()).filter((record) => record.aggregateConsent);
    const trend = buildSettlednessTrend(records, { enabled: true, now, windowDays: 28 });
    const digest = buildWeeklyDigest(records, { enabled: true, language: profile.settings.language, now, days: 28 });
    const candidates = [trend.card, ...digest.cards].filter((card): card is InsightCard => !!card);
    const cards = suppressDuplicateInsights(candidates, seenIds, 5);
    return { enabled: true, cards, generatedAt: now.toISOString() };
  }

  async pruneHistory(now = new Date()): Promise<Awaited<ReturnType<typeof applyRetention>>> {
    const profile = await this.options.getProfile();
    return applyRetention(this.options.repository, profile.settings.retentionDays, now);
  }
}
