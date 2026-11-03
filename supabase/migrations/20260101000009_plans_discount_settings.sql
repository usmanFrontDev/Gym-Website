-- Plans managed by the owner, a per-member monthly discount, gym settings and self-service profile.
-- Business rule change: a member can now get a fixed PKR discount PER MONTH on non-lifetime plans
-- (set by the SUPER_ADMIN only). The admission-fee discount is unchanged.

-- ---------- plans ----------
alter table public.plans add column active boolean not null default true;

create policy plans_admin_insert on public.plans for insert to authenticated with check (public.is_super_admin());
create policy plans_admin_update on public.plans for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

/** Plan price for one member: price minus (monthly discount x months). Lifetime is never discounted. */
create function public.effective_price(p_price integer, p_months integer, p_discount integer) returns integer
language sql immutable as $$
  select case when p_months is null then p_price else greatest(1, p_price - coalesce(p_discount, 0) * p_months) end
$$;

alter table public.members add column monthly_discount integer not null default 0 check (monthly_discount >= 0);

/** A discount must leave every active non-lifetime plan with a price above zero. */
create function public._check_monthly_discount(p_amount integer) returns void
language plpgsql stable set search_path = public as $$
begin
  if p_amount < 0 then raise exception 'Discount cannot be negative'; end if;
  if exists (select 1 from public.plans where active and months is not null and p_amount * months >= price) then
    raise exception 'Discount is too high: it would make an active plan free';
  end if;
end $$;

create function public.set_member_discount(p_member_id uuid, p_amount integer) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'Only the owner can change discounts'; end if;
  perform public._check_monthly_discount(p_amount);
  update public.members set monthly_discount = p_amount where id = p_member_id;
  if not found then raise exception 'Member not found'; end if;
end $$;

create function public.create_plan(p_name text, p_price integer, p_months integer, p_is_trainer boolean default false) returns text
language plpgsql security definer set search_path = public as $$
declare v_base text; v_code text; v_n integer := 1;
begin
  if not public.is_super_admin() then raise exception 'Only the owner can add plans'; end if;
  if length(trim(coalesce(p_name, ''))) = 0 then raise exception 'Plan name is required'; end if;
  if p_price is null or p_price <= 0 then raise exception 'Price must be above zero'; end if;
  if p_months is not null and p_months <= 0 then raise exception 'Months must be above zero'; end if;
  if p_is_trainer and p_months is null then raise exception 'A trainer plan cannot be lifetime'; end if;
  v_base := trim(both '_' from upper(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '_', 'g')));
  if v_base = '' then v_base := 'PLAN'; end if;
  v_code := v_base;
  while exists (select 1 from public.plans where code = v_code) loop
    v_n := v_n + 1; v_code := v_base || '_' || v_n;
  end loop;
  insert into public.plans (code, name, price, months, is_trainer_plan) values (v_code, trim(p_name), p_price, p_months, p_is_trainer);
  return v_code;
end $$;

/** Name, price and availability can change. Months and the trainer flag cannot. A new price only affects future payments. */
create function public.update_plan(p_code text, p_name text, p_price integer, p_active boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'Only the owner can edit plans'; end if;
  if length(trim(coalesce(p_name, ''))) = 0 then raise exception 'Plan name is required'; end if;
  if p_price is null or p_price <= 0 then raise exception 'Price must be above zero'; end if;
  update public.plans set name = trim(p_name), price = p_price, active = p_active where code = p_code;
  if not found then raise exception 'Unknown plan'; end if;
end $$;

-- ---------- billing uses the member's effective price ----------
create or replace function public._apply_payment(
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

  insert into public.payments (member_id, membership_id, amount, admission_fee, discount, months_added, credit_before, received_by)
    values (p_member_id, v_ms_id, p_amount, p_admission_fee, p_discount, v_added, v_credit_before, auth.uid())
    returning id into v_payment_id;
  return v_payment_id;
end $$;
revoke all on function public._apply_payment(uuid, text, integer, date, integer, integer) from public, anon, authenticated;

drop function public.register_member(text, text, text, text, text, text, text, text, text, integer, integer, integer, date, uuid, integer);
create function public.register_member(
  p_full_name text, p_father_name text, p_phone text, p_emergency_contact text, p_email text,
  p_cnic text, p_address text, p_fingerprint_id text,
  p_plan_code text, p_amount integer, p_admission_fee integer, p_discount integer,
  p_start_date date, p_trainer_id uuid, p_commission integer, p_monthly_discount integer default 0
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

  perform public._apply_payment(v_member_id, p_plan_code, p_amount, p_start_date, greatest(0, p_admission_fee - p_discount), p_discount);

  if p_trainer_id is not null then
    insert into public.trainer_assignments (member_id, trainer_id, commission_amount, created_by)
      values (v_member_id, p_trainer_id, coalesce(p_commission, 0), auth.uid());
  end if;
  return v_member_id;
end $$;

-- ---------- gym settings (one row) ----------
create table public.gym_settings (
  id smallint primary key default 1 check (id = 1),
  gym_name text not null default 'Iron Gym',
  phone text,
  address text,
  default_admission_fee integer not null default 1000 check (default_admission_fee >= 0),
  updated_at timestamptz not null default now()
);
insert into public.gym_settings (id) values (1);
alter table public.gym_settings enable row level security;
create policy gym_settings_select on public.gym_settings for select to authenticated using (public.current_role_name() is not null);
create policy gym_settings_update on public.gym_settings for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());
revoke insert, delete on public.gym_settings from authenticated;

-- ---------- a user edits only their own contact details (never role, email or fingerprint) ----------
create function public.update_my_profile(p_full_name text, p_father_name text, p_phone text, p_address text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if length(trim(coalesce(p_full_name, ''))) = 0 then raise exception 'Name is required'; end if;
  update public.profiles
     set full_name = trim(p_full_name), father_name = nullif(trim(p_father_name), ''),
         phone = nullif(trim(p_phone), ''), address = nullif(trim(p_address), '')
   where id = auth.uid() and blocked = false and deleted_at is null;
  if not found then raise exception 'Profile not found'; end if;
end $$;

grant execute on function public.set_member_discount(uuid, integer), public.create_plan(text, integer, integer, boolean),
  public.update_plan(text, text, integer, boolean), public.update_my_profile(text, text, text, text),
  public.register_member(text, text, text, text, text, text, text, text, text, integer, integer, integer, date, uuid, integer, integer),
  public.effective_price(integer, integer, integer) to authenticated;
revoke all on function public._check_monthly_discount(integer) from public, anon, authenticated;
