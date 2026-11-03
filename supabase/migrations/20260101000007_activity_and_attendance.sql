-- Bridge heartbeat, merged activity feed (onboarded / granted / denied) and per-member attendance.
-- A member "came" on a day when they have at least one ACTIVE (granted) punch, day boundaries in Asia/Karachi.

-- ---------- bridge status (one row, written by the reception bridge with the service role) ----------
create table public.bridge_status (
  id smallint primary key default 1 check (id = 1),
  device_ip text,
  bridge_version text,
  started_at timestamptz,
  last_seen_at timestamptz not null default now(),
  last_sync_at timestamptz,
  last_punch_at timestamptz,
  last_punch_fingerprint_id text,
  device_users integer,
  device_fingerprints integer,
  device_records integer,
  last_enrollment_at timestamptz,
  last_enrollment_status text,
  last_error text,
  last_error_at timestamptz
);
alter table public.bridge_status enable row level security;
create policy bridge_status_select on public.bridge_status for select to authenticated
  using (public.current_role_name() in ('SUPER_ADMIN', 'MANAGER'));
revoke insert, update, delete on public.bridge_status from authenticated;

/** The bridge counts as online when it reported in the last 30 seconds. */
create function public.bridge_overview() returns jsonb
language sql stable security invoker set search_path = public as $$
  select coalesce(
    (select to_jsonb(b) || jsonb_build_object('online', b.last_seen_at > now() - interval '30 seconds', 'server_time', now())
       from public.bridge_status b where b.id = 1),
    jsonb_build_object('online', false, 'server_time', now())
  );
$$;

-- ---------- activity feed ----------
/** p_kind: ONBOARDED | GRANTED | DENIED | null for all. Counts ignore p_kind so filter chips keep their totals. */
create function public.list_activity(
  p_kind text default null, p_search text default null, p_page integer default 1, p_page_size integer default 10
) returns jsonb
language plpgsql stable security invoker set search_path = public as $$
declare v_result jsonb;
begin
  with feed as (
    select a.id, a.punched_at as at, a.fingerprint_id, a.status::text as status,
           case when a.status in ('ACTIVE', 'STAFF') then 'GRANTED' else 'DENIED' end as kind,
           coalesce(m.full_name, p.full_name) as name,
           m.id as member_id
      from public.attendance_logs a
      left join public.members m on m.id = a.member_id
      left join public.profiles p on p.id = a.profile_id
    union all
    select m.id, m.created_at, m.fingerprint_id, 'ONBOARDED', 'ONBOARDED', m.full_name, m.id
      from public.members m
  ),
  searched as (
    select * from feed
     where p_search is null or p_search = ''
        or name ilike '%' || p_search || '%' or fingerprint_id ilike '%' || p_search || '%'
  ),
  paged as (
    select * from searched where p_kind is null or kind = p_kind
     order by at desc offset (greatest(p_page, 1) - 1) * p_page_size limit p_page_size
  )
  select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(to_jsonb(paged) order by paged.at desc) from paged), '[]'::jsonb),
    'total', (select count(*) from searched where p_kind is null or kind = p_kind),
    'counts', jsonb_build_object(
      'all', (select count(*) from searched),
      'onboarded', (select count(*) from searched where kind = 'ONBOARDED'),
      'granted', (select count(*) from searched where kind = 'GRANTED'),
      'denied', (select count(*) from searched where kind = 'DENIED')
    )
  ) into v_result;
  return v_result;
end $$;

-- ---------- attendance ----------
/** Members the caller may see with their number of attended days. */
create function public.attendance_overview(
  p_search text default null, p_page integer default 1, p_page_size integer default 10
) returns jsonb
language plpgsql stable security invoker set search_path = public as $$
declare v_result jsonb;
begin
  with days as (
    select a.member_id, (a.punched_at at time zone 'Asia/Karachi')::date as d, max(a.punched_at) as last_punch
      from public.attendance_logs a
     where a.status = 'ACTIVE' and a.member_id is not null
     group by 1, 2
  ),
  base as (
    select m.id, m.full_name, m.fingerprint_id, m.registration_date,
           public.member_status(m.id) as status,
           (select count(*) from days d where d.member_id = m.id)::int as days_attended,
           (select max(d.last_punch) from days d where d.member_id = m.id) as last_visit
      from public.members m
     where p_search is null or p_search = ''
        or m.full_name ilike '%' || p_search || '%' or m.fingerprint_id ilike '%' || p_search || '%'
  ),
  paged as (
    select * from base order by last_visit desc nulls last, full_name
     offset (greatest(p_page, 1) - 1) * p_page_size limit p_page_size
  )
  select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(to_jsonb(paged) order by paged.last_visit desc nulls last, paged.full_name) from paged), '[]'::jsonb),
    'total', (select count(*) from base)
  ) into v_result;
  return v_result;
end $$;

/** Every attended day of one member (RLS decides whether the caller may see the member). */
create function public.member_attendance(p_member_id uuid) returns jsonb
language plpgsql stable security invoker set search_path = public as $$
declare v_member jsonb;
begin
  select jsonb_build_object('id', m.id, 'full_name', m.full_name, 'fingerprint_id', m.fingerprint_id,
                            'registration_date', m.registration_date, 'status', public.member_status(m.id))
    into v_member from public.members m where m.id = p_member_id;
  if v_member is null then raise exception 'Member not found' using errcode = 'P0002'; end if;
  return jsonb_build_object(
    'member', v_member,
    'today', public.karachi_today(),
    'days', coalesce((
      select jsonb_agg(jsonb_build_object('day', d.day, 'punches', d.punches, 'first_punch', d.first_punch, 'last_punch', d.last_punch) order by d.day)
        from (
          select (a.punched_at at time zone 'Asia/Karachi')::date as day, count(*)::int as punches,
                 min(a.punched_at) as first_punch, max(a.punched_at) as last_punch
            from public.attendance_logs a
           where a.member_id = p_member_id and a.status = 'ACTIVE'
           group by 1
        ) d
    ), '[]'::jsonb)
  );
end $$;

grant execute on function public.bridge_overview(), public.list_activity(text, text, integer, integer),
  public.attendance_overview(text, integer, integer), public.member_attendance(uuid) to authenticated;
