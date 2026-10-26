-- Read-side RPCs for lists, dashboards, trainers and expenses.

-- Server-side paginated, filtered members list. Security invoker: RLS decides which members are visible.
create function public.list_members(
  p_search text default null, p_status text default null, p_plan text default null,
  p_from date default null, p_to date default null, p_registered_by uuid default null,
  p_page integer default 1, p_page_size integer default 10
) returns jsonb
language plpgsql stable security invoker set search_path = public as $$
declare v_result jsonb;
begin
  with base as (
    select m.id, m.full_name, m.father_name, m.phone, m.emergency_contact, m.email, m.fingerprint_id,
           m.registration_date, m.registered_by, rb.full_name as registered_by_name,
           lm.plan_code, lm.due_date,
           public.member_status(m.id) as status,
           (select max(p.paid_on) from public.payments p where p.member_id = m.id and p.voided_at is null) as last_payment_date,
           (select t.full_name from public.trainer_assignments a join public.profiles t on t.id = a.trainer_id
              where a.member_id = m.id and a.end_date is null limit 1) as trainer_name
    from public.members m
    join public.profiles rb on rb.id = m.registered_by
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

create function public.revenue_summary() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_today date := public.karachi_today();
  v_month date := date_trunc('month', public.karachi_today())::date;
begin
  if not public.is_super_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  return jsonb_build_object(
    'revenue_daily',   (select coalesce(sum(amount + admission_fee), 0) from payments where voided_at is null and paid_on = v_today),
    'revenue_monthly', (select coalesce(sum(amount + admission_fee), 0) from payments where voided_at is null and paid_on >= v_month),
    'revenue_total',   (select coalesce(sum(amount + admission_fee), 0) from payments where voided_at is null),
    'expenses_monthly',(select coalesce(sum(amount), 0) from expenses where spent_on >= v_month),
    'expenses_total',  (select coalesce(sum(amount), 0) from expenses),
    'active_members',  (select count(*) from members where public.member_status(id) = 'ACTIVE'),
    'expired_members', (select count(*) from members where public.member_status(id) <> 'ACTIVE')
  );
end $$;

create function public.manager_stats(p_manager_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_id uuid := coalesce(p_manager_id, auth.uid());
  v_today date := public.karachi_today();
  v_month date := date_trunc('month', public.karachi_today())::date;
begin
  if not (public.is_super_admin() or v_id = auth.uid()) then raise exception 'Not allowed' using errcode = '42501'; end if;
  return jsonb_build_object(
    'registered_total', (select count(*) from members where registered_by = v_id),
    'registered_month', (select count(*) from members where registered_by = v_id and registration_date >= v_month),
    'revenue_daily',   (select coalesce(sum(p.amount + p.admission_fee), 0) from payments p join members m on m.id = p.member_id
                         where m.registered_by = v_id and p.voided_at is null and p.paid_on = v_today),
    'revenue_monthly', (select coalesce(sum(p.amount + p.admission_fee), 0) from payments p join members m on m.id = p.member_id
                         where m.registered_by = v_id and p.voided_at is null and p.paid_on >= v_month),
    'revenue_total',   (select coalesce(sum(p.amount + p.admission_fee), 0) from payments p join members m on m.id = p.member_id
                         where m.registered_by = v_id and p.voided_at is null)
  );
end $$;

-- All managers with their numbers (SUPER_ADMIN only).
create function public.managers_overview() returns table (
  id uuid, full_name text, father_name text, cnic text, email text, phone text, address text,
  blocked boolean, registered_month bigint, registered_total bigint,
  revenue_daily bigint, revenue_monthly bigint, revenue_total bigint)
language plpgsql stable security definer set search_path = public as $$
declare
  v_today date := public.karachi_today();
  v_month date := date_trunc('month', public.karachi_today())::date;
begin
  if not public.is_super_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  return query
  select p.id, p.full_name, p.father_name, p.cnic, p.email, p.phone, p.address, p.blocked,
    (select count(*) from members m where m.registered_by = p.id and m.registration_date >= v_month),
    (select count(*) from members m where m.registered_by = p.id),
    (select coalesce(sum(y.amount + y.admission_fee), 0)::bigint from payments y join members m on m.id = y.member_id
       where m.registered_by = p.id and y.voided_at is null and y.paid_on = v_today),
    (select coalesce(sum(y.amount + y.admission_fee), 0)::bigint from payments y join members m on m.id = y.member_id
       where m.registered_by = p.id and y.voided_at is null and y.paid_on >= v_month),
    (select coalesce(sum(y.amount + y.admission_fee), 0)::bigint from payments y join members m on m.id = y.member_id
       where m.registered_by = p.id and y.voided_at is null)
  from profiles p where p.role = 'MANAGER' and p.deleted_at is null order by p.full_name;
end $$;

-- Commission rule (assumed, confirm in review): an assignment accrues commission_amount for every month
-- paid (non-voided) by the member on or after the assignment start date.
create function public.assignment_commission(p_assignment_id uuid) returns bigint
language sql stable security definer set search_path = public as $$
  select coalesce(sum(p.months_added), 0)::bigint * a.commission_amount
  from trainer_assignments a
  left join payments p on p.member_id = a.member_id and p.voided_at is null
       and p.paid_on >= a.start_date and (a.end_date is null or p.paid_on <= a.end_date)
  where a.id = p_assignment_id
  group by a.commission_amount
$$;

create function public.trainers_overview() returns table (
  id uuid, full_name text, email text, phone text, trainer_type public.trainer_type, blocked boolean,
  members_trained bigint, commission_earned bigint, commission_paid bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  return query
  select p.id, p.full_name, p.email, p.phone, p.trainer_type, p.blocked,
    (select count(distinct a.member_id) from trainer_assignments a where a.trainer_id = p.id and a.end_date is null),
    (select coalesce(sum(public.assignment_commission(a.id)), 0)::bigint from trainer_assignments a where a.trainer_id = p.id),
    (select coalesce(sum(o.amount), 0)::bigint from trainer_payouts o where o.trainer_id = p.id)
  from profiles p where p.role = 'TRAINER' and p.deleted_at is null order by p.full_name;
end $$;

-- Per-member commission lines for one trainer (SUPER_ADMIN or the trainer themself).
create function public.trainer_member_commissions(p_trainer_id uuid default null) returns table (
  assignment_id uuid, member_id uuid, member_name text, commission_amount integer, start_date date,
  active boolean, earned bigint)
language plpgsql stable security definer set search_path = public as $$
declare v_id uuid := coalesce(p_trainer_id, auth.uid());
begin
  if not (public.is_super_admin() or v_id = auth.uid()) then raise exception 'Not allowed' using errcode = '42501'; end if;
  return query
  select a.id, a.member_id, m.full_name, a.commission_amount, a.start_date, a.end_date is null,
         public.assignment_commission(a.id)
  from trainer_assignments a join members m on m.id = a.member_id
  where a.trainer_id = v_id order by a.start_date desc;
end $$;

create function public.trainer_stats(p_trainer_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_id uuid := coalesce(p_trainer_id, auth.uid());
begin
  if not (public.is_super_admin() or v_id = auth.uid()) then raise exception 'Not allowed' using errcode = '42501'; end if;
  return jsonb_build_object(
    'members_trained', (select count(distinct member_id) from trainer_assignments where trainer_id = v_id and end_date is null),
    'commission_earned', (select coalesce(sum(public.assignment_commission(a.id)), 0) from trainer_assignments a where a.trainer_id = v_id),
    'commission_paid', (select coalesce(sum(amount), 0) from trainer_payouts where trainer_id = v_id)
  );
end $$;

create function public.expense_summary(p_from date, p_to date) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v_revenue bigint; v_expenses bigint;
begin
  if not public.is_super_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  select coalesce(sum(amount + admission_fee), 0) into v_revenue from payments
    where voided_at is null and paid_on between p_from and p_to;
  select coalesce(sum(amount), 0) into v_expenses from expenses where spent_on between p_from and p_to;
  return jsonb_build_object(
    'revenue', v_revenue, 'expenses', v_expenses, 'net', v_revenue - v_expenses,
    'by_category', coalesce((select jsonb_agg(jsonb_build_object('category', category, 'total', total) order by total desc)
      from (select category, sum(amount) as total from expenses where spent_on between p_from and p_to group by category) c), '[]'::jsonb)
  );
end $$;
