# BUFET Shared Package Instructions

## Scope
- Shared TypeScript types and Zod schemas used by all apps.

## Read First
- `package.json`
- `src/`

## Commands
- `pnpm build`
- `pnpm typecheck`

## Rules
- Use `context7` for current TypeScript, Zod, and package/library documentation.
- Keep schema changes backward-compatible when possible.
- Update the consuming app instructions if a shared type or schema changes behavior.
- Do not add runtime app logic here; keep it as shared types/schemas only.

## Local Skills
- `buffet-monorepo-ops` - use when shared types or workspace docs need coordination across apps.
