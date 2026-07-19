# Supabase sync and player delivery

The Supabase project is the metadata and media delivery backend for the player. Rails remains the authenticated dashboard API and a compatibility fallback while the migration is rolled out.

The Expo dashboard production bundle is hosted on Vercel. The Rails API is a separate long-running service and can be provisioned on Render with [`render.yaml`](../render.yaml); moving the static dashboard does not move the Rails process or its database. Supabase remains the metadata/media backend used by the API and player.

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

## Dashboard authentication

`apps/bufet-media-dashboard` uses Supabase Auth for email/password sign-in, registration, session refresh, password recovery, and sign-out. The Supabase access token is sent to the Rails API as a bearer token. Rails verifies the ES256 token against the project's JWKS endpoint and links the Supabase identity to `users.supabase_uid`; existing users are linked by a case-insensitive email match on their first authenticated request.

The player remains unauthenticated because pairing and playback use the existing player contract.

In Supabase Authentication settings, enable email confirmation and add these Redirect URLs:

```text
https://bufet-media-center.vercel.app/reset-password
bufetdash://reset-password
https://bufet-media-center.vercel.app/login
bufetdash://login
```

For local web development, add the current localhost URL, for example `http://localhost:8081/reset-password`.

The API must have `SUPABASE_URL` configured. The dashboard must have `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; never expose `SUPABASE_SERVICE_ROLE_KEY` to Expo or Vercel.

## Data migration

The initial schema and private `media` bucket live in `supabase/migrations/`. The hosted project has been migrated and seeded from the local Rails database. Repeatable synchronization is available through:

```bash
cd apps/api
PATH="$HOME/.rbenv/versions/4.0.6/bin:$PATH" bin/rails supabase:sync
PATH="$HOME/.rbenv/versions/4.0.6/bin:$PATH" bin/rails supabase:mark_stale
```

The sync maps legacy Rails IDs to `organizations`, `screens`, `media`, `playlists`, and `playlist_items`. It is idempotent for legacy IDs and rebuilds each screen playlist from the Rails source during the compatibility period.

## Player contract

`GET /api/player/manifest?deviceId=...` returns the Supabase manifest when a synced screen exists and falls back to the existing Rails config otherwise. The player downloads missing media to its document cache, plays from local files, polls every 60 seconds, and uses the stable playlist item ID as the cache key so rotating signed URLs do not cause duplicate downloads.

Dashboard playlist mutations publish a Supabase Realtime Broadcast event. The player refreshes immediately when it receives that event and keeps polling as the delivery guarantee.

## Storage and thumbnails

New dashboard uploads still enter through Rails authentication. After the Rails record is saved, the server uploads the original and image thumbnail to the private Supabase Storage bucket. Video posters are uploaded after the transcode job completes. The manifest service creates short-lived signed URLs; when Storage is not configured, the legacy Rails media URL remains available through the fallback path.
