---
name: buffet-expo-dashboard
description: Work on /Users/janiecee/Developer/Buffet/apps/bufet-media-dashboard Expo dashboard for pairing, device management, and web/mobile UI. Use for dashboard screens, Expo config, and validation.
---

# Buffet Expo Dashboard

## Use when
- You change the dashboard in `apps/bufet-media-dashboard`.
- You touch pairing, QR scanning, device management, playlists, or dashboard navigation.
- You need Expo config, env, or build guidance for this app.

## Read first
- `/Users/janiecee/Developer/Buffet/apps/bufet-media-dashboard/AGENTS.md`
- `/Users/janiecee/Developer/Buffet/apps/bufet-media-dashboard/package.json`
- `/Users/janiecee/Developer/Buffet/apps/bufet-media-dashboard/app.json`
- `/Users/janiecee/Developer/Buffet/apps/bufet-media-dashboard/.env.example`

## Workflow
- Use the Expo plugin workflow for docs, app inspection, and validation.
- Keep the dashboard separate from the player app.
- Use `EXPO_PUBLIC_API_URL` for API access.
- Validate with `pnpm --filter @bufet/dashboard lint`, and use `build:web` when web output matters.

## Guardrails
- Do not route Expo work through generic web-app assumptions.
- Keep changes inside the dashboard app unless a shared type or API contract must change.
