begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

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

-- two members of Manager One, one of Manager Two (unique names so counts do not depend on existing data)
insert into public.members (id, full_name, phone, fingerprint_id, registered_by) values
  ('00000000-0000-0000-0000-00000000f001', 'Zz Attend One', '03000000001', 'zz-901', '00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-00000000f002', 'Zz Attend Two', '03000000002', 'zz-902', '00000000-0000-0000-0000-0000000000b1'),
  ('00000000-0000-0000-0000-00000000f003', 'Zz Attend Three', '03000000003', 'zz-903', '00000000-0000-0000-0000-0000000000b2');

-- Member one: two punches on the same Karachi day (counts once), one on another day, one denied punch.
-- 19:30 UTC on the 1st is 00:30 on the 2nd in Karachi, so it belongs to the 2nd.
insert into public.attendance_logs (fingerprint_id, punched_at, member_id, status) values
  ('zz-901', '2026-03-10 05:00:00+00', '00000000-0000-0000-0000-00000000f001', 'ACTIVE'),
  ('zz-901', '2026-03-10 14:00:00+00', '00000000-0000-0000-0000-00000000f001', 'ACTIVE'),
  ('zz-901', '2026-04-01 19:30:00+00', '00000000-0000-0000-0000-00000000f001', 'ACTIVE'),
  ('zz-901', '2026-04-05 05:00:00+00', '00000000-0000-0000-0000-00000000f001', 'EXPIRED'),
  ('zz-903', '2026-04-06 05:00:00+00', '00000000-0000-0000-0000-00000000f003', 'ACTIVE');

create function pg_temp.act_as(p_id text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

-- Manager One
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1');
select is(
  (select jsonb_array_length(public.member_attendance('00000000-0000-0000-0000-00000000f001')->'days')), 2,
  'two attended days: same-day punches count once, denied punches do not count'
);
select is(
  (public.member_attendance('00000000-0000-0000-0000-00000000f001')->'days'->1->>'day'), '2026-04-02',
  'a punch just after midnight Karachi time belongs to the Karachi day'
);
select is(
  (public.member_attendance('00000000-0000-0000-0000-00000000f001')->'days'->0->>'punches')::int, 2, 'punches per day are counted'
);
select throws_ok(
  $$ select public.member_attendance('00000000-0000-0000-0000-00000000f003') $$, 'P0002', null,
  'a manager cannot read attendance of another manager''s member'
);
select is(
  (select jsonb_array_length(public.attendance_overview('Zz Attend')->'rows')), 2, 'overview lists only the manager''s own members'
);
select is(
  (select (r->>'days_attended')::int from jsonb_array_elements(public.attendance_overview('Zz Attend One')->'rows') r limit 1), 2,
  'overview shows the days attended'
);

-- activity feed
select is(
  (public.list_activity('DENIED', 'zz-901')->>'total')::int, 1, 'denied filter finds the expired punch'
);
select is(
  (public.list_activity(null, 'Zz Attend One')->'counts'->>'onboarded')::int, 1, 'registration shows as an onboarded event'
);

-- Trainer: no attendance or bridge status
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
select is((select count(*)::int from public.bridge_status), 0, 'trainers cannot read the bridge status');

-- Super admin sees every member and can read the bridge row
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select is(
  (select jsonb_array_length(public.attendance_overview('Zz Attend')->'rows')), 3, 'super admin sees all members'
);
reset role;
-- triggers off for this insert so the test can plant an old heartbeat
set local session_replication_role = replica;
insert into public.bridge_status (id, last_seen_at) values (1, now() - interval '5 minutes') on conflict (id) do update set last_seen_at = excluded.last_seen_at;
set local session_replication_role = origin;
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select is((public.bridge_overview()->>'online')::boolean, false, 'bridge is offline when it has not reported for 5 minutes');

-- the database stamps the heartbeat time itself
reset role;
update public.bridge_status set last_seen_at = now() - interval '1 day' where id = 1;
select ok((select last_seen_at > now() - interval '1 minute' from public.bridge_status where id = 1), 'a heartbeat write always stamps the database time');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select is((public.bridge_overview()->>'online')::boolean, true, 'bridge is online right after a heartbeat');

select * from finish();
rollback;
