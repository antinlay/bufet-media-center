# Supabase sync and player delivery

The Supabase project is the metadata and media delivery backend for the player. Rails remains the authenticated dashboard API and a compatibility fallback while the migration is rolled out.

The Expo dashboard production bundle is hosted on Vercel. The API host is configured separately through `EXPO_PUBLIC_API_URL`; moving the static dashboard does not move the Rails process or its database.

## Environment

Set these variables in `apps/api/.env` or the API deployment. The service-role key is server-only and must never be added to Expo or Vercel client variables.

```dotenv
PUBLIC_API_URL=https://<public-api-host>
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-only-key>
SUPABASE_MEDIA_BUCKET=media
SUPABASE_SIGNED_URL_TTL=3600
```

Expo clients only need:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

## Data migration

The initial schema and private `media` bucket live in `supabase/migrations/`. The hosted project has been migrated and seeded from the local Rails database. Repeatable synchronization is available through:

```bash
cd apps/api
PATH="$HOME/.rbenv/versions/3.3.9/bin:$PATH" bin/rails supabase:sync
PATH="$HOME/.rbenv/versions/3.3.9/bin:$PATH" bin/rails supabase:mark_stale
```

The sync maps legacy Rails IDs to `organizations`, `screens`, `media`, `playlists`, and `playlist_items`. It is idempotent for legacy IDs and rebuilds each screen playlist from the Rails source during the compatibility period.

## Player contract

`GET /api/player/manifest?deviceId=...` returns the Supabase manifest when a synced screen exists and falls back to the existing Rails config otherwise. The player downloads missing media to its document cache, plays from local files, polls every 60 seconds, and uses the stable playlist item ID as the cache key so rotating signed URLs do not cause duplicate downloads.

Dashboard playlist mutations publish a Supabase Realtime Broadcast event. The player refreshes immediately when it receives that event and keeps polling as the delivery guarantee.

## Storage and thumbnails

New dashboard uploads still enter through Rails authentication. After the Rails record is saved, the server uploads the original and image thumbnail to the private Supabase Storage bucket. Video posters are uploaded after the transcode job completes. The manifest service creates short-lived signed URLs; when Storage is not configured, the legacy Rails media URL remains available through the fallback path.
