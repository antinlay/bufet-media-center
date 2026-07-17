#!/usr/bin/env bash
set -euo pipefail

npx --yes pnpm@9.12.0 --filter @bufet/shared build
printf 'EXPO_PUBLIC_API_URL=%s\n' "${EXPO_PUBLIC_API_URL:-https://bufet-media-api.onrender.com}" > apps/bufet-media-dashboard/.env.production
npx --yes pnpm@9.12.0 --filter @bufet/dashboard exec expo export --platform web --clear

if [ -d apps/bufet-media-dashboard/dist ]; then
  rm -rf dist
  cp -R apps/bufet-media-dashboard/dist dist
fi
