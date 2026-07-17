create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint unique,
  name text not null,
  parent_legacy_id bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.screens (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint unique,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  player_device_id text unique,
  name text not null,
  status text not null default 'offline' check (status in ('online', 'offline', 'live')),
  config_version bigint not null default 1,
  last_seen_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  legacy_id bigint unique,
  organization_id uuid references public.organizations(id) on delete set null,
  kind text not null check (kind in ('image', 'video')),
  title text,
  source_url text,
  thumbnail_url text,
  storage_path text,
  thumbnail_path text,
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.playlists (
  id uuid primary key default gen_random_uuid(),
  screen_id uuid not null unique references public.screens(id) on delete cascade,
  version bigint not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.playlist_items (
  id uuid primary key default gen_random_uuid(),
  playlist_id uuid not null references public.playlists(id) on delete cascade,
  media_id uuid not null references public.media(id) on delete restrict,
  legacy_submission_id bigint unique,
  position integer not null check (position >= 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (playlist_id, position)
);

create index if not exists screens_player_device_id_idx on public.screens(player_device_id);
create index if not exists screens_organization_id_idx on public.screens(organization_id);
create index if not exists media_organization_id_idx on public.media(organization_id);
create index if not exists playlist_items_playlist_position_idx on public.playlist_items(playlist_id, position);

alter table public.organizations enable row level security;
alter table public.screens enable row level security;
alter table public.media enable row level security;
alter table public.playlists enable row level security;
alter table public.playlist_items enable row level security;

revoke all on table public.organizations, public.screens, public.media, public.playlists, public.playlist_items from anon, authenticated;

create or replace function public.touch_playlist_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.playlists
  set version = version + 1, updated_at = now()
  where id = coalesce(new.playlist_id, old.playlist_id);
  return coalesce(new, old);
end;
$$;

revoke all on function public.touch_playlist_version() from public, anon, authenticated;

drop trigger if exists playlist_items_touch_playlist on public.playlist_items;
create trigger playlist_items_touch_playlist
after insert or update or delete on public.playlist_items
for each row execute function public.touch_playlist_version();
