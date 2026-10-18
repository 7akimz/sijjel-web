# sijjel — Design Spec

## Context

Riding academies and stables need a way for riders to book evening sessions without overbooking horses.

An academy sets its opening days and hours (e.g. Mon–Thu, 18:00–22:30), its session length, and its arenas, each with its own rider capacity. It teaches one or more **disciplines** (dressage, show jumping, …). Every rider belongs to one discipline at one level on that discipline's ladder.

There are two kinds of riders:
- **Own-horse riders** bring their own horse.
- **School-horse riders** ride an academy horse that the trainer picks.

**The hard problem:** a slot can have rider places left but no *suitable* school horse. Rider capacity alone cannot prevent this. The system must guarantee that a valid horse assignment exists, while:
- matching the horse's discipline and level range to the rider
- using each horse at most once per slot, across all arenas
- respecting each horse's daily session limit
- respecting horses the trainer has already assigned

sijjel is a multi-tenant SaaS in two git repositories, side by side in `~/Projects/sijjel/`:
- **`sijjel-api`**: the Go backend.
- **`sijjel-web`**: the SvelteKit frontend.

Each repo keeps a copy of this spec plus its own implementation plans; when the spec changes, update both copies.

Academies are created by **platform admins** and handed to their owners. Each academy gets its own branded subdomain, so riders feel they are using *their* academy's app.

The visual language is the **sijjel design system**: https://claude.ai/artifact/HysWBDjQnrq5zDEoY1cZqj. Read its `project/README.md` before building any UI.

## Decisions

| Topic | Decision |
|---|---|
| Platform | Platform admins (a global flag on a user) create academies, invite each academy's owner, and maintain the discipline catalogue. There is no public academy sign-up. The first platform admin comes from a CLI command. |
| Disciplines | A platform catalogue, seeded with Dressage, Show jumping, Eventing, Endurance, Flatwork and Vaulting. Each academy switches on the disciplines it teaches. |
| Levels | Each catalogue discipline has a default ordered ladder. Switching a discipline on copies its ladder into the academy, which can then rename, add, reorder or remove levels. A level that a rider or horse uses can't be removed. |
| Riders | One discipline and one level per rider per academy. The invite sets them; staff can change them later. |
| Invites | Personal invites carry: the role (owner/admin, trainer or rider), the discipline and level for riders, and an optional name/email. The person opens the link, signs up or signs in, and is immediately an Active member. There is no other public sign-up and no pending step. |
| Roles | Per academy: Admin (owners are admins), Trainer, Rider. A user may hold several roles. Platform admin is separate and global. |
| Who books | Riders book themselves. Staff can also book on a rider's behalf. |
| Sessions | Every active arena runs a session in every slot within opening hours. Trainers are assigned per arena-slot afterwards. |
| Rider picks | A **time slot** only. Their discipline is implicit. Staff place riders into arenas/trainers on the planning board. |
| Horse shortage | **Block** the booking. The slot shows "no suitable school horse", but stays open to own-horse riders. |
| Horses | Each horse has one discipline. A school horse has a level range (lowest–highest level on its discipline's ladder), a max sessions/day, and can be marked unavailable for a date range. A private horse has an owner rider and takes the owner's discipline. |
| Guarantee | At booking time a **feasibility check** (max-flow) runs over the whole academy-day. No horse is locked at booking time. The trainer assigns horses later, with a one-click suggestion. |
| Recurring bookings | None in v1. |
| v1 extras | Booking rules: how far ahead booking opens, how close to the start it closes, and a riders' cancellation cutoff. |
| Language | English and Arabic, with full RTL. |
| Branding | Each academy has a subdomain (`{slug}.<root-domain>`) carrying its logo, brand colour (generating its accent tones), cover photo, welcome text (EN/AR) and house rules (EN/AR). sijjel appears only as a small "Powered by" footer. |
| Stack: API | Go 1.27, stdlib `net/http` routing, `pgx/v5`, `sqlc`, `goose` migrations, PostgreSQL 17. |
| Stack: web | SvelteKit (Svelte 5, TypeScript) with SSR via `adapter-node`. It proxies `/api` to Go on the same origin. Paraglide JS for i18n. |
| Design | The sijjel design system: tokens and `sj-` components become the Svelte UI kit, with dark mode, mobile-first layouts, and a dev-only `/design` style guide route. |
| Config & ops | No secrets in committed files; environment variables only, validated at start-up. Liveness/readiness health checks, JSON logs, non-root images. |
| Hosting | AWS, free-tier friendly, decided later. Three containers (web, api, Postgres) fit one small instance. |

### Assumptions
1. **Slot grid.**
   - Sessions never cross midnight.
   - A closing time of 00:00 means end of day.
   - Opening times are whole minutes.
   - An optional break between sessions is supported (default 0).
2. Opening hours are stored per weekday.
3. The daily session limit applies to school horses only. A private horse just can't be in two bookings in the same slot.
4. A rider may book several slots a day, but one booking per slot.
5. Riders can't cancel inside the cutoff; staff always can.
6. Schedule changes that would leave future bookings outside the slot grid are rejected, listing the conflicting bookings.
7. Some changes are allowed even when they break existing bookings, because they reflect reality: a horse becoming unavailable, a horse's range or a rider's level changing, an arena's capacity shrinking. The resulting problems show as conflicts on the planning board.
8. Logins are per subdomain (host-only cookie). A platform admin signs in on the root domain.
9. Image uploads: PNG/JPEG/WebP only, max 2 MB, resized in the browser.
10. Dev hosts: `localhost` is the platform; `{slug}.localhost` is an academy.
11. Times use the 24-hour clock; digits are Western in both languages.

## Domain model (PostgreSQL)

- **users**: id, email (unique, case-insensitive), password_hash (argon2id), display_name, preferred_language, is_platform_admin, created_at.
- **sessions**: id (random 256-bit, stored hashed), user_id, created_at, expires_at, last_seen_at.
- **disciplines** (catalogue): id, key (e.g. `dressage`), name_en, name_ar, sort_order.
- **discipline_default_levels**: discipline_id, position, name_en, name_ar.
- **academies**: id, slug (unique, lowercase `a-z0-9-`, 3–30, reserved words blocked), name_en, name_ar, time_zone (IANA, default Africa/Cairo), session_length_minutes and break_minutes (empty until the owner saves the schedule; shown as 30 and 0 meanwhile), booking_window_days (default 14), booking_closes_hours (default 0), cancellation_cutoff_hours (default 12), default_language, is_active, created_at.
- **academy_branding**: academy_id, primary_color (default `#7A5230`), logo_file_id, cover_file_id, welcome_text_en/ar, house_rules_en/ar.
- **academy_disciplines**: academy_id, discipline_id (the disciplines the academy teaches).
- **levels**: id, academy_id, discipline_id, position, name_en, name_ar. Unique (academy_id, discipline_id, position).
- **opening_hours**: academy_id, weekday, opens_at, closes_at.
- **closed_dates**: id, academy_id, from_date, to_date, reason.
- **arenas**: id, academy_id, name, capacity, is_active.
- **memberships**: id, academy_id, user_id, roles (admin/trainer/rider flags), discipline_id and level_id (riders only), status (Active, Suspended), created_at. Unique (academy_id, user_id).
- **invites**:
  - id, academy_id, token_hash, roles, discipline_id and level_id (riders), name, email
  - created_by, created_at, expires_at (14 days), accepted_by, accepted_at, revoked_at
  - Owner invites are created by platform admins; all others by academy admins.
- **horses**:
  - id, academy_id, name (unique per academy, case-insensitive), kind (school/private), discipline_id
  - min_level_id and max_level_id (school), max_sessions_per_day (school, 1–6)
  - owner_membership_id (private), is_active, notes
- **horse_unavailability**: id, academy_id, horse_id, from_date, to_date, reason.
- **bookings**:
  - id, academy_id, rider_membership_id
  - date, start_time, end_time (academy-local), starts_at (UTC)
  - horse_source (school/own), own_horse_id
  - status (Active/Cancelled), cancelled_at, cancelled_by
  - arena_id, assigned_horse_id, created_at
- **session_trainers**: academy_id, date, start_time, arena_id, trainer_membership_id.
- **stored_files**: id, academy_id, content_type, size, storage key (local disk now, S3 later).

**Database safety nets:** partial unique indexes over active bookings, on (rider, date, start), (own_horse, date, start) and (academy, date, start, assigned_horse).

**Tenancy:** every tenant-owned table carries `academy_id`, and every query on one filters by it explicitly. One integration test per resource proves cross-academy isolation.

## Scheduling engine (`internal/domain`, pure Go, no I/O)

1. **SlotGrid** turns opening hours, session length, break, closed dates and a date range into slots, computed on demand.
2. **HorseAllocator** runs a max-flow check over one academy-day:
   - **Graph:** `source → booking (1) → (horse, slot) (1) → horse (max sessions/day) → sink`.
   - **Edges:** a `booking → (horse, slot)` edge exists only when the horse is active, available that date, of the booking rider's discipline, and the rider's level position lies within the horse's min–max range. A booking with a trainer-assigned horse gets only that edge.
   - **Result:** the day is feasible when the max flow equals the number of school-horse bookings; the solver returns a suggested assignment plus any unmatched bookings.
   - **CanAccept:** a candidate booking is accepted when it raises the matched count by one, so existing conflicts never block unrelated bookings.
   - **Algorithm:** Edmonds-Karp. The graph is tiny.
3. **BookingRules** checks the slot exists, is inside the booking window and isn't in the past, and checks the cancellation cutoff. It takes the clock as an injected dependency.

**Booking flow** (`POST /api/bookings`), in one transaction:
1. Validate the rider is Active with a discipline and level, and the slot rules hold.
2. Take `pg_advisory_xact_lock(academy, date)`.
3. Load the day's active bookings.
4. Check rider places against the sum of active arena capacities.
5. For an own horse, check ownership and that it isn't already in that slot. For a school horse, check `CanAccept`, else return 409 `no_suitable_school_horse`.
6. Insert the booking.

**Slot availability** (`GET /api/slots?from&to`) returns, per slot: places left, `canBook` with a reason code, and the suitable school horses free/total for the rider.

**Planning board** (staff): a day view of slots × arenas, unplaced riders, horse pickers limited to suitable free horses, the solver's suggestion (with "apply"), and conflicts.
- A manual pin that breaks a hard rule is rejected.
- A pin that only makes the rest of the day infeasible is allowed, and the response returns the resulting conflicts.

## Tenancy, auth, branding

- **Tenant resolution:**
  - Go middleware reads the Host header, for `/api/*` only.
  - The root domain is the platform; `{slug}.{root}` is an academy, cached in memory for 5 minutes, hits only.
  - Unknown hosts get 404 `academy_not_found`.
  - Health endpoints ignore the host.
- **Auth:**
  - Email + password; argon2id hashes.
  - Server-side sessions: an HttpOnly, host-only, SameSite=Strict cookie holding a random token, stored hashed in the database.
  - Unsafe methods require a matching `Origin` header.
  - A Secure cookie outside local development.
- **Access:** an Application-level check requires an Active membership with one of the required roles in the current academy. Platform endpoints require `is_platform_admin`.
- **Branding:**
  - `GET /api/tenant` is public and returns the academy's names, colours, texts, default language and logo/cover URLs.
  - SvelteKit SSR puts the academy's accent tones, `data-theme`, `lang`/`dir`, `<title>` and Open Graph tags in the first HTML.
- **i18n/RTL:**
  - Paraglide messages in EN and AR.
  - Logical CSS only.
  - Readex Pro + IBM Plex Sans/Arabic.
  - A user's stored choice overrides the academy default.

## API surface (summary)

- **Platform** (root domain, platform admin):
  - `GET/POST /api/platform/academies`
  - `POST /api/platform/academies/{id}/owner-invites`
  - `GET/POST/PUT /api/platform/disciplines` (+ default levels)
  - `PUT /api/platform/users/{id}/platform-admin`
- **Public, any host:**
  - `GET /api/tenant`
  - `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/me`
  - `GET /api/invites/{token}`: a preview of what it grants
  - `POST /api/invites/{token}/accept`: signs up with a password, or uses the current session
- **Academy, rider:**
  - `GET /api/membership`
  - `GET /api/slots`, `GET /api/my/bookings`, `POST /api/bookings`, `DELETE /api/bookings/{id}`, `GET /api/my/horses`
- **Academy, staff:**
  - Planning endpoints
  - Booking on a rider's behalf
  - Horse unavailability (trainer and admin)
- **Academy, admin:**
  - Disciplines and levels
  - Schedule and booking rules
  - Branding (with uploads)
  - Closed dates and arenas
  - Horses
  - Members (roles, level, suspend)
  - Invites (create, list, revoke)

## Repositories

```
sijjel-api/
  cmd/sijjel-api/        serve | migrate | admin create
  internal/domain/       slot grid, allocator, booking rules, ladders (unit tests)
  internal/app/          use cases + typed errors (unit tests where pure)
  internal/store/        sqlc output, queries/*.sql, tx helpers
  internal/httpapi/      routes, handlers, middleware, problem+json
  internal/auth/         passwords, sessions
  migrations/            goose SQL
  Dockerfile, compose.yaml (postgres + api), .env.example
sijjel-web/
  src/hooks.server.ts    tenant + session + theme in SSR
  src/routes/api/[...path]/+server.ts   proxy to Go
  src/lib/styles/        design-system tokens + sj- CSS
  src/lib/ui/            Svelte components from the design system
  src/lib/i18n/          Paraglide messages (en, ar)
  src/routes/(platform)/ platform sign-in and admin
  src/routes/(academy)/  academy pages
  src/routes/design/     dev-only style guide
  Dockerfile, compose.yaml (web, joins the API network)
```

## Milestones

1. **Foundation:**
   - Both repos; compose; tenancy; sessions/auth.
   - Platform admin CLI and platform UI: academies, owner invites, discipline catalogue with default ladders.
   - Invite acceptance with sign-up; academy home.
   - The design-system UI kit, dark mode and the `/design` route.
2. **Scheduling engine:** the slot grid (built in Milestone 3), the discipline- and level-aware allocator, booking rules. Built with booking, after Milestone 3.
3. **Academy setup** (design: `2026-10-18-academy-setup-design.md`): a setup checklist on the admin home; opening hours and sessions with the slot grid preview; booking rules; arenas; closed dates; disciplines and ladders; school horses and their unavailability.
4. **Members and booking:** staff and rider invites, the member list, private horses, then slots, booking and cancelling with the horse allocator and the advisory lock, and the rider UI. Settle the parked booking models first (see the Milestone 3 design, "To settle before booking").
5. **Planning board:** placement, trainers, suggestions, conflicts.
6. **Branding uploads:** logo, cover, live preview.
7. **Later:** AWS deployment, email, waitlist, recurring bookings, attendance, payments.

## Testing & verification

- **Domain (Go unit tests):**
  - Within one discipline: 3 beginners and 2 beginner-safe horses means the 3rd beginner is rejected; an own-horse rider still gets in.
  - A dressage horse is never offered to a jumping rider.
  - A level outside a horse's range is rejected.
  - Greedy assignment fails where flow succeeds.
  - The daily limit applies across slots.
  - Pins, unavailable horses, degenerate horses.
  - The slot grid at 60 and 45 minutes, with breaks, on closed dates, with a midnight close.
  - Daylight-saving time zones.
- **Integration (testcontainers-go, real Postgres):**
  - Each endpoint end-to-end.
  - Tenant isolation per resource.
  - Two parallel bookings for the last suitable horse: exactly one 201 and one 409.
  - Invite single use, expiry and revoke.
  - Non-platform users get 403 on platform endpoints.
- **Web:**
  - Vitest for helpers and components.
  - A Playwright smoke test: platform admin creates an academy → owner accepts the invite → branded home in EN/AR and light/dark.
  - `curl` an invite URL and confirm `<title>`/`og:title` carry the academy name in the SSR HTML.
