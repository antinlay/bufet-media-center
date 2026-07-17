---
name: buffet-expo-player
description: Work on /Users/janiecee/Developer/Buffet/apps/bufet-media-player Expo player for Android TV playback, pairing, cache, and bootstrap flow. Use for player screens, Expo config, and validation.
---

# Buffet Expo Player

## Use when
- You change the player in `apps/bufet-media-player`.
- You touch playback, pairing, caching, bootstrapping, or kiosk behavior.
- You need Expo config, env, or build guidance for this app.

## Read first
- `/Users/janiecee/Developer/Buffet/apps/bufet-media-player/AGENTS.md`
- `/Users/janiecee/Developer/Buffet/apps/bufet-media-player/package.json`
- `/Users/janiecee/Developer/Buffet/apps/bufet-media-player/app.config.ts`
- `/Users/janiecee/Developer/Buffet/apps/bufet-media-player/.env.production.example`

## Workflow
- Use the Expo plugin workflow for docs, app inspection, and validation.
- Keep player-specific behavior inside this app.
- Use `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_ALLOW_HTTP`.
- Validate with `pnpm --filter bufet-media-player lint`; use `android` or `ios` only when native verification is needed.

## Guardrails
- Do not route player work through generic web-app assumptions.
- Do not borrow dashboard-specific UI rules unless the change is shared by design.
