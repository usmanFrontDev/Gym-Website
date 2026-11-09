begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000f1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dp-admin@t.test'),
  ('00000000-0000-0000-0000-0000000000f2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dp-mgr@t.test');
insert into public.profiles (id, role, full_name, email) values
  ('00000000-0000-0000-0000-0000000000f1', 'SUPER_ADMIN', 'Dp Admin', 'dp-admin@t.test'),
  ('00000000-0000-0000-0000-0000000000f2', 'MANAGER', 'Dp Manager', 'dp-mgr@t.test');
insert into public.plans (code, name, price, months) values ('DP_FREE', 'Dp Free', 1000, 1), ('DP_USED', 'Dp Used', 1000, 1);

create function pg_temp.act_as(p_id text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

-- a manager registers a member on DP_USED
select pg_temp.act_as('00000000-0000-0000-0000-0000000000f2');
select public.register_member('Dp Member','X','0300',null,null,null,null,'dp-1','DP_USED',1000,0,0,'2025-06-02',null,null);
select throws_ok($$ select public.delete_plan('DP_FREE') $$, '42501', 'Only the owner can delete plans', 'a manager cannot delete a plan');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000f1');
select lives_ok($$ select public.delete_plan('DP_FREE') $$, 'the owner deletes an unused plan');
select is((select count(*)::int from public.plans where code = 'DP_FREE'), 0, 'the plan is gone');
select throws_ok($$ select public.delete_plan('DP_USED') $$, null, 'a plan with members cannot be deleted');
select throws_ok($$ select public.delete_plan('NOPE') $$, null, 'Unknown plan', 'an unknown plan is rejected');

select * from finish();
rollback;
