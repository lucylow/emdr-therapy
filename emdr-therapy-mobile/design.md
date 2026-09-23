# EMDR Therapy Mobile App — Interface Design Plan

## Product stance

The first release is a **therapist-assisted companion**, not a replacement for diagnosis or treatment. The experience prioritizes preparation, grounding, gentle bilateral stimulation, journaling, and progress reflection. It avoids presenting self-guided trauma processing as clinically sufficient and makes the one-tap stop and grounding action persistent throughout active work.

The visual direction follows mainstream iOS conventions: portrait-first layouts, generous spacing, rounded cards, bottom-tab navigation, strong hierarchy, familiar SF Symbol-style icons, clear press feedback, and accessible contrast. The tone is calm and grounded rather than clinical or gamified.

## Screen list

| Screen | Primary content and functionality |
|---|---|
| Welcome / safety notice | Brief explanation of the app, clinical-use disclaimer, emergency guidance, and a clear “Continue” action. |
| Home | Today’s check-in, a “Begin a session” primary action, grounding shortcut, recent progress, and a small safety reminder. |
| Session setup | Session duration, BLS mode selection, speed/intensity controls, selected focus, and preparation checklist. |
| Preparation | Safe-place exercise, readiness check, and option to stop or return home. |
| Assessment | Image, negative cognition, positive cognition, body sensation, and SUD rating fields. Includes a non-invasive body-area selector for tension. |
| BLS session | Full-screen visual dot movement with optional audio/haptic indicators, session timer, current SUD, pause/stop control, and a reflection prompt between sets. |
| Grounding / closure | Breathing cadence, body scan, grounding prompts, final SUD, and safe exit confirmation. |
| Progress | Session count, total active time, SUD trend by focus, and reflective milestones without implying clinical recovery. |
| Journal | Local-first reflection entries, prompts, and private notes. |
| Resources | Grounding, breathing, and psychoeducation cards. The first release uses concise, static resources. |
| Settings & safety | BLS preferences, privacy statement, reminder preferences, emergency resources, and disclaimer. |

## Key user flows

### First launch

1. The user reads the safety notice and acknowledges that the app is an assistive tool.
2. The user lands on Home with no account requirement and no cloud sync enabled.
3. The user can start with a grounding exercise before considering a session.

### Begin a therapist-assisted session

1. The user taps “Begin a session” on Home.
2. Session setup presents a conservative default duration and visual BLS mode.
3. The user completes the preparation screen and confirms readiness.
4. The user records assessment details and selects an initial SUD score.
5. The app starts one BLS set at a time, pausing for reflection rather than running an unbounded exposure loop.
6. The persistent stop control immediately ends stimulation and routes to grounding.
7. Closure captures a final SUD and optional reflection locally on the device.

### Grounding at any time

1. The user taps “Pause & ground” from any active screen.
2. Stimulation stops before the grounding view appears.
3. The app guides slow breathing and sensory orientation.
4. The user chooses “Return to session” only if they feel ready, or “End safely” to close.

### Review progress

1. The user opens Progress from the tab bar.
2. The app shows locally stored session summaries and a trend line only when enough data exists.
3. The user can open a session reflection or return to Home.

## Navigation

The primary tab bar contains **Home**, **Progress**, **Journal**, and **Settings**. Session setup, preparation, assessment, BLS, grounding, and closure are stack screens presented above the tab bar. The active session uses a focused, darkened surface with the stop action always visible.

## Color choices

| Token | Color | Use |
|---|---|---|
| Ink | `#16252D` | Primary text and high-contrast controls |
| Canvas | `#F4F7F5` | Warm, low-stimulation background |
| Surface | `#FFFFFF` | Cards and input surfaces |
| Sage | `#2F6F68` | Primary action, active state, calm progress |
| Sage light | `#DCEBE5` | Tinted cards and selected controls |
| Sea glass | `#B8D8D2` | Secondary visual accents |
| Lavender mist | `#E8E5F2` | Gentle supportive accent |
| Amber | `#B97932` | Caution and readiness reminders |
| Stop coral | `#B84C4C` | Stop / end stimulation action |
| Divider | `#D9E2DE` | Borders and separators |

## Interaction and accessibility

All primary actions use visible press feedback and a minimum comfortable touch target. Active stimulation keeps the screen awake and avoids unnecessary motion elsewhere. The BLS view provides text state labels in addition to animation. Every destructive or ending action is explicit. The app should remain understandable with reduced motion, and haptic/audio modes are optional rather than required.

## Privacy and clinical safety defaults

Session details, reflections, and progress remain local-first in the prototype. No therapist portal, AI companion, blockchain storage, or cloud synchronization is enabled in this first implementation. Emergency guidance is informational and should be localized before release. The app must repeatedly direct users to a qualified mental-health professional for trauma processing and urgent services for immediate danger.

## README alignment notes — 2026-08-25

The provided README reframes this project as an **EMDR Flow AI Training** simulator for clinicians-in-training rather than a patient-facing therapy app. The implementation must explicitly state that it is a training simulator and decision-support prototype, not a medical device, autonomous therapist, or tool for unsupervised EMDR delivery. Any simulated supervisor flags are heuristic teaching cues and require qualified training, governance, privacy review, clinical validation, and regulatory/legal review before real-world use.

The target educational model follows eight EMDR phases: history/treatment planning, preparation, assessment, desensitization, installation, body scan, closure, and reevaluation. The intended architecture includes simulated AI patients, an educational supervisor, bounded adaptive bilateral stimulation, session telemetry, and a server-side AI gateway that never stores an LLM provider key in mobile code. Adaptive BLS may use SUD to influence pace only within conservative therapist-configured limits, with a persistent stop control.

The current project remains Expo SDK 54 / React Native 0.81, so the README’s Expo SDK 57 stack is treated as future alignment guidance rather than a dependency upgrade performed automatically.

## Deep AI feature alignment notes — 2026-08-25

The deep AI guidance requires shared contracts and audit traces; explicit consent, therapist-assignment, activation, fatigue, and override gates; structured synthetic-state estimation; explainable supervisor findings with evidence, confidence, and review status; provider abstraction for local, replay, and remote seams; transcript caps and simple PII redaction; evidence-linked documentation drafts that never sign or write clinical records; bounded grounding adaptation with `traumaReprocessingAllowed: false`; educational training scoring that is not a competency assessment; and golden-case/adversarial quality testing. The production flow must keep model keys out of the React Native bundle, validate strict structured outputs server-side, reject unsafe or unverifiable outputs, return evidence-linked findings, and preserve audit traces without unnecessary raw patient content.
