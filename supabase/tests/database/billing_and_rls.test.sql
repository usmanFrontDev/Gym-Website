begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

-- fixtures: one admin, two managers, one trainer
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

-- Manager One registers a member: 5000 on Monthly = 2 months, credit 0
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1');
select lives_ok($$ select public.register_member('Ali','Khan','0300','0311',null,null,null,'101','MONTHLY',5000,1000,0,'2025-06-02',null,null) $$, 'manager registers member');
select is((select due_date from public.memberships limit 1), '2025-08-02'::date, '5000 on Monthly = 2 months from anchor');
select is((select admission_fee from public.payments limit 1), 1000, 'admission fee stored in payment row');

-- 3000 on Monthly = 1 month + 500 credit
select lives_ok($$ select public.register_member('Sara','Khan','0301',null,null,null,null,'102','MONTHLY',3000,0,0,'2025-06-02',null,null) $$, 'registers with admission 0');
select is((select credit from public.memberships m join public.members x on x.id = m.member_id where x.fingerprint_id = '102'), 500, '3000 = 1 month + 500 credit');
select is((select admission_fee from public.payments p join public.members x on x.id = p.member_id where x.fingerprint_id = '102'), 0, 'admission fee 0 allowed');

-- late payment continues the cycle from the original anchor
select lives_ok($$ select public.record_payment((select id from public.members where fingerprint_id = '101'), 2500) $$, 'renewal works');
select is((select due_date from public.memberships m join public.members x on x.id = m.member_id where x.fingerprint_id = '101'), '2025-09-02'::date, 'renewal continues cycle (no drift)');

-- lifetime needs exactly 60000
select throws_ok($$ select public.register_member('Bad','X','0302',null,null,null,null,'103','LIFETIME',30000,0,0,null,null,null) $$, 'Lifetime requires exactly 60000', 'lifetime rejects partial payment');
select lives_ok($$ select public.register_member('Life','X','0303',null,null,null,null,'104','LIFETIME',60000,0,0,null,null,null) $$, 'lifetime ok');
select is(public.member_status((select id from public.members where fingerprint_id = '104')), 'ACTIVE'::public.attendance_status, 'lifetime never expires');

-- freeze: lifetime rejected
select throws_ok($$ select public.freeze_member((select id from public.members where fingerprint_id = '104')) $$, 'Lifetime members cannot be frozen', 'lifetime freeze rejected');

-- plan change only after completion (member 101 expired in 2025, so allowed)
select lives_ok($$ select public.record_payment((select id from public.members where fingerprint_id = '101'), 12500, 'SIX_MONTH') $$, 'plan change after expiry works');

-- payments are immutable even for privileged roles (trigger); RLS has no write policy for staff
reset role;
select throws_ok($$ update public.payments set amount = 1 $$, null, 'payments cannot be edited');
select throws_ok($$ delete from public.payments $$, null, 'payments cannot be deleted');

-- void needs a reason and works on latest payment
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1');
select throws_ok($$ select public.void_payment((select id from public.payments order by created_at desc limit 1), ' ') $$, 'A reason is required', 'void needs reason');
select lives_ok($$ select public.void_payment((select p.id from public.payments p join public.members x on x.id = p.member_id where x.fingerprint_id = '101' order by p.created_at desc limit 1), 'wrong entry') $$, 'void latest payment');

-- RLS: manager two sees nothing of manager one
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b2');
select is((select count(*)::int from public.members), 0, 'other manager sees no members');
select is((select count(*)::int from public.payments), 0, 'other manager sees no payments');
select is((select count(*)::int from public.expenses), 0, 'manager cannot read expenses');

-- trainer cannot see payments
select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
select is((select count(*)::int from public.payments), 0, 'trainer cannot see payments');

-- super admin sees all
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select ok((select count(*)::int from public.members) >= 3, 'super admin sees all members');

select * from finish();
rollback;
