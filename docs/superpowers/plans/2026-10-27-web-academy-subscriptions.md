# Academy Subscriptions (Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the platform admin packages, each academy's subscription with payments, free time,
undo and block, and a list showing who is unpaid. Show academy admins what they owe, and show
riders and staff when booking is paused.

**Architecture:**
- Types go in `src/lib/api/subscription-types.ts`.
- Pure helpers go in `src/lib/forms/subscription.ts`: status tone, urgency sort, filter, and the
  owed and riders texts.
- The platform gets `/platform/packages` and `/platform/academies/[id]`.
- The academy side reads `membership.subscription` and `membership.bookingPaused`, which the root
  layout already reloads on every navigation, for one `SubscriptionBanner`. Admins get
  `/settings/subscription`.

**Tech Stack:** SvelteKit / Svelte 5 SSR, Paraglide EN/AR, Vitest browser tests, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-27-academy-subscriptions-design.md`. The API plan
(`sijjel-api/docs/superpowers/plans/2026-10-27-api-academy-subscriptions.md`) fixes the JSON
shapes used here.

## Global Constraints

- **Words.** EN "package", AR "باقة". Never "plan" for what an academy pays sijjel. Riders' plans keep "plan" / "خطة".
- **Statuses** `no_package | free | paid | due_soon | unpaid`. Blocked is a separate boolean.
- **No payment wording for riders or trainers.** They only ever see "Booking is paused at this academy. Please contact the academy." / "الحجز متوقف في هذه الأكاديمية. يرجى التواصل مع الأكاديمية."
- **Fixed copy for academy admins (EN / AR):**
  - Due soon: "Your sijjel subscription is due on {date}." / "يستحق اشتراكك في سجل يوم {date}."
  - Unpaid: "Unpaid: {months} · {amount}. Your sijjel subscription was due on {date}." / "غير مدفوع: {months} · {amount}. كان اشتراكك في سجل مستحقًا يوم {date}."
  - Blocked: "Booking is paused at your academy until your sijjel subscription is paid." / "الحجز متوقف في أكاديميتك حتى يُدفع اشتراكك في سجل."
  - How to pay, after every admin banner: "Pay by InstaPay or cash and let us know." / "ادفع عبر InstaPay أو نقدًا وأخبرنا."
  - Rider limit: "You've reached your package's rider limit. Ask sijjel to move you to a bigger package." / "وصلت إلى حد الفرسان في باقتك. اطلب من سجل نقلك إلى باقة أكبر."
- **Money** is shown with the existing money formatter, in EGP.
- **Phones.** Everything works at 390 px and right to left.

## Review Focus

1. **A rider or trainer at a blocked academy never sees payment wording.** Pinned in Task 4 (`subscription-banner.svelte.test.ts`: `riders see only that booking is paused`).
2. **An academy with no package shows no banner and no "of N" limit.** Pinned in Task 4 (`shows nothing without a package`) and Task 5 (`ridersText` with a null limit).
3. **The first-time package form shows "Free days to start with" (default 30), and only while the academy has no entries.** Pinned in Task 3 (`academy-subscription.svelte.test.ts`).
4. **Undo appears only on the newest entry.** Pinned in Task 3.
5. **The academies list sorts the most months owed first and filters by status.** Pinned in Task 1 (`sortByUrgency`, `matchesFilter`).

---

### Task 1: Types, helpers and messages

**Files:**
- Create: `src/lib/api/subscription-types.ts`, `src/lib/forms/subscription.ts`, `src/lib/forms/subscription.test.ts`
- Modify:
  - `src/lib/api/types.ts`: `AcademySummary` and `Membership`
  - `messages/en.json`, `messages/ar.json`
  - `src/lib/messages.test.ts`: the new error codes

**Interfaces:**
- Produces:
  - **Types:**
    - `SubscriptionStatus`
    - `Package { id; nameEn; nameAr; maxRiders: number | null; monthlyPrice; isActive }`
    - `PackageInput { nameEn; nameAr; maxRiders: number | null; monthlyPrice; isActive }`
    - `SubscriptionEntry { id; kind: 'paid' | 'free'; amount: number | null; method: 'instapay' | 'cash' | 'other' | null; days: number | null; note: string | null; startsOn; endsOn; madeBy; madeAt }`
    - `Riders { count; limit: number | null }`
    - `AcademySubscription { package: Package | null; status; paidUntil: string | null; monthsUnpaid; amountUnpaid; blocked; riders: Riders; entries: SubscriptionEntry[] }`
    - `SubscriptionNotice { status; paidUntil: string | null; monthsUnpaid; amountUnpaid; blocked }`
    - `AcademySummary` gains `package; riders; status; paidUntil; monthsUnpaid; blocked`.
    - `Membership` gains `bookingPaused: boolean` and `subscription?: SubscriptionNotice`.
  - **Helpers:**
    - `statusTone(status, blocked): 'active' | 'pending' | 'danger' | 'stone' | 'neutral'`:
      blocked or unpaid gives danger, due_soon gives pending, paid gives active, free gives
      neutral, and no_package gives stone.
    - `type StatusFilter = 'all' | 'unpaid' | 'due_soon' | 'blocked' | 'free' | 'paid' | 'no_package'`
    - `matchesFilter(a: AcademySummary, f: StatusFilter): boolean`
    - `sortByUrgency(list: AcademySummary[]): AcademySummary[]`: most `monthsUnpaid` first, then
      `due_soon`, then by `paidUntil` (nulls last), then by English name.
    - `ridersText(r: Riders, locale): string`: "Riders: 47 of 50", or "Riders: 47" without a limit.
    - `monthsText(n: number, locale): string`: "1 month" or "2 months", with Arabic plural forms.
- **Messages:** every string in Global Constraints, plus:
  - Status names:
    - `subscription_status_free`: "Free" / "مجاني"
    - `subscription_status_paid`: "Paid" / "مدفوع"
    - `subscription_status_due_soon`: "Due soon" / "يستحق قريبًا"
    - `subscription_status_unpaid`: "Unpaid" / "غير مدفوع"
    - `subscription_status_no_package`: "No package" / "بدون باقة"
    - `subscription_blocked`: "Blocked" / "محظور"
  - Error texts:
    - `error_academy_blocked`: the rider sentence
    - `error_rider_limit_reached`: the rider-limit sentence
    - `error_package_required`: "Pick a package." / "اختر باقة."
    - `error_package_not_found`: "This package no longer exists or has been retired." / "هذه الباقة لم تعد موجودة أو تم إيقافها."
    - `error_max_riders_invalid`: "Riders must be between 1 and 100,000, or empty for unlimited." / "يجب أن يكون عدد الفرسان بين 1 و100,000، أو فارغًا لعدد غير محدود."
    - `error_price_invalid`: "Enter a price of 0 or more." / "أدخل سعرًا 0 أو أكثر."
    - `error_days_invalid`: "Days must be between 1 and 366." / "يجب أن تكون الأيام بين 1 و366."
    - `error_amount_invalid`: "Enter an amount of 0 or more." / "أدخل مبلغًا 0 أو أكثر."
    - `error_method_invalid`: "Pick how it was paid." / "اختر طريقة الدفع."
    - `error_note_too_long`: "Notes can be at most 500 characters." / "يمكن أن تكون الملاحظات 500 حرف كحد أقصى."
    - `error_from_today_invalid`: "This academy is still covered, so it can't start from today." / "هذه الأكاديمية ما زالت مغطاة، فلا يمكن البدء من اليوم."
    - `error_entry_not_found`: "There's nothing to undo." / "لا يوجد ما يمكن التراجع عنه."
  - Slot reason: `slot_reason_academy_blocked`: "Booking paused" / "الحجز متوقف"

- [ ] **Step 1: Write `subscription.test.ts`.**
  - `sortByUrgency`: [paid 2026-12-01, unpaid 1, due_soon, unpaid 3, no package] sorts to [unpaid 3, unpaid 1, due_soon, paid, no package].
  - `matchesFilter`: `blocked` matches only `blocked: true`, and `unpaid` matches `status === 'unpaid'` whether or not the academy is blocked.
  - `ridersText({count: 47, limit: 50}, 'en')` is "Riders: 47 of 50", and with `limit: null` it is "Riders: 47".
  - `monthsText(1, 'en')` is "1 month", and `monthsText(2, 'en')` is "2 months".
  - `statusTone('paid', true)` is "danger".
- [ ] **Step 2: Run** `npx vitest run src/lib/forms/subscription.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Compile Paraglide.
- [ ] **Step 4: Run** the same command plus `src/lib/messages.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: subscription types, helpers and texts`.

### Task 2: Packages page

**Files:**
- Create:
  - `src/routes/(platform)/platform/packages/+page.server.ts` and `+page.svelte`
  - `src/lib/components/PackageForm.svelte` and `package-form.svelte.test.ts`
- Modify: `src/routes/+layout.svelte`, adding a platform nav item "Packages" / "الباقات" with icon `sell`

**Interfaces:**
- Consumes: Task 1 types.
- Produces: `PackageForm` props `{ initial?: Package; locale; onsaved: (p: Package) => void; oncancel?: () => void }`.
  - Fields:
    - "Name (English)"
    - "Name (Arabic)"
    - "Riders (empty for unlimited)" / "عدد الفرسان (فارغ لغير محدود)"
    - "Monthly price" / "السعر الشهري"
    - Active
  - It POSTs or PUTs to `/platform/packages`.

- [ ] **Step 1: Write `package-form.svelte.test.ts`.**
  - `sends an empty rider limit as null`: Riders left empty gives a body with `maxRiders: null`.
  - `shows field errors from the API`: a stubbed 422 with `maxRiders: ['max_riders_invalid']` shows its text.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Follow the academy's plans page. The list shows the name, "Up to N riders" / "حتى N فارس" or "Unlimited riders" / "عدد غير محدود من الفرسان", the price a month, and a Retired chip.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** with `feat: platform packages page`.

### Task 3: An academy's subscription page and the academies list

**Files:**
- Create:
  - `src/routes/(platform)/platform/academies/[id]/+page.server.ts` and `+page.svelte`
  - `src/lib/components/AcademySubscription.svelte` and `academy-subscription.svelte.test.ts`
- Modify: `src/routes/(platform)/platform/academies/+page.svelte`
  - Each row links to `/platform/academies/{id}` and shows the package name, `ridersText`, the
    status chip, a Blocked chip, "Paid until {date}", and "Unpaid: {monthsText}".
  - Filter chips use `StatusFilter`, and the list uses `sortByUrgency`.

**Interfaces:**
- Consumes: Task 1.
- Produces: `AcademySubscription` props `{ academyId; subscription: AcademySubscription; packages: Package[]; locale; onchange: (s: AcademySubscription) => void }`, with these sections:
  1. **Package:**
     - A select of active packages, plus the current one if it is retired.
     - It has no "No package" option once the academy has one.
     - "Free days to start with" / "أيام مجانية للبداية" (default 30) shows only while `entries` is empty.
     - Its own Save. It PUTs to `/package`.
  2. **Mark month paid** / "تسجيل دفع شهر":
     - Fields: amount (default the package price), method (InstaPay / Cash / Other), note.
     - "Start from today" / "البدء من اليوم" shows only when the status is `unpaid`.
  3. **Give free time** / "منح وقت مجاني": days and a note.
  4. **Entries:** newest first, for example "Paid month · EGP 1,500 · InstaPay · 15 Nov → 15 Dec · Mona" or "Free · 30 days · 15 Nov → 15 Dec". Undo / "تراجع" appears on the first entry only.
  5. **Block booking** / "إيقاف الحجز", or **Unblock** / "إلغاء الإيقاف", each with an inline confirm.
  - Sections 2 and 3 are hidden until the academy has a package.

- [ ] **Step 1: Write `academy-subscription.svelte.test.ts`**, stubbing `fetch` as in `rider-sheet.svelte.test.ts`.
  - `offers free days only before the first entry`: visible with no entries and no package. The PUT body is `{packageId, freeDays: 30}`.
  - `has no No package option once on a package`
  - `marks a month paid with the package price by default`: the POST body has the package price and `method: 'instapay'`.
  - `shows Start from today only when unpaid`
  - `undo is on the newest entry only`: with 2 entries there is exactly one Undo button, and it calls `DELETE .../entries/latest`.
  - `blocks after confirming`: the PUT `/blocked` body is `{blocked: true}`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** The `[id]` loader loads `/api/platform/academies/{id}/subscription`, `/api/platform/packages`, and the academy's name from `/api/platform/academies`.
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** with `feat: academy subscription admin and list`.

### Task 4: What the academy sees

**Files:**
- Create: `src/lib/components/SubscriptionBanner.svelte` and `subscription-banner.svelte.test.ts`
- Modify:
  - `src/routes/+layout.svelte`: render the banner above `children()` for academy members
  - `src/routes/(academy)/(rider)/book/+page.svelte` and `src/routes/(academy)/(staff)/members/[id]/book/+page.svelte`: no change is needed beyond the slot reason text from Task 1. Confirm that `slotReasonText` covers `academy_blocked`.

**Interfaces:**
- Produces: `SubscriptionBanner` props `{ membership: Membership | null; locale }`. It renders:
  - for an admin (`subscription` present):
    - blocked: the blocked banner (danger), then the how-to-pay line;
    - otherwise `unpaid`: the Unpaid banner (danger), then how to pay;
    - otherwise `due_soon`: the due-soon banner (pending), then how to pay;
    - otherwise nothing.
  - for anyone else with `bookingPaused`: the rider sentence;
  - otherwise nothing.
  - `{amount}` uses the money formatter with EGP, and `{months}` uses `monthsText`.

- [ ] **Step 1: Write the tests.**
  - `shows an admin how long they have gone unpaid`: the text is "Unpaid: 2 months · EGP 3,000. Your sijjel subscription was due on 15 October 2026." plus how to pay.
  - `riders see only that booking is paused`: there is no "subscription" or "InstaPay" text.
  - `shows nothing without a package`: an admin with no `subscription` and `bookingPaused` false.
  - `due soon reads the date`
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run.** Expected: PASS.
- [ ] **Step 5: Commit** with `feat: academies see their subscription notice`.

### Task 5: Rider limit and the owner's subscription page

**Files:**
- Create: `src/routes/(academy)/(admin)/settings/subscription/+page.server.ts` and `+page.svelte`
- Modify:
  - `src/routes/(academy)/(admin)/settings/+page.svelte`: a row "Subscription" / "الاشتراك", with icon `receipt_long` and the body "Your sijjel package and payments" / "باقتك في سجل ومدفوعاتك"
  - `src/routes/(academy)/(staff)/members/+page.server.ts` and `+page.svelte`: for admins, load `/api/academy/subscription` and show `ridersText` above the list
  - `src/routes/(academy)/(admin)/members/invite/+page.server.ts` and `+page.svelte`, and `src/lib/components/InviteMemberForm.svelte`:
    - load the subscription and show `ridersText`;
    - when `limit !== null && count >= limit`, show the rider-limit sentence and disable the
      "A rider" option, using the same mechanism as `ridersAllowed`.
- Test: `src/lib/components/invite-member-form.svelte.test.ts`

**Interfaces:**
- Consumes: Task 1's `ridersText`.
- Produces: `InviteMemberForm` gains the prop `riderLimitReached: boolean`.

- [ ] **Step 1: Write the test.**
  - `holds riders back at the package's rider limit`: the "A rider" option is disabled and the limit sentence is visible, while trainer stays selectable.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** The subscription page shows:
  - the package name and price a month;
  - `ridersText`;
  - the status chip and "Paid until {date}";
  - when unpaid, the months and amount;
  - the entries (at most 6, read-only);
  - how to pay.
  - With no package it says "You aren't on a sijjel package yet." / "لست على باقة في سجل بعد."
- [ ] **Step 4: Run** `npm run check && npx eslint . && npx vitest run`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: rider limit and the academy's subscription page`.

### Task 6: End to end, the Arabic check, and docs

**Files:**
- Create: `e2e/subscriptions.e2e.ts`
- Modify: `README.md`

- [ ] **Step 1: Write `a platform admin sets up a package, academies see what they owe, and blocking pauses booking`.**
  1. The platform admin creates the package "Starter" (2 riders, 1500).
  2. They create an academy and put it on Starter with 0 free days. The owner sees "Unpaid: 1 month · EGP 1,500" on their home page.
  3. The admin marks a month paid, and the owner's banner disappears.
  4. The owner invites rider Layla, then Sara. The third invite page shows the rider-limit sentence.
  5. The admin blocks the academy. Layla's book page shows "Booking is paused at this academy. Please contact the academy." and no Book button.
  6. The admin marks a month paid again, and the academy is unblocked. The list shows the status chip Paid.
- [ ] **Step 2: Run** `E2E_API_IMAGE=sijjel-api-e2e npm test`. This needs the e2e image built from the API branch. Expected: PASS.
- [ ] **Step 3: Do the throwaway Arabic 390 px check** of the platform academy page, the admin banner and the subscription page. Fix anything that breaks, then delete the spec.
- [ ] **Step 4: Update the README** with the platform pages and the academy-side notice.
- [ ] **Step 5: Commit** with `feat: academy subscriptions end to end` and `docs: academy subscriptions`.
