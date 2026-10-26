# AGENTS.md — Gym Management Frontend (Lite)

Single rulebook for this project. No skills, no CI gates, no custom check scripts. Follow these
rules while writing code. If a rule blocks a real requirement, say so and ask instead of working around it.

## Stack

- React + Vite + TypeScript
- Package manager: **yarn only** (`yarn add`, `yarn dev`, `yarn build`). Do not use npm or pnpm. `yarn.lock` is canonical.
- Tailwind CSS
- React Router (data router)
- TanStack Query (server state), Zustand (client/UI state)
- Supabase (`@supabase/supabase-js`, one shared client) for auth, database, realtime
- date-fns (all calendar/date math, Asia/Karachi)
- Vitest + React Testing Library (TDD: write the test first)
- React Hook Form + Zod (forms, always with reusable field components, see Forms)
- react-hot-toast (notifications)
- MSW for mock API data in dev

Do not swap a stack choice without flagging it first.

## Theme (Yellow and Black)

- The whole app uses a **yellow + black** theme. Black / near-black surfaces, yellow as the primary accent (buttons, active nav, highlights, focus rings).
- Define the palette once as theme tokens in the Tailwind config (e.g. `primary` yellow, `surface` / `background` black shades, `foreground` white/light gray, plus semantic `success` / `danger` for status). Components use tokens only, never raw hex or random arbitrary values.
- Text on yellow is black; text on black is white or light gray. Keep contrast at least 4.5:1 (see Accessibility).
- Focus rings must be clearly visible against both black and yellow.
- Status colors (active green card, expired/blocked red card) are semantic tokens and may sit alongside the yellow/black theme.

## Business Rules (source of truth for the billing engine)

- Billing uses **real calendar months** via date-fns `addMonths`, always computed from the cycle's
  **anchor date** (not from the previous due date) so month-end does not drift (31 Jan -> 28/29 Feb -> 31 Mar).
- Member is valid through 11:59 PM Asia/Karachi on the due date. Grace period is 0. After that: buzzer.
- Packages: 1 month 2500, 6 months 12500, 12 months 22000, lifetime 60000 (one full payment, never expires).
- Credit model: `total = credit + payment`; `periods = floor(total / price)`; `credit = total - periods * price`.
- Admission fee: editable per registration (0 allowed), recorded in the same payment row. Not charged again
  if the member returns within 6 months of their last membership expiry.
- Discount applies to the admission fee only.
- Plan change is allowed only after the current plan completes.
- Freeze: active members only, by SUPER_ADMIN or MANAGER. On resume a fresh cycle starts from the resume date.
- Payments are never edited or deleted, only voided with a reason.
- Delete of a staff user is a soft delete (login revoked, history kept).
- Billing is authoritative in Postgres RPC; the pure TS module in `src/utils/billing/` mirrors it for preview and is tested first.

## Permissions (who can do what)

- `SUPER_ADMIN`: everything, including expenses, revenue dashboard, manager and trainer management.
- `MANAGER`: register members, take payments, freeze/resume members. Sees only the members they registered.
  Sees only their own stats. Cannot see other managers' data, expenses, or gym-wide revenue.
- `TRAINER`: cannot register members. Sees own dashboard, own assigned members, own activity and performance.
- Every rule above must be enforced twice: in the route registry (UI) and in Supabase RLS (data). UI hiding alone is not security.

## TDD (mandatory)

- Write the failing test first, see it fail, then write the minimum code to pass, then refactor.
- Business logic (billing, status, commission, admission fee) is pure TypeScript in `src/utils/billing/` with no React, no Supabase, no `Date.now()` inside. Pass `today` / `now` in as arguments.
- Dates are `'YYYY-MM-DD'` strings. "Today" is computed once in Asia/Karachi (UTC+5, no DST) and passed down.
- Tests sit next to the file: `foo.ts` -> `foo.test.ts`. Run with `yarn test`. A task is not done until `yarn build`, `yarn lint` and `yarn test` all pass.
- Every example in the Business Rules section must exist as a named test (5000 = 2 months, 3000 = 1 month + 500 credit, 7 Jul late payment, freeze/resume, 31 Jan month-end, leap year, 6-month admission fee rule, lifetime).
- Components: test behaviour with React Testing Library (roles/labels, not class names). Server calls are mocked with MSW.
- Database: RLS policies and RPCs get pgTAP (or Supabase test) coverage before the UI uses them.

## Supabase and Database

- Migrations live in `supabase/migrations/`, one per change, never edited after merge.
- All tables have RLS on. No table is readable or writable without a policy.
- Money is stored as integer PKR (no floats). Dates as `date`, timestamps as `timestamptz`.
- Payment, renewal, freeze and resume run in Postgres RPCs (atomic). The client never computes the final state, it only previews.
- `members` is separate from `auth.users` (future member portal links to it later). Staff (manager/trainer) are `profiles` linked to `auth.users`.
- Passwords are never stored or shown after creation. Show a generated/entered password once in a copy dialog, then only offer "Reset password".
- Staff delete = soft delete (`deleted_at`) plus auth access revoked. Block = login disabled, data kept.
- Never put the Supabase service-role key in the frontend.

## Fingerprint and Alerts

- ZKTeco K50 punches are written to `attendance_logs` by a small bridge service on the reception laptop (not by the browser).
- Member `fingerprint_id` must equal the user ID enrolled on the device.
- The React app listens with Supabase Realtime and shows a punch card plus recent-activity row.
- Expired, unpaid, frozen, blocked or unknown fingerprint = buzzer + spoken "Your fees is not paid" (frozen/unknown get their own message text). There is no separate warning state.
- Sound plays only on the reception laptop session (one "Enable sound" click after the page loads, browsers require it).

## Roles

Current roles: `SUPER_ADMIN`, `MANAGER`, `TRAINER`.

- `TRAINER` can have sub-types (gym trainer, martial arts trainer, ...). Model this as a
  `trainerType` field on the user, not as separate roles.
- A `USER` (member) portal is planned for the future. It is NOT built now, but the structure must
  let it be added without refactoring: adding it means adding a role to the enum, a pages folder,
  hooks/services/types folders, and route entries.

Roles live in one enum in `src/constants/roles.ts`:

```ts
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  MANAGER = 'MANAGER',
  TRAINER = 'TRAINER',
  // USER = 'USER',  // future member portal
}
```

## Folder Structure

```
src/
  components/
    common/          All reusable components (Button, Modal, ConfirmDialog, DataTable, Badge, Pagination ...)
    ui/              App-shell UI (Header, Sidebar, Footer, PageContainer, Breadcrumbs ...)
    form/            Reusable react-hook-form field components (see Forms)
    <role>/          Components only used by one role's pages (admin-style names: superAdmin/, manager/, trainer/)
  pages/
    common/          Pages shared by all roles (Login, Profile, NotFound, Forbidden ...)
    superAdmin/      Pages for SUPER_ADMIN
    manager/         Pages for MANAGER
    trainer/         Pages for TRAINER
  hooks/
    common/          Generic hooks and hooks used by several roles
    superAdmin/      Role-specific data hooks
    manager/
    trainer/
  services/
    supabase-client.ts   The shared Supabase client
    common/
    superAdmin/
    manager/
    trainer/
  schemas/           Zod schemas, same role folders: common/, superAdmin/, manager/, trainer/
  types/             Shared TypeScript types, same role folders: common/, superAdmin/, manager/, trainer/
  constants/         roles.ts, route enums, queryKeys.ts, env.ts
  routes/            Router setup, role guards, route registry
  stores/            Zustand stores
  mocks/             MSW handlers and fixtures
  utils/             Pure helper functions
```

Rules:
- **Organise by role, not by feature.** Do not create a folder per feature (no `hooks/members/`).
  Put it in the role folder that uses it, or in `common/` if more than one role uses it.
- Same role-folder names across `components`, `pages`, `hooks`, `services`, `schemas`, `types`.
- **Imports are unrestricted.** Any folder may import from any other folder, including across
  roles. There are no lint rules or boundaries enforcing this. Use judgment: if a trainer
  component is needed by a manager page, move it to `components/common/`.
- If a piece is used in 2+ roles, it belongs in `common/`. If it is used by one role, keep it in that role's folder.

## Before Creating Any Component (duplicate check)

1. Look in `components/common/`, `components/ui/`, `components/form/`, and the relevant role folder(s).
   Also check other role folders for something similar.
2. If something similar exists, extend it (new variant, size, or prop). Do not create a parallel copy.
3. If the same shape appears 2+ times (even on one page), make it a reusable component in `common/`.
4. If it is genuinely new and used by one role only, create it in that role's folder.

Example: a circular icon-only button is a `Button` variant, not a new `IconButton` component.

## Types

- Define types properly in `src/types/<role-or-common>/` as separate files named by domain
  (`member.types.ts`, `session.types.ts`, `trainer.types.ts`).
- Types derived from a Zod schema use `z.infer` and stay next to the schema. Do not duplicate them by hand.
- Shared API shapes (`ApiResponse<T>`, `Paginated<T>`, `User`) go in `types/common/`.
- No `any`. Use `unknown` and narrow if you truly do not know the shape.

## API Flow (always this chain)

```
supabase client  ->  service  ->  hook (TanStack Query)  ->  page/component
```

1. `services/supabase-client.ts`: one Supabase client. URL and anon key from env (`constants/env.ts`). Errors are normalized into one `AppError` shape. No other Supabase/fetch/axios instances.
2. `services/<role>/<name>Service.ts`: a plain object of async functions, one per operation (table query, RPC call, realtime subscription). Returns typed data.
3. `hooks/<role>/useXxx.ts`: wraps a service in `useQuery` / `useMutation`. Owns query keys, cache invalidation and the success/error toast. Hooks never call the Supabase client directly.
4. Components and pages call hooks only. Never fetch in `useEffect`.

Also:
- Table names and RPC names go in enums in `constants/` (e.g. `Table`, `Rpc`). No string literals in services.
- Query keys go in one `QueryKey` enum in `constants/queryKeys.ts`.
- Every variable used inside `queryFn` must also be in `queryKey`.
- Use `placeholderData: keepPreviousData` for paginated or filtered lists.
- Mock data lives in `src/mocks` as MSW handlers (Supabase REST/RPC URLs). No fake data inline in components.

## Event Handlers (UI -> handler -> hook)

- A button's `onClick` calls a named handler (`handle<Action>`), which calls the hook's `.mutate()`.
- Destructive actions (delete, deactivate) open a confirm dialog first. The dialog has exactly two
  buttons: Cancel and Confirm. The dialog's confirm calls the action handler.
- Split into two handlers: a trigger handler (`handleDeleteClick`, only opens the dialog) and an
  action handler (`handleConfirmDelete`, only runs the mutation).
- Trivial one-liners (`onClick={() => setOpen(false)}`) may stay inline.
- Hook `onSuccess`: toast + cache invalidation. Call-site `mutate(values, { onSuccess })`:
  navigation, form reset, closing the dialog. Never hardcode navigation inside a hook, so the
  hook stays reusable by every role.

## Forms (React Hook Form + Zod + Controller)

- Every form uses React Hook Form with `zodResolver` and a Zod schema from `src/schemas/`.
- Build **reusable, RHF-aware field components** in `components/form/`, for example:
  `FormInput`, `FormTextarea`, `FormSelect`, `FormCheckbox`, `FormRadioGroup`, `FormDatePicker`,
  `FormPasswordInput`, `FormPhoneInput`, `FormField` (label + error wrapper).
- Each field component takes `control` and `name` (and `label`, `placeholder`, etc.) and uses
  RHF's `Controller` / `useController` internally. Pages never wire `register` or `Controller`
  manually for standard fields. They just render `<FormInput control={control} name="email" label="Email" />`.
- Field components show the label, the input, and the error message (linked with `aria-describedby`, `role="alert"`).
- Shared Zod primitives (email, phone, password, required string) live in `schemas/common/` and are reused.
- Create / update / filter schemas are derived from one base with `.extend()`, `.pick()`, `.omit()`, `.partial()`. Do not re-declare fields.
- Use Zod v4 top-level formats (`z.email()`, `z.url()`) not the deprecated `z.string().email()`.
- Form types come from `z.infer<typeof schema>`.

## Routing and Role Access

- All routes are declared in a registry in `src/routes/` where each entry has: `path`, `element`
  (lazy-loaded page), `roles` (array of `Role`, or `'all'`), and an optional `nav` entry for the sidebar.
- The router is generated from that registry. Adding a page = adding a registry entry plus the page file.
- A `RoleGuard` wraps every protected route. Not signed in -> redirect to login. Wrong role -> Forbidden page.
- The sidebar reads the same registry and shows only entries allowed for the signed-in role.
- `/` redirects to the signed-in role's home page.
- Role layouts: each role can have its own layout/sidebar config, chosen from the registry by role.
- Adding the future USER portal must only need: a `Role.USER` value, `pages/user/`, matching
  hooks/services/schemas/types folders, and registry entries. No router or guard rewrite.

## Components

- Function components with hooks. Typed `interface` props. One named export per file.
- PascalCase for component files, `useXxx.ts` for hooks, camelCase for utils and services.
- Use Tailwind with theme tokens (colors, spacing, radius defined in the Tailwind config). Avoid random arbitrary values.
- No inline `style={{}}` for normal styling.
- Use variant/size props (for example with `cva`) instead of copy-pasting similar components.
- Buttons always have an explicit `type`. Images always have `alt`.
- Barrel `index.ts` files are not needed for components.

## State

- Server data: TanStack Query only. UI/client state: Zustand or `useState`.
- Filters, search text, page number and tabs go in URL query params so refresh keeps the view.
- Auth state (token, user, role) lives in one Zustand store.

## Accessibility (basics, required)

- Every input has a label. Errors are announced (`role="alert"`) and linked with `aria-describedby`.
- Use real `<button>` and `<a>` elements. Anything clickable must work with the keyboard.
- Headings are in order (`h1 -> h2 -> h3`). Focus is always visible. Text contrast at least 4.5:1.
- Modals trap focus and close with Escape (use Radix Dialog or equivalent).

## User-Facing Text

- Keep UI strings in one central place (a constants file or i18n JSON). Do not scatter hardcoded text across JSX.

## Code Hygiene

- No `any`, no `@ts-ignore`, no `console.log` left in committed code.
- Keep changes small and in scope. Mention unrelated problems instead of silently fixing them.
- Read a file before editing it.
- Do not commit or push unless explicitly asked.

## Commits

`<type>(<scope>): <subject>`. Types: `feat fix refactor style chore docs test`.
