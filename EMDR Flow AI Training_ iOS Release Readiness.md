# EMDR Flow AI Training: iOS Release Readiness

**Prepared by:** Manus AI  
**Date:** 2026-09-23  
**Scope:** Expo SDK 54 / React Native iOS submission hardening

## Release conclusion

The project now has a clean install path, a valid Expo configuration, and passing automated code checks. The iOS application configuration uses bundle identifier `com.app.emdrtherapymobile`, build number `1`, a stable `emdrflow` deep-link scheme, a production EAS profile, and a 1254 × 1254 opaque icon source. The iOS JavaScript bundle and a temporary native iOS prebuild both completed successfully.

The project is **not automatically cleared for App Store submission** solely by this code change. The account-side steps in the final section remain mandatory because they require the product owner’s Apple Developer, App Store Connect, Expo/EAS, OAuth, and privacy-policy records. The source deliberately fails closed when a production backend lacks its security-critical configuration rather than issuing sessions with an empty signing secret.

## Changes applied

| Area                   | Release hardening completed                                                                                                                                                                                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Dependency integrity   | Added missing server and build-tool dependencies; regenerated `pnpm-lock.yaml`; verified `pnpm install --frozen-lockfile`.                                                                                                                                                                                                                                         |
| Expo and EAS           | Switched versioning to local source control, added iOS build number and app-version runtime policy, set store distribution and production EAS environment, and removed unused video/notification configuration.                                                                                                                                                    |
| Permissions            | Disabled microphone and Android recording permissions because the shipped code uses playback only. Removed unused notification and video packages.                                                                                                                                                                                                                 |
| iOS app icon           | Replaced the 512 × 512 release icon source with a checked opaque 1254 × 1254 PNG.                                                                                                                                                                                                                                                                                  |
| Runtime resilience     | Added a root error boundary, safe API timeouts and user-safe errors, secure-token storage behavior, one-time random OAuth state validation, malformed OAuth configuration handling, deep-link parameter normalization, and storage-corruption recovery signals.                                                                                                    |
| BLS safety lifecycle   | Stops native audio and animation before grounding navigation; stops on route blur and backgrounding; requires deliberate resume; makes the screen scrollable; increases option control touch targets; corrects nested switch accessibility semantics.                                                                                                              |
| Local records          | Adds input bounds, rejects invalid persisted data, serializes telemetry mutations, and avoids overwriting malformed/unavailable telemetry with a new session record.                                                                                                                                                                                               |
| Backend trust boundary | Fails closed for incomplete production environment variables, constrains CORS to an explicit allow-list, reduces request body limits and timeouts, scopes cookies explicitly, removes sensitive diagnostic logging, binds session issuer/audience, shortens default sessions to eight hours, and disables storage redirects except for configured public prefixes. |
| Secret hygiene         | Ignores environment files and includes a non-secret `server/.env.example` contract.                                                                                                                                                                                                                                                                                |

## Validation performed

| Check                     | Result                                                                                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit tests                | **53 passed; 1 intentionally skipped**                                                                                                                                                          |
| TypeScript                | **Passed** with `tsc --noEmit`                                                                                                                                                                  |
| Expo lint                 | **Passed** with `expo lint`                                                                                                                                                                     |
| Dependency lock integrity | **Passed** with `pnpm install --frozen-lockfile`                                                                                                                                                |
| Expo public configuration | **Passed**; confirmed build number, bundle identifier, custom scheme, disabled microphone permission, and minimal Android audio permission                                                      |
| Credential signature scan | **Passed**; no common API-key/private-key signatures found outside dependencies and generated metadata                                                                                          |
| iOS JavaScript export     | **Passed**; Metro bundled 1,575 modules and emitted the iOS Hermes bundle                                                                                                                       |
| Native iOS prebuild       | **Passed**; generated Info.plist contains the configured bundle/version/encryption entries and does not contain `NSMicrophoneUsageDescription`; the generated tree was removed after inspection |

## Data and privacy review

The application writes journal text, safety-plan entries, contact details, session scores, and simulator telemetry to local AsyncStorage. The new code validates these records and protects authentication tokens in SecureStore. It does **not** claim that unencrypted AsyncStorage is equivalent to medical-record encryption. If the product will store real patient records, it must receive a product-level privacy and security design review before release. That review should decide whether data remains only on device, whether it is encrypted at rest with a Keychain-protected key, whether an app lock is required, whether backups are disabled, and how deletion and retention work.

The hardened backend uses an eight-hour signed session lifetime but does not yet implement a server-side token-revocation or refresh-token store. This limits exposure compared with the original one-year token, but a remote-account release should add revocation before claiming immediate server-side logout across devices. A training-only, entirely local release should omit remote sign-in rather than ship an unconfigured backend.

Apple requires a privacy disclosure for data collected by the app or included third-party partners. Apple defines collection as transmitting data off device in a form accessible beyond servicing the immediate request. Data processed only on device and never transmitted is not considered collected for this disclosure, but any data sent to a backend or third party must be reviewed and declared accurately. The current source has local wellness data and optional OAuth/backend code; the App Store Connect privacy answers must reflect the features and SDKs that are actually enabled in the release binary. [1]

## Required owner-side release actions

### EAS and Apple identity

The owner must authenticate the intended Expo account, initialize or link the EAS project, and confirm that `com.app.emdrtherapymobile` belongs to the intended Apple Developer team. The project intentionally does not contain an invented Expo project ID, Apple team ID, signing certificate, provisioning profile, Apple ID, App Store Connect application ID, or credentials.

Run the following from the project directory after reviewing the production environment:

```bash
pnpm exec eas login
pnpm run configure:eas
pnpm run build:ios
```

The production profile uses the EAS environment named `production`. Set the release OAuth/API variables in that environment before building. If OAuth will be used, register the exact callback `emdrflow:///oauth/callback` with the OAuth provider and set `EXPO_PUBLIC_OAUTH_PORTAL_URL`, `EXPO_PUBLIC_APP_ID`, and any required public API endpoint. If OAuth is not shipped, keep any related sign-in entry points hidden; the code now declines to create a malformed login URL when these values are absent.

### Backend configuration

Deploy the backend only with values corresponding to `server/.env.example`. In production, the server exits rather than starting if its app ID, database URL, OAuth service URL, allow-listed origins, allow-listed redirect URIs, or a 32-character-or-longer JWT secret are absent. Do not set `PUBLIC_STORAGE_PREFIXES` unless the exposed files are genuinely public; the storage proxy is not an authorization system for private user files.

### App Store Connect record and privacy materials

Create the App Store Connect app record, provide a publicly accessible privacy-policy URL, add the app’s actual support URL and contact details, and complete the App Privacy questionnaire. App Store Connect requires privacy-practice information for new apps and updates, including third-party SDK practices. [1] Test the final archive’s generated privacy manifests and inspect the exact SDK set that reaches the archive before final submission.

For this product, the owner should explicitly decide whether it is a training/wellness simulator or a clinical product. The store description, screenshots, support materials, and privacy policy must make the same representation. Do not represent training telemetry as patient monitoring or clinical treatment without the required professional, legal, clinical, and regulatory review.

### TestFlight and submission

Upload the production build to TestFlight, verify the full onboarding, BLS pause/grounding, audio interruption, backgrounding, local-storage failure, data deletion, accessibility, deep-link, and offline flows on a physical iPhone, then submit the selected build through EAS or App Store Connect. Expo documents that EAS Submit uploads a production iOS build and that the final App Review submission is completed in App Store Connect. [2]

```bash
pnpm run submit:ios
```

When the App Store Connect record exists, add its real `ascAppId` under `submit.production.ios` in `eas.json` for non-interactive submission. Do not commit Apple API keys, app-specific passwords, or Expo tokens to the repository.

## References

[1]: https://developer.apple.com/app-store/app-privacy-details/ "App privacy details on the App Store"
[2]: https://docs.expo.dev/submit/ios/ "Submit to the Apple App Store with EAS Submit"
