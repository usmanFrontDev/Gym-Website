begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

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

-- Manager One queues a scan
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1');
select lives_ok($$ insert into public.device_enrollments (status) values ('PENDING') $$, 'manager can request a fingerprint scan');
select throws_ok($$ insert into public.device_enrollments (fingerprint_id) values ('999') $$, '42501', null, 'client cannot pick the fingerprint id');
select throws_ok(
  $$ update public.device_enrollments set fingerprint_id = '999' $$, '42501', null, 'client cannot write the fingerprint id'
);
select throws_ok(
  $$ update public.device_enrollments set status = 'SUCCESS' $$, '42501', null, 'client cannot mark a scan as successful'
);
select lives_ok($$ update public.device_enrollments set status = 'CANCELLED' $$, 'requester can cancel their scan');

-- Manager Two cannot see it, the admin can
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b2');
select is((select count(*)::int from public.device_enrollments), 0, 'other managers cannot see the request');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select is((select count(*)::int from public.device_enrollments), 1, 'super admin sees every request');

-- Trainers cannot register members, so they cannot enroll fingerprints either
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
select throws_ok($$ insert into public.device_enrollments (status) values ('PENDING') $$, '42501', null, 'trainer cannot request a scan');

select * from finish();
rollback;
