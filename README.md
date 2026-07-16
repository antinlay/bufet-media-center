# BUFET Digital Signage MVP

BUFET is a three-part digital signage stack:

- `apps/api` - Rails 8 backend/admin with Vue/Vite frontend assets
- `apps/bufet-media-dashboard` - Expo dashboard for pairing and device management
- `apps/bufet-media-player` - Expo player for Android TV playback
- `packages/shared` - shared TypeScript types and Zod schemas

## Layout

```
├── apps/
│   ├── api/
│   ├── bufet-media-dashboard/
│   └── bufet-media-player/
├── packages/
│   └── shared/
└── docker-compose.yml
```

## Quick Start

### 1. Install

```bash
pnpm install
cd apps/api && bundle install && yarn install
```

### 2. Configure

```bash
cp apps/api/.env.example apps/api/.env
cp apps/bufet-media-dashboard/.env.example apps/bufet-media-dashboard/.env
cp apps/bufet-media-player/.env.production.example apps/bufet-media-player/.env.production
```

### 3. Start Postgres

```bash
docker-compose up postgres -d
```

## Development

```bash
# Rails API/admin
cd apps/api && bin/dev

# Dashboard
pnpm --filter @bufet/dashboard start -- --web

# Player
pnpm --filter bufet-media-player start
```

Workspace commands:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

## Environment

- API: `DATABASE_URL`, `SECRET_KEY_BASE`, `JWT_SECRET`, `DASHBOARD_BASE_URL`, `PORT`
- Dashboard: `EXPO_PUBLIC_API_URL`
- Player: `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_ALLOW_HTTP`

## Testing

- API: `cd apps/api && bin/rails test`
- API frontend: `cd apps/api && yarn run vitest`
- Dashboard: `pnpm --filter @bufet/dashboard lint`
- Player: `pnpm --filter bufet-media-player lint`
- Shared: `pnpm --filter @bufet/shared typecheck`

## Notes

- Do not use the old paths `apps/dashboard` or `apps/player`.
- Expo work in dashboard/player should go through the Expo plugin workflow.
- Keep changes scoped and update env/docs when commands or config change.

## Home Windows deployment

The Docker bundle for running PostgreSQL, the Rails API, the Expo web dashboard, and Caddy on a Windows PC is documented in [deploy/home-windows/README.md](deploy/home-windows/README.md).

## Local Docker smoke test

For a local Mac/Windows test without public DNS or HTTPS:

```bash
docker compose -f docker-compose.local.yml up -d --build
```

- API: `http://localhost:3001/up`
- Dashboard: `http://localhost:8080`
