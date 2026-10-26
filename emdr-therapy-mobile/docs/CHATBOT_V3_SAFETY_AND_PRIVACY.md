# Safety and Privacy Boundaries

## Intended boundary

This library offers app navigation/intents and generic wellness copy. It is not therapy, an EMDR protocol, a diagnostic tool, a medical triage service, or a validated suicide/self-harm detection system. It must not guide users through traumatic memories or encourage unsupervised trauma processing. A licensed professional should determine suitability for EMDR and treatment decisions.

## Never put NLP in the critical control path

1. The emergency stop must be a real button/control in the host app, not a predicted intent.
2. Do not automatically start a stimulation sequence based on free text, sentiment, estimated emotion, or model confidence.
3. On explicit stop input, the app should stop the active session independently; deterministic string detection can be an additional route, never the sole safety route.
4. NLP safety flags may trigger a conservative prompt and show vetted human support choices; they should not suppress a user's access to Stop or grounding.
5. If the signal is ambiguous, ask a low-pressure clarification. Never state that the user is safe because no pattern matched.

## Known limitations of keyword safety detection

Patterns can miss slang, spelling variants, metaphors, context, code-switching, and some languages. They can also flag quoted text, discussing past experiences, fiction, or negated statements. Quote/negation handling reduces some obvious errors but cannot reliably resolve intent or imminence. Never describe confidence numbers as clinical probabilities, and never use this package as the only crisis monitoring layer.

## Local-first behavior

- `LocalNlpAssistant` processes inputs in the current process and returns `remoteModelUsed: false`.
- Its context stores derived intent/emotion/topic/language/safety labels and is bounded; it deliberately avoids retaining original user messages.
- The standalone pipeline does not persist conversation text to disk.
- `redactSensitiveText`/`scrubForModel` are heuristic and may not redact every sensitive string. Prefer not to collect sensitive information at all.
- The remote adapter is not invoked by the assistant pipeline automatically. Any future remote call needs a clear opt-in, visible data-flow explanation, reviewable provider terms, TLS, retention controls, and a deletion/withdrawal pathway. Explicit consent cannot make an unsafe vendor arrangement safe by itself.
- If the host app stores optional check-ins/history elsewhere, review those storage pathways independently. This package does not guarantee host-app storage behavior.

## Emotion and sentiment outputs

Labels are derived from tiny lexicons and surface text. They can be wrong or culturally biased; don't call them diagnoses, use them to infer a disorder, personalize clinical treatment, make eligibility decisions, or display them as objective facts about the user. Avoid saving them beyond the short interaction unless there's a clear user benefit and consent.

## Crisis resources

Support resources should be current and localized to the user's region. Do not hard-code an assumed location based on IP or guess local hotline availability. When configuring support actions, use a reviewed and maintained resource directory and emergency guidance appropriate to the deployment region. In immediate danger, direct users to local emergency services and human support. The resource list itself needs a maintainer and verification cadence.
