-- The dashboard no longer polls the bridge status: heartbeats are pushed to it over Realtime.
-- last_seen_at is stamped by the database so a wrong clock on the reception laptop cannot fake "online".

alter publication supabase_realtime add table public.bridge_status;

create function public.bridge_status_stamp() returns trigger
language plpgsql set search_path = public as $$
begin
  new.last_seen_at := now();
  return new;
end $$;

create trigger bridge_status_stamp before insert or update on public.bridge_status
  for each row execute function public.bridge_status_stamp();
