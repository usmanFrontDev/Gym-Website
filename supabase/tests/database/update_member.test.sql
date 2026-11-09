begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000e1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'um-admin@t.test'),
  ('00000000-0000-0000-0000-0000000000e2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'um-mgr@t.test');
insert into public.profiles (id, role, full_name, email) values
  ('00000000-0000-0000-0000-0000000000e1', 'SUPER_ADMIN', 'Um Admin', 'um-admin@t.test'),
  ('00000000-0000-0000-0000-0000000000e2', 'MANAGER', 'Um Manager', 'um-mgr@t.test');
insert into public.members (id, full_name, father_name, phone, fingerprint_id, registered_by) values
  ('00000000-0000-0000-0000-00000000f001', 'Um Member', 'Old Father', '03000000001', 'um-1', '00000000-0000-0000-0000-0000000000e2');

create function pg_temp.act_as(p_id text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000e2');
select throws_ok(
  $$ select public.update_member('00000000-0000-0000-0000-00000000f001', 'Hacked', null, '0300', null, null, null, null) $$,
  '42501', 'Only the owner can edit member details', 'a manager cannot edit member details');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000e1');
select lives_ok(
  $$ select public.update_member('00000000-0000-0000-0000-00000000f001', '  Um Renamed ', 'New Father', '03111111111', '', 'a@b.test', null, 'Karachi') $$,
  'the owner edits a member');
select is((select full_name from public.members where id = '00000000-0000-0000-0000-00000000f001'), 'Um Renamed', 'name is saved trimmed');
select is((select father_name from public.members where id = '00000000-0000-0000-0000-00000000f001'), 'New Father', 'father name is saved');
select is((select emergency_contact from public.members where id = '00000000-0000-0000-0000-00000000f001'), null, 'blank optional fields become null');
select is((select fingerprint_id from public.members where id = '00000000-0000-0000-0000-00000000f001'), 'um-1', 'the fingerprint id is never touched');
select throws_ok(
  $$ select public.update_member('00000000-0000-0000-0000-00000000f001', ' ', null, '0300', null, null, null, null) $$,
  null, 'Name is required', 'a name is required');

select * from finish();
rollback;
