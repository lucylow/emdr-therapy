# Model Card: EMDR Flow Local NLP Support Layer

## Summary

A deterministic hybrid text-processing component combining phrase rules, a small reviewed seed corpus, Multinomial Naive Bayes, TF-IDF similarity, fuzzy text matching, local lexical cues, and response templates. It is designed for app support/navigation, not open-ended generative conversation.

## Intended use

- Route simple requests such as hello, pause, stop, grounding, breathing, explain the app, privacy questions, and requests for professional support.
- Offer generic non-clinical copy and action suggestions.
- Provide transparent language, intent, entity, text quality, and lexical sentiment cues for the host UI where genuinely helpful.
- Operate locally and return a bounded response schema.

## Out of scope

- Clinical assessment, diagnosis, treatment recommendations, EMDR facilitation, trauma processing, prediction of suicide/self-harm intent, or deciding that a user is safe.
- Unsupervised autonomous action, including starting/resuming stimulation.
- Replacement for vetted professional support or emergency services.

## Architecture

1. Bound and normalize text.
2. Detect a likely language from a lightweight heuristic.
3. Check direct phrase routes and combine local statistical routes (Naive Bayes/TF-IDF) where applicable.
4. Analyze simple non-clinical affect/discourse/entity cues.
5. Evaluate separate heuristic safety signals.
6. Produce templated response/actions and optional bounded derived context.
7. Return metadata without echoing the raw user message into telemetry.

## Languages and populations

The implementation includes preliminary rules/lexical features for English, French, and Spanish. Coverage is sparse, not parity-tested, and not appropriate for high-stakes use. Children, culturally diverse users, dialects, augmentative communication, code-switching, speech recognition errors, and users with atypical language are not specifically validated.

## Evaluation

`npm test` exercises unit and regression behaviors in the checked-in synthetic tests. `npm run eval` tests 14 hand-written smoke examples and is expected to be too small to support broad performance claims. Tests currently focus on deterministic routes, stop/pause phrase routing, preference-slot extraction, transformed-text robustness plumbing, basic privacy behavior, and known risk-pattern examples. They are not independently annotated clinical data, not a production benchmark, and not evidence of sensitivity/specificity in real usage.

Before production release, create a consented and privacy-reviewed labeled dataset, pre-register metrics, split train/validation/test examples by speaker/session where relevant, report per-language and subgroup error analysis, test false negatives and false positives, and obtain independent clinical/safety review. Never upload raw sensitive chat text to analytics by default.

## Limitations and failure modes

- Intent labels are approximate; confidence scores are model scores, not calibrated probabilities.
- TF-IDF measures lexical overlap, not deep semantic equivalence; paraphrases can be missed.
- Naive Bayes assumes feature independence and depends heavily on the seed corpus.
- Sentiment/emotion labels use small word lists, not nuanced contextual understanding.
- Negation/quotation analysis is shallow and can misread the scope or speaker.
- Safety patterns can miss risk or raise false alarms; use human support and hard-coded, tested safety controls around the component.
- Templates can be repetitive and should remain easy to audit/translate.

## Privacy and deployment

No external model or network connection is used by the default assistant processing function. Context is in-memory and bounded. Remote generation helpers are separate and consent-gated. Host-app integration can introduce its own data collection and storage behavior, which must be reviewed separately.

## Maintainer responsibilities

Version the corpus and rules, document changes, rerun regression tests for each language, manually review safety changes, keep support resources up to date, test the app in the actual Expo runtime, and avoid deploying for clinical decisions without appropriate regulatory, professional, privacy, and safety review.
