-- Trainers cannot read manager profiles (RLS), so the registrar join must not drop their members.
create or replace function public.list_members(
  p_search text default null, p_status text default null, p_plan text default null,
  p_from date default null, p_to date default null, p_registered_by uuid default null,
  p_page integer default 1, p_page_size integer default 10
) returns jsonb
language plpgsql stable security invoker set search_path = public as $$
declare v_result jsonb;
begin
  with base as (
    select m.id, m.full_name, m.father_name, m.phone, m.emergency_contact, m.email, m.fingerprint_id,
           m.registration_date, m.registered_by, coalesce(rb.full_name, '---') as registered_by_name,
           lm.plan_code, lm.due_date,
           public.member_status(m.id) as status,
           (select max(p.paid_on) from public.payments p where p.member_id = m.id and p.voided_at is null) as last_payment_date,
           (select t.full_name from public.trainer_assignments a join public.profiles t on t.id = a.trainer_id
              where a.member_id = m.id and a.end_date is null limit 1) as trainer_name
    from public.members m
    left join public.profiles rb on rb.id = m.registered_by
    left join lateral (select * from public.memberships x where x.member_id = m.id order by x.created_at desc, x.id desc limit 1) lm on true
    where (p_search is null or p_search = '' or m.full_name ilike '%' || p_search || '%'
           or m.phone ilike '%' || p_search || '%' or m.fingerprint_id ilike '%' || p_search || '%')
      and (p_plan is null or p_plan = '' or lm.plan_code = p_plan)
      and (p_from is null or m.registration_date >= p_from)
      and (p_to is null or m.registration_date <= p_to)
      and (p_registered_by is null or m.registered_by = p_registered_by)
  ), filtered as (
    select * from base
    where p_status is null or p_status = ''
       or (p_status = 'active' and status = 'ACTIVE')
       or (p_status = 'inactive' and status <> 'ACTIVE')
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'kpis', jsonb_build_object(
      'total', (select count(*) from filtered),
      'active', (select count(*) from filtered where status = 'ACTIVE'),
      'expired', (select count(*) from filtered where status = 'EXPIRED'),
      'frozen', (select count(*) from filtered where status = 'FROZEN')),
    'rows', coalesce((select jsonb_agg(to_jsonb(r)) from (
      select * from filtered order by registration_date desc, full_name
      limit p_page_size offset (greatest(p_page, 1) - 1) * p_page_size) r), '[]'::jsonb)
  ) into v_result;
  return v_result;
end $$;

