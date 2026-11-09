-- The owner can correct a member's personal details. Plan, payments, fingerprint and registration data are not touched here.
create function public.update_member(
  p_member_id uuid, p_full_name text, p_father_name text, p_phone text,
  p_emergency_contact text, p_email text, p_cnic text, p_address text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'Only the owner can edit member details' using errcode = '42501'; end if;
  if length(trim(coalesce(p_full_name, ''))) = 0 then raise exception 'Name is required'; end if;
  if length(trim(coalesce(p_phone, ''))) = 0 then raise exception 'Phone is required'; end if;

  update public.members
     set full_name = trim(p_full_name),
         father_name = nullif(trim(p_father_name), ''),
         phone = trim(p_phone),
         emergency_contact = nullif(trim(p_emergency_contact), ''),
         email = nullif(trim(p_email), ''),
         cnic = nullif(trim(p_cnic), ''),
         address = nullif(trim(p_address), '')
   where id = p_member_id and deleted_at is null;
  if not found then raise exception 'Member not found'; end if;
end $$;

revoke all on function public.update_member(uuid, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.update_member(uuid, text, text, text, text, text, text, text) to authenticated;
