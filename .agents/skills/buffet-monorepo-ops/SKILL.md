---
name: buffet-monorepo-ops
description: Work on /Users/janiecee/Developer/Buffet repo-wide docs, workspace commands, shared package changes, and cross-app coordination. Use for instruction updates and multi-app validation.
---

# Buffet Monorepo Ops

## Use when
- You change root docs, workspace config, or cross-app instructions.
- You touch `packages/shared` and need to coordinate consumers.
- You need to reconcile paths, scripts, env templates, or repo-wide conventions.

## Read first
- `/Users/janiecee/Developer/Buffet/AGENTS.md`
- `/Users/janiecee/Developer/Buffet/README.md`
- `/Users/janiecee/Developer/Buffet/pnpm-workspace.yaml`
- The app-level `AGENTS.md` files for affected apps

## Workflow
- Keep the repo map accurate: `apps/api`, `apps/bufet-media-dashboard`, `apps/bufet-media-player`, `packages/shared`.
- Use root workspace commands for shared checks: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- Use Rails commands directly for `apps/api`; do not assume it is a pnpm workspace package.
- Prefer updating docs and instructions before making broader code changes.

## Guardrails
- Do not reintroduce the old `apps/dashboard` or `apps/player` paths.
- When a shared contract changes, update the relevant app instructions too.
