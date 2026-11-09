begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lg-admin@t.test'),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lg-mgr@t.test');
insert into public.profiles (id, role, full_name, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'SUPER_ADMIN', 'Lg Admin', 'lg-admin@t.test'),
  ('00000000-0000-0000-0000-0000000000a2', 'MANAGER', 'Lg Manager', 'lg-mgr@t.test');

create function pg_temp.act_as(p_id text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  set local role authenticated;
end $$;

-- a manager registers two members (cash and online) on 2025-06-02
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
select public.register_member('Lg Cash','X','0300',null,null,null,null,'lg-1','MONTHLY',2500,1000,0,'2025-06-02',null,null);
select public.register_member('Lg Online','X','0301',null,null,null,null,'lg-2','MONTHLY',2500,0,0,'2025-06-02',null,null,0,'ONLINE');
select throws_ok($$ select public.ledger(null, null) $$, '42501', 'Not allowed', 'a manager cannot open the ledger');

-- the owner adds an expense and reads the ledger
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
insert into public.expenses (category, amount, spent_on, note, created_by)
  values ('RENT', 1000, public.karachi_today(), 'Lg rent', '00000000-0000-0000-0000-0000000000a1');

select is((public.ledger(public.karachi_today(), public.karachi_today())->>'expense')::int, 1000, 'expense total for today');
select is((public.ledger(null, null)->>'income')::int, 6000, 'income counts payments plus admission fee');
select is((public.ledger(null, null)->>'cash')::int, 3500, 'cash split');
select is((public.ledger(null, null)->>'online')::int, 2500, 'online split');
select is(jsonb_array_length(public.ledger(null, null)->'rows'), 3, 'income and expense rows are listed together');

select * from finish();
rollback;
