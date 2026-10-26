# Gym Management System: Project Brief (paste this as the first prompt)

Read `AGENTS.md` first. It is the rulebook for code style, folder structure, TDD and security. This brief is the product spec. If anything here conflicts with `AGENTS.md`, stop and ask.

## 0. How to work

- Build in the phases in section 9, one phase at a time. At the end of each phase run `yarn test`, `yarn lint`, `yarn build` and report results in 3-4 lines.
- TDD always: failing test first, then code.
- Phase 0 is already done (Vite + React + TS, Tailwind, Router, TanStack Query, Zustand, Supabase client, Vitest, `RoleGuard`, route registry, `Role` enum).
- Ask before inventing business rules. Items marked **OPEN** in section 10 are undecided.
- Currency is PKR, integers only. Timezone is Asia/Karachi. UI language is English.
- Color theme is **yellow and black** (see Theme in `AGENTS.md`).

## 1. What we are building

An internal web app for one gym, used at reception and by the owner. It runs on a single reception laptop that stays logged in all day.
- Backend: Supabase (Postgres, Auth, Realtime, RLS).
- Frontend: React web app (this project). A public marketing site in Next.js comes later and is out of scope now.
- Attendance: ZKTeco K50 fingerprint device connected to the reception laptop by USB. A small bridge service reads punches and writes them to Supabase.

## 2. Roles

| Role | Can do |
|---|---|
| SUPER_ADMIN (owner) | Everything: members, managers, trainers, payments, expenses, revenue dashboard, commission, freeze/resume |
| MANAGER (staff) | Register members, take payments/renewals, freeze/resume. Sees only members they registered. Sees only their own stats. Cannot see other managers, expenses, or gym-wide revenue |
| TRAINER | Cannot register members. Sees own dashboard, own assigned members, activity table, own performance and commission |

A future member (USER) portal is planned, not built now. `members` is therefore its own table, not tied to `auth.users`.

Managers and trainers are created by SUPER_ADMIN. A manager cannot create trainers. SUPER_ADMIN can block a staff user (login stopped, data kept) or delete (soft delete: login revoked, history kept). Passwords are never shown again after creation: show once with a copy button, then only "Reset password".

## 3. Packages and billing rules (source of truth)

Packages (PKR): Monthly 2500 (1 month), 6-Month 12500 (6 months), 12-Month 22000 (12 months), Lifetime 60000.
Trainer packages are monthly only: 8000 and 12000. Each includes the 2500 gym fee, the rest is trainer commission. The commission amount is **not fixed**: the owner sets it per member at registration, and that amount accrues to the trainer every month.

Rules:
1. **Real calendar months.** Due date = `addMonths(anchorDate, monthsCovered)` using date-fns. Always compute from the cycle's anchor date, never from the previous due date, so there is no drift (31 Jan -> 28 Feb (29 in leap year) -> 31 Mar).
2. **Valid through 11:59 PM Asia/Karachi on the due date.** Grace period is 0. Example: subscribed 2 Jun, due 2 Jul, buzzer starts after 11:59 PM on 2 Jul.
3. **Credit model.** `total = credit + payment`, `periods = floor(total / planPrice)`, `credit = total - periods * planPrice`.
   - 5000 on Monthly = 2 months, credit 0, next due 2 months later.
   - 3000 on Monthly = 1 month, credit 500. Credit alone gives no access. A later payment of 2000 completes another month.
4. **Late payment.** Default is "continue cycle": the new period starts from the original due date, not the payment date. Member 2 Jun, due 2 Jul, pays 7 Jul -> next due 2 Aug. The buzzer rings from 3 Jul until payment. The payment form has an optional editable **start date** so staff can choose another start.
5. **Freeze.** Allowed for ACTIVE members only, by SUPER_ADMIN or MANAGER. No payment during a freeze. Fingerprint shows FROZEN. On resume a fresh cycle starts at the resume date. Example: paid 2 Jun, freezes 28 Jun for 20 days, resumes 18 Jul -> next due 18 Aug. The 4 unused days are forgiven.
6. **Plan change** only after the current plan has completed (expired). Then the new plan is a fresh start from the payment/start date. No mid-plan changes.
7. **Lifetime.** One payment of exactly 60000, no installments, never expires, never buzzes.
8. **Admission fee.** Default 1000, editable on registration (0 allowed, discounts allowed). It is stored in the same payment record as an `admission_fee` column (0 shows as 0). It is **not** charged again if the member returns within 6 months after their last membership expired, or if they have been continuous. It is charged again after more than 6 months away.
9. **Discount applies only to the admission fee**, never the plan price.
10. **Payments are immutable.** Wrong entry: void with a reason, then re-enter. No edit, no delete.
11. All of the above is authoritative in Postgres RPCs (atomic). A tested pure TypeScript mirror in `src/utils/billing/` powers previews in the UI.

## 4. Fingerprint and alerts

- Enrollment: enroll the member on the K50 first, then enter the device user ID as `fingerprint_id` in the app. They must match.
- The bridge service (Node or Python on the reception laptop) reads punches and inserts into `attendance_logs`. The browser never talks to the device.
- The React app subscribes to Supabase Realtime. On each punch the status is evaluated and shown as a card plus a new row at the top of the recent-activity table.
- Statuses: ACTIVE, EXPIRED/unpaid, FROZEN, BLOCKED/inactive, UNKNOWN fingerprint, and staff punches (managers/trainers also punch, with their own `fingerprint_id`).
- ACTIVE -> short beep, green card. Everything else -> buzzer plus spoken "Your fees is not paid" (FROZEN and UNKNOWN get their own wording). There is no separate "expiring soon" warning.
- Only the reception laptop plays sound. Show an "Enable sound" button once per page load because browsers block autoplay audio.
- No door lock integration for now. Alert only.

## 5. Super admin pages

1. **Dashboard:** gym-wide revenue (daily, monthly, total), expenses, net, active/expired member counts, plus the recent-activity table. Visible to SUPER_ADMIN only.
2. **All Members:** server-side paginated table (10 rows), debounced search (name, phone, fingerprint id), filters (active/inactive, plan, registration date range), KPI cards that follow the filters. Columns: name, father name, phone, emergency contact, fingerprint id, status, plan, registration date, last payment date, next payment (due) date, email, trainer (or `---`), registered by (which manager or super admin).
3. **Member detail:** profile, payment history, attendance, freeze history, trainer history. Actions: renew/pay, freeze/resume, void payment, change trainer.
4. **Managers:** table plus add/block/soft-delete. Columns: name, father name, CNIC, role, email, phone, address, members registered this month and total, revenue by their registrations (daily, monthly, total). Password is shown once on create/reset, never in the table. Each manager also has a **detail page** with stats, registered members and revenue.
5. **Trainers:** separate page from managers (different columns). Shows each trainer, number of members trained, commission earned per member and in total, trainer type (Gym or Martial Arts), payouts.
6. **Expenses (SUPER_ADMIN only):** record, categorize and report spending (rent, electricity, salaries, equipment, maintenance, other). Daily/monthly/yearly views, net profit = revenue minus expenses, category breakdown, with plain-language labels.
7. **Recent activity** table everywhere it appears: realtime, paginated, newest first.

## 6. Manager portal

Dashboard with recent activity, own stats page (registrations and revenue progress), list of members they registered, registration form, payment/renewal and freeze/resume for those members. A manager can never open another manager's data (UI guard and RLS).

## 7. Trainer portal

Dashboard with activity table, own assigned members, performance and commission. No registration.

## 8. Tables and forms (production grade)

- Every table: server-side pagination at 10 rows, 400 ms debounced search and filters, state in URL query params, `keepPreviousData`, loading/empty/error states.
- Forms: React Hook Form + Zod with the reusable `components/form/` fields. Registration form fields: personal info, plan, trainer (optional), amount paid, admission fee (editable), start date (default today), commission (when a trainer package is chosen).
- Confirm dialog (Cancel / Confirm) on every destructive action.

## 9. Phases (each ends with tests, lint, build green)

0. Setup (done).
1. Supabase schema, RLS and pgTAP tests: profiles/roles, members, plans, payments, memberships, freezes, attendance_logs, trainer_assignments, expenses.
2. **Billing engine** in `src/utils/billing/` (pure functions, tests first) and the matching Postgres RPCs.
3. Auth, login, role layouts, guards.
4. Super admin: All Members, registration, payment/renewal, freeze/resume.
5. Super admin: Managers and manager portal.
6. Fingerprint bridge, Realtime alerts, recent-activity table.
7. Dashboards and stats (super admin, manager).
8. Trainers page, assignments, commission and payouts.
9. Expense tracking.
10. Polish, performance, E2E.

## 10. OPEN items (ask me before building these)

- **Resume after freeze on multi-month plans:** assumed one period of the member's current plan from the resume date. Confirm.
- **Freeze on Lifetime:** assumed not allowed. Confirm.
- **Commission:** exact accrual rules (does it start at registration or first payment, what if a member is frozen, payout tracking) to be confirmed in Phase 8.
- **Expenses:** fixed vs custom categories, recurring entries, receipt attachments.
- **K50 connection:** confirm how the K50 reaches the laptop over USB (ZKTeco software, USB, or network) before Phase 6. The bridge design depends on it.
- **Multiple trainers per member** and more trainer types than Gym and Martial Arts.
- **Export** (CSV/Excel) of member and payment tables.

Start with Phase 1 unless I say otherwise.
