# sijjel-web Milestone 4: Members, plans and booking — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Riders book and cancel sessions from their academy home and see what's left of their weekly plan. Academy staff work in four places:
- **Settings:** plans and member-related booking rules
- **Members:** invite people (WhatsApp, copy link or QR code) and manage the list
- **Member pages:** levels, plans, payments, roles, private horses and suspension
- **Booking for a rider**

**Architecture:**
- **Routes:**
  - Admin pages extend the `(academy)/(admin)` group.
  - Pages that trainers can also open live in a new `(academy)/(staff)` group with its own guard.
  - Rider pages (`/book`) live in `(academy)/(rider)`.
- **Data and forms:** as in Milestone 3, loads use `apiLoad`, writes use `api()`, and form logic lives in tested helpers under `src/lib/forms`.
- **QR codes** come from the `qrcode` package, rendered to an SVG string in the browser.

**Tech Stack:** SvelteKit 3.1 / Svelte 5, TypeScript, Paraglide JS 2, Vitest 4.1, Playwright 1.64, `qrcode` 1.5.4 (new dependency).

**Spec:** `docs/superpowers/specs/2026-10-18-members-and-booking-design.md` (Calls referenced as (Call N)), with the main spec and the Milestone 3 design.

**Depends on:** the sijjel-api plan `2026-10-18-api-m4-members-booking.md`, for its endpoints, JSON shapes and codes:
- **Plans:** `{id,nameEn,nameAr,sessionsPerWeek,monthlyPrice,discipline,isActive}`.
- **Booking rules** add `currency`, `unpaidBooking`, `minRiderAge`, `maxRiderAge` and `countryCallingCode`.
- **Invites:**
  - `POST /api/academy/invites` takes `{role,name,phone?,age?,disciplineId?,levelId?,planId?,horseSource?}` and returns `{inviteId,token,url,expiresAt}`.
  - The list and renew endpoints exist alongside it.
- **Members:**
  - Each member has `{id,displayName,email,roles,status,phone?,age,discipline,level,plan,horseSource,privateHorse,paidThisMonth?,upcomingBookings}`.
  - Writes: `PUT` the member, `suspend` (`{confirm}`), `reactivate`, `payments/{YYYY-MM}`, and `PUT`/`DELETE` the private horse.
- **Slots:** `GET /api/slots?from&to[&for]` returns `[{date,start,end,placesLeft,canBook,reason,suitableHorsesFree,suitableHorsesTotal,booked,bookingId}]`.
- **Bookings:**
  - `POST /api/bookings` takes `{date,start,riderId?,confirm?}`.
  - `POST /api/bookings/{id}/cancel`, `GET /api/me/bookings` and `GET /api/academy/members/{id}/bookings` handle the rest.
  - A booking is `{id,date,start,end,horseSource,ownHorseName,status,canCancel}`.
- **Rider plan:** `GET /api/me/plan` returns `{plan,currency,sessionsPerWeek,usedThisWeek,leftThisWeek,weekStart,weekEnd,paidThisMonth,unpaidBooking}`.
- **`bookings_affected`** (409) carries `bookings:[{id,riderName,date,startTime}]`. **`warning_required`** carries `warnings:[codes]`.

**Branch:** `feat/m4-members-booking`.

## Global Constraints

- **Environment:** Node 24, via `export PATH="$(dirname "$(fnm exec --using=24.22.0 which node)"):$PATH"`.
- **UI kit:**
  - Use only the sijjel UI kit and `sj-` classes, with tokens and logical CSS only.
  - Touch targets are at least 44px, copy is in sentence case, and times are 24-hour with Western digits.
  - The bottom bar shows below 720px.
- **Strings:**
  - Every string is in `messages/en.json` and `messages/ar.json`.
  - Every new API code has an `error_<code>` key.
  - Every slot reason has a `slot_reason_<code>` key.
- **`errorText`/`fieldText` and `focusFirstInvalid`** are used as in Milestone 3.
- **The `ApiError` class** gains `extra: Record<string, unknown>`, parsed from the problem body. Unknown keys other than `type`, `title`, `status`, `code` and `errors` go there.
- **Prices** use `formatMoney(amount, currency, locale)`, which is `Intl.NumberFormat` with `ar-u-nu-latn` for Arabic: "1,200 EGP".
- **Weeks** run Saturday to Friday. The `/book` page shows one week at a time.
- **Comments and commits** follow the same rules as Milestone 3. Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Checks:** `npx vitest --run`, `npm run check` (0/0), `npx eslint .`, `npx prettier --check src messages e2e`, and `npx playwright test`. The e2e suite needs the `sijjel-api-api` image built from the API's Milestone 4 branch.
- **Manual checks** use the throwaway `sijjel-e2e` stack, never the dev database.

## Review Focus

1. **A booking refused after the slot list loaded** (another rider took the last suitable horse): the rider sees the reason in plain words, the slot list refreshes, and the rider isn't left on a stale "Book" button. Pinned in Task 5 by `bookingErrorText` + reload on 409.
2. **Staff warnings:** a `warning_required` response shows the warnings and a "Book anyway" confirmation, then resends with `confirm: true`. A second click must never double-book. The button is disabled while busy. Pinned in Task 6.
3. **WhatsApp link building with Arabic text and a missing phone:** the message is URI-encoded, and with no phone it uses `wa.me/?text=`. Pinned in Task 3 (`whatsappLink`).
4. **`bookings_affected` on closed dates, hours and suspension:** the admin sees the affected bookings listed with rider names, and can confirm (closed dates and suspension) or go back (hours). Nothing is cancelled without that confirmation. Pinned in Task 7.
5. **A rider with no plan, an own horse with none registered, or an unpaid month in block mode:** the rider's home explains why booking isn't possible instead of showing an empty slot list. Pinned in Task 5 (`riderBlockReason`).

---

### Task 1: Types, messages, navigation, plans page and booking-rules additions

**Files:**
- Create: `src/lib/api/member-types.ts`, `src/lib/money.ts`, `src/lib/forms/plan.ts`, `src/routes/(academy)/(admin)/settings/plans/+page.server.ts`, `+page.svelte`
- Modify: `src/lib/api/errors.ts` (`extra`), `src/lib/forms/booking-rules.ts`, the booking-rules page, `src/routes/(academy)/(admin)/settings/+page.svelte` (add the Plans row), `src/routes/+layout.svelte` (nav), the messages files
- Test: `src/lib/money.test.ts`, `src/lib/forms/plan.test.ts`, `src/lib/forms/booking-rules.test.ts` (extend), `src/lib/api/errors.test.ts` (extend), `src/lib/messages.test.ts` (extend the code list)

**Interfaces:**
- Produces:
  - **Types:** `Plan`, `PlanInput`, `Member`, `MemberInput`, `PendingInvite`, `CreatedAcademyInvite`, `SlotView`, `BookingView`, `PlanSummary`, `AffectedBooking`, matching the header shapes. `BookingRules` gains its new fields.
  - **Money:** `formatMoney(amount: number, currency: string, locale: Locale): string`.
  - **Plan form:** `planErrors(p: {nameEn,nameAr,sessionsPerWeek,monthlyPrice}): FieldErrors`, mirroring the API.
  - **Booking-rules form:** `bookingRulesErrors` gains `currency` (`^[A-Z]{3}$`, else `currency_invalid`), `minRiderAge` (3–99) and `maxRiderAge` (empty, or ≥ min and ≤ 120, else `age_range_invalid`), plus `countryCallingCode` (1–3 digits, else `phone_invalid`).
  - **Navigation:**
    - Admins: Home, Members, Horses, Settings.
    - Trainers: Home, Members.
    - Riders: Home.
  - **Plans page:** a list of plans (name, "{n} a week", price, discipline chip, Retired chip), a "New plan" card and inline edit.

- [ ] **Step 1: Write the failing tests:**
  - `formatMoney(1200,'EGP','en')` → `"EGP 1,200"`, or whatever `Intl` gives for `en`. Assert it contains `1,200` and `EGP`. In `ar`, assert there are no Arabic-Indic digits.
  - `planErrors`: sessions 0 → `sessions_per_week_invalid`; price −1 → `price_invalid`; a blank `nameAr` → `name_required`.
  - Booking rules: `currency:'egp'` → `currency_invalid`; min 10, max 8 → `age_range_invalid`.
  - `ApiError` parsing keeps `extra.bookings`.
  - The message test lists the new error codes and slot reason codes.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify** with the tests, check and lint. Then, on the throwaway stack, create a plan and see it in the list, and save the currency and age range.
- [ ] **Step 5: Commit** `feat: add plans and member settings for academies`

---

### Task 2: Staff route group and the member list

**Files:**
- Create: `src/routes/(academy)/(staff)/+layout.server.ts`, `src/routes/(academy)/(staff)/members/+page.server.ts`, `+page.svelte`, `src/lib/academy/staff.ts`
- Test: `src/lib/academy/staff.test.ts`

**Interfaces:**
- Produces:
  - `isAcademyStaff(m: Membership | null): boolean`: active, with the admin or trainer role.
  - **The `(staff)` guard** works like the `(admin)` guard, using `isAcademyStaff`.
  - **Members page:**
    - A "Pending invitations" card (admins only), with role, name, expiry, "Copy link again" (`renew`, then the result card from Task 3) and "Cancel".
    - The member list: avatar initials, name, role chips, age, discipline and level, the plan, a red "Unpaid this month" chip (admins), and a Suspended chip.
    - Role and unpaid filters as link pills.
    - An "Invite someone" button (admins).

- [ ] **Step 1: Write the failing tests:** `isAcademyStaff` is true for an active trainer or admin, and false for a rider, a suspended admin or `null`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify:**
  - The tests, check and lint pass.
  - On the stack, an admin sees pending invitations and members.
  - A trainer sees the list without the unpaid chip.
  - A rider on `/members` gets 403.
- [ ] **Step 5: Commit** `feat: list academy members and pending invitations`

---

### Task 3: Invite flow with WhatsApp, copy and QR code

**Files:**
- Create:
  - `src/lib/forms/invite-member.ts`, `src/lib/share.ts`
  - `src/lib/components/InviteMemberForm.svelte`, `src/lib/components/InviteShareCard.svelte`
  - `src/routes/(academy)/(admin)/members/invite/+page.server.ts`, `+page.svelte`
- Modify: `package.json` (add `qrcode` and `@types/qrcode`)
- Test: `src/lib/forms/invite-member.test.ts`, `src/lib/share.test.ts`

**Interfaces:**
- Produces:
  - **Invite form:** `inviteMemberErrors(f: InviteMemberForm, rules: {minRiderAge, maxRiderAge}): FieldErrors`. For riders it requires the name, the age within the range (`age_out_of_range`), the discipline and level, and the plan (`plan_required`).
  - `toInviteRequest(f)`: trims, drops blank optional fields, and sends rider fields only for riders.
  - **WhatsApp:** `whatsappLink(url: string, message: string, phoneDigits?: string | null): string`, giving `https://wa.me/{digits}?text={encodeURIComponent(message + ' ' + url)}`. Without a phone the path is `wa.me/?text=…`.
  - `inviteMessage(academyName, role, locale)`, built from messages (`invite_share_message_rider` / `_staff`) in the academy's default language.
  - **`InviteShareCard`:** props `{ invite: CreatedAcademyInvite; academyName; locale; phone? }`. It shows:
    - a "Send on WhatsApp" link button (`target="_blank"`, `rel="noopener"`)
    - the copy field, reusing `InviteLink`
    - a QR code SVG from `QRCode.toString(url, {type:'svg', margin:1})`, rendered with `{@html}` after generation in `onMount`. It is the only `{@html}`; the input is a URL we built, and the output is the library's SVG.
  - **The invite page:**
    - A role choice (Rider default, Trainer, Admin).
    - For riders, the discipline picker, a level picker defaulting to the bottom of the ladder, an age field (with a "Minimum {n}" hint), a plan picker (plans for that discipline or with no discipline), and school or own horse.
    - On success it shows `InviteShareCard`.

- [ ] **Step 1: Write the failing tests:**
  - `whatsappLink('https://a.test/invite/x', 'أهلًا', '201012345678')` starts with `https://wa.me/201012345678?text=` and contains the encoded Arabic and URL.
  - Without a phone it starts with `https://wa.me/?text=`.
  - `inviteMemberErrors`: rider age 5 with min 6 → `age_out_of_range`; no plan → `plan_required`; a trainer with a name only → `{}`.
  - `toInviteRequest` drops `planId` for trainers.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement**, including `npm install qrcode@1.5.4 && npm install -D @types/qrcode@1.5.5`.
- [ ] **Step 4: Verify:**
  - The tests, check and lint pass.
  - On the stack, invite a rider: the share card shows a WhatsApp link with the phone digits and a QR code, and copying works.
  - Opening the link and signing up gives the rider their level and plan.
- [ ] **Step 5: Commit** `feat: invite riders and staff and share the link by WhatsApp or QR code`

---

### Task 4: Member page — details, roles, payments, private horse, suspension

**Files:**
- Create:
  - `src/routes/(academy)/(staff)/members/[id]/+page.server.ts`, `+page.svelte`
  - `src/lib/forms/member.ts`, `src/lib/components/AffectedBookings.svelte`
- Test: `src/lib/forms/member.test.ts`, `src/lib/components/affected-bookings.svelte.test.ts`

**Interfaces:**
- Produces:
  - **Member form:**
    - `memberFormFrom(m: Member): MemberForm` and `toMemberInput(f): MemberInput`.
    - `memberErrors(f, rules)` uses the rider rules from Task 3 whenever `roles` includes `rider`.
  - **Months:** `monthKey(date: string): string` (`"2026-10-19"` → `"2026-10"`) and `nextMonth("2026-12")` → `"2027-01"`.
  - **`AffectedBookings`:** props `{ bookings: AffectedBooking[]; locale; confirmLabel?: string; onconfirm?: () => void; oncancel: () => void }`. It lists "{riderName} · {date} {startTime}", with a confirm button when `onconfirm` is given.
  - **The member page** (admin; trainers see a read-only version):
    - details: name, email, phone with a WhatsApp link, age, roles
    - rider: discipline and level, plan, horse choice
    - "This month: Paid / Not paid" and "Next month" toggles
    - the private horse card (name, notes, Retire)
    - Suspend / Reactivate. A `bookings_affected` response shows `AffectedBookings` with "Suspend and cancel these bookings".
    - an "Upcoming bookings" list with Cancel
    - a "Book for this rider" button, linking to `/members/{id}/book` (Task 6)

- [ ] **Step 1: Write the failing tests:**
  - `monthKey` and `nextMonth` work, including the December rollover.
  - `memberErrors` for `['admin','rider']` with no plan → `plan_required`.
  - The `AffectedBookings` component lists 2 bookings, and the confirm button calls `onconfirm`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify:**
  - The tests, check and lint pass.
  - On the stack: mark a rider paid and see the chip clear on the list.
  - Register a private horse.
  - Suspend a rider who has a booking, see the list of affected bookings, and confirm.
- [ ] **Step 5: Commit** `feat: manage a member's level, plan, payments, horse and status`

---

### Task 5: Rider home and booking a session

**Files:**
- Create:
  - `src/routes/(academy)/(rider)/+layout.server.ts` (active member with the rider role, else 403)
  - `src/routes/(academy)/(rider)/book/+page.server.ts`, `+page.svelte`
  - `src/lib/forms/booking.ts`, `src/lib/components/RiderHome.svelte`
- Modify: `src/routes/+page.server.ts` (riders load `/api/me/plan` and `/api/me/bookings`), `src/routes/+page.svelte`
- Test: `src/lib/forms/booking.test.ts`

**Interfaces:**
- Produces:
  - **Reasons:**
    - `slotReasonText(reason: string, locale): string`, using `slot_reason_<code>` messages (e.g. `no_suitable_school_horse` → "No suitable school horse is free").
    - `bookingErrorText(e: ApiError, locale)`, which uses the slot reason text for slot codes, else `errorText`.
  - **Weeks:** `weekStartOf(date: string): string` (the Saturday on or before) and `shiftWeek(start, n)`.
  - **Grouping:** `groupByDate(slots: SlotView[]): {date, slots}[]`.
  - **Blocked riders:** `riderBlockReason(plan: PlanSummary | null, member: Membership & {horseSource?, hasOwnHorse?}): string | null`, giving `no_plan`, `no_own_horse`, `month_unpaid` (block mode and unpaid) or `null`.
  - **`RiderHome`:**
    - the plan card: plan name, price via `formatMoney`, and "{left} of {perWeek} left this week" as a `ProgressBar`
    - the paid status ("This month isn't marked paid yet" in allow mode)
    - the upcoming bookings as `SessionSlot` rows, each with Cancel when `canCancel`, else "Ask the academy to cancel"
    - a "Book a session" button
    - the block reason text when `riderBlockReason` isn't null
  - **The `/book` page:**
    - week navigation (previous and next, with this week first)
    - days as headings, and slots as `SessionSlot` rows: time, "{placesLeft} places left", and "suitable horses free: n" for school riders
    - a "Book" button, or the reason text
    - booking asks for confirmation ("Book Monday 18:00 on a school horse?"), POSTs, shows a success banner and reloads the week
    - a 409 shows `bookingErrorText` and reloads
- **The home page:** for academy members with the rider role it renders `RiderHome`. For admins who are also riders, it shows both the checklist and `RiderHome`. Staff-only members see the membership card as now.

- [ ] **Step 1: Write the failing tests:**
  - `weekStartOf('2026-10-19')` → `'2026-10-17'`, and `weekStartOf('2026-10-31')` → `'2026-10-31'`.
  - `shiftWeek('2026-10-17', 1)` → `'2026-10-24'`.
  - `groupByDate` keeps date order.
  - `slotReasonText('weekly_limit','en')` is the message text.
  - `riderBlockReason`:
    - a null plan → `no_plan`
    - block mode, unpaid → `month_unpaid`
    - allow mode, unpaid → `null`
    - own horse without one → `no_own_horse`
  - `bookingErrorText(new ApiError(409,'no_suitable_school_horse'))` uses the slot reason text.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify:**
  - The tests, check and lint pass.
  - On the stack as a rider: the home shows "2 of 2 left this week"; book a slot and see "1 of 2 left" and the booking listed; cancel it.
  - With 1 horse, two riders booking the same slot: the second sees "No suitable school horse is free".
  - The page works in Arabic RTL.
- [ ] **Step 5: Commit** `feat: let riders book and cancel sessions from their academy home`

---

### Task 6: Staff booking for a rider

**Files:**
- Create: `src/routes/(academy)/(staff)/members/[id]/book/+page.server.ts`, `+page.svelte`
- Modify: `src/lib/forms/booking.ts` (warnings)
- Test: `src/lib/forms/booking.test.ts` (extend)

**Interfaces:**
- Consumes: the slot rendering pieces from Task 5. Extract `WeekSlots.svelte` into `src/lib/components` and use it on both pages.
- Produces:
  - `warningTexts(e: ApiError, locale): string[] | null`: `extra.warnings` mapped through `slotReasonText` when `code === 'warning_required'`.
  - **The staff booking page:**
    - "Booking for {rider}"
    - the week of slots from `GET /api/slots?for={id}`
    - booking POSTs `{date,start,riderId}`
    - on `warning_required` it shows a pending `Banner` with the warnings and a "Book anyway" button, which resends with `confirm: true`
    - buttons are disabled while busy

- [ ] **Step 1: Write the failing tests:**
  - `warningTexts(new ApiError(409,'warning_required',{},{warnings:['weekly_limit']}),'en')` → `[weekly limit text]`.
  - A non-warning error → `null`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify:**
  - The tests, check and lint pass.
  - On the stack, as an admin, book for a rider past their limit, see the warning, and book anyway.
  - As a trainer, the page works too.
- [ ] **Step 5: Commit** `feat: let staff book sessions on a rider's behalf`

---

### Task 7: Hours and closed-date changes that affect bookings

**Files:**
- Modify: `src/routes/(academy)/(admin)/settings/hours/+page.svelte`, `src/routes/(academy)/(admin)/settings/closed-dates/+page.svelte`, `src/lib/forms/closed-dates.ts` (`toDateRangeInput(form, confirm?)`)
- Test: `src/lib/forms/closed-dates.test.ts` (extend)

**Interfaces:**
- Consumes: `AffectedBookings` (Task 4).
- Produces:
  - **The hours page:** a `bookings_affected` response shows `AffectedBookings` (no confirm button) with `hours_affected_body` ("These bookings would no longer fit. Cancel them first, or keep the current hours.").
  - **The closed-dates page:** a `bookings_affected` response shows `AffectedBookings` with "Close these days and cancel the bookings", which resends with `confirm: true`.

- [ ] **Step 1: Write the failing test:** `toDateRangeInput({from,to,reason:''}, true)` includes `confirm: true`; without the flag it omits `confirm`.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Verify** with the tests, check and lint. On the stack, close a day that has a booking: see the list, confirm, and the booking is cancelled.
- [ ] **Step 5: Commit** `feat: show bookings affected by hours and closed-date changes`

---

### Task 8: End-to-end booking journey and docs

**Files:**
- Create: `e2e/booking.e2e.ts`
- Modify: `e2e/helpers.ts` (add `setUpAcademy(owner, slug)`, which reuses the setup journey's steps, and `inviteRider(owner, opts)`), `README.md`

**Interfaces:**
- Consumes: everything above.

- [ ] **Step 1: Write `booking.e2e.ts`.** The owner:
  1. sets up the academy (helper)
  2. creates the plan "Dressage, 2 a week" at 1,000
  3. invites the rider Layla (age 14, Dressage Intro, the plan); the share card has a `wa.me` link and an `svg` QR code
  4. Layla signs up on the link and sees "2 of 2 left this week"
  5. Layla opens "Book a session" and books the first bookable slot; she sees "1 of 2 left this week" and the booking on her home
  6. Layla cancels it and sees "2 of 2 left"
  7. the owner opens Members, sees Layla "Unpaid this month", marks her paid, and the chip clears
- [ ] **Step 2: Run `npx playwright test`.** Expected: all pass (4 tests). The API image must first be rebuilt from the Milestone 4 API branch.
- [ ] **Step 3: Update `README.md`:** members and booking pages, and the QR dependency.
- [ ] **Step 4: Run every check.** Expected: pass.
- [ ] **Step 5: Commit** `test: cover inviting a rider and booking a session end to end`
