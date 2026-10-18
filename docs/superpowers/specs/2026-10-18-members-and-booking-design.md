# Milestone 4: Members, plans and booking — Design

Builds on `2026-10-17-sijjel-design.md` (the main spec) and `2026-10-18-academy-setup-design.md` (Milestone 3). Where this document differs from them, it wins for Milestone 4, and the main spec is updated to match.

## Intent

Once an academy is set up, it can bring in its people and start taking bookings.

- **Staff** invite trainers and riders, give each rider a discipline, level and plan, and keep track of who has paid this month.
- **Riders** open the app, pick a time slot and book it. They always see how many sessions they have left this week.
- **The system** never lets a booking through when no suitable school horse would be free. This is the core problem from the main spec.

The user rides at an academy and doesn't run one. Rider-side details below come from their own experience. Operational details are marked as the assistant's calls.

## Goals

1. **Invitations** for trainers and riders.
   - Shared by WhatsApp, a copy button or a QR code.
   - Only possible once the academy's setup is done.
2. **A member list,** with each member's details and actions.
3. **Plans:**
   - Sessions per week and a monthly price, defined by the academy.
   - Each rider has one plan.
4. **Monthly payment tracking:**
   - Staff mark a rider paid for the month.
   - The academy chooses whether unpaid riders can book.
5. **Private horses,** registered on their owner rider.
6. **Booking:**
   - The scheduling engine: the slot grid (already built in Milestone 3), the horse allocator and the booking rules.
   - Riders book and cancel themselves, and staff can book and cancel on a rider's behalf.
7. **The rider's home:** upcoming bookings, sessions left this week, plan and price, and a way to book.

## Non-goals (this phase)

- **The planning board,** which places riders into arenas and trainers and pins horses: Milestone 5.
- **Online payments:** money stays outside sijjel.
- **Monthly fixed schedules** (committing to fixed weekly times for a month), **recurring bookings** and **waitlists.**
- **Trial sessions for people who aren't members yet:** staff book these outside sijjel.
- **Email or SMS sending.**
- **Branding uploads.**

## Anti-goals

- A booking must never be accepted when no valid school-horse assignment exists for that academy-day.
- A rider must never be able to see another rider's personal details: name, age, phone, payments.
- Staff must never be locked out by rider rules. Staff can always book for a rider (with a warning past the weekly limit) and always cancel.

## Decisions made with the user

| Topic | Decision |
|---|---|
| How riders book | Open the app, pick a time slot, book it. One-off bookings. |
| Plans | The academy defines plans; each limits a rider's bookings per week, and sijjel blocks bookings beyond the limit. |
| Subscription | Monthly. Riders pay at the start of the month, usually at their first session of the month. |
| Remaining sessions | The rider always sees how many sessions are left. |
| Unpaid riders | The academy chooses: allow booking while unpaid, or block booking until the month is marked paid. |
| Price | Each plan has a monthly price, and riders see their plan's price. Different prices per discipline come from separate plans (e.g. "Jumping, 3 a week"). |
| Joining | Beginners start at the bottom of their discipline's ladder. Experienced riders do a trial session first, and the trainer picks their level from it. Details are asked and recorded by staff. |
| Sharing invitations | Academies message riders on WhatsApp or in person. |
| Age | An age in years, not a date of birth. The academy's minimum rider age defaults to 6. There is no maximum unless an academy sets one. |
| Setup before invites | An academy can invite only once its setup is done: opening hours and sessions saved, an arena, a school horse. (Recorded in Milestone 3.) |

## Calls made by the assistant (the user can overturn these)

### Plans and limits
1. **Counting window.** The limit counts **per calendar week**, starting on Saturday in line with the hours page. Unused sessions don't carry over. The user believes their academy doesn't allow bunching, but hasn't confirmed it, so a per-month option can be added later.
2. **Plan fields:**
   - Required: a name (EN and AR, 1–60 characters each), sessions per week (1–14) and a monthly price (a whole number, 0–1,000,000).
   - Optional: a discipline, which is used only to filter the plan picker. A plan without one fits any discipline.
   - Plans can be retired (not deleted), as with arenas and horses.
3. **Currency.** Each academy has one currency, set on the booking rules page: an ISO code, default `EGP`. Prices show with Western digits, e.g. "1,200 EGP a month".
4. **Riders without a plan can't book.** Staff can still book for them.
5. **Cancelling gives the session back.** A cancelled booking doesn't count towards the limit.
6. **Changing plan mid-week** applies the new limit straight away to the current week's count.

### Payments
7. **Paid months.** "Paid for a month" is a record per rider per calendar month (in the academy's time zone), set or cleared by an admin with one tap. sijjel records who marked it and when. No amounts are stored.
8. **The unpaid-rider rule** is an academy setting on the booking rules page, default **allow**.
   - **Allow:** unpaid riders book normally. The rider's home shows "This month isn't marked paid yet".
   - **Block:** unpaid riders can't book sessions in an unpaid month. The booking is refused with `month_unpaid`.
   - The month checked is the month of the session, not today's month. Staff can always book for the rider.

### Invitations and members
9. **Who invites.** Only academy admins invite in this milestone. Trainers can't.
10. **Inviting a trainer:**
    - Name (required), phone (optional), and the role "trainer".
    - An admin can also invite another admin.
11. **Inviting a rider:**
    - Name (required) and age (required, a whole number). The age must be at least the academy's minimum and at most its maximum, if one is set; otherwise `age_out_of_range`.
    - Phone (optional).
    - Discipline and level (required). The level defaults to the bottom of the ladder.
    - Plan (required).
    - Horse: school horse (the default) or own horse.
12. **Age range** is an academy setting on the booking rules page: minimum default 6, maximum empty. Changing the range doesn't affect existing riders.
13. **Sharing an invitation.** After creating one, staff see:
    - a "Send on WhatsApp" button, which opens `https://wa.me/?text=…` with a short message in the academy's default language plus the link. If a phone was entered, it opens `https://wa.me/<digits>?text=…` instead.
    - a copy button
    - a QR code of the link, generated in the browser
14. **Pending invitations** appear on the member list, with "Copy link again" and "Cancel invitation". The link itself can't be shown again, because only its hash is stored. Copying again creates a new invitation and cancels the old one. Links still work once and expire after 14 days.
15. **Accepting** stays as built in Milestone 1:
    - The person signs up or signs in on the invitation page and becomes an active member with what the invitation set.
    - A rider invitation also sets their age, phone, plan and own-horse choice.
    - The rider's name is pre-filled from the invitation.
16. **The member list** (admins only) shows each member's name, role chips, and age, discipline and level, plan, and this month's paid status for riders. Filters: role and unpaid this month. Tapping a member opens their page, where an admin can:
    - change discipline and level (the level must be on the discipline's ladder), plan, age, phone and horse choice
    - mark this month or next month paid or unpaid
    - suspend or reactivate (suspended members can't sign in to that academy's pages or book; their future bookings stay but are flagged on the board in Milestone 5)
    - register or edit their private horse
17. **Trainers see the member list read-only,** without phone numbers or payments. They need riders' levels for the planning board later.

### Private horses
18. **Fields.** A private horse belongs to exactly one active rider (`owner_membership_id`). It takes the owner's discipline and has a name and notes. It has no level range and no daily limit.
19. **Booking with the own horse.** Riders whose membership says "own horse" always book with their own horse. A rider with an own-horse choice but no registered horse can't book (`no_own_horse`).
20. **One slot at a time.** A private horse can't be in two bookings in the same slot. That can only happen through staff booking.

### Booking
21. **Slots.** Riders see slots from now until the end of the booking window. A slot can be booked when all of these hold:
    - it starts after now plus "booking closes" hours
    - it is within the booking window
    - it isn't on a closed date
    - rider places are left (the sum of active arena capacities, minus active bookings in that slot)
    - the rider has no booking in that slot
    - the weekly limit isn't reached
    - the unpaid rule allows it
    - a horse is available: for school-horse riders, `CanAccept`; for own-horse riders, their horse isn't already booked in that slot
22. **Reason codes,** shown per slot when it can't be booked:
    - `closed`, `past`, `too_soon`, `outside_window`
    - `full`, `already_booked`
    - `weekly_limit`, `month_unpaid`, `no_plan`
    - `no_suitable_school_horse`, `own_horse_busy`, `no_own_horse`
23. **The slot list for riders** shows each day's slots as `SessionSlot` rows: time, places left, and either a "Book" button or the reason in plain words. School-horse riders also see "suitable horses free: n". The list scrolls a week at a time.
24. **Booking** is one tap, with a confirmation showing the time and "school horse" or the horse's name.
    - The rider's home lists upcoming bookings with a "Cancel" button, available until the cutoff.
    - Past bookings stay visible for 30 days.
25. **Cancelling:**
    - Riders can cancel until `cancellationCutoffHours` before the start; after that the button reads "Ask the academy to cancel".
    - Staff can always cancel. `cancelled_by` records who cancelled.
26. **Staff booking for a rider.** From the member page, staff pick a rider and a slot. The same checks apply, except:
    - the weekly limit and unpaid rule become warnings that staff confirm
    - "booking closes" and the window don't apply; the slot must still be in the future and not on a closed date
    - capacity, the horse check and one-booking-per-slot stay hard rules
27. **Concurrency.** The booking transaction takes `pg_advisory_xact_lock(academy, date)` as the main spec describes, so two riders racing for the last suitable horse get one 201 and one 409.
28. **The weekly limit** is checked inside the same transaction and lock. The lock is held per academy and day, but the week spans several days, so the check also takes a per-rider row lock on the membership.
29. **Arenas and trainers** aren't assigned at booking time. Bookings have no arena until the planning board.

### Settled after the builder check
31. **Closing days that have bookings.** Adding a closed range that covers active future bookings is refused with `bookings_affected` and the list of bookings, unless the request carries `confirm: true`. In that case those bookings are cancelled in the same transaction (`cancelled_by` is the admin, and the rider sees "Cancelled by the academy"). Saving opening hours, session length or break in a way that would leave active future bookings off the slot grid is refused with `bookings_affected` and the list. No silent changes.
32. **Several roles per person.** Admins edit a member's roles on the member page. Adding "rider" requires the rider fields (Call 11). Removing a member's last admin role is refused when they are the academy's only admin (`last_admin`). Accepting an invitation when already a member still returns `already_member`; roles are changed on the member page. When a member books **for themselves**, rider rules apply, even if they are also staff. When staff book **for someone else**, staff rules apply (Call 26).
33. **Trainers count as staff** for booking and cancelling on a rider's behalf, and for `GET /api/slots?for=`. The member list stays read-only for them, without phone numbers or payments, but shows "Book for this rider".
34. **Horse and status changes:**
    - Private horses are retired (`is_active = false`), never deleted. `DELETE /api/academy/members/{id}/horse` retires the rider's horse.
    - Changing a rider's horse choice, or retiring their private horse, is refused while they have active future bookings that depend on it (`bookings_affected`, with the list).
    - Suspending a member asks for confirmation when they have active future bookings, and those bookings are cancelled with the suspension. A suspended member's bookings therefore never hold places or horses.
35. **Phone numbers.**
    - Each academy has a calling code (`country_calling_code`, default `20`, set on the booking rules page).
    - Phones are stored in international digits: a local number that starts with `0` has the 0 replaced by the code (`01012345678` → `201012345678`), and a number starting with `+` keeps its own code.
    - Valid numbers have 8–15 digits after normalisation, otherwise `phone_invalid`.
    - WhatsApp links use the stored digits.

### Weight (added by the user during the build)
36. **Rider weight limit.** Some academies only accept riders up to a weight, for example 80 kg.
    - The academy has an optional maximum rider weight in kg (`max_rider_weight_kg`, 20–200, empty by default), set on the booking rules page.
    - Riders have an optional weight in whole kg (`weight_kg`, 10–250), set on the invitation and the member page.
    - When the academy has a limit, the rider's weight is required, and a weight above the limit is refused with `weight_out_of_range`, like the age range.
    - Changing the limit doesn't affect existing riders.

### Visibility
30. **Riders can read** the academy's opening hours, closed dates and booking rules through the slot API. They see only their own bookings, plan and payment status. They never see horse names other than their own private horse, only counts.

## Data changes (new migration)

- **`academies`:**
  - `currency text NOT NULL DEFAULT 'EGP'` (CHECK: 3 uppercase letters)
  - `unpaid_booking text NOT NULL DEFAULT 'allow'` (CHECK: in `allow`, `block`)
  - `min_rider_age smallint NOT NULL DEFAULT 6` (CHECK: 3–99)
  - `max_rider_age smallint` (CHECK: NULL or ≥ the minimum, ≤ 120)
  - `country_calling_code text NOT NULL DEFAULT '20'` (CHECK: 1–3 digits)
- **`plans`:**
  - `id`, `academy_id`
  - `name_en`, `name_ar`
  - `sessions_per_week smallint` (1–14)
  - `monthly_price integer` (0–1,000,000)
  - `discipline_id` (nullable, FK to `academy_disciplines`)
  - `is_active`, `created_at`
- **`memberships`** gains:
  - `display_name` (copied from the invitation and editable by staff)
  - `phone` (nullable, ≤ 30)
  - `age smallint` (nullable for staff)
  - `plan_id` (nullable FK to `plans`)
  - `horse_source text` (`school` | `own`, nullable for staff)
- **`invites`** gains the same rider fields: `phone`, `age`, `plan_id`, `horse_source`.
- **`monthly_payments`:**
  - `academy_id`, `membership_id`
  - `month date` (always the 1st)
  - `marked_by`, `marked_at`
  - Primary key `(membership_id, month)`.
- **`horses`:**
  - `kind` allows `private`
  - `owner_membership_id` (required for private, NULL for school)
  - `min_level_id`, `max_level_id` and `max_sessions_per_day` become nullable, but stay required for school horses (CHECK on kind)
  - A private horse's `discipline_id` must equal its owner's discipline. This is enforced in the app, and corrected when the owner's discipline changes.
- **`bookings`,** as in the main spec:
  - `id`, `academy_id`, `rider_membership_id`
  - `date`, `start_time`, `end_time`, `starts_at`
  - `horse_source`, `own_horse_id`
  - `status`, `cancelled_at`, `cancelled_by`, `created_by`, `created_at`
  - `arena_id` and `assigned_horse_id` (nullable, unused until Milestone 5)
  - Partial unique indexes over active bookings on `(rider_membership_id, date, start_time)` and `(own_horse_id, date, start_time)`.

## API (academy host)

| Method and path | Who | Purpose |
|---|---|---|
| `GET` / `POST /api/academy/plans`, `PUT /api/academy/plans/{id}` | admin | Plans. |
| `GET` / `PUT /api/academy/booking-rules` | admin | Gains `currency`, `unpaidBooking`, `minRiderAge`, `maxRiderAge`. |
| `POST /api/academy/invites` | admin | Create a trainer, admin or rider invite. Returns `{inviteId, url, expiresAt}`. Refused with `setup_incomplete` until setup is done. |
| `GET /api/academy/invites`, `POST /api/academy/invites/{id}/revoke`, `POST /api/academy/invites/{id}/renew` | admin | Pending invitations. Renew issues a new link and revokes the old one. |
| `GET /api/academy/members`, `GET` / `PUT /api/academy/members/{id}` | admin (trainer: read-only, no phone or payments) | Member list and detail. |
| `POST` / `DELETE /api/academy/members/{id}/payments/{month}` | admin | Mark or unmark a month (`YYYY-MM`) as paid. |
| `POST /api/academy/members/{id}/suspend`, `POST /api/academy/members/{id}/reactivate` | admin | Change member status. |
| `PUT /api/academy/members/{id}/horse`, `DELETE /api/academy/members/{id}/horse` | admin | The rider's private horse. |
| `GET /api/slots?from&to` | rider (own view) or staff with `?for={memberId}` | Slots with `placesLeft`, `canBook`, `reason`, `suitableHorsesFree`. |
| `GET /api/me/bookings`, `POST /api/bookings`, `POST /api/bookings/{id}/cancel` | rider (own) or staff (`riderId` in the body) | Booking and cancelling. |
| `GET /api/me/plan` | rider | Plan, price, currency, sessions left this week, and whether this month is paid. |

New error codes, each translated (`error_<code>`):
- `setup_incomplete`, `age_out_of_range`, `plan_required`, `plan_not_found`, `price_invalid`, `sessions_per_week_invalid`, `currency_invalid`, `age_range_invalid`, `phone_invalid`, `member_not_found`, `month_invalid`, `not_a_rider`
- every slot reason code in Call 22, also used as 409 codes on `POST /api/bookings`
- `bookings_affected` (409, with the bookings listed), `last_admin`
- `booking_not_found`, `cancel_too_late`, `warning_required` (staff must confirm a weekly-limit or unpaid warning)

## Web

- **Admin navigation** adds **Members** (Home, Members, Horses, Settings).
- **Settings:**
  - a "Plans" page
  - the booking rules page gains currency, the unpaid-rider rule and the age range
- **Members** (`/members`): the list, a pending invitations section, "Invite someone", and member pages (`/members/[id]`) with the actions in Call 16 plus "Book for this rider".
- **The invite flow:** choose a role, then the form from Calls 10 and 11. The result card has a WhatsApp button, a copy button and a QR code.
- **The rider's home** replaces "Booking opens soon" with:
  - upcoming bookings
  - "2 of 3 left this week", and the plan with its price
  - the paid status for this month
  - a "Book a session" button opening `/book`, which shows the week's slots
- **Trainers** see Home and Members (read-only) in this milestone.
- **Building blocks:** everything uses the sijjel UI kit (`SessionSlot` already exists in it), mobile first, in EN and AR with RTL, light and dark.

## Testing

- **Domain unit tests:** the main spec's allocator cases (3 beginners and 2 suitable horses, discipline and level filtering, greedy-fails-where-flow-succeeds, the daily limit across slots, unavailable and inactive horses), plus the weekly window (Saturday start, across a month boundary) and the booking rules (too soon, outside the window, past, cancellation cutoff).
- **API integration tests:**
  - every endpoint, tenant isolation and role checks
  - two concurrent bookings for the last suitable horse: one 201, one 409
  - two concurrent bookings that would exceed the weekly limit: one succeeds
  - the unpaid rule in both modes
  - staff warnings
  - the age range
  - setup-incomplete blocking invites
- **Web:**
  - Vitest for the form helpers (invite, plan, age, WhatsApp link building) and the slot reason texts
  - the Playwright e2e on the throwaway stack: the owner sets up the academy, creates a plan, invites a rider (WhatsApp link present), the rider accepts, sees "3 of 3 left this week", books a slot, sees "2 of 3 left", and cancels; the owner marks the month paid
