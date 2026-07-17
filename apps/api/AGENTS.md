# BUFET API Instructions

## Scope
- Rails 8 backend/admin lives here.
- Use this file instead of the old `CLAUDE.md`.

## Read First
- `package.json`
- `README.md`
- `docs/authorization_guidelines.md`
- `docs/content_ordering_design.md`
- `docs/concerto-style-guide.md`

## Commands
- `bin/dev`
- `bin/rails test`
- `bin/rails test:system`
- `bin/rails rubocop`
- `bundle exec brakeman`
- `yarn run vitest`
- `yarn run eslint "{app,test}/frontend/**/*.{js,vue}"`

## Rules
- Keep authorization changes aligned with `docs/authorization_guidelines.md`.
- Keep ordering logic aligned with `docs/content_ordering_design.md`.
- Use `Browser` for Rails admin/frontend smoke checks and local UI inspection.
- Use `Build Web Apps` for frontend-heavy Rails/Vite Vue UI work and payment/subscription UI planning.
- Use `Codex Security` for auth, authorization, uploads, storage, secrets, and other security-sensitive changes.
- Use Rails conventions for controllers, policies, models, and services.
- Keep frontend changes inside the Rails/Vite Vue app, not the Expo apps.
- Avoid using `pnpm --filter` here; this app is managed with Rails + Yarn tooling.

## Local Skills
- `buffet-rails-api` - local adapter at `/Users/janiecee/Developer/Buffet/.agents/skills/buffet-rails-api/SKILL.md`.
- `buffet-monorepo-ops` - use when root instructions or shared contracts change.
