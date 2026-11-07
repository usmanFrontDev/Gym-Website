-- Managers see who scanned (any gym member) and can look up any member with a limited profile.
-- members RLS stays strict (managers only read their own members); these functions are security definer
-- and return only the fields the front desk needs: name, father name, registration date, last payment date.

/** Front-desk roles may see identity of any gym member; trainers only of members assigned to them. */
create function public.can_see_member_identity(p_member_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when public.current_role_name() in ('SUPER_ADMIN', 'MANAGER')
      then exists (select 1 from public.members m where m.id = p_member_id and m.deleted_at is null)
    else public.can_see_member(p_member_id)
  end
$$;

-- ---------- activity feed: names of everyone who scanned, plus the limited member details ----------
create or replace function public.list_activity(
  p_kind text default null, p_search text default null, p_page integer default 1, p_page_size integer default 10
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_result jsonb;
  v_role public.user_role := public.current_role_name();
begin
  if v_role is null then raise exception 'Not allowed' using errcode = '42501'; end if;
  with feed as (
    select a.id, a.punched_at as at, a.fingerprint_id, a.status::text as status,
           case when a.status in ('ACTIVE', 'STAFF') then 'GRANTED' else 'DENIED' end as kind,
           m.id as member_id,
           case when m.id is not null then public.can_see_member_identity(m.id)
                when p.id is not null then (v_role in ('SUPER_ADMIN', 'MANAGER') or p.id = auth.uid() or p.role = 'TRAINER')
                else false end as vis,
           coalesce(m.full_name, p.full_name) as name, m.father_name, m.registration_date
      from public.attendance_logs a
      left join public.members m on m.id = a.member_id and m.deleted_at is null
      left join public.profiles p on p.id = a.profile_id
    union all
    select m.id, m.created_at, m.fingerprint_id, 'ONBOARDED', 'ONBOARDED', m.id, true, m.full_name, m.father_name, m.registration_date
      from public.members m
     where m.deleted_at is null and public.can_see_member(m.id)
  ),
  searched as (
    select * from feed
     where p_search is null or p_search = ''
        or (vis and name ilike '%' || p_search || '%') or fingerprint_id ilike '%' || p_search || '%'
  ),
  paged as (
    select s.id, s.at, s.fingerprint_id, s.status, s.kind,
           case when s.vis then s.name end as name,
           case when s.vis then s.member_id end as member_id,
           case when s.vis then s.father_name end as father_name,
           case when s.vis then s.registration_date end as registration_date,
           case when s.vis and s.member_id is not null
                then (select max(p.paid_on) from public.payments p where p.member_id = s.member_id and p.voided_at is null) end as last_payment_date
      from searched s
     where p_kind is null or s.kind = p_kind
     order by s.at desc offset (greatest(p_page, 1) - 1) * p_page_size limit p_page_size
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

-- ---------- one punch with its limited member details (realtime scan card) ----------
create function public.punch_details(p_log_id uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_role public.user_role := public.current_role_name();
  v_row jsonb;
begin
  if v_role is null then raise exception 'Not allowed' using errcode = '42501'; end if;
  select jsonb_build_object(
           'id', a.id, 'at', a.punched_at, 'fingerprint_id', a.fingerprint_id, 'status', a.status,
           'kind', case when a.status in ('ACTIVE', 'STAFF') then 'GRANTED' else 'DENIED' end,
           'name', case when m.id is not null and public.can_see_member_identity(m.id) then m.full_name
                        when p.id is not null and (v_role in ('SUPER_ADMIN', 'MANAGER') or p.id = auth.uid() or p.role = 'TRAINER') then p.full_name end,
           'member_id', case when m.id is not null and public.can_see_member_identity(m.id) then m.id end,
           'father_name', case when m.id is not null and public.can_see_member_identity(m.id) then m.father_name end,
           'registration_date', case when m.id is not null and public.can_see_member_identity(m.id) then m.registration_date end,
           'last_payment_date', case when m.id is not null and public.can_see_member_identity(m.id)
              then (select max(x.paid_on) from public.payments x where x.member_id = m.id and x.voided_at is null) end)
    into v_row
    from public.attendance_logs a
    left join public.members m on m.id = a.member_id and m.deleted_at is null
    left join public.profiles p on p.id = a.profile_id
   where a.id = p_log_id;
  return v_row;
end $$;

-- ---------- gym directory: search every member, limited columns ----------
create function public.gym_directory(
  p_search text default null, p_page integer default 1, p_page_size integer default 10
) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_result jsonb;
begin
  if public.current_role_name() not in ('SUPER_ADMIN', 'MANAGER') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  with base as (
    select m.id, m.full_name, m.father_name, m.registration_date,
           (select max(p.paid_on) from public.payments p where p.member_id = m.id and p.voided_at is null) as last_payment_date
      from public.members m
     where m.deleted_at is null
       and (p_search is null or p_search = '' or m.full_name ilike '%' || p_search || '%' or m.father_name ilike '%' || p_search || '%')
  ),
  paged as (
    select * from base order by full_name, id offset (greatest(p_page, 1) - 1) * p_page_size limit p_page_size
  )
  select jsonb_build_object(
    'rows', coalesce((select jsonb_agg(to_jsonb(paged) order by paged.full_name, paged.id) from paged), '[]'::jsonb),
    'total', (select count(*) from base)
  ) into v_result;
  return v_result;
end $$;

revoke all on function public.can_see_member_identity(uuid), public.punch_details(uuid), public.gym_directory(text, integer, integer) from public, anon;
grant execute on function public.can_see_member_identity(uuid), public.punch_details(uuid), public.gym_directory(text, integer, integer) to authenticated;
revoke all on function public.list_activity(text, text, integer, integer) from public, anon;
grant execute on function public.list_activity(text, text, integer, integer) to authenticated;

-- ---------- collect fees: a manager records a fee for any gym member ----------
-- Continues the member's current plan through the normal billing engine, so the due date, credit and
-- last payment date all move exactly as with record_payment. Managers cannot pick a plan or change one here.
create function public.collect_fee(p_member_id uuid, p_amount integer) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_today date := public.karachi_today();
  v_last_due date;
  v_fee integer := 0;
begin
  perform public.assert_billing_role();
  if not exists (select 1 from public.members m where m.id = p_member_id and m.deleted_at is null) then
    raise exception 'Member not found';
  end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Payment must be positive'; end if;
  if (public.latest_membership(p_member_id)).id is null then
    raise exception 'This member has no plan yet. Ask the owner to set up their membership.';
  end if;

  select max(due_date) into v_last_due from public.memberships where member_id = p_member_id;
  if v_last_due is not null and v_today > (v_last_due + interval '6 months')::date then
    v_fee := 1000;
  end if;
  return public._apply_payment(p_member_id, null, p_amount, null, v_fee, 0);
end $$;

revoke all on function public.collect_fee(uuid, integer) from public, anon;
grant execute on function public.collect_fee(uuid, integer) to authenticated;
