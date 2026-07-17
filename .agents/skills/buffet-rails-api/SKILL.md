---
name: buffet-rails-api
description: Work on /Users/janiecee/Developer/Buffet/apps/api Rails 8 backend/admin, policies, services, migrations, and tests. Use for API changes, authorization, ordering, and Rails-specific validation.
---

# Buffet Rails API

## Use when
- You are changing the Rails backend/admin in `apps/api`.
- You touch controllers, models, policies, services, migrations, or tests.
- You need authorization, ordering, or frontend asset guidance for the Rails app.

## Read first
- `/Users/janiecee/Developer/Buffet/apps/api/AGENTS.md`
- `/Users/janiecee/Developer/Buffet/apps/api/docs/authorization_guidelines.md`
- `/Users/janiecee/Developer/Buffet/apps/api/docs/content_ordering_design.md`
- `/Users/janiecee/Developer/Buffet/apps/api/docs/concerto-style-guide.md`

## Workflow
- Keep diffs small and Rails-native.
- Use `bin/dev` for local runs, `bin/rails test` for validation, `bin/rails rubocop` for style, and `bundle exec brakeman` for security.
- Use `yarn run vitest` only when the Rails Vite/Vue frontend changes.
- Do not apply Expo guidance to this app.

## Validation
- Prefer the narrowest relevant command first.
- If authorization changes, run the touched tests and check policy coverage.
