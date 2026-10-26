import type { InsightCard, LanguageCode } from '../core/types.ts';
import { dataLimitations } from './copy.ts';

export interface InsightViewModel {
  readonly id: string;
  readonly heading: string;
  readonly summary: string;
  readonly meta: string;
  readonly limitationNotes: readonly string[];
  readonly actionLabels: readonly string[];
  readonly accessibleLabel: string;
  readonly dismissible: true;
}

const KIND_LABELS: Record<InsightCard['kind'], Record<LanguageCode, string>> = {
  pattern: { en: 'Pattern', fr: 'Tendance', es: 'Patrón' },
  reflection: { en: 'Reflection', fr: 'Réflexion', es: 'Reflexión' },
  preference: { en: 'Preference', fr: 'Préférence', es: 'Preferencia' },
  usage: { en: 'App activity', fr: 'Activité de l’application', es: 'Actividad de la aplicación' },
};

const ACTION_TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  'view-details': { en: 'View details', fr: 'Voir les détails', es: 'Ver detalles' },
  dismiss: { en: 'Dismiss', fr: 'Ignorer', es: 'Descartar' },
  'adjust-preferences': { en: 'Adjust preferences', fr: 'Ajuster les préférences', es: 'Ajustar preferencias' },
  'export-data': { en: 'Export data', fr: 'Exporter les données', es: 'Exportar datos' },
  'clear-history': { en: 'Clear history', fr: 'Effacer l’historique', es: 'Borrar historial' },
  'open-grounding': { en: 'Open grounding', fr: 'Ouvrir l’ancrage', es: 'Abrir ejercicio de orientación' },
  'open-breathing': { en: 'Open breathing', fr: 'Ouvrir la respiration', es: 'Abrir respiración' },
};

export function toInsightViewModel(card: InsightCard, language: LanguageCode): InsightViewModel {
  const meta = `${KIND_LABELS[card.kind][language]} · ${new Date(card.createdAt).toLocaleDateString(language)}`;
  const actionLabels = card.actions.map((action) => ACTION_TRANSLATIONS[action.id]?.[language] ?? action.label);
  const accessibleLabel = `${card.title}. ${card.body}. ${actionLabels.join('. ')}`;
  return {
    id: card.id, heading: card.title, summary: card.body, meta,
    limitationNotes: card.limitations.length ? card.limitations : dataLimitations(language),
    actionLabels, accessibleLabel, dismissible: true,
  };
}

export function insightEmptyState(language: LanguageCode): { title: string; body: string } {
  const copy: Record<LanguageCode, { title: string; body: string }> = {
    en: { title: 'No summary yet', body: 'Summaries appear only after you opt in and log enough entries. You can use the app without insights.' },
    fr: { title: 'Aucun résumé pour le moment', body: 'Les résumés apparaissent uniquement après votre accord et lorsque suffisamment d’entrées sont enregistrées. L’application reste utilisable sans aperçus.' },
    es: { title: 'Aún no hay resumen', body: 'Los resúmenes aparecen solo si das tu consentimiento y registras suficientes entradas. Puedes usar la aplicación sin resúmenes.' },
  };
  return copy[language];
}
