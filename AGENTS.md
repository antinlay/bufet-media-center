# Repository Guidelines

## Project Structure & Modules
- `apps/api` - Rails 8 backend/admin with Vue/Vite frontend assets, migrations in `db/migrate/`, tests in `test/`.
- `apps/bufet-media-dashboard` - Expo dashboard for web and mobile pairing/management.
- `apps/bufet-media-player` - Expo player for Android TV / kiosk playback.
- `packages/shared` - Shared TypeScript types and Zod schemas.
- Root config: `docker-compose.yml`, `pnpm-workspace.yaml`, `tsconfig.json`, `.editorconfig`.

## Setup & Environment
- Install workspace deps: `pnpm install` from repo root.
- Install Rails deps in `apps/api`: `bundle install && yarn install`.
- Copy env templates: `apps/api/.env.example`, `apps/bufet-media-dashboard/.env.example`, `apps/bufet-media-player/.env.production.example`.
- Start Postgres for local API work: `docker-compose up postgres -d`.

## Build, Test, and Development Commands
- Workspace: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- API: `cd apps/api && bin/dev`, `bin/rails test`, `bin/rails rubocop`, `bundle exec brakeman`, `yarn run vitest`.
- Dashboard: `pnpm --filter @bufet/dashboard start -- --web`, `pnpm --filter @bufet/dashboard build:web`, `pnpm --filter @bufet/dashboard lint`.
- Player: `pnpm --filter bufet-media-player start`, `pnpm --filter bufet-media-player android|ios|web|lint|reset-project`.
- Shared: `pnpm --filter @bufet/shared build`, `pnpm --filter @bufet/shared typecheck`.

## Coding Style & Naming Conventions
- EditorConfig: 2-space indents, LF, UTF-8, trimmed trailing whitespace.
- TypeScript strict across workspace; prefer async/await and shared Zod schemas for validation.
- Ruby follows Rails conventions; keep changes small and align with existing controllers, services, and policies.
- Naming: files/directories kebab-case; React components PascalCase; DTOs/interfaces PascalCase; variables camelCase.

## Testing Guidelines
- API tests live in `apps/api/test/` and run with `bin/rails test`.
- Dashboard/player currently rely on lint and targeted manual verification; add tests for critical UI/logic when introducing them.
- For shared schema changes, run `pnpm --filter @bufet/shared typecheck` and whatever app consumes the change.

## Commit & Pull Request Guidelines
- Use concise Conventional Commits (`feat:`, `fix:`, `chore:`) with imperative subjects.
- PRs should include purpose, linked ticket, env keys touched, screenshots for UI changes, and test output.
- Keep diffs minimal and scoped; update docs/env samples when behavior or config changes.

## Security & Configuration
- Never commit secrets; keep them in `.env` files.
- Demo creds may exist in local seed data; do not reuse them in production.

## Общие принципы (всегда)
- Пиши кратко. Без длинных планов и теории.
- Сначала найди точные файлы/места изменений, затем делай минимальный diff.
- После правок: запусти релевантную проверку и исправь ошибки до финала.
- В ответе: (1) что изменено и где, (2) как проверить (команда), (3) риски/краевые кейсы - только если есть.

## Использование MCP (источники истины)
- Expo/RN задачи для `apps/bufet-media-dashboard` и `apps/bufet-media-player`: используй Expo plugin и его инструменты, а не общий web workflow.
- JS/TS экосистема и сторонние библиотеки/SDK: использовать `context7`.
- OpenAI API / Agents / MCP: использовать `openaiDeveloperDocs`.
- Не отвечать по памяти, если доступна официальная документация через MCP.

## Codex Plugins / MCP
- `Expo` - Expo/RN build, deploy, upgrade, debug, EAS and Expo Router work in dashboard/player.
- `Browser` - localhost/web smoke, UI inspection, screenshots, and Rails admin/dashboard/player web checks.
- `Build Web Apps` - frontend-heavy Rails admin/dashboard UI work, Stripe/payment planning, and web UX implementation guidance.
- `Test Android Apps` - Android emulator QA, screenshots, UI tree, logcat, and performance evidence for the player.
- `Codex Security` - repository security scans, diff scans, threat modeling, and security finding validation.
- `GitHub` - PRs, issues, CI inspection, review feedback, and publishing changes.
- `Linear` - roadmap, tickets, product tasks, and issue/project coordination when relevant.
- `Figma` - design handoff, UI mockups, component/design-system sync, and Figma URLs.
- `Product Design` - product direction, UX audits, prototypes, and app/store flow exploration.
- `Creative Production` - launch visuals, store assets, campaign concepts, and marketing creative.
- `Data Analytics` - KPI design, launch metrics, product usage analysis, dashboards, and reports.

## Local Skills
- `buffet-monorepo-ops` - root docs, workspace commands, shared package changes, and cross-app coordination.
- `buffet-rails-api` - `apps/api` backend/admin, policies, services, migrations, and tests.
- `buffet-expo-dashboard` - `apps/bufet-media-dashboard` pairing, device management, and dashboard UI.
- `buffet-expo-player` - `apps/bufet-media-player` playback, pairing, cache, and kiosk flow.
