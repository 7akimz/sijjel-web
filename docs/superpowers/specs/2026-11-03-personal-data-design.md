# A rider's personal data is theirs

## Why

When a rider accepts an invite, the academy keeps its own copy of their name, age and weight, all
typed by staff, and staff can edit them at any time. The academy shows the name staff typed on the
invite, not the one the rider signed up with, and goes on showing it.

The user's rule, from riding at academies themselves:

- **Personal data belongs to the rider.** No academy changes it: not their name, date of birth or
  weight.
- **The academy changes academy data.** That means roles, level (through moves), plan, own or
  school horse, status (suspended, left) and payments.
- **Minimal data entry for everyone.** The less anyone has to type, the more they'll use the
  system. Invites ask only what the academy needs, sign-up asks only for the account, and anything
  extra is the rider's choice, made later.

On top of that:

- **Academies don't weigh riders or update ages.** They have horses to worry about. A typed age
  goes stale, so it's replaced by a date of birth, and the age is worked out from it.
- **Every academy runs an assessment session for a new rider** (memory: the assessment-session
  idea). That's where an academy decides whether a rider suits it, so there's no need for checks
  based on typed numbers.

Success looks like this:

- Staff inviting a rider type a name, optionally a phone, then discipline, level, plan and horse.
  Nothing else.
- Sign-up is unchanged: name, phone, optional email, password.
- Every academy shows the rider's own name, and staff can't edit it.
- A rider can, if they want, add a date of birth and weight in their account. Staff then see the
  age and weight, read-only.

## Goals

1. **Name.** After accepting, the rider's name everywhere in an academy (member list, member page,
   board, bookings, level history, trainer names) is their account name. Staff can't edit it. This
   applies to every member: riders, trainers and admins.
2. **No age or weight on invites.** The invite form and API stop taking them.
3. **Date of birth and weight on the account, optional, entered only by the person themselves.**
   They're on the "Your account" page and nowhere else. Sign-up doesn't ask for them.
4. **Staff see age and weight read-only, only when the person has added them.** The age is worked
   out from the date of birth on the academy's local date.
5. **Remove the checks that depended on typed age and weight:**
   - the academy's minimum rider age, maximum rider age and maximum rider weight (booking rules
     settings);
   - the horse's maximum rider weight (horse form), and with it the weight rule in horse matching.

   The user agreed these can come back later if needed.

## Non-goals

- Bringing back any of the removed limits, or warning staff about age or weight.
- Asking anyone for a date of birth or weight: no prompts, nags or sign-up fields.
- Parents managing a child's account. Today a child rider has their own account, and that doesn't
  change.
- Keeping existing typed ages or weights. They were entered by staff, so under the rule above they
  aren't the rider's data. They're dropped, not copied to accounts.

## Anti-goals (would make this a failure even if it works)

- Any staff screen that can change a member's name, date of birth or weight.
- Any new required field on the invite, sign-up or accept step.
- Showing a date of birth or weight field to staff as something they could fill in.

## Decisions

### Data (API, one migration)

- `users` gains two optional columns:
  - `birth_date date`, checked `>= '1900-01-01'`;
  - `weight_kg smallint`, checked `BETWEEN 10 AND 250`, the same range rider weight uses today.
- `memberships` drops `display_name`, `age` and `weight_kg`. Every query that used
  `coalesce(m.display_name, u.display_name)` uses `u.display_name`. That covers the queries in
  `members.sql`, `board.sql` and `moves.sql`, including trainer names.
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

- **Account:**
  - `GET /api/me` and the account update return `birthDate` (an ISO date or null) and `weightKg`
    (or null).
  - The account update (`Accounts.UpdateAccount`, `AccountInput`) accepts both, and null clears
    them.
  - Validation:
    - the date of birth can't be in the future or before 1900 (`birth_date_invalid`);
    - the weight is a whole number from 10 to 250 (`weight_out_of_range`, the existing code).
- **Members:**
  - Each member response has `age` (worked out from `birth_date` on the academy's local date, or
    null) and `weightKg` (from the account, or null).
  - `displayName` is the account name.
  - Staff never see `birthDate` itself, only the age. My call: the age is all an academy uses, and
    it reveals less.
- **Member update** (`PUT /api/academy/members/{id}`, `MemberInput`): drops `displayName`, `age`
  and `weightKg`. It keeps roles and the rider fields that remain: discipline, level, plan and horse
  source.
- **Invites** (`POST /api/academy/invites`, renewal, `RiderFields`): drop `age` and `weightKg`, and
  with them the age-range and weight-limit checks (`age_out_of_range` and `weight_out_of_range` on
  invites).
- **Booking rules** (`GET` and `PUT` `/api/academy/booking-rules`): drop `minRiderAge`,
  `maxRiderAge` and `maxRiderWeightKg`, and their validation.
- **Horses:** drop `maxRiderWeightKg` from the request and response.
- **Matching** (`internal/domain/allocator.go`):
  - `SchoolHorse.MaxWeightKg` and `SchoolBooking.WeightKg` go, along with the weight rule in
    `suits`.
  - A horse suits a booking by discipline and level only, and a pinned booking still takes its
    horse.
  - `SuitableFree` loses its weight parameter.
- **Board:** the rider's weight on the board comes from the account, as for members. My call:
  keep showing it where it's shown today, when it exists.

### Web

- **Invite member form:**
  - The age and weight fields go, along with their hints. `invite-member.ts`, `riderErrors` and
    `toInviteRequest` lose them.
  - The member page's form uses `riderErrors` too, so it loses them there as well.
- **Member page (staff):**
  - The name shows as text, not a field.
  - Age and weight show as read-only text when present, for example "14 years · 52 kg", and are
    hidden when absent.
  - Admins keep editing roles, plan, horse source, moves, status, payments and the private horse.
- **Members list:** the age line stays, now from the account, and shows only when present.
- **Booking rules settings:** the three rider-limit fields go.
- **Horse form and horses list:** the maximum rider weight goes.
- **Your account (`/account`):**
  - Two optional fields under the existing ones: **Date of birth** (a date input) and **Weight
    (kg)**.
  - One hint under them: "Optional. The academies you ride at can see your age and weight." The
    same page also says that's all they see.
  - The fields can be cleared.
- **Sign-up and accept:** unchanged. No new fields.
- **Types:**
  - `Member.age`/`weightKg` stay as nullable numbers, now read-only.
  - `Account` gains `birthDate`/`weightKg`.
  - Remove the dropped fields from the booking rules, horse and invite types.
- **Copy:** remove messages that only served the dropped fields, such as the invite age and weight
  labels and hints, the limit settings and the horse weight. Add messages for the account fields and
  the new error, in English and Arabic.

### Tests (both repos, TDD)

- **API:**
  - Accepting an invite doesn't copy the invite name. The member shows the account name, and a
    later account rename shows up in every academy.
  - The member update ignores or refuses `displayName`. Pick refusing an unknown field only if
    `decodeJSON` already refuses unknown fields; otherwise it's ignored and the name is unchanged.
    The test asserts the name is unchanged either way.
  - Account update:
    - sets and clears the date of birth and weight;
    - refuses a future date or one before 1900, and a weight outside 10–250.
  - Member responses:
    - work out the age on the academy's local date, including the day before and on a birthday;
    - are null without a date of birth.
  - Invites no longer accept or require age.
  - Booking rules no longer carry the limits.
  - Horses no longer carry a weight limit.
  - Allocator tests drop weight cases. A horse matches by discipline and level alone.
  - The migration test: up drops the columns and keeps memberships; down restores the schema.
- **Web:**
  - unit tests for the account form validation;
  - the invite form has no age or weight fields;
  - the member page shows the name as text and the age and weight read-only.
  - e2e: the existing invite helpers stop filling age. One test where a rider adds a date of birth
    and weight in their account, and the owner then sees the age and weight on the member page,
    with no field to change them.

## Left to the builder

- Exact layout of the account fields and the read-only age and weight line.
- Whether the age is calculated in SQL or Go, as long as it uses the academy's local date.
- The order of migration statements and how to keep the generated queries in step.
