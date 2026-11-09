-- How a payment was received: cash in hand or an online transfer.
-- Every billing path (register, renew, collect fees) now records it. Existing and old-style calls default to CASH.

create type public.payment_method as enum ('CASH', 'ONLINE');

alter table public.payments add column payment_method public.payment_method not null default 'CASH';

-- ---------- _apply_payment records the method ----------
drop function public._apply_payment(uuid, text, integer, date, integer, integer);
create function public._apply_payment(
  p_member_id uuid, p_plan_code text, p_amount integer, p_start_date date,
  p_admission_fee integer, p_discount integer, p_method public.payment_method default 'CASH'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_today date := public.karachi_today();
  v_cur public.memberships;
  v_plan public.plans;
  v_cur_plan public.plans;
  v_ms_id uuid;
  v_credit_before integer := 0;
  v_months_covered integer;
  v_total integer;
  v_periods integer;
  v_credit integer;
  v_added integer;
  v_anchor date;
  v_due date;
  v_price integer;
  v_payment_id uuid;
begin
  select * into v_cur from public.latest_membership(p_member_id);
  if v_cur.id is null then
    v_plan := (select p from public.plans p where p.code = p_plan_code);
  else
    select * into v_cur_plan from public.plans where code = v_cur.plan_code;
    v_plan := (select p from public.plans p where p.code = coalesce(p_plan_code, v_cur.plan_code));
  end if;
  if v_plan.code is null then raise exception 'Unknown plan'; end if;
  if not v_plan.active and (v_cur.id is null or v_plan.code <> v_cur.plan_code) then
    raise exception 'This plan is not available any more';
  end if;
  v_price := public.effective_price(v_plan.price, v_plan.months, (select m.monthly_discount from public.members m where m.id = p_member_id));

  if v_cur.id is not null then
    if v_cur.frozen then raise exception 'No payment during a freeze'; end if;
    if v_cur_plan.months is null then raise exception 'Lifetime member has already paid'; end if;
    if v_plan.code <> v_cur.plan_code and not (v_cur.due_date < v_today or v_cur.months_covered = 0) then
      raise exception 'Plan change is allowed only after the current plan completes';
    end if;
  end if;

  if v_plan.months is null and p_amount <> v_plan.price then
    raise exception 'Lifetime requires exactly %', v_plan.price;
  end if;

  if v_cur.id is not null and v_plan.code = v_cur.plan_code and p_start_date is null then
    -- continue the cycle from its original anchor
    v_ms_id := v_cur.id; v_anchor := v_cur.anchor_date;
    v_months_covered := v_cur.months_covered; v_credit_before := v_cur.credit;
  else
    v_anchor := coalesce(p_start_date, v_today);
    v_months_covered := 0;
    v_credit_before := case when v_cur.id is not null and v_plan.code = v_cur.plan_code then v_cur.credit else 0 end;
    insert into public.memberships (member_id, plan_code, anchor_date, months_covered, credit)
      values (p_member_id, v_plan.code, v_anchor, 0, v_credit_before) returning id into v_ms_id;
  end if;

  if v_plan.months is null then
    v_periods := 1; v_credit := 0; v_added := 0; v_due := null;
    update public.memberships set due_date = null where id = v_ms_id;
  else
    v_total := v_credit_before + p_amount;
    v_periods := v_total / v_price;
    v_credit := v_total - v_periods * v_price;
    v_added := v_periods * v_plan.months;
    v_due := (v_anchor + make_interval(months => v_months_covered + v_added))::date;
    update public.memberships
      set months_covered = v_months_covered + v_added, credit = v_credit, due_date = v_due
      where id = v_ms_id;
  end if;

  insert into public.payments (member_id, membership_id, amount, admission_fee, discount, months_added, credit_before, received_by, payment_method)
    values (p_member_id, v_ms_id, p_amount, p_admission_fee, p_discount, v_added, v_credit_before, auth.uid(), coalesce(p_method, 'CASH'))
    returning id into v_payment_id;
  return v_payment_id;
end $$;
revoke all on function public._apply_payment(uuid, text, integer, date, integer, integer, public.payment_method) from public, anon, authenticated;

-- ---------- register_member ----------
drop function public.register_member(text, text, text, text, text, text, text, text, text, integer, integer, integer, date, uuid, integer, integer);
create function public.register_member(
  p_full_name text, p_father_name text, p_phone text, p_emergency_contact text, p_email text,
  p_cnic text, p_address text, p_fingerprint_id text,
  p_plan_code text, p_amount integer, p_admission_fee integer, p_discount integer,
  p_start_date date, p_trainer_id uuid, p_commission integer, p_monthly_discount integer default 0,
  p_payment_method public.payment_method default 'CASH'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_member_id uuid;
  v_plan public.plans;
begin
  perform public.assert_billing_role();
  select * into v_plan from public.plans where code = p_plan_code;
  if v_plan.code is null then raise exception 'Unknown plan'; end if;
  if v_plan.is_trainer_plan and p_trainer_id is null then raise exception 'Trainer plan requires a trainer'; end if;
  if p_amount < 0 or p_admission_fee < 0 or p_discount < 0 or coalesce(p_monthly_discount, 0) < 0 then raise exception 'Invalid amount'; end if;
  if coalesce(p_monthly_discount, 0) > 0 then
    if not public.is_super_admin() then raise exception 'Only the owner can give a monthly discount'; end if;
    perform public._check_monthly_discount(p_monthly_discount);
  end if;

  insert into public.members (full_name, father_name, phone, emergency_contact, email, cnic, address, fingerprint_id, registered_by, monthly_discount)
    values (p_full_name, p_father_name, p_phone, p_emergency_contact, p_email, p_cnic, p_address, p_fingerprint_id, auth.uid(), coalesce(p_monthly_discount, 0))
    returning id into v_member_id;

  perform public._apply_payment(v_member_id, p_plan_code, p_amount, p_start_date, greatest(0, p_admission_fee - p_discount), p_discount, p_payment_method);

  if p_trainer_id is not null then
    insert into public.trainer_assignments (member_id, trainer_id, commission_amount, created_by)
      values (v_member_id, p_trainer_id, coalesce(p_commission, 0), auth.uid());
  end if;
  return v_member_id;
end $$;
grant execute on function public.register_member(text, text, text, text, text, text, text, text, text, integer, integer, integer, date, uuid, integer, integer, public.payment_method) to authenticated;

-- ---------- record_payment (renewal) ----------
drop function public.record_payment(uuid, integer, text, date, integer);
create function public.record_payment(
  p_member_id uuid, p_amount integer, p_plan_code text default null,
  p_start_date date default null, p_discount integer default 0,
  p_payment_method public.payment_method default 'CASH'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_today date := public.karachi_today();
  v_last_due date;
  v_fee integer := 0;
begin
  perform public.assert_billing_role();
  if not public.can_see_member(p_member_id) then raise exception 'Not allowed' using errcode = '42501'; end if;
  if p_amount <= 0 then raise exception 'Payment must be positive'; end if;

  select max(due_date) into v_last_due from public.memberships where member_id = p_member_id;
  if v_last_due is not null and v_today > (v_last_due + interval '6 months')::date then
    v_fee := greatest(0, 1000 - coalesce(p_discount, 0));
  end if;
  return public._apply_payment(p_member_id, p_plan_code, p_amount, p_start_date, v_fee, coalesce(p_discount, 0), p_payment_method);
end $$;
grant execute on function public.record_payment(uuid, integer, text, date, integer, public.payment_method) to authenticated;

-- ---------- collect_fee (manager directory) ----------
drop function public.collect_fee(uuid, integer);
create function public.collect_fee(p_member_id uuid, p_amount integer, p_payment_method public.payment_method default 'CASH') returns uuid
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
  return public._apply_payment(p_member_id, null, p_amount, null, v_fee, 0, p_payment_method);
end $$;
revoke all on function public.collect_fee(uuid, integer, public.payment_method) from public, anon;
grant execute on function public.collect_fee(uuid, integer, public.payment_method) to authenticated;

-- A payment's method is fixed once recorded, like every other payment column.
create or replace function public.payments_immutable() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Payments cannot be deleted, void them instead';
  end if;
  if (new.member_id, new.membership_id, new.amount, new.admission_fee, new.discount, new.months_added, new.credit_before, new.paid_on, new.received_by, new.created_at, new.payment_method)
     is distinct from
     (old.member_id, old.membership_id, old.amount, old.admission_fee, old.discount, old.months_added, old.credit_before, old.paid_on, old.received_by, old.created_at, old.payment_method) then
    raise exception 'Payments cannot be edited, void them instead';
  end if;
  if old.voided_at is not null then
    raise exception 'Payment is already voided';
  end if;
  return new;
end $$;
