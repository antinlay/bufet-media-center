alter table public.screens
  alter column config_version type text using config_version::text;

alter table public.screens
  alter column config_version set default '1';
