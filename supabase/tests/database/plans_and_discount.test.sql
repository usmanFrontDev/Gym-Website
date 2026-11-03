begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, instance_id, aud, role, email) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@t.test'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm1@t.test'),
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 't1@t.test');
insert into public.profiles (id, role, full_name, email, trainer_type) values
  ('00000000-0000-0000-0000-0000000000a1', 'SUPER_ADMIN', 'Admin', 'admin@t.test', null),
  ('00000000-0000-0000-0000-0000000000b1', 'MANAGER', 'Manager One', 'm1@t.test', null),
  ('00000000-0000-0000-0000-0000000000c1', 'TRAINER', 'Trainer One', 't1@t.test', 'GYM');

create function pg_temp.act_as(p_id text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

-- Manager: registers a member, cannot manage plans or discounts
select pg_temp.act_as('00000000-0000-0000-0000-0000000000b1');
select lives_ok($$ select public.register_member('Disc One','X','0300',null,null,null,null,'dsc-1','MONTHLY',2500,0,0,'2026-03-10',null,null) $$, 'manager registers a member');
select throws_ok($$ select public.create_plan('Quarterly', 7000, 3, false) $$, 'Only the owner can add plans', 'manager cannot add plans');
select throws_ok(
  $$ select public.set_member_discount((select id from public.members where fingerprint_id = 'dsc-1'), 500) $$,
  'Only the owner can change discounts', 'manager cannot give a discount'
);
select throws_ok(
  $$ select public.register_member('Disc Two','X','0301',null,null,null,null,'dsc-2','MONTHLY',2500,0,0,'2026-03-10',null,null,500) $$,
  'Only the owner can give a monthly discount', 'manager cannot register with a discount'
);

-- Admin: adds a plan, gives a discount
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
select is(public.create_plan('Quarterly Special', 7000, 3, false), 'QUARTERLY_SPECIAL', 'owner adds a plan, code comes from the name');
select is(public.create_plan('Quarterly Special', 7500, 3, false), 'QUARTERLY_SPECIAL_2', 'a duplicate name gets a unique code');
select throws_ok($$ select public.create_plan('Free', 0, 1, false) $$, 'Price must be above zero', 'a plan needs a price');

select lives_ok($$ select public.set_member_discount((select id from public.members where fingerprint_id = 'dsc-1'), 500) $$, 'owner gives 500 off per month');
select throws_ok(
  $$ select public.set_member_discount((select id from public.members where fingerprint_id = 'dsc-1'), 2500) $$,
  'Discount is too high: it would make an active plan free', 'a discount cannot make a plan free'
);

-- The discounted member pays 2000 for a month, and 5000 for 2 months + credit 1000
select lives_ok($$ select public.record_payment((select id from public.members where fingerprint_id = 'dsc-1'), 2000, 'MONTHLY') $$, 'pays the discounted price');
select is((select months_covered from public.memberships order by created_at desc limit 1), 2, '2000 at 2000/month adds a month on top of the first');
select is(
  public.effective_price(12500, 6, 500), 9500, 'a 6-month plan gets the discount for each of its months'
);
select is(public.effective_price(60000, null, 500), 60000, 'lifetime is never discounted');

-- Inactive plans cannot start new memberships
select lives_ok($$ select public.update_plan('QUARTERLY_SPECIAL', 'Quarterly Special', 7000, false) $$, 'owner switches a plan off');
select throws_ok(
  $$ select public.register_member('Disc Three','X','0302',null,null,null,null,'dsc-3','QUARTERLY_SPECIAL',7000,0,0,'2026-03-10',null,null) $$,
  'This plan is not available any more', 'an inactive plan cannot be sold'
);

select * from finish();
rollback;
