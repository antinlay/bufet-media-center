create index if not exists playlist_items_media_id_idx on public.playlist_items(media_id);
drop index if exists public.screens_player_device_id_idx;
