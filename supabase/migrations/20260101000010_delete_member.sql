-- Member delete (SUPER_ADMIN only). Soft delete: payments and history are never removed.
alter table public.members add column deleted_at timestamptz;

-- Deleted members are invisible to everyone (RLS follows can_see_member), including billing RPCs.
create or replace function public.can_see_member(p_member_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case public.current_role_name()
    when 'SUPER_ADMIN' then exists (select 1 from public.members m where m.id = p_member_id and m.deleted_at is null)
    when 'MANAGER' then exists (select 1 from public.members m where m.id = p_member_id and m.deleted_at is null and m.registered_by = auth.uid())
    when 'TRAINER' then exists (select 1 from public.trainer_assignments a join public.members m on m.id = a.member_id
                                where a.member_id = p_member_id and m.deleted_at is null and a.trainer_id = auth.uid() and a.end_date is null)
    else false
  end
$$;

create function public.delete_member(p_member_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  if not public.can_see_member(p_member_id) then raise exception 'Member not found'; end if;
  -- Free the fingerprint id so it can be enrolled again; the device punch then logs as UNKNOWN.
  update public.members set deleted_at = now(), fingerprint_id = null where id = p_member_id;
  update public.trainer_assignments set end_date = public.karachi_today() where member_id = p_member_id and end_date is null;
end $$;

revoke all on function public.delete_member(uuid) from public, anon;
grant execute on function public.delete_member(uuid) to authenticated;

-- Stats are security definer (bypass RLS), so deleted members are excluded explicitly.
-- Revenue keeps counting their payments: money history is never rewritten.
create or replace function public.revenue_summary() returns jsonb
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
    'active_members',  (select count(*) from members where deleted_at is null and public.member_status(id) = 'ACTIVE'),
    'expired_members', (select count(*) from members where deleted_at is null and public.member_status(id) <> 'ACTIVE')
  );
end $$;

create or replace function public.manager_stats(p_manager_id uuid default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_id uuid := coalesce(p_manager_id, auth.uid());
  v_today date := public.karachi_today();
  v_month date := date_trunc('month', public.karachi_today())::date;
begin
  if not (public.is_super_admin() or v_id = auth.uid()) then raise exception 'Not allowed' using errcode = '42501'; end if;
  return jsonb_build_object(
    'registered_total', (select count(*) from members where registered_by = v_id and deleted_at is null),
    'registered_month', (select count(*) from members where registered_by = v_id and deleted_at is null and registration_date >= v_month),
    'revenue_daily',   (select coalesce(sum(p.amount + p.admission_fee), 0) from payments p join members m on m.id = p.member_id
                         where m.registered_by = v_id and p.voided_at is null and p.paid_on = v_today),
    'revenue_monthly', (select coalesce(sum(p.amount + p.admission_fee), 0) from payments p join members m on m.id = p.member_id
                         where m.registered_by = v_id and p.voided_at is null and p.paid_on >= v_month),
    'revenue_total',   (select coalesce(sum(p.amount + p.admission_fee), 0) from payments p join members m on m.id = p.member_id
                         where m.registered_by = v_id and p.voided_at is null)
  );
end $$;
