import { normalizeForMatching } from '../../text/normalize-base.ts';
import { tokenize } from '../../text/tokenize.ts';
import type { ChatIntent } from '../types.ts';
import type { Language } from '../../types.ts';
import { normalizeKnowledgeQuery, queryExpansionScoreBoost } from './query-normalization.ts';
import { rerankKnowledgeMatches } from './reranker.ts';

export interface KnowledgeArticle {
  id: string;
  language: 'en' | 'fr' | 'es';
  intents: ChatIntent[];
  title: string;
  questions: string[];
  tags: string[];
  answer: string;
  /** Describes the scope of the answer; not shown unless diagnostics are requested. */
  scope: 'general_information' | 'app_navigation' | 'privacy_boundary' | 'safety_boundary';
}
export interface KnowledgeMatch {
  articleId: string;
  title: string;
  language: 'en' | 'fr' | 'es';
  intent: ChatIntent;
  score: number;
  margin: number;
  answer: string;
  scope: KnowledgeArticle['scope'];
}
export interface KnowledgeSearchOptions {
  minimumScore?: number;
  minimumMargin?: number;
  maxResults?: number;
  language?: Language;
  intent?: ChatIntent;
}

/** Reviewed, static, offline articles. Product-specific facts must be supplied by the app team, not guessed. */
export const DEFAULT_KNOWLEDGE_BASE: readonly KnowledgeArticle[] = Object.freeze([
  {
    id: 'emdr-basics-en', language: 'en', intents: ['explain_emdr'], title: 'What EMDR means',
    questions: ['what is emdr', 'what does EMDR stand for', 'how does EMDR work', 'explain eye movement desensitization and reprocessing'],
    tags: ['emdr', 'psychotherapy', 'clinician', 'bilateral stimulation'],
    answer: 'EMDR stands for eye movement desensitization and reprocessing. It is a psychotherapy approach delivered by trained clinicians and may involve recalling aspects of a distressing experience while using bilateral stimulation. This chatbot cannot provide EMDR treatment or determine whether EMDR is suitable for you; a qualified professional can explain its process, benefits, and limits.',
    scope: 'general_information',
  },
  {
    id: 'emdr-basics-fr', language: 'fr', intents: ['explain_emdr'], title: 'Définition de l’EMDR',
    questions: ['qu’est-ce que l’emdr', 'que signifie emdr', 'comment fonctionne l’emdr'],
    tags: ['emdr', 'psychothérapie', 'clinicien', 'stimulation bilatérale'],
    answer: 'EMDR signifie désensibilisation et retraitement par les mouvements oculaires. Il s’agit d’une approche psychothérapeutique offerte par des cliniciens formés, qui peut associer le rappel de certains aspects d’une expérience pénible à une stimulation bilatérale. Ce chatbot ne peut pas fournir de traitement EMDR ni déterminer si cette approche vous convient.',
    scope: 'general_information',
  },
  {
    id: 'emdr-basics-es', language: 'es', intents: ['explain_emdr'], title: 'Qué significa EMDR',
    questions: ['qué es emdr', 'qué significa emdr', 'cómo funciona emdr'],
    tags: ['emdr', 'psicoterapia', 'profesional', 'estimulación bilateral'],
    answer: 'EMDR significa desensibilización y reprocesamiento por movimientos oculares. Es un enfoque de psicoterapia que ofrecen profesionales formados y puede combinar el recuerdo de aspectos de una experiencia difícil con estimulación bilateral. Este chatbot no puede ofrecer tratamiento EMDR ni determinar si es adecuado para ti.',
    scope: 'general_information',
  },
  {
    id: 'app-limits-en', language: 'en', intents: ['app_help', 'explain_emdr'], title: 'What the app can and cannot do',
    questions: ['what can this app do', 'is this real therapy', 'does the app replace a therapist', 'is the chatbot a therapist'],
    tags: ['limitations', 'therapist', 'not therapy', 'wellbeing'],
    answer: 'This app can offer general information and optional present-focused support tools. It does not replace a licensed mental-health professional, diagnose conditions, or deliver clinician-guided EMDR. Exact features depend on the version you installed; I will not assume a control or feature exists unless the app exposes it.',
    scope: 'general_information',
  },
  {
    id: 'app-limits-fr', language: 'fr', intents: ['app_help', 'explain_emdr'], title: 'Limites de l’application',
    questions: ['que peut faire cette application', 'est-ce une vraie thérapie', 'le chatbot remplace-t-il un thérapeute'],
    tags: ['limites', 'thérapeute', 'bien-être'],
    answer: 'Cette application peut fournir des informations générales et des outils facultatifs axés sur le présent. Elle ne remplace pas un professionnel de la santé mentale, ne pose pas de diagnostic et ne fournit pas d’EMDR guidée par un clinicien. Les fonctions exactes dépendent de la version installée.',
    scope: 'general_information',
  },
  {
    id: 'app-limits-es', language: 'es', intents: ['app_help', 'explain_emdr'], title: 'Límites de la aplicación',
    questions: ['qué puede hacer la aplicación', 'esto es terapia real', 'el chatbot sustituye al terapeuta'],
    tags: ['límites', 'terapeuta', 'bienestar'],
    answer: 'Esta aplicación puede ofrecer información general y herramientas opcionales centradas en el presente. No sustituye a un profesional de salud mental, no diagnostica ni proporciona EMDR guiado clínicamente. Las funciones exactas dependen de la versión instalada.',
    scope: 'general_information',
  },
  {
    id: 'pause-stop-en', language: 'en', intents: ['app_help', 'pause', 'stop'], title: 'Pause and stop controls',
    questions: ['how do I pause stimulation', 'how do I stop the session', 'where is the stop button', 'stop controls'],
    tags: ['pause', 'stop', 'emergency control', 'session'],
    answer: 'Use the app’s dedicated pause or stop control, which should work independently of the chatbot. I cannot verify the exact screen layout of your version. If stimulation is active and you cannot find the control, use the app’s visible session controls immediately and do not rely on a generated chat response.',
    scope: 'safety_boundary',
  },
  {
    id: 'pause-stop-fr', language: 'fr', intents: ['app_help', 'pause', 'stop'], title: 'Commandes de pause et d’arrêt',
    questions: ['comment mettre en pause la stimulation', 'comment arrêter la séance', 'où est le bouton arrêter'],
    tags: ['pause', 'arrêt', 'commande de session'],
    answer: 'Utilisez le contrôle dédié de pause ou d’arrêt de l’application, qui doit fonctionner indépendamment du chatbot. Je ne peux pas vérifier la disposition exacte de votre version. Ne comptez pas sur une réponse générée pour arrêter une stimulation active.',
    scope: 'safety_boundary',
  },
  {
    id: 'pause-stop-es', language: 'es', intents: ['app_help', 'pause', 'stop'], title: 'Controles de pausa y parada',
    questions: ['cómo pausar la estimulación', 'cómo detener la sesión', 'dónde está el botón de parada'],
    tags: ['pausa', 'parada', 'control de sesión'],
    answer: 'Usa el control específico de pausa o parada de la aplicación, que debe funcionar independientemente del chatbot. No puedo verificar el diseño exacto de tu versión. No dependas de una respuesta generada para detener la estimulación activa.',
    scope: 'safety_boundary',
  },
  {
    id: 'privacy-current-en', language: 'en', intents: ['privacy'], title: 'Privacy and remote processing',
    questions: ['what data do you store', 'is my chat private', 'does the app send messages to a server', 'who can read my messages'],
    tags: ['privacy', 'data', 'remote model', 'storage', 'history'],
    answer: 'The chatbot module defaults to local responses and does not retain raw messages unless temporary in-memory retention is explicitly enabled. If remote generation is enabled, the current message is sent to the configured provider; past turns require separate history consent. Your installed app may have other storage or telemetry code, so check its actual privacy settings and provider terms.',
    scope: 'privacy_boundary',
  },
  {
    id: 'privacy-current-fr', language: 'fr', intents: ['privacy'], title: 'Confidentialité et traitement distant',
    questions: ['quelles données sont stockées', 'mes messages sont-ils privés', 'les messages sont-ils envoyés à un serveur'],
    tags: ['confidentialité', 'données', 'modèle distant', 'historique'],
    answer: 'Le module de chatbot privilégie les réponses locales et ne conserve pas les messages bruts sans activation explicite d’une mémoire temporaire. Si la génération distante est activée, le message actuel est transmis au fournisseur configuré ; l’historique nécessite un consentement distinct. Vérifiez les réglages et les conditions réelles de l’application installée.',
    scope: 'privacy_boundary',
  },
  {
    id: 'privacy-current-es', language: 'es', intents: ['privacy'], title: 'Privacidad y procesamiento remoto',
    questions: ['qué datos se guardan', 'son privados mis mensajes', 'la aplicación envía mensajes a un servidor'],
    tags: ['privacidad', 'datos', 'modelo remoto', 'historial'],
    answer: 'El módulo del chatbot prioriza respuestas locales y no conserva mensajes sin activar explícitamente una memoria temporal. Si se habilita la generación remota, el mensaje actual se envía al proveedor configurado; el historial requiere un consentimiento distinto. Comprueba los ajustes reales y las condiciones del proveedor de la aplicación instalada.',
    scope: 'privacy_boundary',
  },
  {
    id: 'grounding-en', language: 'en', intents: ['grounding'], title: 'Present-focused grounding',
    questions: ['what is grounding', 'help me get present', 'how does grounding work'],
    tags: ['grounding', 'present', 'senses', 'here and now'],
    answer: 'Grounding is a general coping exercise intended to draw attention to the present moment. You might notice your feet on the floor, name a few objects around you, or describe sounds you can hear. Keep it optional; stop if it feels uncomfortable or increases distress.',
    scope: 'general_information',
  },
  {
    id: 'grounding-fr', language: 'fr', intents: ['grounding'], title: 'Ancrage dans le présent',
    questions: ['qu’est-ce que l’ancrage', 'aide-moi à revenir au présent'],
    tags: ['ancrage', 'présent', 'sens'],
    answer: 'L’ancrage est un exercice général qui attire doucement l’attention vers le moment présent. Vous pouvez sentir vos pieds sur le sol, nommer quelques objets ou remarquer les sons environnants. Arrêtez si cela devient inconfortable ou augmente la détresse.',
    scope: 'general_information',
  },
  {
    id: 'grounding-es', language: 'es', intents: ['grounding'], title: 'Conexión con el presente',
    questions: ['qué es un ejercicio de conexión con el presente', 'ayúdame a volver al presente'],
    tags: ['presente', 'sentidos', 'anclaje'],
    answer: 'Un ejercicio de conexión con el presente dirige suavemente la atención al momento actual. Puedes notar los pies en el suelo, nombrar algunos objetos o escuchar sonidos cercanos. Detente si resulta incómodo o aumenta el malestar.',
    scope: 'general_information',
  },
  {
    id: 'breathing-en', language: 'en', intents: ['breathing'], title: 'Comfortable breathing',
    questions: ['how can I breathe calmly', 'what is a breathing prompt', 'breathing exercise'],
    tags: ['breathing', 'relaxation', 'breath'],
    answer: 'If comfortable, breathe gently in and let the breath out slowly without holding it. Do not force a deep breath or follow a count that feels uncomfortable. Return to ordinary breathing at any time.',
    scope: 'general_information',
  },
  {
    id: 'breathing-fr', language: 'fr', intents: ['breathing'], title: 'Respiration confortable',
    questions: ['comment respirer calmement', 'exercice de respiration'],
    tags: ['respiration', 'calme'],
    answer: 'Si cela vous convient, inspirez doucement puis laissez l’expiration se faire lentement sans retenir votre souffle. Ne forcez pas une respiration profonde. Revenez à votre respiration habituelle à tout moment.',
    scope: 'general_information',
  },
  {
    id: 'breathing-es', language: 'es', intents: ['breathing'], title: 'Respiración cómoda',
    questions: ['cómo respirar con calma', 'ejercicio de respiración'],
    tags: ['respiración', 'calma'],
    answer: 'Si te resulta cómodo, inspira suavemente y deja salir el aire despacio sin contener la respiración. No fuerces una respiración profunda. Puedes volver a respirar de manera normal en cualquier momento.',
    scope: 'general_information',
  },
  {
    id: 'professional-support-en', language: 'en', intents: ['professional_support'], title: 'Finding an EMDR clinician',
    questions: ['how to find a therapist', 'where do I find a licensed EMDR clinician', 'professional help'],
    tags: ['therapist', 'licensed', 'clinician', 'professional', 'support'],
    answer: 'Look for a licensed mental-health professional with documented EMDR training in your region. Verify credentials and scope of practice through a trusted professional registry. I cannot verify availability or recommend a specific provider without a vetted directory connected to this app.',
    scope: 'general_information',
  },
  {
    id: 'professional-support-fr', language: 'fr', intents: ['professional_support'], title: 'Trouver un clinicien EMDR',
    questions: ['comment trouver un thérapeute', 'trouver un professionnel formé à l’emdr'],
    tags: ['thérapeute', 'clinicien', 'professionnel'],
    answer: 'Recherchez un professionnel de la santé mentale autorisé et formé à l’EMDR dans votre région. Vérifiez ses qualifications auprès d’un registre professionnel fiable. Je ne peux pas vérifier sa disponibilité sans annuaire de confiance relié à l’application.',
    scope: 'general_information',
  },
  {
    id: 'professional-support-es', language: 'es', intents: ['professional_support'], title: 'Encontrar un profesional EMDR',
    questions: ['cómo encontrar terapeuta', 'encontrar profesional formado en emdr'],
    tags: ['terapeuta', 'profesional', 'clínico'],
    answer: 'Busca un profesional de salud mental autorizado y con formación en EMDR en tu región. Verifica sus credenciales mediante un registro profesional fiable. No puedo confirmar disponibilidad sin un directorio de confianza conectado a la aplicación.',
    scope: 'general_information',
  },
]);

const STOP_WORDS: Record<'en' | 'fr' | 'es', Set<string>> = {
  en: new Set('a an the is are do does did what how when where why can could would should i me my we you your this that with for to of and in on about please help tell explain'.split(' ')),
  fr: new Set('le la les un une des est sont que quoi comment quand où pourquoi je me ma nous vous votre ce cette et avec pour de du en sur aide explique'.split(' ')),
  es: new Set('el la los las un una es son que cómo cuando donde por qué yo me mi nosotros tú tu este esta y con para de del en sobre ayuda explica'.split(' ')),
};

export class LocalKnowledgeRetriever {
  private readonly articles: KnowledgeArticle[];
  private readonly documents: Array<{ article: KnowledgeArticle; terms: Set<string> }>;
  private readonly documentFrequency: Map<string, number>;

  constructor(articles: readonly KnowledgeArticle[] = DEFAULT_KNOWLEDGE_BASE) {
    this.articles = articles.map((article) => ({ ...article, intents: [...article.intents], questions: [...article.questions], tags: [...article.tags] }));
    this.documents = this.articles.map((article) => ({ article, terms: new Set(buildTerms(article)) }));
    this.documentFrequency = new Map();
    for (const document of this.documents) for (const term of document.terms) this.documentFrequency.set(term, (this.documentFrequency.get(term) ?? 0) + 1);
  }

  search(query: string, options: KnowledgeSearchOptions = {}): KnowledgeMatch[] {
    const language = options.language === 'fr' || options.language === 'es' ? options.language : 'en';
    const queryTerms = getTerms(query, language);
    if (!queryTerms.size) return [];
    const normalizedQuery = normalizeKnowledgeQuery(query, language);
    const expandedTerms = normalizedQuery.expandedTerms.filter((term) => term.length > 1 && !STOP_WORDS[language].has(term));
    const minScore = bounded(options.minimumScore, 0.24, 0, 1);
    const maxResults = Math.max(1, Math.min(10, Math.floor(options.maxResults ?? 3)));
    const scored = this.documents
      .filter(({ article }) => article.language === language && (!options.intent || article.intents.includes(options.intent)))
      .map(({ article, terms }) => {
        let overlap = 0;
        let weightedOverlap = 0;
        let totalQueryWeight = 0;
        for (const term of queryTerms) {
          const df = this.documentFrequency.get(term) ?? 1;
          const weight = 1 + Math.log((this.articles.length + 1) / (df + 1));
          totalQueryWeight += weight;
          if (terms.has(term)) { overlap++; weightedOverlap += weight; }
        }
        const cosineLike = weightedOverlap / Math.max(1, totalQueryWeight);
        const titleTerms = getTerms(article.title, language);
        const titleBoost = [...queryTerms].some((term) => titleTerms.has(term)) ? 0.12 : 0;
        const questionBoost = article.questions.some((question) => normalizeForMatching(question) === normalizeForMatching(query)) ? 0.3 : 0;
        const coverage = overlap / Math.max(1, queryTerms.size);
        const expansionBoost = queryExpansionScoreBoost([...queryTerms], terms, expandedTerms);
        const score = Math.min(0.99, cosineLike * 0.65 + coverage * 0.25 + titleBoost + questionBoost + expansionBoost);
        return { article, score };
      })
      .filter((row) => row.score >= minScore)
      .sort((a, b) => b.score - a.score || a.article.id.localeCompare(b.article.id));
    const firstPass = scored.slice(0, maxResults).map((row, index) => ({
      articleId: row.article.id,
      title: row.article.title,
      language: row.article.language,
      intent: row.article.intents[0] ?? 'unknown',
      score: round3(row.score),
      margin: round3(Math.max(0, row.score - (scored[index + 1]?.score ?? 0))),
      answer: row.article.answer,
      scope: row.article.scope,
    }));
    return rerankKnowledgeMatches(query, firstPass, this, language, maxResults).matches;
  }

  answer(query: string, options: KnowledgeSearchOptions = {}): KnowledgeMatch | undefined {
    const results = this.search(query, { ...options, maxResults: Math.max(2, options.maxResults ?? 2) });
    const winner = results[0];
    if (!winner) return undefined;
    const minimumMargin = bounded(options.minimumMargin, 0.035, 0, 1);
    if (results.length > 1 && winner.score - results[1]!.score < minimumMargin && winner.score < 0.5) return undefined;
    return winner;
  }

  getArticle(id: string): KnowledgeArticle | undefined {
    const article = this.articles.find((item) => item.id === id);
    return article ? { ...article, intents: [...article.intents], questions: [...article.questions], tags: [...article.tags] } : undefined;
  }

  listIds(): string[] { return this.articles.map((article) => article.id); }
}

export function searchLocalKnowledge(query: string, options?: KnowledgeSearchOptions): KnowledgeMatch[] {
  return new LocalKnowledgeRetriever().search(query, options);
}

function buildTerms(article: KnowledgeArticle): Set<string> {
  const language = article.language;
  return new Set([...getTerms(article.title, language), ...article.questions.flatMap((question) => [...getTerms(question, language)]), ...article.tags.flatMap((tag) => [...getTerms(tag, language)])]);
}
function getTerms(text: string, language: 'en' | 'fr' | 'es'): Set<string> {
  const normalized = normalizeForMatching(text);
  return new Set(tokenize(normalized).filter((term) => term.length > 1 && !STOP_WORDS[language].has(term)));
}
function bounded(value: number | undefined, fallback: number, min: number, max: number): number { return Number.isFinite(value) ? Math.max(min, Math.min(max, value as number)) : fallback; }
function round3(value: number): number { return Number(value.toFixed(3)); }
