import { createId } from '../core/id.ts';
import { toIso, type Clock, systemClock } from '../core/time.ts';
import { validateCheckIn } from '../core/validation.ts';
import type { CheckInRecord, ThemeId, SupportToolId } from '../core/types.ts';
import type { PersonalizationRepository } from '../store/contracts.ts';

export interface CheckInInput {
  readonly settlednessRating?: number;
  readonly phase: 'before' | 'after' | 'standalone';
  readonly activityId?: SupportToolId;
  readonly helpfulnessRating?: number;
  readonly selectedThemes?: readonly ThemeId[];
  readonly includeInInsights: boolean;
  readonly confirmSaveLocally: boolean;
}

export interface CheckInServiceOptions {
  readonly repository: PersonalizationRepository;
  readonly isAggregateInsightsEnabled: () => Promise<boolean>;
  readonly clock?: Clock;
}

export class CheckInService {
  private readonly options: CheckInServiceOptions;
  private readonly clock: Clock;
  constructor(options: CheckInServiceOptions) { this.options = options; this.clock = options.clock ?? systemClock; }

  async save(input: CheckInInput): Promise<CheckInRecord | undefined> {
    if (!input.confirmSaveLocally) return undefined;
    const aggregateEnabled = await this.options.isAggregateInsightsEnabled();
    const now = this.clock.now();
    const candidate: CheckInRecord = {
      id: createId('checkin', now), createdAt: toIso(now),
      phase: input.phase, settlednessRating: input.settlednessRating,
      activityId: input.activityId, helpfulnessRating: input.helpfulnessRating,
      selectedThemes: [...new Set(input.selectedThemes ?? [])].slice(0, 4),
      aggregateConsent: input.includeInInsights && aggregateEnabled,
    };
    const checked = validateCheckIn(candidate);
    if (!checked.value) throw new Error(`Invalid check-in: ${checked.issues.map((i) => i.code).join(',')}`);
    await this.options.repository.appendCheckIn(checked.value);
    return checked.value;
  }

  async remove(id: string): Promise<boolean> {
    const records = await this.options.repository.listCheckIns();
    const filtered = records.filter((record) => record.id !== id);
    if (filtered.length === records.length) return false;
    await this.options.repository.replaceCheckIns(filtered);
    return true;
  }

  async clearHistory(): Promise<void> { await this.options.repository.replaceCheckIns([]); }
}
