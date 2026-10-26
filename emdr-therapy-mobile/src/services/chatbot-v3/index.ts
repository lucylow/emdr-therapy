export { createLocalNlpAssistant, LocalNlpAssistant } from './assistant.ts';
export { DEFAULT_NLP_CONFIG, PIPELINE_VERSION, resolveConfig } from './config.ts';
export { normalizeUserText, normalizeForMatching } from './text/normalize.ts';
export { tokenize, splitSentences, ngrams, countWords } from './text/tokenize.ts';
export { detectLanguage } from './text/language.ts';
export { classifyIntent } from './intent/classifier.ts';
export { LocalNaiveBayesIntentModel } from './intent/naive-bayes.ts';
export { estimateEmotion } from './affect/emotion.ts';
export { detectSafetySignals, hasSafetySignal } from './safety/detector.ts';
export { createSafetyResponse } from './safety/policy.ts';
export { guardAssistantOutput } from './safety/output-guard.ts';
export { redactSensitiveText, scrubForModel } from './privacy/redaction.ts';
export { LocalFeedbackCounter } from './privacy/feedback.ts';
export { extractEntities } from './entities/extractor.ts';
export { EphemeralConversationContext } from './context/context.ts';
export { resolveFollowUp } from './context/follow-up.ts';
export { planResponse } from './response/planner.ts';
export { getTemplate, getSafetyDisclaimer } from './response/templates.ts';
export { tryRemoteGeneration } from './integrations/remote-adapter.ts';
export { evaluateLabels, assertMinimumSafetyRecall } from './evaluation/metrics.ts';
export { getGroundingExercises } from './grounding/exercises.ts';
export type * from './types.ts';

export { assessInputQuality } from './text/quality.ts';
export { removeStopWords, stemForMatching, stems, lexicalOverlap, classifyQuestionType } from './text/morphology.ts';
export { editDistance, fuzzyPhraseMatch } from './intent/fuzzy-match.ts';
export { EXPANDED_TRAINING_CORPUS } from './intent/training-corpus.ts';
export { parseInteractionPreferences, applyPreferencePatch, DEFAULT_INTERACTION_PREFERENCES } from './context/preferences.ts';
export { ConsentController } from './privacy/consent.ts';
export { analyzeDiscourse } from './text/discourse.ts';
export { explainIntent } from './intent/explain.ts';
export { evaluateCalibration } from './evaluation/calibration.ts';
export { getReflectionPrompts } from './response/reflection-library.ts';

export { LocalTfidfIntentModel } from './intent/tfidf.ts';
export { analyzeSentiment } from './affect/sentiment.ts';
export { splitClauses, findNegationScope, analyzeUtteranceContext } from './text/clause-analysis.ts';
export type { Clause, NegationScope, UtteranceContext } from './text/clause-analysis.ts';

export { extractPreferenceSlots } from './intent/slots.ts';
export type { PreferenceSlot, PreferenceSlotName, PreferenceSlotValue, PreferenceParseResult } from './intent/slots.ts';
export { evaluateRobustness } from './evaluation/robustness.ts';
export type { RobustnessExample, RobustnessRow, RobustnessReport } from './evaluation/robustness.ts';

// Optional conversation-oriented chatbot extension. It shares the local NLP core.
export * from './chatbot/index.ts';
