# Integration Guide — Expo / React Native

This package is designed to be copied into an existing app, not to replace it. Keep the existing stimulation implementation, navigation, app config, and dependency versions until a real repository checkout confirms the proper integration points.

## 1. Find the actual app root

The repository has an `emdr-therapy-mobile` subdirectory; don't assume the repository root is the Expo app root. From a fresh checkout:

```sh
git clone https://github.com/lucylow/emdr-therapy.git
cd emdr-therapy
find . -maxdepth 4 -name package.json -print
find . -maxdepth 4 -name app.json -o -name app.config.ts -o -name app.config.js
```

Enter the directory whose `package.json` owns the existing Expo commands and whose app config belongs to the mobile app. Do not create an unrelated root `package.json` to hide a wrong working directory.

## 2. Copy the folder without flattening imports

Copy this bundle's `src/` tree into a folder inside the app, for example:

```text
emdr-therapy-mobile/
  src/
    services/
      nlp/                  # copy contents of this bundle's src/ here
        assistant.ts
        index.ts
        ...
```

Preserve the file tree. Source files use relative TypeScript imports with `.ts` extensions. Expo's TypeScript project typically uses a bundler module resolution strategy, but verify it against the host's existing `tsconfig.json` rather than overwriting project config wholesale. Keep tests, scripts, and this documentation outside the app bundle if Metro's configured roots would otherwise include them.

## 3. Use it in a service or hook

```ts
import { createLocalNlpAssistant } from '../services/nlp/index';

// Create once per app/chat lifetime, not on every render.
const nlpAssistant = createLocalNlpAssistant();

async function replyToUser(message: string) {
  const result = await nlpAssistant.process({
    text: message,
    conversationId: activeConversationId,
  });

  // The returned content is generic support copy, not a diagnosis.
  setMessages((previous) => [
    ...previous,
    { role: 'assistant', content: result.text },
  ]);
  setSuggestedActions(result.actions);
}

function clearChat() {
  nlpAssistant.forget(activeConversationId);
  clearMessagesFromUi();
}
```

Adapt state and hooks to the actual app. The snippet is illustrative; names like `setMessages`, `activeConversationId`, and `setSuggestedActions` are owned by the host and are not part of this package.

## 4. Wire hard session controls separately

Action IDs are intents/suggestions. They do not call hardware, Web Audio, animation loops, timers, navigation, or the session controller. The host app should map them to explicit UI handlers:

- `pause`: invoke the tested pause method on the session controller.
- `stop`: invoke the tested emergency-stop method directly; stop audio, timers, animation frames, subscriptions, and animation state.
- `grounding` / `breathing`: navigate to existing support tools, not into trauma processing.
- `contact_support`: show vetted, locale-specific support options and make them region-aware where possible.

The most prominent Stop control must always be directly accessible, work without NLP, and remain functional offline. Never allow an NLP result to start or continue bilateral stimulation automatically.

## 5. Verify in the actual app root

```sh
npm install
npx tsc --noEmit
npm run lint       # only if the existing app defines this script
npm test           # only if the existing app defines this script
npx expo export    # or use the app's documented production build command
```

Use the actual scripts in the host `package.json`; don't assume every command exists. Also test an iOS/Android development build and real-device behavior: safe areas, screen reader labels, reduced motion, app background/foreground, audio focus, timer cleanup, and emergency stop under slow-device load. Do not use the bundle's standalone `npm test` command as a substitute for an Expo export/build.

## 6. Tune through labeled examples, not large synthetic padding

Add new utterances only when they represent genuine phrasing variation. Label each example with the intended route; include typos, short messages, negation, indirect questions, quoted text, mixed feelings, and multilingual variants. Keep emergency-stop commands routed deterministically ahead of fuzzy or statistical scoring. Review false positives and false negatives separately. Hold out examples for evaluation rather than measuring only on the same seed corpus used by the model.


## 7. Parse preferences as suggestions

The optional `extractPreferenceSlots(text, language)` helper can surface simple requests such as “mute the sound” or “slower movement”. It returns candidate slots with confidence and a `requiresConfirmation: true` marker; conflicts are returned separately. It **does not** change settings. Show the proposed settings in accessible UI and only apply after the user confirms. Do not map these slots to start, resume, or safety-critical session controls.

## 8. Evaluate robustness before expanding the corpus

`evaluateRobustness(examples, config)` runs fixed perturbations across labeled examples and returns transformation-level error rows. Add a reviewed held-out set from varied phrasing and language samples. Make changes based on the false positives/false negatives in that held-out set rather than adding large quantities of near-duplicate synthetic strings.
