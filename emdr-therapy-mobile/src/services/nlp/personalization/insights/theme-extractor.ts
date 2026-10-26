import { PERSONALIZATION_LIMITS } from '../core/config.ts';
import type { LanguageCode, ThemeCount, ThemeExtractionResult, ThemeId } from '../core/types.ts';

/** Small, transparent lexicons for opt-in reflection organization, not emotion inference. */
const TERMS: Readonly<Record<ThemeId, Readonly<Record<LanguageCode, readonly string[]>>>> = {
  'daily-routines': {
    en: ['routine', 'schedule', 'habit', 'morning', 'evening', 'daily', 'organize', 'chores'],
    fr: ['routine', 'horaire', 'habitude', 'matin', 'soir', 'quotidien', 'organiser', 'tâches'],
    es: ['rutina', 'horario', 'hábito', 'mañana', 'noche', 'diario', 'organizar', 'tareas'],
  },
  'sleep-and-energy': {
    en: ['sleep', 'rest', 'tired', 'energy', 'awake', 'bedtime', 'nap', 'fatigue'],
    fr: ['sommeil', 'repos', 'fatigué', 'énergie', 'éveillé', 'coucher', 'sieste', 'fatigue'],
    es: ['sueño', 'descanso', 'cansado', 'energía', 'despierto', 'dormir', 'siesta', 'fatiga'],
  },
  'relationships-and-connection': {
    en: ['friend', 'family', 'partner', 'connection', 'relationship', 'conversation', 'lonely', 'support'],
    fr: ['ami', 'famille', 'partenaire', 'lien', 'relation', 'conversation', 'seul', 'soutien'],
    es: ['amigo', 'familia', 'pareja', 'conexión', 'relación', 'conversación', 'solo', 'apoyo'],
  },
  'work-and-demands': {
    en: ['work', 'job', 'deadline', 'meeting', 'task', 'study', 'school', 'pressure'],
    fr: ['travail', 'emploi', 'échéance', 'réunion', 'tâche', 'étude', 'école', 'pression'],
    es: ['trabajo', 'empleo', 'plazo', 'reunión', 'tarea', 'estudio', 'escuela', 'presión'],
  },
  'uncertainty-and-change': {
    en: ['change', 'uncertain', 'decision', 'future', 'transition', 'unknown', 'choice', 'plan'],
    fr: ['changement', 'incertain', 'décision', 'avenir', 'transition', 'inconnu', 'choix', 'plan'],
    es: ['cambio', 'incierto', 'decisión', 'futuro', 'transición', 'desconocido', 'elección', 'plan'],
  },
  'self-compassion': {
    en: ['kindness', 'gentle', 'forgive', 'patience', 'self-care', 'compassion', 'kind to myself', 'acceptance'],
    fr: ['bienveillance', 'douceur', 'pardonner', 'patience', 'prendre soin', 'compassion', 'indulgence', 'acceptation'],
    es: ['amabilidad', 'suavidad', 'perdonar', 'paciencia', 'autocuidado', 'compasión', 'ser amable', 'aceptación'],
  },
  'body-and-senses': {
    en: ['body', 'breathing', 'breath', 'sound', 'light', 'temperature', 'touch', 'senses'],
    fr: ['corps', 'respiration', 'souffle', 'son', 'lumière', 'température', 'toucher', 'sens'],
    es: ['cuerpo', 'respiración', 'aliento', 'sonido', 'luz', 'temperatura', 'tacto', 'sentidos'],
  },
  'nature-and-outdoors': {
    en: ['nature', 'outside', 'garden', 'tree', 'park', 'walk outdoors', 'sky', 'water'],
    fr: ['nature', 'dehors', 'jardin', 'arbre', 'parc', 'promenade', 'ciel', 'eau'],
    es: ['naturaleza', 'afuera', 'jardín', 'árbol', 'parque', 'paseo', 'cielo', 'agua'],
  },
  'creative-activities': {
    en: ['draw', 'paint', 'music', 'write', 'craft', 'create', 'sing', 'read'],
    fr: ['dessiner', 'peindre', 'musique', 'écrire', 'artisanat', 'créer', 'chanter', 'lire'],
    es: ['dibujar', 'pintar', 'música', 'escribir', 'artesanía', 'crear', 'cantar', 'leer'],
  },
  'movement-and-rest': {
    en: ['stretch', 'movement', 'exercise', 'walk', 'sit', 'pause', 'break', 'relax'],
    fr: ['étirer', 'mouvement', 'exercice', 'marcher', 'asseoir', 'pause', 'interruption', 'détendre'],
    es: ['estirar', 'movimiento', 'ejercicio', 'caminar', 'sentar', 'pausa', 'descanso', 'relajar'],
  },
  other: { en: [], fr: [], es: [] },
};

const STOP_WORDS: Readonly<Record<LanguageCode, ReadonlySet<string>>> = {
  en: new Set('the a an and or but if then this that is are was were be been to of in on at it for with from by as i me my we our you your they them their'.split(' ')),
  fr: new Set('le la les un une des et ou mais si ce cette ces est sont était être de du dans sur à au aux il elle je me mon ma nous vous ils elles pour avec par comme'.split(' ')),
  es: new Set('el la los las un una unos unas y o pero si este esta estos es son era ser de del en sobre a al él ella yo me mi nosotros ustedes ellos ellas para con por como'.split(' ')),
};

function tokenize(text: string, language: LanguageCode): string[] {
  return (text.normalize('NFKC').toLocaleLowerCase(language).match(/[\p{L}\p{N}']+/gu) ?? [])
    .filter((token) => token.length > 1 && token.length <= 40 && !STOP_WORDS[language].has(token));
}

function matchesPhrase(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`, 'iu').test(text);
}

export interface ThemeExtractorOptions {
  readonly enabled: boolean;
  readonly language: LanguageCode;
  readonly maxCharacters?: number;
  readonly maxTokens?: number;
  readonly minMatchedTokens?: number;
}

export function extractReflectionThemes(text: string, options: ThemeExtractorOptions): ThemeExtractionResult {
  if (!options.enabled) return { counts: [], tokenCount: 0, matchedTokenCount: 0, confidence: 0, rawTextStored: false, needsReview: true };
  const maxCharacters = Math.min(PERSONALIZATION_LIMITS.maxReflectionCharacters, Math.max(100, options.maxCharacters ?? 3000));
  const maxTokens = Math.min(PERSONALIZATION_LIMITS.maxTokensPerReflection, Math.max(10, options.maxTokens ?? 600));
  const source = String(text ?? '').slice(0, maxCharacters).normalize('NFKC').toLocaleLowerCase(options.language);
  const tokens = tokenize(source, options.language).slice(0, maxTokens);
  const unique = new Set(tokens);
  const results: { themeId: ThemeId; count: number; matched: number }[] = [];
  for (const [themeId, langs] of Object.entries(TERMS) as [ThemeId, typeof TERMS[ThemeId]][]) {
    if (themeId === 'other') continue;
    const hits = langs[options.language].filter((term) => matchesPhrase(source, term));
    if (hits.length) results.push({ themeId, count: hits.length, matched: hits.length });
  }
  results.sort((a, b) => b.matched - a.matched || a.themeId.localeCompare(b.themeId));
  const top = results.slice(0, PERSONALIZATION_LIMITS.maxThemesPerReflection);
  const matchedTokenCount = top.reduce((sum, item) => sum + item.matched, 0);
  const minimum = Math.max(1, options.minMatchedTokens ?? 2);
  const confidence = Math.min(0.82, matchedTokenCount / Math.max(4, unique.size / 3));
  const counts: ThemeCount[] = top.map((item) => ({ themeId: item.themeId, count: item.count, source: 'opt-in-reflection-extraction' }));
  return {
    counts: matchedTokenCount >= minimum ? counts : [], tokenCount: tokens.length,
    matchedTokenCount, confidence, rawTextStored: false, needsReview: confidence < 0.45 || matchedTokenCount < minimum,
  };
}

export function mergeThemeCounts(current: readonly ThemeCount[], addition: readonly ThemeCount[], now = new Date()): readonly ThemeCount[] {
  // Keep one count per theme/day/source so the retention job can truly discard old themes.
  const day = now.toISOString().slice(0, 10);
  const updatedAt = now.toISOString();
  const next = new Map<string, ThemeCount>();
  for (const item of current) {
    if (!Number.isInteger(item.count) || item.count <= 0 || !item.day || !item.updatedAt) continue;
    const key = `${item.day}::${item.themeId}::${item.source}`;
    next.set(key, item);
  }
  for (const item of addition) {
    if (!Number.isInteger(item.count) || item.count <= 0) continue;
    const targetDay = item.day ?? day;
    const targetUpdatedAt = item.updatedAt ?? updatedAt;
    const key = `${targetDay}::${item.themeId}::${item.source}`;
    const existing = next.get(key);
    next.set(key, { themeId: item.themeId, day: targetDay, updatedAt: targetUpdatedAt,
      count: Math.min(PERSONALIZATION_LIMITS.maxThemeCount, (existing?.count ?? 0) + item.count), source: item.source });
  }
  return [...next.values()].sort((a, b) => (b.day ?? '').localeCompare(a.day ?? '') || b.count - a.count || a.themeId.localeCompare(b.themeId)).slice(0, 1000);
}

export function subtractThemeCounts(current: readonly ThemeCount[], remove: readonly ThemeCount[]): readonly ThemeCount[] {
  const deductions = new Map<string, number>();
  for (const item of remove) {
    const key = `${item.day ?? 'legacy'}::${item.themeId}::${item.source}`;
    deductions.set(key, (deductions.get(key) ?? 0) + item.count);
  }
  return current.flatMap((item) => {
    const key = `${item.day ?? 'legacy'}::${item.themeId}::${item.source}`;
    const remaining = Math.max(0, item.count - (deductions.get(key) ?? 0));
    return remaining ? [{ ...item, count: remaining }] : [];
  });
}
