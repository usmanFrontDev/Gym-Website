-- The gym is called Try Workout Gym. A name the owner already changed in Settings is left alone.
alter table public.gym_settings alter column gym_name set default 'Try Workout Gym';
update public.gym_settings set gym_name = 'Try Workout Gym' where gym_name = 'Iron Gym';
