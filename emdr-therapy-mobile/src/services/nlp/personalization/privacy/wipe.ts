import type { PersonalizationRepository } from '../store/contracts.ts';

export const DELETE_CONFIRMATION_PHRASE = 'DELETE LOCAL DATA';

export interface WipeResult {
  readonly deleted: boolean;
  readonly recordsCleared: boolean;
  readonly note: string;
}

/** Destructive deletion requires an explicit second-step confirmation phrase from the UI. */
export async function deleteAllLocalPersonalizationData(
  repository: PersonalizationRepository,
  confirmationPhrase: string,
): Promise<WipeResult> {
  if (confirmationPhrase !== DELETE_CONFIRMATION_PHRASE) {
    return { deleted: false, recordsCleared: false, note: 'Confirmation phrase did not match; no data was changed.' };
  }
  await repository.deleteAll();
  return { deleted: true, recordsCleared: true, note: 'Local personalization records were cleared from the configured repository.' };
}

export async function clearEventsOnly(repository: PersonalizationRepository, confirmed: boolean): Promise<boolean> {
  if (!confirmed) return false;
  await repository.replaceEvents([]);
  return true;
}

export async function clearThemeHistory(repository: PersonalizationRepository, confirmed: boolean): Promise<boolean> {
  if (!confirmed) return false;
  await repository.writeThemeCounts([]);
  return true;
}
