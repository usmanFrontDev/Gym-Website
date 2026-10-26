-- Row level security. Writes to billing tables go through RPCs (security definer) only.

create function public.current_role_name() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and blocked = false and deleted_at is null
$$;

create function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = 'SUPER_ADMIN', false)
$$;

create function public.can_see_member(p_member_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case public.current_role_name()
    when 'SUPER_ADMIN' then true
    when 'MANAGER' then exists (select 1 from public.members m where m.id = p_member_id and m.registered_by = auth.uid())
    when 'TRAINER' then exists (select 1 from public.trainer_assignments a
                                where a.member_id = p_member_id and a.trainer_id = auth.uid() and a.end_date is null)
    else false
  end
$$;

alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.members enable row level security;
alter table public.memberships enable row level security;
alter table public.payments enable row level security;
alter table public.freezes enable row level security;
alter table public.trainer_assignments enable row level security;
alter table public.trainer_payouts enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.expenses enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated using (
  public.is_super_admin() or id = auth.uid()
  or (role = 'TRAINER' and deleted_at is null and public.current_role_name() is not null)
);
create policy profiles_admin_write on public.profiles for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- plans
create policy plans_select on public.plans for select to authenticated using (public.current_role_name() is not null);

-- members
create policy members_select on public.members for select to authenticated using (public.can_see_member(id));
create policy members_admin_update on public.members for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- memberships / freezes follow member visibility
create policy memberships_select on public.memberships for select to authenticated using (public.can_see_member(member_id));
create policy freezes_select on public.freezes for select to authenticated using (public.can_see_member(member_id));

-- payments: money is never visible to trainers
create policy payments_select on public.payments for select to authenticated using (
  public.current_role_name() in ('SUPER_ADMIN', 'MANAGER') and public.can_see_member(member_id)
);

-- trainer data
create policy assignments_select on public.trainer_assignments for select to authenticated using (
  public.is_super_admin() or trainer_id = auth.uid() or public.can_see_member(member_id)
);
create policy payouts_select on public.trainer_payouts for select to authenticated using (
  public.is_super_admin() or trainer_id = auth.uid()
);
create policy payouts_admin_insert on public.trainer_payouts for insert to authenticated
  with check (public.is_super_admin() and created_by = auth.uid());

-- attendance: any signed-in staff may read (recent activity); inserts come from the bridge via service role
create policy attendance_select on public.attendance_logs for select to authenticated using (public.current_role_name() is not null);

-- expenses: SUPER_ADMIN only
create policy expenses_admin_all on public.expenses for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin() and created_by = auth.uid());

alter publication supabase_realtime add table public.attendance_logs;
