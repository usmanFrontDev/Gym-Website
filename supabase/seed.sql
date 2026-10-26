-- Local development seed ONLY. Never run against production.
-- Super admin login: admin@gym.test / Admin@12345
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'admin@gym.test', crypt('Admin@12345', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
);
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"admin@gym.test"}', 'email', now(), now(), now()
);
insert into public.profiles (id, role, full_name, email, phone)
values ('11111111-1111-1111-1111-111111111111', 'SUPER_ADMIN', 'Gym Owner', 'admin@gym.test', '0300-0000000');
