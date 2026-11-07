begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm1@t.test'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm2@t.test'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't1@t.test');
insert into public.profiles (id, role, full_name, email, trainer_type) values
  ('00000000-0000-0000-0000-0000000000b1', 'MANAGER', 'Manager One', 'm1@t.test', null),
  ('00000000-0000-0000-0000-0000000000b2', 'MANAGER', 'Manager Two', 'm2@t.test', null),
  ('00000000-0000-0000-0000-0000000000c1', 'TRAINER', 'Trainer One', 't1@t.test', 'GYM');

-- the member belongs to Manager Two; Manager One must still be able to identify them
insert into public.members (id, full_name, father_name, phone, fingerprint_id, registered_by) values
  ('00000000-0000-0000-0000-00000000e001', 'Yy Directory One', 'Yy Father', '03000000011', 'yy-901', '00000000-0000-0000-0000-0000000000b2'),
  ('00000000-0000-0000-0000-00000000e002', 'Yy Directory Gone', null, '03000000012', 'yy-902', '00000000-0000-0000-0000-0000000000b2');
update public.members set deleted_at = now() where id = '00000000-0000-0000-0000-00000000e002';
insert into public.attendance_logs (id, fingerprint_id, punched_at, member_id, status) values
  ('00000000-0000-0000-0000-00000000d001', 'yy-901', now(), '00000000-0000-0000-0000-00000000e001', 'ACTIVE');

create function pg_temp.act_as(p_id text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1');
select is(
  (select count(*)::int from public.members where full_name = 'Yy Directory One'), 0, 'precondition: RLS hides another manager''s member'
);
select is(
  public.list_activity(null, 'yy-901')->'rows'->0->>'name', 'Yy Directory One', 'activity feed names any gym member for a manager'
);
select is(
  public.list_activity(null, 'yy-901')->'rows'->0->>'father_name', 'Yy Father', 'activity feed includes father name'
);
select is(
  public.punch_details('00000000-0000-0000-0000-00000000d001')->>'name', 'Yy Directory One', 'scan card details name the member'
);
select is(
  (public.gym_directory('Yy Directory')->>'total')::int, 1, 'directory finds the member and skips deleted ones'
);
select is(
  (select array_agg(k order by k) from jsonb_object_keys(public.gym_directory('Yy Directory')->'rows'->0) k),
  array['father_name', 'full_name', 'id', 'last_payment_date', 'registration_date'],
  'directory exposes only the limited columns'
);

-- trainer: no directory, and unassigned members stay anonymous
select throws_ok($$ select public.collect_fee('00000000-0000-0000-0000-00000000e001', 500) $$, null, 'This member has no plan yet. Ask the owner to set up their membership.', 'collecting a fee needs an existing plan');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
select throws_ok($$ select public.gym_directory('Yy') $$, '42501', null, 'trainers cannot use the directory');
select is(
  public.punch_details('00000000-0000-0000-0000-00000000d001')->>'name', null, 'trainers do not get names of members they are not assigned to'
);

select throws_ok($$ select public.collect_fee('00000000-0000-0000-0000-00000000e001', 500) $$, '42501', null, 'trainers cannot collect fees');

reset role;
select throws_ok($$ select public.gym_directory('Yy') $$, null, null, 'anonymous callers are rejected');

select * from finish();
rollback;
