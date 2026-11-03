begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@t.test'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't1@t.test');
insert into public.profiles (id, role, full_name, email, trainer_type) values
  ('00000000-0000-0000-0000-0000000000a1', 'SUPER_ADMIN', 'Admin', 'admin@t.test', null),
  ('00000000-0000-0000-0000-0000000000c1', 'TRAINER', 'Trainer One', 't1@t.test', 'GYM');

create function pg_temp.act_as(p_id text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

-- Trainer: edits own contact details only, reads gym settings, cannot change them
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
select lives_ok($$ select public.update_my_profile('Trainer Renamed', 'Father', '0300 1111111', 'Karachi') $$, 'a trainer edits their own profile');
select is((select full_name from public.profiles where id = '00000000-0000-0000-0000-0000000000c1'), 'Trainer Renamed', 'the name changed');
select is((select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000c1'), 'TRAINER', 'the role did not change');
select throws_ok($$ select public.update_my_profile('   ', null, null, null) $$, 'Name is required', 'a blank name is rejected');
select is((select count(*)::int from public.gym_settings), 1, 'staff can read the gym settings');
update public.gym_settings set gym_name = 'Hacked';
select is((select gym_name from public.gym_settings), 'Iron Gym', 'a trainer cannot change the gym settings');

-- Admin changes them
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
update public.gym_settings set gym_name = 'Workout Chapter 1', default_admission_fee = 1500;
select is((select default_admission_fee from public.gym_settings), 1500, 'the owner changes the gym settings');

select * from finish();
rollback;
