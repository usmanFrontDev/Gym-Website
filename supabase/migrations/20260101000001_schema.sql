-- Core schema. Money = integer PKR. Dates = date, timestamps = timestamptz.

create type public.user_role as enum ('SUPER_ADMIN', 'MANAGER', 'TRAINER');
create type public.trainer_type as enum ('GYM', 'MARTIAL_ARTS');
create type public.expense_category as enum ('RENT', 'ELECTRICITY', 'SALARIES', 'EQUIPMENT', 'MAINTENANCE', 'OTHER');
create type public.attendance_status as enum ('ACTIVE', 'EXPIRED', 'FROZEN', 'BLOCKED', 'UNKNOWN', 'STAFF');

create function public.karachi_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Karachi')::date $$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  father_name text,
  cnic text,
  phone text,
  address text,
  email text not null,
  trainer_type public.trainer_type,
  fingerprint_id text unique,
  blocked boolean not null default false,
  deleted_at timestamptz,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  constraint trainer_type_only_for_trainers check (role = 'TRAINER' or trainer_type is null)
);

create table public.plans (
  code text primary key,
  name text not null,
  price integer not null check (price > 0),
  months integer check (months is null or months > 0), -- null = lifetime
  is_trainer_plan boolean not null default false
);

insert into public.plans (code, name, price, months, is_trainer_plan) values
  ('MONTHLY', 'Monthly', 2500, 1, false),
  ('SIX_MONTH', '6-Month', 12500, 6, false),
  ('TWELVE_MONTH', '12-Month', 22000, 12, false),
  ('LIFETIME', 'Lifetime', 60000, null, false),
  ('TRAINER_8000', 'Trainer 8000', 8000, 1, true),
  ('TRAINER_12000', 'Trainer 12000', 12000, 1, true);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  father_name text,
  phone text not null,
  emergency_contact text,
  email text,
  cnic text,
  address text,
  fingerprint_id text unique,
  blocked boolean not null default false,
  registered_by uuid not null references public.profiles (id),
  registration_date date not null default public.karachi_today(),
  created_at timestamptz not null default now()
);
create index members_registered_by_idx on public.members (registered_by);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id),
  plan_code text not null references public.plans (code),
  anchor_date date not null,
  months_covered integer not null default 0,
  credit integer not null default 0 check (credit >= 0),
  due_date date, -- null for lifetime
  frozen boolean not null default false,
  created_at timestamptz not null default clock_timestamp()
);
create index memberships_member_idx on public.memberships (member_id, created_at desc);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id),
  membership_id uuid not null references public.memberships (id),
  amount integer not null check (amount >= 0),
  admission_fee integer not null default 0 check (admission_fee >= 0),
  discount integer not null default 0 check (discount >= 0),
  months_added integer not null default 0,
  credit_before integer not null default 0,
  paid_on date not null default public.karachi_today(),
  received_by uuid not null references public.profiles (id),
  voided_at timestamptz,
  voided_by uuid references public.profiles (id),
  void_reason text,
  created_at timestamptz not null default clock_timestamp(),
  constraint void_has_reason check (voided_at is null or (void_reason is not null and length(trim(void_reason)) > 0))
);
create index payments_member_idx on public.payments (member_id, paid_on desc);
create index payments_paid_on_idx on public.payments (paid_on);

create table public.freezes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id),
  membership_id uuid not null references public.memberships (id),
  frozen_on date not null,
  resumed_on date,
  frozen_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.trainer_assignments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id),
  trainer_id uuid not null references public.profiles (id),
  commission_amount integer not null default 0 check (commission_amount >= 0),
  start_date date not null default public.karachi_today(),
  end_date date,
  created_by uuid not null references public.profiles (id)
);
create index trainer_assignments_trainer_idx on public.trainer_assignments (trainer_id);
create index trainer_assignments_member_idx on public.trainer_assignments (member_id);

create table public.trainer_payouts (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id),
  amount integer not null check (amount > 0),
  paid_on date not null default public.karachi_today(),
  note text,
  created_by uuid not null references public.profiles (id)
);

create table public.attendance_logs (
  id uuid primary key default gen_random_uuid(),
  fingerprint_id text not null,
  punched_at timestamptz not null default now(),
  member_id uuid references public.members (id),
  profile_id uuid references public.profiles (id),
  status public.attendance_status not null default 'UNKNOWN'
);
create index attendance_logs_punched_idx on public.attendance_logs (punched_at desc);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  category public.expense_category not null,
  amount integer not null check (amount > 0),
  spent_on date not null default public.karachi_today(),
  note text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

-- Payments are immutable: only the void columns may change, and rows are never deleted.
create function public.payments_immutable() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Payments cannot be deleted, void them instead';
  end if;
  if (new.member_id, new.membership_id, new.amount, new.admission_fee, new.discount, new.months_added, new.credit_before, new.paid_on, new.received_by, new.created_at)
     is distinct from
     (old.member_id, old.membership_id, old.amount, old.admission_fee, old.discount, old.months_added, old.credit_before, old.paid_on, old.received_by, old.created_at) then
    raise exception 'Payments cannot be edited, void them instead';
  end if;
  if old.voided_at is not null then
    raise exception 'Payment is already voided';
  end if;
  return new;
end $$;
create trigger payments_immutable_trg before update or delete on public.payments
  for each row execute function public.payments_immutable();
