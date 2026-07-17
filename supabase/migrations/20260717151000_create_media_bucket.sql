insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do update set public = false;
