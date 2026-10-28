-- Remote fingerprint enrollment: the app queues a scan, the reception bridge drives the K50,
-- picks the device user ID and reports the result back on the same row.

create type public.enrollment_status as enum ('PENDING', 'ENROLLING', 'SUCCESS', 'FAILED', 'CANCELLED');

create table public.device_enrollments (
  id uuid primary key default gen_random_uuid(),
  status public.enrollment_status not null default 'PENDING',
  fingerprint_id text,
  error text,
  requested_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index device_enrollments_pending_idx on public.device_enrollments (created_at) where status = 'PENDING';

alter table public.device_enrollments enable row level security;

create policy enrollments_select on public.device_enrollments for select to authenticated
  using (requested_by = auth.uid() or public.is_super_admin());
create policy enrollments_insert on public.device_enrollments for insert to authenticated
  with check (public.current_role_name() in ('SUPER_ADMIN', 'MANAGER') and requested_by = auth.uid() and status = 'PENDING');
-- The requester may only cancel; progress and results are written by the bridge (service role).
create policy enrollments_cancel on public.device_enrollments for update to authenticated
  using (requested_by = auth.uid() and status in ('PENDING', 'ENROLLING'))
  with check (requested_by = auth.uid() and status = 'CANCELLED');

revoke insert, update on public.device_enrollments from authenticated;
grant insert (status) on public.device_enrollments to authenticated;
grant update (status) on public.device_enrollments to authenticated;
