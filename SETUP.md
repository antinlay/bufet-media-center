# BUFET Digital Signage MVP - Installation & Setup Guide

## Quick Start

### 1. Install dependencies

```bash
pnpm install
cd apps/api && bundle install && yarn install
```

### 2. Copy env templates

```bash
cp apps/api/.env.example apps/api/.env
cp apps/bufet-media-dashboard/.env.example apps/bufet-media-dashboard/.env
cp apps/bufet-media-player/.env.production.example apps/bufet-media-player/.env.production
```

### 3. Start PostgreSQL

```bash
docker-compose up postgres -d
```

### 4. Prepare the API database

```bash
cd apps/api
bin/rails db:setup
```

### 5. Start development servers

```bash
# API / admin
cd apps/api && bin/dev

# Dashboard
pnpm --filter @bufet/dashboard start -- --web

# Player
pnpm --filter bufet-media-player start
```

## Project Structure

```text
apps/
├── api/                    # Rails backend/admin
├── bufet-media-dashboard/  # Expo dashboard
└── bufet-media-player/     # Expo player
packages/
└── shared/                 # Shared TS types and Zod schemas
```

## Environment Variables

- API: `DATABASE_URL`, `SECRET_KEY_BASE`, `JWT_SECRET`, `DASHBOARD_BASE_URL`, `PORT`
- Dashboard: `EXPO_PUBLIC_API_URL`
- Player: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_ALLOW_HTTP`

## Useful Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

API-specific:

```bash
cd apps/api
bin/rails test
bin/rails rubocop
bundle exec brakeman
yarn run vitest
```

Dashboard-specific:

```bash
pnpm --filter @bufet/dashboard build:web
pnpm --filter @bufet/dashboard lint
```

Player-specific:

```bash
pnpm --filter bufet-media-player android
pnpm --filter bufet-media-player ios
pnpm --filter bufet-media-player lint
pnpm --filter bufet-media-player reset-project
```

## Notes

- Do not use the old `apps/dashboard` or `apps/player` paths.
- Expo work in the dashboard/player should follow the Expo plugin workflow.
- Keep shared schema changes in `packages/shared` and validate with `pnpm --filter @bufet/shared typecheck`.
