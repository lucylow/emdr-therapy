# EMDR Flow AI Frontend Redesign

This Expo Router application now uses the supplied Figma-inspired mobile redesign as its primary interface. The redesign keeps the existing project structure and backend code while adding a visual UI layer under `src/`.

## What is included

The primary experience now includes a premium ivory, graphite, forest-teal, and lavender visual system across onboarding, Home, Sessions, Session Detail, Active Session, Completion, Reflection, Insights, Profile, Privacy, Accessibility, Support, offline, permission, and recoverable-error states.

The mock account is intentionally fictional. It uses Alex Morgan, five sessions, 57 minutes, four reflections, and a current **Evening Reset** session. Session cards, insights, reflection language, and the active-session view all use the same descriptive data. AI language is marked as **AI-assisted reflection** and makes no diagnosis or clinical claim.

The Active Session screen connects to the project’s installed `expo-audio` player for ambient playback, retains the defensive session adapter for recoverable states, animates the visual cue, supports pause/resume/end actions, pauses on app interruption, and gives a Retry / Continue Visually / Back recovery path when audio is unavailable.

## Run locally

```bash
pnpm install --frozen-lockfile
pnpm start
```

## Preview QR code

`expo-qr-code.png` encodes the public Expo web preview URL in `EXPO_PREVIEW_URL.txt`. Scan it with a phone camera to open the responsive Expo web preview. This sandbox preview URL is temporary; use `pnpm start` or `npx expo start --tunnel` from your own network for a persistent Expo Go preview.

## Validated commands

```bash
pnpm test
pnpm check
pnpm lint
npx expo-doctor
pnpm exec expo export --platform ios
npx expo prebuild --clean --platform ios --no-install
```

The prebuild step is a validation step only; generated `ios/` output is intentionally excluded from the source archive so EAS can generate it from the managed Expo configuration.
