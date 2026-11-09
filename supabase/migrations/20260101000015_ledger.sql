-- Owner-only financial ledger: money in (membership payments) and money out (expenses) for any date range.
-- p_from / p_to may be null for "all time". Totals cover the whole range; the row list is capped to the newest 1000.
create function public.ledger(p_from date default null, p_to date default null) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_income bigint;
  v_cash bigint;
  v_online bigint;
  v_expense bigint;
  v_count integer;
  v_rows jsonb;
begin
  if not public.is_super_admin() then raise exception 'Not allowed' using errcode = '42501'; end if;

  select coalesce(sum(amount + admission_fee), 0),
         coalesce(sum(amount + admission_fee) filter (where payment_method = 'CASH'), 0),
         coalesce(sum(amount + admission_fee) filter (where payment_method = 'ONLINE'), 0)
    into v_income, v_cash, v_online
    from payments
   where voided_at is null and (p_from is null or paid_on >= p_from) and (p_to is null or paid_on <= p_to);

  select coalesce(sum(amount), 0) into v_expense from expenses
   where (p_from is null or spent_on >= p_from) and (p_to is null or spent_on <= p_to);

  with entries as (
    select p.id, 'INCOME'::text as kind, p.paid_on as day, (p.amount + p.admission_fee) as amount,
           m.full_name as label, p.payment_method::text as method, null::text as note, p.created_at
      from payments p join members m on m.id = p.member_id
     where p.voided_at is null and (p_from is null or p.paid_on >= p_from) and (p_to is null or p.paid_on <= p_to)
    union all
    select e.id, 'EXPENSE', e.spent_on, e.amount, e.category::text, null, e.note, e.created_at
      from expenses e
     where (p_from is null or e.spent_on >= p_from) and (p_to is null or e.spent_on <= p_to)
  ), newest as (
    select * from entries order by day desc, created_at desc limit 1000
  )
  select (select count(*) from entries)::integer,
         coalesce(jsonb_agg(jsonb_build_object(
           'id', id, 'kind', kind, 'day', day, 'amount', amount, 'label', label, 'method', method, 'note', note
         ) order by day desc, created_at desc), '[]'::jsonb)
    into v_count, v_rows
    from newest;

  return jsonb_build_object(
    'income', v_income, 'cash', v_cash, 'online', v_online, 'expense', v_expense, 'net', v_income - v_expense,
    'row_count', v_count, 'rows', v_rows
  );
end $$;

revoke all on function public.ledger(date, date) from public, anon;
grant execute on function public.ledger(date, date) to authenticated;
