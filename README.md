# Gym Management

React + Vite + TypeScript frontend, Supabase backend. Rules: see `AGENTS.md`. Spec: `PROJECT_BRIEF.md`. Theme: yellow + black.

## Run locally
```
yarn install
supabase start                      # needs Docker
supabase functions serve --no-verify-jwt   # staff management function
cp .env.example .env                # fill VITE_SUPABASE_ANON_KEY from `supabase status`
yarn dev
```
Dev login (seed only): `admin@gym.test` / `Admin@12345`.

## Checks
```
yarn test && yarn lint && yarn build
supabase db reset && supabase test db   # pgTAP: RLS + RPCs
```

## Deploy notes
- Deploy `supabase/functions/manage-staff` and set it to verify JWT in production.
- Remove `supabase/seed.sql` data from production; create the owner profile manually.
- Fingerprint bridge: `bridge/` runs on the reception laptop with the service-role key.
