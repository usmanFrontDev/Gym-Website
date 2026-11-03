# Scope and Feature Candidates

Status: DRAFT for owner review. Section 3 (requested changes) is **Built** (needs migrations 06 and 07 on the hosted database). Section 4 features are not built until chosen.
Source: our own app (`PROJECT_BRIEF.md`) plus a read-only review of the reference app "Workout"
(sidebar pages and what each shows). The reference UI is **not** being copied. We keep our yellow and
black theme and only borrow ideas for features. No data in the reference app was changed.

## 1. What the reference app has (observed)

| Reference page | What it does |
|---|---|
| Dashboard | Bridge online/offline badge, scan card, recent entry logs (granted/denied), system health, access analytics chart, member segmentation (active payer / non-paying / left) |
| Notifications | Total collection due, one card per member with an expired cycle: amount due, days lapsed, phone, last paid date, "Go to Ledger". Popup "Access Denied" on a blocked scan |
| Admissions | Registration form (member or employee), package, activation date, trainer cycle, add-ons, initial settlement (gym fee, admission, trainer fee, total), biometric enrollment |
| Manage Trainers | Hire trainer (name, phone), list with client counts, export, delete |
| Members Directory | 951 members, search (name, phone, serial, trainer, scanner id), assign trainer, CSV export |
| Payments | Per member membership fee, trainer fee, cycle payment, search, CSV export |
| Financial Ledger | Daily / monthly / yearly / all-time, income, expense, net profit, add income or expense entry, export |
| Reporting | Approved vs blocked entries per month, income per month, yearly income |
| ID Mapping | Link device user IDs to members (page referenced from dashboard) |

## 2. Our app today (Built)

Dashboard, Members (list, register, detail), Managers, Trainers, Expenses, Manager portal, Trainer portal,
Login, Profile, billing engine, fingerprint bridge with device enrollment, realtime punch card and sound.

## 3. Requested changes (decided by owner) — Built

1. **Dashboard: hardware bridge panel.** Online/offline, last punch, last sync, device user count, record count,
   last enrollment, last error. Needs a bridge heartbeat table (new migration).
2. **Dashboard: activity log table.** Every device decision in order, newest first, realtime. Filters: onboarded,
   access granted, denied (also frozen, unknown). Shows who, when, decision and reason.
3. **No Access Analytics chart.**
4. **New Attendance page** for SUPER_ADMIN and MANAGER: member list, open a member, pick a month, see which
   days they came and the total days. Joining month to current month in one view.
5. **UI refresh** across the whole app: modern, decent, yellow + black, consistent components.

Decisions taken while building: a day counts as attended when there is at least one granted (ACTIVE) scan, in Asia/Karachi time; attendance covers members only; the bridge counts as offline after 30 seconds without a heartbeat; staff (trainers) do not see the bridge panel.

## 4. Candidate features from the reference (owner to choose)

Mark each: YES / NO / LATER.

| # | Feature | Notes | Our status |
|---|---|---|---|
| A | Payment reminders page (all overdue members, amount due, days lapsed, phone) | Our data already supports it | Not built |
| B | Blocked-scan popup with amount due | Same as our buzzer card, adds amount | Partial |
| C | Member segmentation (active payer, non-paying, left) | Needs a "left" rule, e.g. no payment for 90 days | Not built |
| D | Employee registration type | Staff already punch with their own fingerprint id | Partial |
| E | Add-ons at registration (cardio, premium) | New business rule, needs prices | Not built |
| F | CSV export of members and payments | Listed OPEN in the brief | Not built |
| G | Payments table (fee, trainer fee, cycle payment per member) | Overlaps member detail | Not built |
| H | Financial ledger with manual income entries | We have expenses and revenue already | Partial |
| I | Monthly reporting (approved vs blocked entries, income per month) | Could live in Dashboard or Reporting | Not built |
| J | ID Mapping page (device user to member) | Our enrollment already assigns ids | Not needed |
| K | Trainer payroll page | Our Trainers page covers commission and payouts | Built |
| L | Gender field on members | Cheap to add | Not built |

## 5. Open questions

- What counts as a member who "left"? (days without payment)
- Add-ons: real list and prices?
- Should reminders send SMS or WhatsApp later, or stay on screen only?
- Attendance: count a day when there is at least one granted punch, or any punch?
- Attendance for staff (managers, trainers): needed or members only?

## 6. Out of scope for now

Member (USER) portal, public marketing site, door lock integration, SMS sending, payment gateway.
