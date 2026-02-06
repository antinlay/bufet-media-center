#!/usr/bin/env bash
set -euo pipefail

# Ensure pnpm is available in EAS build environment
corepack enable
corepack prepare pnpm@9.12.0 --activate
pnpm --version

# Install deps for this app (skip auto-install via EAS)
pnpm install --frozen-lockfile
