import { validateActivityFeedback } from '../core/validation.ts';
import type { ActivityFeedbackRecord, SupportToolId } from '../core/types.ts';
import type { PersonalizationRepository } from '../store/contracts.ts';
import type { Clock } from '../core/time.ts';
import { systemClock } from '../core/time.ts';
import { createId } from '../core/id.ts';

export interface FeedbackServiceOptions {
  readonly repository: PersonalizationRepository;
  readonly isLearningEnabled: () => Promise<boolean>;
  readonly clock?: Clock;
}

export class RecommendationFeedbackService {
  private readonly options: FeedbackServiceOptions;
  private readonly clock: Clock;
  constructor(options: FeedbackServiceOptions) { this.options = options; this.clock = options.clock ?? systemClock; }

  async rate(activityId: SupportToolId, helpfulness: 1 | 2 | 3 | 4 | 5): Promise<ActivityFeedbackRecord> {
    if (!(await this.options.isLearningEnabled())) throw new Error('Usage learning is not enabled');
    const candidate = { id: createId('feedback', this.clock.now()), createdAt: this.clock.now().toISOString(), activityId,
      helpfulness, source: 'explicit-rating' as const };
    const checked = validateActivityFeedback(candidate);
    if (!checked.value) throw new Error('Invalid feedback');
    await this.options.repository.appendActivityFeedback(checked.value);
    return checked.value;
  }

  async skip(activityId: SupportToolId): Promise<ActivityFeedbackRecord> {
    if (!(await this.options.isLearningEnabled())) throw new Error('Usage learning is not enabled');
    const candidate = { id: createId('skip', this.clock.now()), createdAt: this.clock.now().toISOString(), activityId,
      helpfulness: 3 as const, skipped: true, source: 'explicit-skip' as const };
    const checked = validateActivityFeedback(candidate);
    if (!checked.value) throw new Error('Invalid skip feedback');
    await this.options.repository.appendActivityFeedback(checked.value);
    return checked.value;
  }

  async clear(): Promise<void> { await this.options.repository.replaceActivityFeedback([]); }
}
