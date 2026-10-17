# sijjel-web Milestone 3: Academy setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On their academy's subdomain, an academy admin sees a setup checklist on the home page and gets Settings pages and a Horses section. From there they set opening hours (with a live session preview), booking rules, arenas, closed dates, their disciplines and ladders, and school horses with unavailable dates.

**Architecture:**
- **Admin routes** live in a `(academy)/(admin)` route group whose server layout requires an Active admin membership.
- **Data:** pages load through `apiLoad` on the server and save through the same-origin `api()` client, as in Milestone 1.
- **Form logic:** pure helpers in `src/lib/forms/*.ts`, each with unit tests.
- **New UI kit pieces:** go in `src/lib/ui` and onto the `/design` page.
- **Ladder editor:** the platform's ladder editor is split into a reusable `LadderEditor` component.

**Tech Stack:** SvelteKit 3.1 / Svelte 5 runes, TypeScript, Paraglide JS 2 (en, ar), Vitest 4.1 (browser mode for `*.svelte.test.ts`), Playwright 1.64.

**Spec:** `docs/superpowers/specs/2026-10-18-academy-setup-design.md`, which builds on `docs/superpowers/specs/2026-10-17-sijjel-design.md`. The design's numbered "Calls" are referenced below as (Call N).

**Depends on:** the sijjel-api plan `2026-10-18-api-m3-academy-setup.md`. Its endpoints, JSON shapes and error codes, in brief:
- **Shapes and endpoints:**
  - `GET /api/academy/setup` → `{hours,arenas,horses}` each `{done}`
  - `GET` / `PUT /api/academy/schedule` and `POST /api/academy/schedule/preview`, with:
    - body `{timeZone, sessionLengthMinutes, breakMinutes, days:[{weekday,opensAt,closesAt}]}`
    - response adds `preview:[{weekday,starts:[...]}]`
    - weekday 0 = Sunday; `"00:00"` close = midnight
  - `GET` / `PUT /api/academy/booking-rules` `{bookingWindowDays, bookingClosesHours, cancellationCutoffHours}`
  - arenas `{id,name,capacity,isActive}`; closed dates `{id,from,to,reason}`
  - `GET /api/academy/disciplines` → `{enabled:[{id,key,nameEn,nameAr,inUse,levels:[{id,nameEn,nameAr,inUse}]}], available:[{id,key,nameEn,nameAr}]}`
  - `PUT .../disciplines/{id}/levels` `{levels:[{id?,nameEn,nameAr}]}`
  - horse `{id,name,kind,discipline,minLevel:{id,nameEn,nameAr,position},maxLevel,maxSessionsPerDay,notes,isActive,unavailableToday,unavailability:[{id,from,to,reason}]}`
- **New error codes:**
  - `not_an_admin`
  - `hours_invalid`, `session_length_invalid`, `break_invalid`, `booking_rule_invalid`
  - `capacity_invalid`, `arena_name_taken`, `arena_not_found`
  - `date_range_invalid`, `reason_too_long`, `closed_dates_overlap`, `closed_date_not_found`
  - `discipline_in_use`, `last_discipline`, `discipline_already_enabled`
  - `level_in_use`, `level_range_inverted`, `level_unknown`
  - `horse_name_taken`, `level_range_invalid`, `sessions_per_day_invalid`, `notes_too_long`
  - `horse_not_found`, `unavailability_not_found`

**Branch:** `feat/m3-academy-setup` (already created from `main`; the design commit is on it).

## Global Constraints

- Put Node 24 on PATH: `export PATH="$(dirname "$(fnm exec --using=24.22.0 which node)"):$PATH"`.
- **Design system:** use only the sijjel UI kit (`#lib/ui/index.js`) and `sj-` classes. The user dislikes default scaffold styling. Other rules:
  - tokens only, never literal colours
  - logical CSS properties only
  - 44px touch targets
  - sentence case
  - 24-hour times with Western digits
  - bottom bar below 720px
  - focus ring: 2px `--focus` with a 2px offset
- **Strings:** every user-facing string goes in both `messages/en.json` and `messages/ar.json`. Every API error code shown has an `error_<code>` key in both.
- **Server-side loads** use `apiLoad` from `#lib/server/api.js`. **Browser saves** use `api()` from `#lib/api/client.js`, with errors shown via `errorText` and `fieldText` (Task 1). After client-side validation fails, call `focusFirstInvalid(form)`.
- **Links and navigation** use `resolve()` with route ids. The `(academy)` and `(admin)` groups appear in the id, e.g. `resolve('/(academy)/(admin)/settings/hours')`.
- **Weekday order on screen** starts on Saturday: 6, 0, 1, 2, 3, 4, 5 (Call 6). Weekday names come from messages (`weekday_0`…`weekday_6`).
- **Code comments (user rule):** no commented-out code, no end-of-line comments, no past-tense or change narration. Comments go above the code, only when intent isn't obvious.
- **Commits** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Checks to run:**
  - `npx vitest --run`
  - `npm run check` (0 errors, 0 warnings)
  - `npx eslint .`
  - `npx prettier --check src messages e2e`
  - `npx playwright test` (it starts its own throwaway API stack from the `sijjel-api-api` image; rebuild that image after the API plan lands)

## Review Focus

1. **Non-admins on admin URLs:** a rider or trainer opening `/settings/hours` directly gets the 403 page, not a broken form. A signed-out visitor is sent to `/login?returnTo=…`. Pinned in Task 1 by the guard tests.
2. **Hours preview during typing:**
   - Half-typed times (`"18:"`) must not fire preview requests or show errors mid-typing.
   - A slow, older preview response must not overwrite a newer one.
   Pinned in Task 3 (`previewRequestFor` returns null for incomplete days; the page drops stale responses by request sequence).
3. **Arabic and RTL on time and date inputs:** times and dates stay left-to-right (`dir="ltr"`) inside RTL pages, and weekday labels are translated. Pinned in Task 2 by the `TimeRangeField` test.
4. **A level range that no longer fits after changing a horse's discipline:** the min/max pickers reset to the new ladder's first and last levels instead of keeping stale ids. Pinned in Task 6 (`rangeAfterDisciplineChange`).
5. **Ladder save rejected by the API** (`level_in_use`, `level_range_inverted` with horse names): the page shows the reason with the horse names and keeps the unsaved edits. Pinned in Task 5 by the `ladderSaveError` helper test.

---

### Task 1: Admin area shell, guard, navigation and messages

**Files:**
- Create:
  - `src/routes/(academy)/(admin)/+layout.server.ts`
  - `src/routes/(academy)/(admin)/settings/+page.svelte`
  - `src/lib/academy/admin.ts`
  - `src/lib/api/academy-types.ts`
- Modify:
  - `src/routes/+layout.svelte` (nav), `src/lib/api/errors.ts` (add `fieldText`)
  - `messages/en.json`, `messages/ar.json`
- Test: `src/lib/academy/admin.test.ts`, `src/lib/api/errors.test.ts` (extend)

**Interfaces:**
- Produces:
  - `isAcademyAdmin(membership: Membership | null): boolean`: true when the status is `active` and the roles include `admin`.
  - `adminNav(locale)`, used by the layout: Home (`home`), Horses (`pets`), Settings (`settings`). Riders and others keep Home only.
  - `fieldText(fields: FieldErrors, field: string): string | undefined`: the first code translated via `errorText`.
  - **Admin layout guard** (`(admin)/+layout.server.ts`):
    - not an academy tenant → `error(404)`
    - unavailable → `error(503)`
    - signed out → redirect 303 to `/login?returnTo={pathname}`
    - not `isAcademyAdmin` → `error(403, 'not_an_admin')`
  - **The 403 page:** the existing `+error.svelte` handles it. Its 403 copy changes to a generic `status_forbidden_title`/`status_forbidden_body` ("You don't have access to this page"), and the platform variant becomes `status_platform_forbidden_*`.
  - **Settings page:** a `sj-list` of five rows (icon, title, one-line description) linking to `/settings/hours`, `/settings/booking-rules`, `/settings/arenas`, `/settings/closed-dates` and `/settings/disciplines`.
  - **Types** in `src/lib/api/academy-types.ts`: `SetupState`, `ScheduleDay`, `ScheduleInput`, `Schedule`, `DayPreview`, `BookingRules`, `Arena`, `ClosedRange`, `AcademyLevel`, `AcademyDiscipline`, `AcademyDisciplines`, `Horse`, `HorseInput`, `Unavailable`, matching the API shapes in this plan's header.
  - **Messages:**
    - `weekday_0`…`weekday_6`
    - `nav_horses`, `nav_settings`, `settings_title`
    - the five settings row titles and descriptions
    - every new error code listed in the header

- [ ] **Step 1: Write the failing tests:**
  - `isAcademyAdmin`: true for `{roles:['admin'],status:'active'}`; false for a rider, for a suspended admin, and for `null`.
  - `fieldText({slug:['slug_taken']}, 'slug')` returns the slug-taken text; a missing field returns `undefined`.
  - A message-key test asserts that every code in the header list has `error_<code>` in both locales.
- [ ] **Step 2: Run `npx vitest --run src/lib/academy src/lib/api`.** Expected: FAIL.
- [ ] **Step 3: Implement** the helpers, types, guard, Settings page, nav and messages.
- [ ] **Step 4: Verify:**
  - `npx vitest --run`, `npm run check` and `npx eslint .` pass.
  - Manually, against the dev API with an academy owner on `alfaris.localhost:5173`, the bottom bar shows Home/Horses/Settings, and `/settings` lists five rows.
  - A rider on `/settings` gets the 403 page, and a signed-out visitor gets the sign-in redirect.
- [ ] **Step 5: Commit** `feat: add the academy admin area with settings navigation`

---

### Task 2: Setup checklist card and the time and date UI pieces

**Files:**
- Create:
  - `src/lib/components/SetupChecklist.svelte`
  - `src/lib/ui/TimeRangeField.svelte`, `src/lib/ui/DateRangeField.svelte`, `src/lib/ui/ProgressBar.svelte`
- Modify:
  - `src/lib/ui/index.ts`
  - `src/routes/+page.svelte` (academy branch), `src/routes/+page.server.ts` (create: loads setup state for admins)
  - `src/routes/design/+page.svelte`
  - messages
- Test: `src/lib/components/setup-checklist.svelte.test.ts`, `src/lib/ui/fields.svelte.test.ts`

**Interfaces:**
- Consumes: `isAcademyAdmin` and `SetupState` (Task 1).
- Produces:
  - **`SetupChecklist`:** props `{ state: SetupState; academyName: string }`.
    - Renders a raised card titled `setup_title` ("Get {academy} ready for bookings").
    - A `ProgressBar` with `setup_progress` ("{done} of 3 done").
    - Three rows in order: Opening hours → `/settings/hours`, Arenas → `/settings/arenas`, Horses → `/horses`.
    - Done rows show a check and no chevron; open rows show their number and a chevron.
    - Renders nothing when all three are done.
  - **`ProgressBar`:** props `{ value: number; max: number; label: string }`, rendered as `role="progressbar"` with `aria-valuenow`/`aria-valuemax`.
  - **`TimeRangeField`:** props `{ label: string; opens: string (bindable); closes: string (bindable); error?: string }`.
    - Two `<input type="time" step="60">` with `dir="ltr"`, labelled "{label} opens" and "{label} closes" via messages.
  - **`DateRangeField`:** props `{ label: string; from: string (bindable); to: string (bindable); error?: string }`.
    - Two `<input type="date" dir="ltr">`. When `to` is empty or earlier than `from`, editing `from` copies it into `to`.
  - **Home page:**
    - `+page.server.ts` loads `/api/academy/setup` only when the tenant is an academy and `isAcademyAdmin(locals.membership)`; otherwise `setup: null`.
    - The existing universal `src/routes/+page.ts` keeps its platform-admin redirect and must return the server `data` (`return data;`) so `setup` reaches the page.
    - The page renders `SetupChecklist` above the membership card when `setup` is non-null.
  - **`/design`** gets a section showing `SetupChecklist` (one done, two open), `ProgressBar`, `TimeRangeField` and `DateRangeField`.

- [ ] **Step 1: Write the failing component tests:**
  - `SetupChecklist shows progress and links`: state `{hours:{done:true},arenas:{done:false},horses:{done:false}}`:
    - the text "1 of 3 done"
    - the progressbar's `aria-valuenow` is "1"
    - the Arenas link `href` ends with `/settings/arenas`
    - the Horses link ends with `/horses`
  - `SetupChecklist renders nothing when done`: all done → the container has no `.sj-card`.
  - `TimeRangeField keeps times left-to-right`: both inputs have `dir="ltr"` and `type="time"`.
  - `DateRangeField fills the end date`: setting `from` to `2026-04-01` while `to` is empty makes `to` `2026-04-01`.
- [ ] **Step 2: Run `npx vitest --run --project client`.** Expected: FAIL.
- [ ] **Step 3: Implement** the components, home load and design section.
- [ ] **Step 4: Verify:**
  - The tests, `npm run check` and eslint pass.
  - In dev, the owner's home shows "0 of 3 done" and the rider's home shows no card.
- [ ] **Step 5: Commit** `feat: show the setup checklist on the admin home`

---

### Task 3: Opening hours and sessions page with a live preview

**Files:**
- Create:
  - `src/lib/forms/hours.ts`
  - `src/routes/(academy)/(admin)/settings/hours/+page.server.ts`, `+page.svelte`
- Test: `src/lib/forms/hours.test.ts`

**Interfaces:**
- Consumes: `TimeRangeField` (Task 2); `Schedule`, `ScheduleInput` types (Task 1).
- Produces (`src/lib/forms/hours.ts`):
  - `type DayRow = { weekday: number; open: boolean; opensAt: string; closesAt: string }`
  - `WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5]`
  - `rowsFromSchedule(s: Schedule): DayRow[]`: seven rows in `WEEK_ORDER`. Closed days get `open:false` and copy the first open day's times, or `18:00`/`22:00` if none.
  - `copyToOpenDays(rows: DayRow[], from: number): DayRow[]`: copies the `from` weekday's times onto every other open row.
  - `toScheduleInput(rows, base: {timeZone, sessionLengthMinutes, breakMinutes}): ScheduleInput`: only open rows, in weekday order.
  - `previewRequestFor(rows, base): ScheduleInput | null`: null while any open row has an incomplete time (not matching `^\d\d:\d\d$`).
  - `hoursErrors(rows, base): FieldErrors`:
    - `hours_invalid` on `days` when an open day's close isn't after its open (`"00:00"` close counts as 24:00)
    - `session_length_invalid` (15–240, step 5)
    - `break_invalid` (0–60, step 5)
  - `sessionSummary(starts: string[]): string`: "8 sessions · 18:00 – 21:30" via messages (`hours_preview_summary`); `hours_preview_none` when empty.
- **Page:**
  - One card with a row per weekday: an Open/Closed `CheckboxField`, a `TimeRangeField` when open, and a "Copy to other open days" quiet button.
  - Session length and break `SelectField`s (15–240 and 0–60 in steps of 5), and a time zone `SelectField` (same list as the platform academy form).
  - A preview card listing each open day's summary from the server's `preview`.
  - Save does a `PUT`, shows a success `Banner`, and refreshes `preview` from the response.
  - **While editing:** when `previewRequestFor` returns non-null and the client has no errors, POST `/api/academy/schedule/preview` debounced by 400 ms. Each request carries an increasing sequence number, and a response is applied only if it is the latest one sent.

- [ ] **Step 1: Write the failing tests** in `hours.test.ts`:
  - `rowsFromSchedule orders the week from Saturday`: the weekdays of the rows equal `[6,0,1,2,3,4,5]`, with Thursday (4) and Friday (5) closed for the sample Sat–Wed schedule.
  - `copyToOpenDays`: copying Saturday's 18:00–22:00 changes Sun–Wed but not the closed Thu/Fri rows.
  - `toScheduleInput sends only open days`: the sample gives 5 `days`, the first being `{weekday:0,…}` (weekday order, Sunday first).
  - `previewRequestFor waits for complete times`: an open row with `opensAt:"18:"` → `null`.
  - `hoursErrors`:
    - `18:00`–`17:00` → `hours_invalid`
    - `23:00`–`00:00` → no error
    - session 50 → `session_length_invalid`
    - break 7 → `break_invalid`
  - `sessionSummary`: eight starts from "18:00" to "21:30" → "8 sessions · 18:00 – 21:30"; `[]` → the none text.
- [ ] **Step 2: Run `npx vitest --run src/lib/forms/hours.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement** `hours.ts`, the load (`apiLoad<Schedule>(event, '/api/academy/schedule')`) and the page.
- [ ] **Step 4: Verify:**
  - The tests, `npm run check` and eslint pass.
  - In dev as the owner:
    1. Set Sat–Wed 18:00–22:00 at 30 minutes; the preview reads "8 sessions · 18:00 – 21:30" before saving.
    2. Save; after a reload the values persist.
    3. The home checklist now shows "1 of 3 done".
  - In Arabic the page is RTL, with times left-to-right.
- [ ] **Step 5: Commit** `feat: set opening hours and sessions with a live preview`

---

### Task 4: Booking rules, arenas and closed dates pages

**Files:**
- Create:
  - `src/lib/forms/booking-rules.ts`, `src/lib/forms/arena.ts`, `src/lib/forms/closed-dates.ts`
  - `src/routes/(academy)/(admin)/settings/booking-rules/+page.server.ts`, `+page.svelte`
  - `src/routes/(academy)/(admin)/settings/arenas/+page.server.ts`, `+page.svelte`
  - `src/routes/(academy)/(admin)/settings/closed-dates/+page.server.ts`, `+page.svelte`
- Test: `src/lib/forms/booking-rules.test.ts`, `src/lib/forms/arena.test.ts`, `src/lib/forms/closed-dates.test.ts`

**Interfaces:**
- Consumes: `DateRangeField` (Task 2), types (Task 1).
- Produces:
  - **Booking rules:** `bookingRulesErrors(r: BookingRules): FieldErrors`:
    - `bookingWindowDays` 1–90
    - `bookingClosesHours` 0–168
    - `cancellationCutoffHours` 0–168
    - integers only, else `booking_rule_invalid`
  - **Booking rules page:** three number `TextField`s with hints:
    - "Riders can book up to {n} days ahead"
    - "Booking closes {n} hours before a session starts; 0 means right up to the start"
    - "Riders can cancel until {n} hours before; staff can always cancel"
  - **Arena form:** `arenaErrors(a: {name, capacity}): FieldErrors`, mirroring the API: `name_required`, `name_too_long` (> 60), `capacity_invalid` (not 1–50).
  - **Arenas page:**
    - A `sj-list` of arenas (name, "{n} riders", an Inactive chip).
    - Each row expands an inline edit form (name, capacity, an "Active" checkbox).
    - A "New arena" form at the top.
    - `arena_name_taken` shows under the name field.
  - **Closed dates:**
    - `closedRangeErrors(r: {from,to,reason}): FieldErrors`: a missing or reversed date → `date_range_invalid`; reason > 120 → `reason_too_long`.
    - `isPast(r: ClosedRange, today: string): boolean`.
    - `formatRange(r, locale): string`: one date when `from === to`, else "{from} – {to}", via `formatDate`.
  - **Closed dates page:**
    - An add form (`DateRangeField` and a reason).
    - The list, upcoming first; past ranges are greyed (`sj-muted`) and listed under a "Past" heading.
    - Each range has a delete button with label `closed_dates_delete`.
    - `closed_dates_overlap` shows as a danger `Banner`.

- [ ] **Step 1: Write the failing tests:**
  - `bookingRulesErrors`: `{14,0,12}` → `{}`; `bookingWindowDays: 0` and `91` → `booking_rule_invalid`; `bookingClosesHours: 1.5` → `booking_rule_invalid`.
  - `arenaErrors`: `{name:"  ",capacity:5}` → `name_required`; capacity 0 and 51 → `capacity_invalid`.
  - `closedRangeErrors`: `{from:"2026-04-02",to:"2026-04-01"}` → `date_range_invalid`; a reason of 121 characters → `reason_too_long`.
  - `isPast`: a range ending `2026-10-17` is past on `2026-10-18`; one ending `2026-10-18` isn't.
  - `formatRange`: `{from:"2026-04-01",to:"2026-04-01"}` in `en` → "1 April 2026"; a two-day range → "30 March 2026 – 1 April 2026".
- [ ] **Step 2: Run `npx vitest --run src/lib/forms`.** Expected: FAIL.
- [ ] **Step 3: Implement** the helpers and the three pages. "Today" for `isPast` is derived on the server from the academy time zone (`Intl.DateTimeFormat('en-CA', {timeZone})`) and passed in the page data.
- [ ] **Step 4: Verify:**
  - The tests, `npm run check` and eslint pass.
  - In dev:
    - Add arenas "Main arena" (5) and "Small arena" (2); the checklist shows "2 of 3 done".
    - A duplicate name shows its error.
    - Add a closed range, try an overlap and see the banner, then delete the range.
    - Change the booking rules to 2/48/24 and reload.
- [ ] **Step 5: Commit** `feat: manage booking rules, arenas and closed dates`

---

### Task 5: Disciplines and levels page with a shared ladder editor

**Files:**
- Create:
  - `src/lib/components/LadderEditor.svelte`
  - `src/lib/forms/academy-ladder.ts`
  - `src/routes/(academy)/(admin)/settings/disciplines/+page.server.ts`, `+page.svelte`
- Modify:
  - `src/lib/components/DisciplineEditor.svelte`: use `LadderEditor` for the rows; behaviour unchanged
  - `src/lib/forms/ladder.ts`: `LadderRow` gains an optional `id?: string` and `inUse?: boolean`
- Test: `src/lib/forms/academy-ladder.test.ts`, `src/lib/forms/ladder.test.ts` (extend), `src/lib/components/ladder-editor.svelte.test.ts`

**Interfaces:**
- Consumes: `moveRow`, `addRow`, `removeRow`, `ladderErrors`, `trimLadder` (M1 `ladder.ts`); types (Task 1).
- Produces:
  - **`LadderEditor`:** props `{ rows: LadderRow[] (bindable); errors?: string[] }`.
    - Renders the numbered rows with EN/AR fields, up/down/remove buttons and "Add level", carrying over the focus-keeping move behaviour from `DisciplineEditor`.
    - A row with `inUse: true` has its remove button disabled, with the label `ladder_remove_in_use` ("Level {number} is used by a horse").
  - `toLadderInput(rows: LadderRow[]): { levels: { id?: string; nameEn: string; nameAr: string }[] }`: trimmed; `id` included only when present.
  - `ladderSaveError(e: ApiError): string`:
    - `level_range_inverted` with `fields.horses` → `ladder_inverts_horses` ("This order would put {horses} outside their level range"), with the names joined by the locale's list format.
    - `level_in_use` → its error text.
    - Otherwise `errorText(e.code)`.
  - **Disciplines page:**
    - One card per enabled discipline: the name, an "Edit levels" button opening `LadderEditor` with Save/Cancel, and a "Turn off" quiet button.
    - "Turn off" is disabled with hint `discipline_in_use_hint` when `inUse`; `last_discipline` and `discipline_in_use` from the API show as a danger `Banner`.
    - An "Add a discipline" card lists the `available` disciplines, each with a "Turn on" button.
    - A failed save keeps the edits and shows `ladderSaveError`.

- [ ] **Step 1: Write the failing tests:**
  - `toLadderInput keeps ids for existing levels`: `[{id:'l1',nameEn:' Intro ',nameAr:'تمهيدي'},{nameEn:'New',nameAr:'جديد'}]` → `{levels:[{id:'l1',nameEn:'Intro',nameAr:'تمهيدي'},{nameEn:'New',nameAr:'جديد'}]}`.
  - `ladderSaveError names the horses`: `new ApiError(409,'level_range_inverted',{levels:['level_range_inverted'],horses:['Zahra','Najm']})` in `en` → a string containing "Zahra and Najm".
  - `LadderEditor disables removing a level in use`: rows `[{nameEn:'Intro',nameAr:'ت',inUse:true},{nameEn:'Novice',nameAr:'م'}]`. The "Level 1 is used by a horse" button is disabled, and "Remove level 2" is enabled.
  - The existing `DisciplineEditor` behaviour is still covered by the platform e2e: create/edit discipline flows pass unchanged.
- [ ] **Step 2: Run `npx vitest --run src/lib/forms src/lib/components`.** Expected: FAIL.
- [ ] **Step 3: Implement** `LadderEditor`, refactor `DisciplineEditor` onto it, then build the helpers and the page.
- [ ] **Step 4: Verify:**
  - The tests, `npm run check` and eslint pass.
  - In dev: rename a Dressage level and reorder it, turn Eventing on, then off.
  - With a horse on Intro–Novice (after Task 6, re-check), removing Novice is blocked in the UI.
  - The platform `/platform/disciplines` editor still saves.
- [ ] **Step 5: Commit** `feat: let academy admins edit their disciplines and level ladders`

---

### Task 6: Horses list, form, detail and unavailability

**Files:**
- Create:
  - `src/lib/forms/horse.ts`, `src/lib/components/HorseForm.svelte`
  - `src/routes/(academy)/(admin)/horses/+page.server.ts`, `+page.svelte`
  - `src/routes/(academy)/(admin)/horses/new/+page.server.ts`, `+page.svelte`
  - `src/routes/(academy)/(admin)/horses/[id]/+page.server.ts`, `+page.svelte`
- Test: `src/lib/forms/horse.test.ts`

**Interfaces:**
- Consumes: `AcademyDisciplines` and `Horse` types (Task 1); `DateRangeField` (Task 2); `closedRangeErrors` and `formatRange` (Task 4) for unavailability entries.
- Produces (`src/lib/forms/horse.ts`):
  - `type HorseFormState = { name: string; disciplineId: string; minLevelId: string; maxLevelId: string; maxSessionsPerDay: number; notes: string; isActive: boolean }`
  - `newHorseState(d: AcademyDisciplines): HorseFormState`: the first enabled discipline, its first and last levels, 3 sessions, active.
  - `rangeAfterDisciplineChange(d: AcademyDisciplines, disciplineId: string): { minLevelId: string; maxLevelId: string }`: the new ladder's first and last level ids.
  - `horseErrors(s: HorseFormState, d: AcademyDisciplines): FieldErrors`:
    - `name_required` / `name_too_long` (> 60)
    - `level_range_invalid` when min's position is after max's, or either level isn't on the chosen ladder
    - `sessions_per_day_invalid` (not 1–6)
    - `notes_too_long` (> 500)
  - `toHorseInput(s): HorseInput`: trimmed name, `notes: null` when blank.
  - `rangeLabel(h: Horse, locale): string`: "Intro – Novice", or just "Intro" when min equals max.
- **`HorseForm`:**
  - name, a discipline `SelectField`, min and max level `SelectField`s listing the chosen ladder, a sessions-per-day `SelectField` (1–6), notes, and an Active checkbox (edit only)
  - changing the discipline applies `rangeAfterDisciplineChange`
- **Pages:**
  - **`/horses`:**
    - a discipline filter (chips) and a "New horse" button
    - a `sj-list` with name, discipline chip, range chip, `horses_sessions_per_day` and chips for "Unavailable today" / "Inactive"
    - an `EmptyState` when there are no horses
  - **`/horses/new`:** `HorseForm`, then on create it goes to `/horses/{id}`.
  - **`/horses/[id]`:**
    - `HorseForm` to edit
    - an "Unavailable dates" card: a `DateRangeField`, a reason, "Add", and the list with delete buttons
- **Load notes:**
  - The list and detail loads fetch both `/api/academy/horses[...]` and `/api/academy/disciplines`, in parallel with `Promise.all`.
  - `?discipline=` from the URL is passed through to the API.

- [ ] **Step 1: Write the failing tests** in `horse.test.ts`, using the default Dressage and Show jumping ladders from the API plan:
  - `newHorseState picks the first discipline's full ladder`: `minLevelId` is the Intro id, and `maxLevelId` is the Medium+ id.
  - `rangeAfterDisciplineChange resets to the new ladder`: switching to Show jumping gives the Poles and 1.10 m+ ids.
  - `horseErrors`:
    - min Novice, max Intro → `level_range_invalid`
    - a Show jumping level while on Dressage → `level_range_invalid`
    - sessions 0 → `sessions_per_day_invalid`
    - a blank name → `name_required`
  - `rangeLabel`: "Intro – Novice", and "Intro" when they're equal.
- [ ] **Step 2: Run `npx vitest --run src/lib/forms/horse.test.ts`.** Expected: FAIL.
- [ ] **Step 3: Implement** `horse.ts`, `HorseForm` and the three pages.
- [ ] **Step 4: Verify:**
  - The tests, `npm run check` and eslint pass.
  - In dev:
    1. Add "Zahra" (Dressage, Intro–Novice, 3 a day); the home checklist card disappears (3 of 3).
    2. Switching the discipline resets the range.
    3. Add an unavailable range covering today; the list shows "Unavailable today".
    4. In Arabic, the list and form are RTL with translated chips.
- [ ] **Step 5: Commit** `feat: manage school horses and their unavailable dates`

---

### Task 7: End-to-end setup journey and docs

**Files:**
- Modify: `e2e/foundation.e2e.ts` (extract shared helpers), `README.md`
- Create: `e2e/helpers.ts`, `e2e/setup.e2e.ts`

**Interfaces:**
- Consumes: everything above. Also the throwaway e2e stack (M1 follow-up), which needs a `sijjel-api-api` image built from the API's Milestone 3 branch.
- Produces:
  - **`e2e/helpers.ts`:**
    - `signInAsPlatformAdmin(page)`
    - `createAcademy(page, slug): Promise<{name: string}>`
    - `inviteOwner(page, academyName): Promise<string>`, which returns the invite path
    - `signUpOwner(browser, slug, invitePath): Promise<Page>`
  - `foundation.e2e.ts` uses the helpers, with the same assertions as before.
  - `setup.e2e.ts` holds the test "an owner sets up hours, arenas and a horse from the checklist".

- [ ] **Step 1: Write the e2e test** `setup.e2e.ts`. The new owner, on the academy home:
  1. Expect the text "0 of 3 done".
  2. Click "Opening hours" and set Saturday 18:00–22:00. Click "Copy to other open days" after ticking Sun–Wed as open, then set 30-minute sessions.
  3. Expect "8 sessions · 18:00 – 21:30" to be visible **before** clicking Save.
  4. Save, go home, and expect "1 of 3 done".
  5. Click "Arenas", add "Main arena" with capacity 5, go home, and expect "2 of 3 done".
  6. Click "Horses", then "New horse": "Zahra", Dressage, Intro–Novice, and save.
  7. Go home and expect no "ready for bookings" card.
  8. In a fresh browser context, sign in on the academy host as the platform admin, who has no membership in this academy. Open `/settings` and expect the response status 403 and the heading "You don't have access to this page".
- [ ] **Step 2: Rebuild the API image** from `sijjel-api` `feat/m3-academy-setup` (`docker compose --profile app build`; `--network host` on this machine only), then run `npx playwright test`. Expected: 3 passed.
- [ ] **Step 3: Update `README.md`:** list the academy admin pages and note that e2e needs the Milestone 3 API image.
- [ ] **Step 4: Run every check** in Global Constraints. Expected: all pass.
- [ ] **Step 5: Commit** `test: cover the academy setup journey end to end`
