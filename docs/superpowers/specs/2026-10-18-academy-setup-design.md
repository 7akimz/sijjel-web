# Milestone 3: Academy setup — Design

Builds on `2026-10-17-sijjel-design.md` (the main spec). Where this document and the main spec differ, this document wins for Milestone 3, and the main spec is updated to match.

## Intent

An academy owner who has just accepted their invitation should be able to get the academy ready for bookings on their own, from their phone:
- set when the academy is open and how long sessions are
- add the arenas riders ride in
- add the school horses

The user wants to try this phase out by setting up the sample academy Al Faris themselves. That is why it comes before the scheduling engine and booking.

The user trains as a rider at an academy and doesn't run one. Operational details below that came from them are illustrative: the system must not hard-code them, only use them as examples and sample data.

## Goals

1. **A setup checklist card** on the academy home page, for admins only, guiding them through three steps in order:
   1. Opening hours
   2. Arenas
   3. Horses

   The user chose this layout over a step-by-step wizard and over a banner with a separate Setup page.
2. **Settings pages** for an academy admin:
   - opening hours and sessions
   - booking rules
   - arenas
   - closed dates
   - disciplines and levels
3. **A Horses section:** school horses with discipline, level range, a daily session limit, and unavailable date ranges.
4. **The slot grid** from the scheduling engine (main spec "Scheduling engine", item 1), so the hours page can preview the session times riders will be offered.

## Non-goals (this phase)

- **Inviting trainers and riders, and the member list.** These move to a later milestone, before booking. The user was explicit: inviting is not part of setup, because an academy doesn't open with its clients already signed up.
- **Private horses.** Each needs an owner rider, and riders arrive through invitations.
- **The horse allocator, booking, cancelling and the planning board.**
- **Branding uploads.**
- **Recurring bookings, plans and pricing:** parked for the booking milestone (see "To settle before booking").

## Anti-goals

- The checklist must never get in a rider's way. Riders and trainers never see it.
- Setup must not force a fixed order or block the rest of the app. Every page stays reachable from Settings at any time, before and after the checklist is done.
- No sample data is created automatically in a real academy.

## Decisions made with the user

| Topic | Decision |
|---|---|
| Setup guidance | A checklist card on the academy home: "Get {academy} ready for bookings", a progress bar ("1 of 3 done"), and three rows (Opening hours, Arenas, Horses). Each row opens that step's page. |
| Invites | Not a checklist step and not in this phase. |
| Opening hours | One stretch per open weekday, set per weekday. The sample academy is open Sat–Wed 18:00–22:00 and closed Thu–Fri. |
| Sessions | The sample academy uses 30-minute sessions with no gap between them. |
| Arenas | A name and a rider capacity. The sample academy has two arenas, of 5 and 2 riders. |
| Horse choice | Trainers pick each rider's horse before the session, mostly by level. The level range models this. |
| Booking rules | Three settings: how far ahead booking opens, how close to the start booking closes, and the riders' cancellation cutoff. The user has seen same-day phone booking at one academy and "book at least 2 days ahead" at another. |
| Parked | Monthly fixed schedules, plans by sessions per week, and pricing by discipline go to the booking milestone. |

## Calls made by the assistant (the user can overturn these)

Marked here so they can be checked while reading.

### Checklist and navigation
1. **Who sees the checklist:** academy admins (owners included) only. Riders keep today's "booking opens soon" home.
2. **When a step counts as done**, worked out from live data rather than stored:
   - Opening hours: at least one open weekday.
   - Arenas: at least one active arena.
   - Horses: at least one active school horse.
3. **When the card goes away:** once all three steps are done. If data is later removed, the card comes back.
4. **Admin navigation:** the bottom bar and desktop nav show Home, Horses and Settings. Riders see only Home.
5. **Settings** is a list page linking to the five settings pages. The checklist rows link straight to the matching pages.

### Opening hours and sessions
6. **Week order:** the hours page lists weekdays starting from Saturday.
7. **Copying hours:** setting one day offers a "Copy to other open days" action.
8. **Time zone:** the academy's time zone (set at creation) is shown and editable on this page.
9. **Session preview:** the page shows the session start times for each open day, recomputed as the owner edits ("8 sessions · 18:00 – 21:30"). While editing, the page sends the unsaved schedule to a dry-run endpoint (`POST /api/academy/schedule/preview`, debounced), so the slot rule lives only in Go.
10. **Limits:**
    - Session length is 15–240 minutes, in steps of 5. The default stays 60.
    - Break is 0–60 minutes, in steps of 5.
    - Opening and closing times are whole minutes.
    - Closing 00:00 means end of day. A stretch never crosses midnight, and its closing time must be after its opening time.
11. **Saving:** the page saves the whole week, session length, break and time zone together.

### Booking rules
12. Three fields, all whole numbers:
    - **Booking opens:** days ahead, 1–90, default 14 (existing column `booking_window_days`).
    - **Booking closes:** hours before the session starts, 0–168, default 0 (new column `booking_closes_hours`). 0 means riders can book until the start.
    - **Riders can cancel until:** hours before the start, 0–168, default 12 (existing column `cancellation_cutoff_hours`). Staff can always cancel; that is enforced in the booking milestone.

    Nothing enforces these yet. They are stored for the booking milestone.

### Arenas
13. **Fields:**
    - a name, 1–60 characters, unique per academy, case-insensitive
    - a capacity, 1–50 riders
    - an active flag
14. **No deleting:** arenas are turned off, never deleted, so past bookings keep their arena.
15. **Disciplines:** arenas are not tied to a discipline.

### Closed dates
16. Stored as ranges:
    - a from date and a to date, inclusive
    - an optional reason of up to 120 characters, in one language as typed

    A single day is a range of one date. Ranges may not overlap.
17. **Editing:** past closed ranges are kept and shown greyed. Closed ranges can be deleted, but not edited.

### Disciplines and levels
18. **Turning disciplines on and off:**
    - The owner can turn on any catalogue discipline, which copies its default ladder.
    - The owner can turn a discipline off only when no horse (and, later, no rider) uses it.
    - At least one discipline must stay on.
19. **Ladder editing:**
    - Uses the same editor as the platform catalogue: rename, add, reorder, remove, 1–12 levels.
    - A level that a horse's range uses can't be removed.
    - A reorder that would put any horse's lowest level above its highest is rejected, naming the horses.
    - Level ids survive renames and reorders, so horses keep their range.
    - **"Uses" means a horse's two end levels only.** Removing a level strictly between a horse's lowest and highest is allowed and narrows that range. A reorder that moves a level into or out of a range without inverting it is also allowed: suitability follows ladder position, so the change is intended.
    - **Retired horses still count as using** their discipline and end levels. The foreign keys enforce this (no cascades from levels or academy_disciplines into horses). To free a level or a discipline, the owner edits or re-ranges the retired horse, which stays editable.

### Horses
20. **School horses** have:
    - a name, 1–60 characters, unique per academy, case-insensitive
    - one of the academy's disciplines
    - a lowest and highest level on that discipline's ladder (lowest ≤ highest by position)
    - a daily session limit, 1–6, default 3
    - optional notes of up to 500 characters
    - an active flag
21. **Changing discipline** requires choosing a new range on the new ladder.
22. **Retiring a horse:** horses are turned off, never deleted.
23. **Unavailability:**
    - Date ranges (from–to inclusive) with an optional reason, listed on the horse's page.
    - Entries can be added and deleted. Overlapping ranges for the same horse are allowed.
    - Admins only in this phase; trainers get this once they can be invited.
24. **The horses list** shows each horse with discipline and level-range chips ("Dressage · Intro – Novice"), plus an "Unavailable today" chip when one applies. It can be filtered by discipline.

### Slot grid
25. **What it is:** a pure Go function in `internal/domain`.
    - **Input:** the weekly hours, session length, break, time zone, closed ranges and a date range.
    - **Output:** each slot's local date, start time and end time, plus the UTC instant it starts.
    - **Rule:** slots start at the opening time and repeat every session length + break, while start + session length ≤ closing time.
26. **Time-zone edge cases:**
    - A local start time that doesn't exist because of a daylight-saving jump is skipped.
    - An ambiguous one (clocks going back) uses the first occurrence.
27. **Preview:** the hours preview uses the same function. The API returns the preview with the schedule, so the web app never duplicates the rule.

### Permissions and sample data
28. **Permissions:** every endpoint in this phase requires an Active membership with the admin role in the request's academy. Reads that riders will need later (hours, closed dates) are admin-only for now and opened up in the booking milestone.
29. **Sample data for trying it out:** the user sets up Al Faris by hand. No seed script ships. The sample values above are only examples in docs and tests.

## Data changes

- **New migration** (`00002_academy_setup.sql`):
  - `academies.booking_closes_hours integer NOT NULL DEFAULT 0 CHECK (0..168)`.
  - CHECK constraints for:
    - `session_length_minutes` (15–240, multiple of 5)
    - `break_minutes` (0–60, multiple of 5)
    - `booking_window_days` (1–90)
    - `cancellation_cutoff_hours` (0–168)
- **New tables**, each carrying `academy_id` and filtered by it in every query:
  - `opening_hours`: academy_id, weekday 0–6 (0 = Sunday, as Go's `time.Weekday`), opens_at, closes_at (minutes from midnight, closes 1440 = midnight). Primary key (academy_id, weekday).
  - `closed_dates`: id, academy_id, from_date, to_date, reason, created_at. An exclusion constraint prevents overlap per academy.
  - `arenas`: id, academy_id, name, capacity, is_active, created_at. Unique (academy_id, lower(name)).
  - `horses`: id, academy_id, name, kind (`school`; `private` comes later), discipline_id, min_level_id, max_level_id, max_sessions_per_day, notes, is_active, created_at.
    - Foreign keys `(academy_id, discipline_id)` → academy_disciplines.
    - Foreign keys `(academy_id, discipline_id, min_level_id/max_level_id)` → levels, so a range can't point at another discipline's levels.
    - Unique (academy_id, lower(name)).
  - `horse_unavailability`: id, academy_id, horse_id, from_date, to_date, reason, created_at.

## API (all under the academy host, admin only)

| Method and path | Purpose |
|---|---|
| `GET /api/academy/setup` | Checklist state: `{hours, arenas, horses}`, each `done: bool`. |
| `GET /api/academy/schedule` | Weekly hours, session length, break, time zone, plus a preview of session start times per weekday. |
| `PUT /api/academy/schedule` | Replace the whole schedule. Returns the same shape as GET. |
| `POST /api/academy/schedule/preview` | Validate an unsaved schedule and return its preview, without saving. |
| `GET` / `PUT /api/academy/booking-rules` | The three booking rules. |
| `GET` / `POST /api/academy/arenas`, `PUT /api/academy/arenas/{id}` | List, create, and update (name, capacity, active). |
| `GET` / `POST /api/academy/closed-dates`, `DELETE /api/academy/closed-dates/{id}` | List, add and delete closed ranges. |
| `GET /api/academy/disciplines` | The academy's disciplines with their ladders, plus the catalogue disciplines not yet turned on. |
| `POST /api/academy/disciplines` `{disciplineId}` | Turn a discipline on. |
| `DELETE /api/academy/disciplines/{id}` | Turn a discipline off. |
| `PUT /api/academy/disciplines/{id}/levels` | Replace the ladder. Existing levels are matched by id; new ones have no id. |
| `GET` / `POST /api/academy/horses`, `GET` / `PUT /api/academy/horses/{id}` | List, create, read and update school horses. |
| `POST /api/academy/horses/{id}/unavailability`, `DELETE /api/academy/horses/{id}/unavailability/{entryId}` | Add and remove unavailable ranges. |

Errors follow the existing problem+json shape with stable codes, each translated in the web app (`error_<code>`):
- `not_an_admin`
- `hours_invalid`
- `session_length_invalid`
- `break_invalid`
- `time_zone_invalid`
- `booking_rule_invalid`
- `arena_name_taken`
- `capacity_invalid`
- `closed_dates_overlap`
- `date_range_invalid`
- `discipline_in_use`
- `last_discipline`
- `level_in_use`
- `level_range_inverted`
- `horse_name_taken`
- `level_range_invalid`
- `sessions_per_day_invalid`
- the existing name, level and validation codes

## Web

- **Academy home for admins:** the checklist card above today's membership card while any step is open. Riders' home is unchanged.
- **Routes** (academy host, admins only; others get the 403 page):
  - `/settings`
  - `/settings/hours`
  - `/settings/booking-rules`
  - `/settings/arenas`
  - `/settings/closed-dates`
  - `/settings/disciplines`
  - `/horses`
  - `/horses/new`
  - `/horses/[id]`
- **Building blocks:**
  - Everything uses the sijjel design-system UI kit. The user dislikes default scaffold styling.
  - The ladder editor component from the platform catalogue page is reused.
  - New UI kit pieces (for example a time input row or a date-range field) are added to `src/lib/ui` and to the `/design` page.
- **Layout and language:** mobile-first, EN/AR with RTL, light and dark. Times are 24-hour with Western digits.

## To settle before booking (parked)

Seen by the user at real academies; each changes how booking works:
1. **A monthly fixed schedule:** on the 28th, riders commit to the next month by choosing fixed weekly times (e.g. two days at a fixed time).
2. **Plans by sessions per week:** 2, 3 or 5 sessions a week, each at a different price.
3. **Pricing by discipline:** e.g. jumping costs more.

A softer idea for the planning board: a rider's "usual horse" that the trainer's suggestion prefers when it is suitable and free, without ever blocking a booking. The user's trainer picks horses the rider gets along with.

## Testing

- **Domain unit tests for the slot grid:**
  - 30, 45 and 60-minute sessions, with and without breaks
  - a midnight close
  - closed ranges
  - a closed weekday
  - a last session that doesn't fit
  - daylight-saving jumps in both directions, in a DST time zone
- **API integration tests** (testcontainers, real Postgres), for every endpoint:
  - the happy path, the validation codes, and non-admins getting 403
  - cross-academy isolation per resource
  - removing a level used by a horse range is rejected
  - a reorder inverting a horse's range is rejected
  - turning off a discipline in use is rejected
  - overlapping closed ranges are rejected
- **Web:**
  - Vitest for form helpers (hours, horse range, closed dates) and the new UI pieces.
  - The Playwright e2e on its throwaway stack:
    1. The platform admin creates an academy and the owner accepts.
    2. The checklist shows 0 of 3.
    3. The owner sets hours and sees the session preview update before saving, then adds an arena, then a school horse.
    4. The checklist card disappears.
