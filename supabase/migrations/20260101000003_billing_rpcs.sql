-- Authoritative billing. The TS module in src/utils/billing mirrors this for previews.

create function public.latest_membership(p_member_id uuid) returns public.memberships
language sql stable security definer set search_path = public as $$
  select * from public.memberships where member_id = p_member_id order by created_at desc, id desc limit 1
$$;

create function public.member_status(p_member_id uuid) returns public.attendance_status
language plpgsql stable security definer set search_path = public as $$
declare
  v_member public.members;
  v_ms public.memberships;
  v_months integer;
begin
  select * into v_member from public.members where id = p_member_id;
  if not found then return 'UNKNOWN'; end if;
  if v_member.blocked then return 'BLOCKED'; end if;
  select * into v_ms from public.latest_membership(p_member_id);
  if v_ms.id is null then return 'EXPIRED'; end if;
  if v_ms.frozen then return 'FROZEN'; end if;
  select months into v_months from public.plans where code = v_ms.plan_code;
  if v_months is null then return 'ACTIVE'; end if; -- lifetime
  if v_ms.months_covered = 0 then return 'EXPIRED'; end if; -- credit alone gives no access
  return case when public.karachi_today() <= v_ms.due_date then 'ACTIVE' else 'EXPIRED' end;
end $$;

create function public.assert_billing_role() returns public.user_role
language plpgsql stable security definer set search_path = public as $$
declare v_role public.user_role := public.current_role_name();
begin
  if v_role is null or v_role not in ('SUPER_ADMIN', 'MANAGER') then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return v_role;
end $$;

-- Internal: apply a plan payment to a member. Returns the payment id.
create function public._apply_payment(
  p_member_id uuid, p_plan_code text, p_amount integer, p_start_date date,
  p_admission_fee integer, p_discount integer
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
    v_periods := v_total / v_plan.price;
    v_credit := v_total - v_periods * v_plan.price;
    v_added := v_periods * v_plan.months;
    v_due := (v_anchor + make_interval(months => v_months_covered + v_added))::date;
    update public.memberships
      set months_covered = v_months_covered + v_added, credit = v_credit, due_date = v_due
      where id = v_ms_id;
  end if;

  insert into public.payments (member_id, membership_id, amount, admission_fee, discount, months_added, credit_before, received_by)
    values (p_member_id, v_ms_id, p_amount, p_admission_fee, p_discount, v_added, v_credit_before, auth.uid())
    returning id into v_payment_id;
  return v_payment_id;
end $$;

create function public.register_member(
  p_full_name text, p_father_name text, p_phone text, p_emergency_contact text, p_email text,
  p_cnic text, p_address text, p_fingerprint_id text,
  p_plan_code text, p_amount integer, p_admission_fee integer, p_discount integer,
  p_start_date date, p_trainer_id uuid, p_commission integer
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
  if p_amount < 0 or p_admission_fee < 0 or p_discount < 0 then raise exception 'Invalid amount'; end if;

  insert into public.members (full_name, father_name, phone, emergency_contact, email, cnic, address, fingerprint_id, registered_by)
    values (p_full_name, p_father_name, p_phone, p_emergency_contact, p_email, p_cnic, p_address, p_fingerprint_id, auth.uid())
    returning id into v_member_id;

  perform public._apply_payment(v_member_id, p_plan_code, p_amount, p_start_date, greatest(0, p_admission_fee - p_discount), p_discount);

  if p_trainer_id is not null then
    insert into public.trainer_assignments (member_id, trainer_id, commission_amount, created_by)
      values (v_member_id, p_trainer_id, coalesce(p_commission, 0), auth.uid());
  end if;
  return v_member_id;
end $$;

create function public.record_payment(
  p_member_id uuid, p_amount integer, p_plan_code text default null,
  p_start_date date default null, p_discount integer default 0
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
  return public._apply_payment(p_member_id, p_plan_code, p_amount, p_start_date, v_fee, coalesce(p_discount, 0));
end $$;

create function public.void_payment(p_payment_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_pay public.payments;
  v_ms public.memberships;
  v_plan public.plans;
  v_months integer;
begin
  perform public.assert_billing_role();
  if p_reason is null or length(trim(p_reason)) = 0 then raise exception 'A reason is required'; end if;
  select * into v_pay from public.payments where id = p_payment_id;
  if v_pay.id is null or not public.can_see_member(v_pay.member_id) then raise exception 'Not allowed' using errcode = '42501'; end if;
  if v_pay.voided_at is not null then raise exception 'Payment is already voided'; end if;

  select * into v_ms from public.memberships where id = v_pay.membership_id;
  if v_ms.id <> (public.latest_membership(v_pay.member_id)).id then
    raise exception 'Only payments of the current membership can be voided';
  end if;
  if exists (select 1 from public.payments where membership_id = v_ms.id and voided_at is null and created_at > v_pay.created_at) then
    raise exception 'Void the most recent payment first';
  end if;

  select * into v_plan from public.plans where code = v_ms.plan_code;
  v_months := greatest(0, v_ms.months_covered - v_pay.months_added);
  update public.memberships
    set months_covered = v_months, credit = v_pay.credit_before,
        due_date = case when v_plan.months is null then null else (anchor_date + make_interval(months => v_months))::date end
    where id = v_ms.id;
  update public.payments set voided_at = now(), voided_by = auth.uid(), void_reason = p_reason where id = p_payment_id;
end $$;

create function public.freeze_member(p_member_id uuid, p_date date default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ms public.memberships;
  v_months integer;
begin
  perform public.assert_billing_role();
  if not public.can_see_member(p_member_id) then raise exception 'Not allowed' using errcode = '42501'; end if;
  if public.member_status(p_member_id) <> 'ACTIVE' then raise exception 'Only active members can be frozen'; end if;
  select * into v_ms from public.latest_membership(p_member_id);
  select months into v_months from public.plans where code = v_ms.plan_code;
  if v_months is null then raise exception 'Lifetime members cannot be frozen'; end if;
  update public.memberships set frozen = true where id = v_ms.id;
  insert into public.freezes (member_id, membership_id, frozen_on, frozen_by)
    values (p_member_id, v_ms.id, coalesce(p_date, public.karachi_today()), auth.uid());
end $$;

-- On resume a fresh cycle starts from the resume date (one period of the current plan).
create function public.resume_member(p_member_id uuid, p_date date default null) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ms public.memberships;
  v_months integer;
  v_resume date := coalesce(p_date, public.karachi_today());
begin
  perform public.assert_billing_role();
  if not public.can_see_member(p_member_id) then raise exception 'Not allowed' using errcode = '42501'; end if;
  select * into v_ms from public.latest_membership(p_member_id);
  if v_ms.id is null or not v_ms.frozen then raise exception 'Member is not frozen'; end if;
  select months into v_months from public.plans where code = v_ms.plan_code;
  update public.freezes set resumed_on = v_resume where membership_id = v_ms.id and resumed_on is null;
  update public.memberships set frozen = false where id = v_ms.id;
  insert into public.memberships (member_id, plan_code, anchor_date, months_covered, credit, due_date)
    values (p_member_id, v_ms.plan_code, v_resume, v_months, v_ms.credit, (v_resume + make_interval(months => v_months))::date);
end $$;

create function public.assign_trainer(p_member_id uuid, p_trainer_id uuid, p_commission integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;
  update public.trainer_assignments set end_date = public.karachi_today() where member_id = p_member_id and end_date is null;
  if p_trainer_id is not null then
    insert into public.trainer_assignments (member_id, trainer_id, commission_amount, created_by)
      values (p_member_id, p_trainer_id, coalesce(p_commission, 0), auth.uid());
  end if;
end $$;

-- Called by the fingerprint bridge (service role only). Evaluates the punch and logs it.
create function public.log_punch(p_fingerprint_id text, p_punched_at timestamptz default now()) returns public.attendance_logs
language plpgsql security definer set search_path = public as $$
declare
  v_member public.members;
  v_profile public.profiles;
  v_row public.attendance_logs;
begin
  select * into v_member from public.members where fingerprint_id = p_fingerprint_id;
  if v_member.id is not null then
    insert into public.attendance_logs (fingerprint_id, punched_at, member_id, status)
      values (p_fingerprint_id, p_punched_at, v_member.id, public.member_status(v_member.id)) returning * into v_row;
    return v_row;
  end if;
  select * into v_profile from public.profiles where fingerprint_id = p_fingerprint_id and deleted_at is null;
  if v_profile.id is not null then
    insert into public.attendance_logs (fingerprint_id, punched_at, profile_id, status)
      values (p_fingerprint_id, p_punched_at, v_profile.id, case when v_profile.blocked then 'BLOCKED' else 'STAFF' end::public.attendance_status)
      returning * into v_row;
    return v_row;
  end if;
  insert into public.attendance_logs (fingerprint_id, punched_at, status) values (p_fingerprint_id, p_punched_at, 'UNKNOWN') returning * into v_row;
  return v_row;
end $$;

revoke all on function public.log_punch(text, timestamptz) from public, anon, authenticated;
grant execute on function public.log_punch(text, timestamptz) to service_role;
revoke all on function public._apply_payment(uuid, text, integer, date, integer, integer) from public, anon, authenticated;
