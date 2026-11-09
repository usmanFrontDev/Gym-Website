-- The owner can delete a plan nobody has ever been on. A plan that members are (or were) on stays,
-- because their membership history points at it; the owner turns such a plan off instead.
create function public.delete_plan(p_code text) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_used integer;
begin
  if not public.is_super_admin() then raise exception 'Only the owner can delete plans' using errcode = '42501'; end if;
  if not exists (select 1 from public.plans where code = p_code) then raise exception 'Unknown plan'; end if;

  select count(distinct member_id) into v_used from public.memberships where plan_code = p_code;
  if v_used > 0 then
    raise exception 'This plan cannot be deleted because % member(s) are or were on it. Turn it off instead.', v_used;
  end if;

  delete from public.plans where code = p_code;
end $$;

revoke all on function public.delete_plan(text) from public, anon;
grant execute on function public.delete_plan(text) to authenticated;
