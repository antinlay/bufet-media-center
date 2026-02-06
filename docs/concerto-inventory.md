# Concerto inventory (Bufet integration)

## Source
- Repository: `apps/api`
- Rails version: `8.1.1` (Gemfile)
- DB: SQLite (`config/database.yml`)
- Frontend player (Concerto): `app/frontend` (Vite + Vue)

## Core domain models
- Users: `app/models/user.rb`
- Groups & memberships: `app/models/group.rb`, `app/models/membership.rb`
- Screens: `app/models/screen.rb`
- Templates/positions/fields: `app/models/template.rb`, `app/models/position.rb`, `app/models/field.rb`
- Feeds: `app/models/feed.rb`, `app/models/rss_feed.rb`, `app/models/remote_feed.rb`
- Content (STI): `app/models/content.rb`, `graphic.rb`, `video.rb`, `rich_text.rb`, `clock.rb`
- Submissions (content ↔ feed): `app/models/submission.rb`

## Player endpoints mapping
- New Player pairing/config API implemented in Concerto:
  - `POST /api/player/pairing`
  - `GET /api/player/pairing/status`
  - `GET /api/player/bootstrap`
  - `GET /api/player/config`
- Data flow:
  - `PlayerDevice` ↔ `Screen`
  - `PlayerPairing` stores pairing codes + expiry
  - `PlayerConfigBuilder` converts Concerto content into playlist items (image/video)

## Rails API for new RN cabinet
- Namespace: `/api/v1`
- Auth: `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `GET /api/v1/auth/me`
- Resources: screens, templates, feeds, contents, submissions, groups, users, memberships

## Key schema notes
- Screens belong to groups and templates (`screens.group_id`, `screens.template_id`)
- Feeds belong to groups (`feeds.group_id`)
- Content belongs to users; submissions join content to feeds
- Templates contain positions which map fields to layout areas

## Notes for next steps
- Concerto defaults: seeded template + demo screen + demo feeds (`db/seeds.rb`)
- Pairing URL: set `CONCERTO_DASHBOARD_URL` to point QR codes to the RN cabinet
