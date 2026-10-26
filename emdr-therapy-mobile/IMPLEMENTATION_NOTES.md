# Implementation notes

This archive includes a focused companion-app MVP update based on the implementation brief.

## Included changes

- Home now presents neutral, user-chosen routes for grounding, check-in, journaling, practice setup, and support. It no longer labels static items as personalized suggestions.
- Added an optional transient check-in with user-selected, descriptive words. The screen does not save responses, infer diagnoses, or calculate a readiness or outcome score.
- Grounding now starts with outward orientation, offers an optional movement prompt set with stillness alternatives, and lets users skip cues. Existing session Stop/Pause behavior was left in place.
- Journal adds per-entry deletion with confirmation and a safe read-failure guard. A user-authored, editable share draft opens the native share sheet only after the user chooses to proceed; no AI summary is generated.
- Preparation copy is more choice-led and notes the app is not EMDR therapy and cannot assess readiness.
- Privacy settings disclose that AsyncStorage is unencrypted, the current export action is only a preview, and device-backup behavior is unverified.
- Added six session catalogue examples, three audio-track examples, and four varied reflection examples. The profile and the catalogue/history screens identify this as fictional sample data; the examples make no treatment claims.
- Chatbot/NLP hardening: derived conversation context and emotion cues now default off; the AI Lab offers explicit temporary context opt-in and describes the derived metadata retained. Clear/forget invalidates in-flight turns, chat input is bounded, NLP actions are rendered as navigation only, and policy switches are explicitly labeled as a demo rather than actual authorization.
- Ambiguous body-sensation meaning questions now receive uncertainty-first, non-diagnostic copy in English, French, and Spanish. Crisis navigation is exposed from response actions; the crisis page clarifies 911's US/Canada scope and reports call/text-link failures. Focused safety/privacy regression tests were added.

## Important limitations

This is still a prototype. No full Expo native build or on-device accessibility test was run in this environment. Project dependencies are absent; `tsc --noEmit` stops because `expo/tsconfig.base`, `nativewind/types`, and Node type definitions are unavailable. Vitest could not run without installed dependencies. The changed TypeScript/TSX files and focused NLP runtime invariants were checked with the globally available TypeScript compiler and Node. Journal deletion, mock-data, and chatbot safety/privacy regression tests are included for execution in a dependency-installed project. Semantic retrieval, user-approved therapist summaries, region-specific crisis directory, and remote AI are not enabled by this update.

App-managed journal data remains in unencrypted local storage. Sharing through an operating-system share sheet can expose the user-authored text to the selected destination; users should review it before proceeding. No device-backup, release-network, third-party SDK, or security audit has been completed. This app is a companion, not a replacement for a qualified EMDR clinician, and it must not be used to automate trauma-memory processing.
