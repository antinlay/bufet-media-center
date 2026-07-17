# BUFET Player Instructions

## Scope
- Expo player for Android TV / kiosk playback, pairing, bootstrap, and offline cache.
- Use Expo plugin workflow for docs, inspection, and validation.

## Read First
- `package.json`
- `app.config.ts`
- `README.md`
- `.env.production.example`

## Commands
- `pnpm start`
- `pnpm android`
- `pnpm ios`
- `pnpm web`
- `pnpm lint`
- `pnpm reset-project`

## Rules
- Use `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_ALLOW_HTTP`.
- Use `Expo` for Expo/RN docs, build, deploy, upgrade, debug, and EAS workflow questions.
- Use `Browser` for player web smoke checks and localhost inspection when running on web.
- Use `Test Android Apps` for Android TV/emulator QA, focus navigation, screenshots, logcat, and performance evidence.
- Keep playback, cache, and pairing changes inside this app.
- Prefer Expo-specific tools over generic web-app tooling.
- Do not use the old `apps/player` path in instructions or references.

## Local Skills
- `buffet-expo-player` - local adapter at `/Users/janiecee/Developer/Buffet/.agents/skills/buffet-expo-player/SKILL.md`.
- `buffet-monorepo-ops` - use when workspace docs or shared contracts change.
