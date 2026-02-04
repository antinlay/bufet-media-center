# Repository Guidelines

## Project Structure & Modules
- `apps/api` – NestJS backend (Prisma + PostgreSQL), holds migrations in `prisma/` and tests in `src/**/*.spec.ts`.
- `apps/dashboard` – React + Vite web dashboard with Tailwind and Radix UI.
- `apps/player` – Expo/React Native Android TV player (QR pairing, media playback).
- `packages/shared` – Shared TypeScript types/Zod schemas consumed by all apps.
- Root config: `docker-compose.yml` for Postgres, `tsconfig.json`/`.editorconfig` for shared tooling.

## Setup & Environment
- Install deps: `pnpm install` (Node 18+). Use pnpm workspace root.
- Copy env templates: `cp apps/api/.env.example apps/api/.env`, same for `dashboard` and `player`.
- Start Postgres (dev): `docker-compose up postgres -d`; DB URL lives in `apps/api/.env`.

## Build, Test, and Development Commands
- Run everything in watch: `pnpm dev` (parallel dev servers).
- Build all packages: `pnpm build`; lint all: `pnpm lint`; type-check all: `pnpm typecheck`; tests (API only today): `pnpm test`.
- Per app: `pnpm --filter @bufet/api dev|build|lint|typecheck|test`, `pnpm --filter @bufet/dashboard dev|build|lint|typecheck`, `pnpm --filter @bufet/player start|android|ios`.
- Migrations/seed (API): from `apps/api`, run `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:seed`.

## Coding Style & Naming Conventions
- EditorConfig enforced: 2-space indents, LF endings, UTF-8, trailing whitespace trimmed.
- TypeScript strict across apps; prefer async/await, typed Axios/fetch, and shared Zod schemas for validation.
- Lint with ESLint (`apps/api` targets `src,apps,libs,test/**`; dashboard uses Vite/React rules). Keep imports sorted logically; avoid default `any`.
- Naming: files and directories kebab-case; React components PascalCase; DTOs/interfaces PascalCase; variables camelCase.

## Testing Guidelines
- API uses Jest; tests live beside code as `*.spec.ts`. Run `pnpm --filter @bufet/api test` or `test:cov` for coverage. Aim to cover controllers, services, and auth guards.
- Dashboard/Player have no test runner configured yet; add React Testing Library or Expo tests when introducing critical UI/logic and wire them into `pnpm test`.

## Commit & Pull Request Guidelines
- Repository snapshot lacks git history; default to Conventional Commits (`feat:`, `fix:`, `chore:`) with concise, imperative subjects.
- PRs should include: purpose summary, linked issue/ticket, environment notes (.env keys touched), screenshots or screen recordings for UI changes, and test command output.
- Keep diffs minimal and scoped; update docs/env samples when behavior or config changes.

## Security & Configuration
- Never commit secrets; use the `.env` files and keep keys out of version control. Rotate JWT/DB creds before production deploys.
- For local dev, seed data includes demo credentials (`demo@bufet.com` / `password123`); change or remove in production environments.
