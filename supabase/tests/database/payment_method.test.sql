begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pm1@t.test');
insert into public.profiles (id, role, full_name, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'MANAGER', 'Method Manager', 'pm1@t.test');

create function pg_temp.act_as(p_id text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');

-- registration without a method keeps working and counts as cash
select lives_ok($$ select public.register_member('Pm Cash','X','0300',null,null,null,null,'pm-1','MONTHLY',2500,0,0,'2025-06-02',null,null) $$, 'register without a method');
select is((select payment_method::text from public.payments p join public.members m on m.id = p.member_id where m.fingerprint_id = 'pm-1'), 'CASH', 'defaults to cash');

-- registration with an online payment
select lives_ok($$ select public.register_member('Pm Online','X','0301',null,null,null,null,'pm-2','MONTHLY',2500,0,0,'2025-06-02',null,null,0,'ONLINE') $$, 'register with online');
select is((select payment_method::text from public.payments p join public.members m on m.id = p.member_id where m.fingerprint_id = 'pm-2'), 'ONLINE', 'registration stores online');

-- renewal and collect fees both record the chosen method
select lives_ok($$ select public.record_payment((select id from public.members where fingerprint_id = 'pm-1'), 2500, null, null, 0, 'ONLINE') $$, 'renewal with online');
select lives_ok($$ select public.collect_fee((select id from public.members where fingerprint_id = 'pm-2'), 2500, 'ONLINE') $$, 'collect fees with online');
select is(
  (select count(*)::int from public.payments p join public.members m on m.id = p.member_id where m.fingerprint_id in ('pm-1', 'pm-2') and p.payment_method = 'ONLINE'),
  3, 'three online payments recorded');

-- the method cannot be edited afterwards
select throws_ok($$ update public.payments set payment_method = 'CASH' where payment_method = 'ONLINE' $$, null, 'a recorded payment method cannot be changed');

select * from finish();
rollback;
