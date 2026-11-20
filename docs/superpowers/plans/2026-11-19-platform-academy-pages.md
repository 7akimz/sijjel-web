# Platform academy pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A guided four-step "New academy" flow, a tabbed academy page (Overview, Subscription, Settings) and a simpler academies list for the platform admin.

**Architecture:** Pages and components in sijjel-web only; no API changes. The academy page reads `?tab=` in `+page.server.ts`, as `members/[id]` does. The flow is one component, `NewAcademyFlow`, that keeps its step and the created academy in component state. It reuses the existing create, package and owner-invite calls.

**Tech Stack:** SvelteKit 5 (runes), Paraglide (en/ar), vitest browser mode for components, vitest Node for `src/lib/forms`, Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-11-19-platform-academy-pages-design.md`. The mock-ups are saved next to it, and they win where the text is silent.

## Global Constraints

- No API changes. The endpoints used are `POST /platform/academies`, `PUT /platform/academies/{id}/package`, `POST /platform/academies/{id}/owner-invites`, `POST /platform/invites/{id}/renew`, `POST …/payments`, `POST …/free-time`, `POST …/trial/start`, `DELETE …/entries/{id}` and `PUT …/blocked`.
- **No ⋮ More menu** on the academy page.
- One primary button per screen. Danger buttons are always confirmed first.
- Every new string goes in both `messages/en.json` and `messages/ar.json`. Reuse the existing `academy_*`, `subscription_*`, `owner_*`, `invite_*` and `package_*` keys wherever they exist.
- Pass `{ locale }` to `m.*` in components that take `locale` as a prop.
- Unblock acts in one tap with no confirm (agreed with the user 2026-11-20): it isn't destructive, and its confirm put a second primary button on the tab.
- Logical CSS properties only. Directional icons (`arrow_back`, `chevron_right`) use `directional`.
- Comments follow the user's global rules: no end-of-line comments, no past tense, only where the intent isn't clear.
- Commit on `feat/platform-academy-pages`, ending each message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Node 24 (`eval "$(fnm env)" && fnm use 24`) before every npm or npx command.

## Review Focus

1. **Step 2 rejects a step-1 field** (for example, a web address already taken): the flow goes back to step 1, with the error under that field. Pinned in Task 3.
2. **Reloading the academy page with `?tab=nonsense`** shows Overview, not an error. Pinned in Task 1 (`academyTab`).
3. **The country has no active package** on step 3: the package select offers only the "Choose a package" placeholder, and Save package leaves the package unset with no crash. Skip for now still works. Pinned in Task 3.
4. **Cancelling Change on the Subscription tab** brings back the saved package, not the half-picked one. Pinned in Task 2.
5. **An academy that is blocked but not unpaid** (blocked by hand): there is no unpaid banner, and the block card shows Unblock. Pinned in Task 2.

---

### Task 1: Tabbed academy page with header and Overview

**Files:**
- Create: `src/lib/forms/academy-page.ts`, `src/lib/forms/academy-page.test.ts`
- Create: `src/lib/components/AcademyPackageCard.svelte`, `src/lib/components/academy-package-card.svelte.test.ts`
- Modify: `src/routes/(platform)/platform/academies/[id]/+page.server.ts`, `src/routes/(platform)/platform/academies/[id]/+page.svelte`
- Modify: `messages/en.json`, `messages/ar.json`

**Interfaces:**
- Produces:
  - `type AcademyTab = 'overview' | 'subscription' | 'settings'`
  - `academyTab(param: string | null): AcademyTab`
  - `addedText(name: string, academy: Pick<AcademySummary, 'owner'>, status: SubscriptionStatus, locale: Locale): string`
  - `AcademyPackageCard` props: `{ academyId: string; subscription: AcademySubscription; subscriptionHref: string; locale: Locale; onchange: (s: AcademySubscription) => void }`
  - Page data gains `tab: AcademyTab` and `added: boolean`, from `?added=1`.

**New strings (en / ar):**
- `academy_tabs`: "Academy views" / "عروض الأكاديمية"
- `academy_tab_overview`: "Overview" / "نظرة عامة"
- `academy_added`: "{name} is added." / "تمت إضافة {name}."
- `academy_added_waiting`: "{name} is added. The trial starts when {owner} finishes setting it up." / "تمت إضافة {name}. تبدأ الفترة التجريبية عندما ينتهي {owner} من إعدادها."
- `subscription_no_package_yet`: "No package yet." / "لا توجد باقة بعد."

The Subscription and Settings tabs reuse `subscription_title` and `settings_title`.

- [ ] **Step 1: Write the failing Node tests** in `academy-page.test.ts`:

```ts
it('reads the tab, defaulting to Overview', () => {
	expect(academyTab(null)).toBe('overview');
	expect(academyTab('subscription')).toBe('subscription');
	expect(academyTab('settings')).toBe('settings');
	expect(academyTab('nonsense')).toBe('overview');
});
it('names the owner when the trial waits for them', () => {
	const pending = { owner: { ...noOwner, state: 'pending', name: 'Karim' } };
	expect(addedText('Orlando', pending, 'trial_waiting', 'en')).toBe(
		'Orlando is added. The trial starts when Karim finishes setting it up.'
	);
});
it('says only that it is added otherwise', () => {
	expect(addedText('Orlando', { owner: noOwner }, 'no_package', 'en')).toBe('Orlando is added.');
	expect(addedText('Orlando', { owner: { ...noOwner, state: 'pending', name: 'Karim' } }, 'free', 'en')).toBe('Orlando is added.');
});
```

`noOwner` is an `OwnerStatus` with `state: 'none'` and null fields.

- [ ] **Step 2: Run** `npx vitest run src/lib/forms/academy-page.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement `academy-page.ts`** and add the strings to both message files. `addedText` uses the waiting text only when `status === 'trial_waiting'`, the owner state is `pending` or `expired`, and the owner has a name.

- [ ] **Step 4: Run** the same command. Expected: PASS.

- [ ] **Step 5: Write the failing component tests** in `academy-package-card.svelte.test.ts`. Reuse the fixtures in `academy-subscription.svelte.test.ts`; copy them, since there is no shared fixture file.
  - `'shows the package, price and paid-until date'`: with `subscription({ status: 'paid', paidUntil: '2026-12-15' })`, the card shows the heading "Package", "Starter", "Up to 25 riders", "EGP 1,500 a month" (match it with a regex for the non-breaking space) and "Paid until 15 Dec 2026".
  - `'starts a waiting trial on request'`: with `trialDaysWaiting: 45` and `status: 'trial_waiting'`, it shows "45 free days start when setup is finished.". A click on "Start the trial now" makes one `POST /api/platform/academies/a1/trial/start` and calls `onchange` with the response.
  - `'links to the Subscription tab when there is no package'`: with `none`, it shows "No package yet." and a link named "Choose a package" whose `href` is `subscriptionHref`.

- [ ] **Step 6: Run** `npx vitest run src/lib/components/academy-package-card.svelte.test.ts`. Expected: FAIL, the component doesn't exist.

- [ ] **Step 7: Implement `AcademyPackageCard.svelte`.**
  - It's a `Card` with an `h2.sj-heading` reading `subscription_package`.
  - **The package line:** `localName` plus `package_up_to({ riders: riderCountText(max) })`, or `package_unlimited`.
  - **The price:** `package_per_month({ price: formatMoney(...) })`.
  - **Then one of:**
    - `waitingText(trialDaysWaiting)` and a secondary `Start the trial now` (icon `play_arrow`), which calls `POST /platform/academies/{id}/trial/start` through `api()`;
    - or `subscription_paid_until` with `formatDate`;
    - with no package, a muted "No package yet." and `<Button variant="secondary" icon="sell" href={subscriptionHref}>`.
  - Errors show a danger `Banner` with `errorText`.

- [ ] **Step 8: Run** the same command. Expected: PASS.

- [ ] **Step 9: Update the route.**
  - **`+page.server.ts`:** return `tab: academyTab(event.url.searchParams.get('tab'))` and `added: event.url.searchParams.get('added') === '1'`. The loads stay as they are, because the header needs the subscription on every tab.
  - **The header in `+page.svelte`:**
    - `<Button variant="quiet" icon="arrow_back" href={resolve('/(platform)/platform/academies')}>{m.nav_academies()}</Button>`;
    - the `h1.sj-title`;
    - the chips row as today;
    - `<nav class="tabs" aria-label={m.academy_tabs()}>` with three `a.tab` links to `academyHref`, `?tab=subscription` and `?tab=settings`, each with `aria-current` (copy the markup and the eslint comment from `members/[id]/+page.svelte:210-218`).
    - The paid-until and waiting lines leave the header, because the package card shows them.
  - **Overview:**
    - if `data.added`, a `Banner icon="check_circle"` with `addedText(name, data.academy, sub.status, locale)`;
    - `AcademyPackageCard` with `subscriptionHref` set to `?tab=subscription`;
    - `AcademyOwner`;
    - `AcademySetup` when `showsSetup`.
  - **Subscription:** `AcademySubscription`, as today.
  - **Settings:** `AcademyBookingSetup`.
  - Keep the `{#key data.academy.id}` wrapper and the `current` subscription state, so the header chips follow changes.

- [ ] **Step 10: Run** `npx vitest run && npm run check`. Expected: all pass, 0 errors.

- [ ] **Step 11: Commit**

```bash
git add src messages
git commit -m "Academy page: tabs for overview, subscription and settings"
```

### Task 2: Subscription tab in place: Change, Give free time, unpaid banner, block card

**Files:**
- Modify: `src/lib/components/AcademySubscription.svelte`, `src/lib/components/academy-subscription.svelte.test.ts`
- Modify: `messages/en.json`, `messages/ar.json`

**Interfaces:**
- Consumes: nothing new. The props stay `{ academyId, subscription, packages, country, locale, onchange }`.

**New strings (en / ar):**
- `action_change`: "Change" / "تغيير"
- `subscription_booking_blocked`: "Booking is blocked." / "الحجز موقوف."
- `subscription_block_card`: "New bookings stop until you unblock this academy or record a paid month." / "تتوقف الحجوزات الجديدة حتى تلغي إيقاف هذه الأكاديمية أو تسجّل شهرًا مدفوعًا."
- `subscription_blocked_card`: "Bookings are stopped. Recording a paid month also unblocks." / "الحجوزات متوقفة. تسجيل شهر مدفوع يلغي الإيقاف أيضًا."

**Order of the tab:**
1. The unpaid danger banner, only when `status === 'unpaid'`: `subscription_unpaid_owed({ months, amount: formatMoney(amountUnpaid, currency) })`, plus " " and `subscription_booking_blocked` only when blocked.
2. The package card.
3. Mark month paid, or the waiting text with a secondary "Start the trial now".
4. Payments and free time.
5. The block card.

- [ ] **Step 1: Rewrite the tests that change, and add the new ones**, in `academy-subscription.svelte.test.ts`.
  - **Tests that change:**
    - `'has no No package option once on a package'`: click "Change" first.
    - `'shows a free-time note error on the free-time card'`, `'checks amounts and days are whole numbers…'` and `'keeps a typed amount when giving free time'`: click the quiet "Give free time" before filling "Days". The submit button inside the form is also named "Give free time", so query it with `formOf(screen, 'Payments and free time')`, the card that now holds the form, or within the opened form.
    - `'blocks after confirming'` and `'moves focus into the block confirmation…'`: unchanged names ("Block booking", "Yes, block booking", Cancel).
  - **New tests:**
    - `'shows the package and opens the select on Change'`: on a package, there's no Package select until "Change" is clicked. Then the select shows, along with Save package and Cancel.
    - `'cancelling Change keeps the saved package'`: Change, select another active EG package (add a second EG fixture `rising`), Cancel, Change again. The select's value is `starter`.
    - `'opens the package select at once without a package'`: with `none`, the Package select is visible with no click.
    - `'opens Give free time inside the history card'`: before the click, the label "Days" is absent. After the click on the quiet "Give free time", "Days" is inside the card headed "Payments and free time", and the quiet heading button is gone.
    - `'shows no Give free time while the trial waits'`: with `waiting`, there's no button named "Give free time".
    - `'warns at the top when unpaid'`: `subscription({ status: 'unpaid', monthsUnpaid: 2, amountUnpaid: 3000, blocked: true })` shows the text `/^Unpaid: 2 months · EGP\s3,000 Booking is blocked\.$/`. The first element of the component is the banner.
    - `'has no unpaid banner when blocked by hand'`: `subscription({ blocked: true })` has no text matching `/Unpaid/`, and has an "Unblock" button.
    - `'unblocks in one tap'`: with `subscription({ blocked: true })`, one click on "Unblock" sends `PUT /api/platform/academies/a1/blocked` with `{ blocked: false }`, there is never a button named "Yes, unblock", and "Saved." shows in the block card.
    - `'puts the block card last'`: the last `Card` in the component contains "Block booking" and the `subscription_block_card` text.

- [ ] **Step 2: Run** `npx vitest run src/lib/components/academy-subscription.svelte.test.ts`. Expected: the new and changed tests FAIL. The unchanged ones (country filter, free days, waiting, mark paid, undo, block) pass.

- [ ] **Step 3: Implement the changes in `AcademySubscription.svelte`.**
  - **State:** add `editing = $state(untrack(() => !subscription.package))` and `giving = $state(false)`.
  - **The package card:**
    - shows the heading, the package line and the price (the same strings as `AcademyPackageCard`), and a quiet `Change` (icon `edit`) while not `editing`;
    - while `editing`, the existing package form, plus a quiet Cancel when `sub.package` exists. Cancel resets `packageId` to `sub.package.id` and sets `editing = false`;
    - a successful save sets `editing = false`.
  - **"Start the trial now"** moves from the package form to the waiting-text paragraph, as a secondary button.
  - **The free-time form** moves into the history card.
    - The heading row is `h2` "Payments and free time" and a quiet `Give free time` (icon `redeem`) in a flex row that wraps (`flex-wrap: wrap; justify-content: space-between`).
    - The button shows only when `sub.package && sub.status !== 'trial_waiting' && !giving`.
    - While `giving`, the form sits above the entries, with the secondary submit and a quiet Cancel.
    - A successful give sets `giving = false`.
  - **The block card:**
    - **Not blocked:** the `subscription_block_card` text and a secondary `Block booking` (icon `block`).
    - **Confirming:** `Card raised`, with `subscription_block_confirm`, a danger `Yes, block booking` and Cancel.
    - **Blocked:** the `subscription_blocked_card` text and a secondary `Unblock` (icon `lock_open`) that sends `PUT …/blocked` `{ blocked: false }` straight away, with no confirm step. Remove the now unused `subscription_unblock_confirm` and `subscription_unblock_yes` from both message files.
    - Keep the focus handling.
  - **The unpaid banner** goes at the top, as above.

- [ ] **Step 4: Run** the same command. Expected: all PASS.

- [ ] **Step 5: Run** `npx vitest run && npm run check`. Expected: all pass, 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src messages
git commit -m "Subscription tab: change package, give free time and block in place"
```

### Task 3: The "New academy" flow

**Files:**
- Create: `src/routes/(platform)/platform/academies/new/+page.server.ts`, `src/routes/(platform)/platform/academies/new/+page.svelte`
- Create: `src/lib/components/NewAcademyFlow.svelte`, `src/lib/components/new-academy-flow.svelte.test.ts`
- Modify: `src/lib/forms/academy.ts`, `src/lib/forms/academy.test.ts`
- Modify: `src/lib/components/OwnerInviteForm.svelte`, `src/lib/components/owner-invite-form.svelte.test.ts`
- Delete: `src/lib/components/NewAcademyForm.svelte` and `src/lib/components/new-academy-form.svelte.test.ts`. Their two tests move into `new-academy-flow.svelte.test.ts`.
- Modify: `messages/en.json`, `messages/ar.json`

**Interfaces:**
- Produces:
  - `academyStepOneErrors(form: AcademyForm): FieldErrors`: only the `slug`, `nameEn` and `nameAr` keys of `academyFormErrors(form)`.
  - `STEP_ONE_FIELDS = ['slug', 'nameEn', 'nameAr'] as const`.
  - `NewAcademyFlow` props: `{ countries: Country[]; disciplines: Discipline[]; packages: Package[]; rootHost: string; locale: Locale; onfinish: (academyId: string) => void; oncancel: () => void }`.
  - `OwnerInviteForm` gains an optional prop `step?: boolean`. When true, the quiet button reads "Skip for now" and sits on the start side, and "Create invitation" sits on the end side. The default layout is unchanged.
  - `/platform/academies/new` finishes by going to `/platform/academies/{id}?added=1`. Leaving from steps 1–2 goes to `/platform/academies`.

**New strings (en / ar):**
- `flow_step`: "Step {n} of {total} · {name}" / "الخطوة {n} من {total} · {name}"
- `flow_step_academy`: "Academy" / "الأكاديمية"
- `flow_step_runs`: "How it runs" / "طريقة العمل"
- `flow_step_package`: "Package" / "الباقة"
- `flow_step_owner`: "Owner" / "المالك"
- `action_next`: "Next" / "التالي"
- `action_back`: "Back" / "رجوع"
- `action_skip`: "Skip for now" / "تخطَّ الآن"
- `flow_finish_later`: "Finish later" / "أكمل لاحقًا"
- `flow_go_to_academy`: "Go to the academy" / "اذهب إلى الأكاديمية"
- `academy_created_next`: "{name} is created. Next, its package." / "تم إنشاء {name}. التالي: الباقة."
- `owner_step_intro`: "The owner gets a link to sign up and set up the academy." / "يحصل المالك على رابط للتسجيل وإعداد الأكاديمية."

**Reused keys:**
- `academy_new` for the title, `academy_create` for the step-2 button, and `nav_academies` for the ✕ link on steps 1–2.
- `subscription_save_package` for step 3's button.
- `invite_create` for step 4's button.

- [ ] **Step 1: Write the failing Node test** in `academy.test.ts`: `'checks only the step-one fields'`. A form with an empty slug and no disciplines gives `academyStepOneErrors(form)` with key `slug`, without `disciplineIds`.

- [ ] **Step 2: Run** `npx vitest run src/lib/forms/academy.test.ts`. Expected: FAIL, not exported.

- [ ] **Step 3: Implement `academyStepOneErrors`** and `STEP_ONE_FIELDS` in `academy.ts`.

- [ ] **Step 4: Run** the same command. Expected: PASS.

- [ ] **Step 5: Write the failing `OwnerInviteForm` test**, `'reads Skip for now as a step'`: with `step: true`, there's a button "Skip for now", and clicking it calls `oncancel`. Run `npx vitest run src/lib/components/owner-invite-form.svelte.test.ts`. Expected: FAIL. Implement the prop, then run again. Expected: PASS.

- [ ] **Step 6: Write the failing flow tests** in `new-academy-flow.svelte.test.ts`.
  - Stub `fetch` as in `academy-subscription.svelte.test.ts`, and route the responses by URL:
    - `/api/platform/academies` returns an `AcademySummary`, `id: 'a9'`, `nameEn: 'Orlando Equestrian'`, `country: 'EG'`;
    - `/package` returns a subscription;
    - `/owner-invites` returns a `CreatedInvite`.
  - **Tests:**
    - `'shows step 1 of 4 with the academy fields'`: the text "Step 1 of 4 · Academy", a `progressbar` with `aria-valuenow` 1, a "Web address" field, and no "Country" field.
    - `'checks step 1 locally before going on'`: Next with an empty form shows the slug error and makes no fetch call.
    - `'goes back from step 2 with the fields kept'`: fill step 1, Next, see "Step 2 of 4 · How it runs", then Back. "Web address" still holds the typed value.
    - `'starts in Egypt, with riders booking their own'`: moved from the old form test, after Next.
    - `'sends the country and who books, and takes the time zone from the country'`: moved from the old form test. The body of the one POST to `/api/platform/academies` equals what the old test expected.
    - `'goes back to step 1 when the API rejects the web address'`: POST returns 400 `{ errors: { slug: ['slug_taken'] } }`. Then "Step 1 of 4" shows, with the `error_slug_taken` text under Web address.
    - `'offers the package step after creating'`: after Create academy, "Orlando Equestrian is created. Next, its package.", "Step 3 of 4 · Package", and the ✕ link reads "Finish later". Save package sends `PUT /api/platform/academies/a9/package` with `{ packageId: 'starter', freeDays: 30, startAfterSetup: true }`, and then shows "Step 4 of 4 · Owner".
    - `'saves no package when the country has none'`: with `packages: [saudi]`, the select offers only "Choose a package". Save package sends `{ packageId: null, freeDays: 30, startAfterSetup: true }` and goes on to step 4.
    - `'skips straight to the academy'`: on step 3, Skip for now, then on step 4 Skip for now calls `onfinish('a9')`.
    - `'shares the invitation, then goes to the academy'`: on step 4, fill "Their name" and click Create invitation. A "Send on WhatsApp" link shows, then "Go to the academy" calls `onfinish('a9')`.
    - `'leaves from step 1 without saving'`: the ✕ link "Academies" calls `oncancel`.

- [ ] **Step 7: Run** `npx vitest run src/lib/components/new-academy-flow.svelte.test.ts`. Expected: FAIL, the component doesn't exist.

- [ ] **Step 8: Implement `NewAcademyFlow.svelte`.**
  - **State:** `step = $state<1 | 2 | 3 | 4>(1)`, `academy = $state<AcademySummary>()`, and the `AcademyForm` state and field markup moved from `NewAcademyForm.svelte` (steps 1 and 2 render different halves of it).
  - **Layout:**
    - a quiet `Button` with icon `close`: on steps 1–2 it reads `nav_academies` and calls `oncancel`; on steps 3–4 it reads `flow_finish_later` and calls `onfinish(academy.id)`;
    - `h1.sj-title` with `academy_new`;
    - `ProgressBar value={step} max={4}` labelled by the `flow_step` text, with the same text under it as `sj-small sj-muted`;
    - one `Card` per step;
    - an actions row (`display:flex; flex-wrap:wrap`), with the primary pushed to the end by `margin-inline-start:auto`.
  - **Step behaviour:**
    - **Step 1, Next:** run `academyStepOneErrors`, and `focusFirstInvalid` if any.
    - **Step 2, Create academy:** run the full `academyFormErrors`. On an API field error, if any key is in `STEP_ONE_FIELDS`, set `step = 1` and focus the first invalid field after `tick()`.
    - **Step 3:** the package form, as in `AcademySubscription`: a select of `packages` filtered to active ones of `academy.country`, with a leading "Choose a package" option and an empty value. Free days default to 30, checked by the same 0–366 rule, and `startAfterSetup` is checked. Save sends `packageId || null`. The success banner `academy_created_next` sits above the card.
    - **Step 4:** `owner_step_intro`, then `<OwnerInviteForm step academyId={academy.id} oncreated=… oncancel={() => onfinish(academy.id)} />`. Once created, show `InviteShareCard` (message `invite_share_message_owner`) and a secondary `Go to the academy` (icon `arrow_forward`, directional).
  - Delete `NewAcademyForm.svelte` and its test.

- [ ] **Step 9: Run** the same command. Expected: all PASS.

- [ ] **Step 10: Add the route.**
  - **`new/+page.server.ts`:** loads disciplines, countries and packages (`/api/platform/disciplines`, `/api/platform/countries`, `/api/platform/packages`).
  - **`new/+page.svelte`:** `<div class="sj-page">`, with the title `academy_new` in `<svelte:head>`, rendering `NewAcademyFlow`.
    - `onfinish` does `goto(resolve('/(platform)/platform/academies/[id]', { id }) + '?added=1')`.
    - `oncancel` goes to `resolve('/(platform)/platform/academies')`.

- [ ] **Step 11: Run** `npx vitest run && npm run check && npx eslint src`. Expected: all pass. There are no imports left of `NewAcademyForm`, apart from the list page, which Task 4 fixes. If `check` fails only on the list page's import, do Task 4's removal of that import here.

- [ ] **Step 12: Commit**

```bash
git add -A src messages
git commit -m "New academy: a guided four-step flow"
```

### Task 4: The academies list as whole-row links

**Files:**
- Modify: `src/routes/(platform)/platform/academies/+page.svelte`, `src/routes/(platform)/platform/academies/+page.server.ts`
- Create: `src/routes/(platform)/platform/academies/academies-page.svelte.test.ts`

**Interfaces:**
- Consumes: the `/platform/academies/new` route from Task 3.

- [ ] **Step 1: Write the failing page test** in `academies-page.svelte.test.ts`. Render the page component with `data` holding `locale: 'en'` and two academies, one paid until 15 Dec and one unpaid for 1 month and blocked.
  - `'links each row to its academy'`: there's a link whose accessible name contains the academy name, with `href` `/platform/academies/<id>`, and the row has no buttons.
  - `'shows status, riders and the paid or unpaid line'`: the row texts include "Paid", "Paid until 15 Dec" for the first, and "Unpaid: 1 month" and "Blocked" for the second.
  - `'links New academy to the flow'`: a link named "New academy" with `href` `/platform/academies/new`.
  - `'keeps the status filter'`: the "Show" select (`subscription_filter`) still narrows the list.

  If rendering a route component needs a `$app/state` mock, use `vi.mock('$app/state', …)`, as other route tests do. If none do, move these assertions into the e2e in Task 5, and record a ruling.

- [ ] **Step 2: Run** `npx vitest run src/routes/(platform)/platform/academies/academies-page.svelte.test.ts`. Expected: FAIL.

- [ ] **Step 3: Rewrite the list.**
  - The head's `Button` becomes `href={resolve('/(platform)/platform/academies/new')}`.
  - Remove `NewAcademyForm`, `OwnerInviteForm`, `InviteShareCard`, the `created`, `invites`, `owners`, `sending` and `inviting` state, and the discipline, owner, setup and package chips.
  - Each `li` holds one `<a class="academy" href=…>`, modelled on the horses list (`src/routes/(academy)/(admin)/horses/+page.svelte:58-95`), with:
    - `sj-avatar` initials;
    - a main column: the name, then a `sj-row` of the status chip, "Blocked" and the riders text, then the unpaid or paid-until line;
    - a trailing `chevron_right` icon (directional).
  - Drop `disciplines` from the server load, since nothing else on the page uses it.

- [ ] **Step 4: Run** the same command. Expected: PASS.

- [ ] **Step 5: Run** `npx vitest run && npm run check && npx eslint src && npx prettier --check src messages`. Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add -A src
git commit -m "Academies list: one link per academy"
```

### Task 5: E2e tests, the patterns table, and full verification

**Files:**
- Modify: `e2e/helpers.ts`, `e2e/owners.e2e.ts`, `e2e/subscriptions.e2e.ts`, `e2e/foundation.e2e.ts`
- Modify: `CLAUDE.md` (the patterns table)

- [ ] **Step 1: Update the helpers.**
  - **`createAcademy`:**
    1. Open `/platform/academies/new`, fill step 1 and click Next.
    2. Fill step 2 and click Create academy.
    3. Expect the text "{name} is created. Next, its package.", click "Finish later" and expect the heading `name` at level 1.
    4. Return `{ name }`.
  - **`inviteOwner(page, academyName)`:**
    1. Open `/platform/academies`, then click the row link for `academyName` (`getByRole('link', { name: new RegExp(academyName) })`).
    2. In the Owner card, click "Invite owner", fill "Their name" and click "Create invitation".
    3. Read "Invitation link".
  - Add `openAcademy(page, name, tab?: 'subscription' | 'settings')`, which clicks the row link and then the tab link by name.

- [ ] **Step 2: Update the specs.**
  - **`owners.e2e.ts`:** do the invite, send-again and package steps on the academy page (Overview for the owner, Subscription for the package). Check "Owner: Owner" and "Setup: 0 of 4" on the Overview's Owner and Setup cards instead of the list row. The list still shows "Trial waits for setup".
  - **`subscriptions.e2e.ts`:**
    - `openSubscription` uses `openAcademy(page, name, 'subscription')`;
    - the package select is open from the start (no package);
    - Block booking → Yes, block booking → Unblock, as now;
    - the list check for "Paid" and no "Blocked" stays.
  - **`foundation.e2e.ts:70-90`:** invite from the academy's Overview, scoped to the Owner card (`page.locator('.sj-card').filter({ hasText: 'Owner' })`) instead of `row`.
  - Grep `e2e/` for `Subscription for`, `getByRole('listitem')` with `Invite owner`, and `Academy created.`. None should remain.

- [ ] **Step 3: Run** `E2E_API_IMAGE=sijjel-api-api npx playwright test`. The API is unchanged, so use the merged image. Expected: all pass. Fix the selectors, never the product, unless a failure shows a real bug. In that case write a component test for it first.

- [ ] **Step 4: Update the patterns table in `CLAUDE.md`.**
  - Add the row: `| Steps with a progress bar ("Step N of M") | Add one new thing, one decision per screen | New academy (platform) |`.
  - Add "academy page: Overview, Subscription, Settings" to the Underlined tabs row.
  - Add "Academies (platform)" to the Whole-row link row.

- [ ] **Step 5: Run the full check:** `npx vitest run && npm run check && npx eslint src e2e && npx prettier --check src e2e messages`. Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add -A e2e CLAUDE.md
git commit -m "E2e and patterns for the new academy pages"
```

After the last task: build the preview images and recreate the :3001 containers. Run the ux-laws review on screenshots of the real pages: 390 px in English Day and Arabic Night, and 1440 px. Then hand it to the user to try.
