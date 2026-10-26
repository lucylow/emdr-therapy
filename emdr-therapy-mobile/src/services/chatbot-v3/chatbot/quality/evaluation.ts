import type { ChatEvaluationCase, ChatEvaluationReport, ChatEvaluationRow, ChatIntent, ChatControl } from '../types.ts';
import { ChatIntentRouter } from '../routing/router.ts';

export function evaluateChatRoutes(cases: ChatEvaluationCase[], router = new ChatIntentRouter()): ChatEvaluationReport {
  const rows: ChatEvaluationRow[] = cases.map((item) => {
    const result = router.route(item.text, item.language ?? 'unknown');
    return {
      expected: item.expectedIntent,
      predicted: result.intent,
      correct: result.intent === item.expectedIntent,
      expectedControl: item.expectedControl,
      predictedControl: result.directControl,
      controlCorrect: item.expectedControl === undefined ? undefined : result.directControl === item.expectedControl,
      inputChars: item.text.length,
      language: item.language ?? 'unknown',
    };
  });
  const total = rows.length;
  const correct = rows.filter((row) => row.correct).length;
  const controlRows = rows.filter((row) => row.expectedControl !== undefined);
  const controlCorrect = controlRows.filter((row) => row.controlCorrect).length;
  const byIntent: ChatEvaluationReport['byIntent'] = {};
  for (const row of rows) {
    const current = byIntent[row.expected] ?? { total: 0, correct: 0, accuracy: 0 };
    current.total++;
    if (row.correct) current.correct++;
    current.accuracy = Number((current.correct / current.total).toFixed(4));
    byIntent[row.expected] = current;
  }
  return {
    total,
    correct,
    accuracy: total === 0 ? 0 : Number((correct / total).toFixed(4)),
    controlCases: controlRows.length,
    controlCorrect,
    controlRecall: controlRows.length === 0 ? 1 : Number((controlCorrect / controlRows.length).toFixed(4)),
    byIntent,
    rows,
  };
}

export function assertMinimumControlRecall(report: ChatEvaluationReport, minimum = 1): void {
  if (report.controlRecall < minimum) throw new Error(`Control recall ${report.controlRecall} is below required ${minimum}.`);
}

export function buildChatEvaluationCases(): ChatEvaluationCase[] {
  const rows: Array<[string, ChatIntent, import('../../types.ts').Language]> = [
    ['Hi', 'greeting', 'en'], ['Hello there', 'greeting', 'en'], ['Bonjour', 'greeting', 'fr'], ['Hola', 'greeting', 'es'],
    ['bye for now', 'goodbye', 'en'], ['au revoir', 'goodbye', 'fr'], ['adiós', 'goodbye', 'es'],
    ['what is EMDR?', 'explain_emdr', 'en'], ['Can you explain how EMDR works?', 'explain_emdr', 'en'], ["Qu'est-ce que l'EMDR", 'explain_emdr', 'fr'], ['qué es emdr', 'explain_emdr', 'es'],
    ['help me use the app', 'app_help', 'en'], ['where are the settings?', 'app_help', 'en'], ['comment utiliser l’application', 'app_help', 'fr'], ['cómo usar la aplicación', 'app_help', 'es'],
    ['can we do a grounding exercise', 'grounding', 'en'], ['I need grounding', 'grounding', 'en'], ['un exercice d’ancrage', 'grounding', 'fr'], ['quiero un ejercicio de conexión con el presente', 'grounding', 'es'],
    ['help me breathe slowly', 'breathing', 'en'], ['respiration calme', 'breathing', 'fr'], ['ejercicio de respiración', 'breathing', 'es'],
    ['I feel overwhelmed', 'share_feelings', 'en'], ['I am having a difficult day', 'share_feelings', 'en'], ['je me sens triste', 'share_feelings', 'fr'], ['me siento ansioso', 'share_feelings', 'es'],
    ['ask me a reflection question', 'reflection', 'en'], ['journal prompt please', 'reflection', 'en'], ['question de réflexion', 'reflection', 'fr'], ['pregunta de reflexión', 'reflection', 'es'],
    ['change the stimulation settings', 'configure_stimulation', 'en'], ['where can I change volume?', 'configure_stimulation', 'en'],
    ['what data do you store?', 'privacy', 'en'], ['delete my data', 'privacy', 'en'], ['confidentialité des données', 'privacy', 'fr'], ['privacidad de datos', 'privacy', 'es'],
    ['find a therapist', 'professional_support', 'en'], ['I want to talk to a therapist', 'professional_support', 'en'], ['trouver un thérapeute', 'professional_support', 'fr'], ['buscar terapeuta', 'professional_support', 'es'],
    ['that was helpful', 'feedback', 'en'], ['not helpful', 'feedback', 'en'], ['the answer was too long', 'feedback', 'en'],
    ['I do not understand', 'unknown', 'en'], ['maybe something else', 'unknown', 'en'], ['', 'unknown', 'en'],
  ];
  const cases: ChatEvaluationCase[] = rows.map(([text, expectedIntent, language]) => ({ text: String(text), expectedIntent: expectedIntent as ChatIntent, language: language as ChatEvaluationCase['language'] }));
  const controls: Array<[string, ChatControl]> = [
    ['stop', 'stop'], ['stop now', 'stop'], ['please stop', 'stop'], ['end session', 'stop'], ['arrête maintenant', 'stop'], ['para', 'stop'],
    ['pause', 'pause'], ['pause now', 'pause'], ['take a break', 'pause'], ['hold on', 'pause'], ['fais une pause', 'pause'], ['hacer una pausa', 'pause'],
  ];
  for (const [text, expectedControl] of controls) {
    cases.push({ text, expectedIntent: expectedControl === 'stop' ? 'stop' : 'pause', expectedControl, language: text === 'arrête maintenant' || text === 'fais une pause' ? 'fr' : text === 'para' || text === 'hacer una pausa' ? 'es' : 'en' });
  }
  return cases;
}
