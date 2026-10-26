begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

-- baseline so the tests also pass on a database that already holds data
create temp table base as select
  (select coalesce(sum(amount + admission_fee), 0)::int from public.payments where voided_at is null) as revenue,
  (select count(*)::int from public.profiles where role = 'MANAGER') as managers,
  (select coalesce(sum(amount + admission_fee), 0)::int from public.payments where voided_at is null and paid_on >= current_date - 30)
    - (select coalesce(sum(amount), 0)::int from public.expenses where spent_on >= current_date - 30) as net;
grant select on base to authenticated;

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@t.test'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm1@t.test'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm2@t.test'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't1@t.test');
insert into public.profiles (id, role, full_name, email, trainer_type) values
  ('00000000-0000-0000-0000-0000000000a1', 'SUPER_ADMIN', 'Admin', 'admin@t.test', null),
  ('00000000-0000-0000-0000-0000000000b1', 'MANAGER', 'Manager One', 'm1@t.test', null),
  ('00000000-0000-0000-0000-0000000000b2', 'MANAGER', 'Manager Two', 'm2@t.test', null),
  ('00000000-0000-0000-0000-0000000000c1', 'TRAINER', 'Trainer One', 't1@t.test', 'GYM');

create function pg_temp.act_as(p_id text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1');
select public.register_member('Ali','Khan','0300',null,null,null,null,'201','TRAINER_8000',8000,1000,0,null,'00000000-0000-0000-0000-0000000000c1',3000);
select public.register_member('Sara','Khan','0301',null,null,null,null,'202','MONTHLY',2500,1000,0,null,null,null);

select is((public.list_members()->>'total')::int, 2, 'manager lists own members');
select is((public.list_members(p_search => 'sara')->>'total')::int, 1, 'search filters by name');
select is((public.list_members(p_status => 'active')->'kpis'->>'active')::int, 2, 'kpis follow filters');
select is((public.manager_stats()->>'registered_total')::int, 2, 'manager sees own stats');
select is((public.manager_stats()->>'revenue_total')::int, 12500, 'revenue = payments + admission fees');
select throws_ok($$ select public.revenue_summary() $$, 'Not allowed', 'manager cannot read gym revenue');
select throws_ok($$ select public.manager_stats('00000000-0000-0000-0000-0000000000b2') $$, 'Not allowed', 'manager cannot read other manager stats');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
select is((public.trainer_stats()->>'commission_earned')::int, 3000, 'trainer commission accrues per paid month');
select is((public.list_members()->>'total')::int, 1, 'trainer lists only assigned members even without manager profile access');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select is((public.revenue_summary()->>'revenue_total')::int - (select revenue from base), 12500, 'admin sees gym revenue');
select is((select count(*)::int from public.managers_overview()) - (select managers from base), 2, 'admin lists managers');
select is((public.expense_summary(current_date - 30, current_date)->>'net')::int - (select net from base), 12500, 'net = revenue - expenses');

select * from finish();
rollback;
