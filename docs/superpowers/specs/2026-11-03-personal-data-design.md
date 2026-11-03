# A rider's name is theirs; age and weight are gone

## Why

When a rider accepts an invite, the academy keeps its own copy of their name, age and weight, all
typed by staff, and staff can edit them at any time. The academy shows the name staff typed on the
invite, not the one the rider signed up with, and goes on showing it.

The user's rule, from riding at academies themselves:

- **Personal data belongs to the rider.** No academy changes it.
- **The academy changes academy data.** That means roles, level (through moves), plan, own or
  school horse, status (suspended, left) and payments.
- **Minimal data entry for everyone.** The less anyone has to type, the more they'll use the
  system.

About age and weight specifically:

- Academies don't weigh riders or update ages.
- Every academy runs an assessment session for a new rider. That's where an academy decides
  whether a rider suits it.
- The user considered a date of birth and an optional weight on the rider's own account, then
  decided (2026-11-03) to **remove age and weight completely**, for riders and academies alike. A
  future design may bring something back; this work doesn't prepare for it.

Success looks like this:

- Staff inviting a rider type a name, optionally a phone, then discipline, level, plan and horse.
  Nothing else.
- Sign-up is unchanged: name, phone, optional email, password.
- Every academy shows the member's own name, and staff can't edit it.
- No age or weight appears anywhere in the product.

## Goals

1. **Name.** After accepting, the member's name everywhere in an academy (member list, member page,
   board, bookings, level history, trainer names) is their account name. Staff can't edit it. This
   applies to every member: riders, trainers and admins. The person changes it from "Your account",
   as today.
2. **Remove age and weight everywhere:**
   - from invites (form, API and pending list);
   - from members (list, member page, edit, API);
   - from the board.
3. **Remove the checks that depended on them:**
   - the academy's minimum rider age, maximum rider age and maximum rider weight (booking rules
     settings);
   - the horse's maximum rider weight (horse form and list), and with it the weight rule in horse
     matching.

## Non-goals

- Date of birth or weight on the account, or anywhere else.
- Warnings, prompts or replacements for the removed limits.
- Keeping existing typed ages or weights. They're dropped.

## Anti-goals (would make this a failure even if it works)

- Any staff screen that can change a member's name.
- Any new field on the invite, sign-up, accept step or account page.

## Decisions

### Data (API, one migration)

- `memberships` drops `display_name`, `age` and `weight_kg`. Every query that used
  `coalesce(m.display_name, u.display_name)` (or the trainer equivalent) uses the account's
  `display_name`. That covers the queries in `members.sql`, `board.sql` and `moves.sql`.
- `invites` drops `age` and `weight_kg`. **`invites.name` stays:** staff type it to recognise a
  pending invite, and it pre-fills the sign-up name. It is no longer copied to a membership when the
  invite is accepted.
- `academies` drops `min_rider_age`, `max_rider_age`, `max_rider_weight_kg` and the age-range
  check constraint.
- `horses` drops `max_rider_weight_kg`.
- **Down migration:** it re-adds the columns, nullable or with their old defaults, without the
  data (`min_rider_age` back with `DEFAULT 6`). Dropped values aren't restored; the dev database
  holds no real riders.

### API behaviour

- **Members:**
  - Member responses lose `age` and `weightKg`.
  - `displayName` is the account name.
- **Member update** (`PUT /api/academy/members/{id}`, `MemberInput`): drops `displayName`, `age`
  and `weightKg`. It keeps roles and the rider fields that remain: discipline, level, plan and horse
  source. `decodeJSON` refuses unknown fields (`DisallowUnknownFields`), so a request that still
  sends any of them is refused, and the web stops sending them.
- **Invites** (`POST /api/academy/invites`, renewal, `RiderFields`, `PendingInvite`): drop `age`
  and `weightKg`, and with them the age-range and weight-limit checks. Error codes used only by
  those checks (`age_out_of_range`, and `weight_out_of_range` if nothing else uses it) go.
- **Booking rules** (`GET` and `PUT` `/api/academy/booking-rules`): drop `minRiderAge`,
  `maxRiderAge` and `maxRiderWeightKg`, and their validation (`age_range_invalid`, and
  `weight_range_invalid` if nothing else uses it).
- **Horses:** drop `maxRiderWeightKg` from the request, the response and its validation.
- **Matching** (`internal/domain/allocator.go`):
  - `SchoolHorse.MaxWeightKg` and `SchoolBooking.WeightKg` go, along with the weight rule in
    `suits`.
  - A horse suits a booking by discipline and level only, and a pinned booking still takes its
    horse.
  - `SuitableFree` loses its weight parameter.
- **Board:** the rider's weight goes from the board response.

### Web

- **Invite member form:**
  - The age and weight fields go, along with their hints. `invite-member.ts`, `riderErrors` and
    `toInviteRequest` lose them.
  - The member page's form uses `riderErrors` too, so it loses them there as well.
- **Member page (staff):**
  - The name shows as text, not a field.
  - Age and weight are gone.
  - Admins keep editing roles, plan, horse source, moves, status, payments and the private horse.
- **Members list and pending invites:** the age line goes.
- **Board:** any rider weight shown goes.
- **Booking rules settings:** the three rider-limit fields go.
- **Horse form and horses list:** the maximum rider weight goes.
- **Sign-up, accept and account:** unchanged.
- **Types:** remove the dropped fields from the member, invite, board, booking rules and horse
  types.
- **Copy:** remove messages that only served the dropped fields, in English and Arabic.

### Tests (both repos, TDD)

- **API:**
  - Accepting an invite doesn't copy the invite name. The member shows the account name, and a
    later account rename shows up in every academy.
  - The member update refuses a request that includes `displayName`. The name stays unchanged.
  - Invites no longer accept age or weight. A rider invite without them succeeds whatever the
    academy is.
  - Booking rules no longer carry the limits.
  - Horses no longer carry a weight limit.
  - Allocator tests drop weight cases. A horse matches by discipline and level alone.
  - The migration test: up drops the columns and keeps memberships and their accounts' names; down
    restores the schema.
- **Web:**
  - the invite form has no age or weight fields;
  - the member page shows the name as text with no name field.
  - e2e: the existing helpers stop filling age (`inviteRider` and similar). One assertion that the
    owner sees the rider's sign-up name, not the invite's, and has no field to change it.

## Left to the builder

- Exact wording and placement of the name on the member page.
- The order of migration statements and how to keep the generated queries in step.
- Removing now-unused helpers (for example `optionalNumber` if nothing else uses it).
