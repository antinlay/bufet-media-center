# BUFET Dashboard Instructions

## Scope
- Expo dashboard for pairing, device management, playlists, and QR scanning.
- Use Expo plugin workflow for docs, inspection, and validation.

## Read First
- `package.json`
- `app.json`
- `.env.example`
- `README.md`

## Commands
- `pnpm start`
- `pnpm web`
- `pnpm build:web`
- `pnpm android`
- `pnpm ios`
- `pnpm lint`

## Rules
- Use `EXPO_PUBLIC_API_URL` for API access.
- Use `Expo` for Expo/RN docs, build, deploy, upgrade, debug, and EAS workflow questions.
- Use `Browser` for dashboard web smoke checks, local UI inspection, and screenshots.
- Use `Test Android Apps` only for Android emulator QA when dashboard Android behavior matters.
- Keep changes inside the dashboard app; do not touch the player unless explicitly needed.
- Prefer Expo-specific tools over generic web-app tooling.
- Do not use the old `apps/dashboard` path in instructions or references.

## Local Skills
- `buffet-expo-dashboard` - local adapter at `/Users/janiecee/Developer/Buffet/.agents/skills/buffet-expo-dashboard/SKILL.md`.
- `buffet-monorepo-ops` - use when workspace docs or shared contracts change.
