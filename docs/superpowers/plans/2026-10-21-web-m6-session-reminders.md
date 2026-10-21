# Web Milestone 6: Session Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Staff can give a group of riders a trainer from the board, and trainers can turn on "Time's up" reminders on their phone.

**Architecture:**
- **The board:** gains a select mode, a trainer choice in the rider sheet, and trainer sub-groups inside an arena.
- **Installing and notifying:** a web app manifest and a push-only service worker make the site installable and able to show notifications.
- **The `/reminders` page:** detects what this device can do and subscribes it through the API.

**Tech Stack:** SvelteKit 3 / Svelte 5 runes, Paraglide EN/AR, Vitest (node + browser), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-21-session-reminders-design.md`. The API contract is in `sijjel-api/docs/superpowers/plans/2026-10-21-api-m6-session-reminders.md`: `BoardRider.trainer`, `PUT /api/board/riders/trainer`, the `/api/push/*` endpoints, the push message `{title, body, url, tag, lang}`, and the error codes there are binding.

## Global Constraints

- **The board stays uncluttered:**
  - An arena where every rider follows one trainer looks exactly as today.
  - Sub-groups ("Omar · 4", "Ahmed · 3", then "No trainer") appear only when an arena's riders have more than one trainer.
  - Rows stay rider + horse.
- **Select mode:** a "Select" action shows checkboxes on rows. A bar at the bottom then offers "Trainer…" for the ticked riders, with the active staff list plus "Same as arena". It's only shown when `session.editable`.
- **The "Session reminders" page:**
  - It's reached from a `notifications` icon button in the app bar for academy staff only, at `/reminders` in the `(staff)` group. It's hidden when `GET /api/push/key` is 404.
  - The states it shows:
    - **iPhone not installed:** the home-screen how-to, "Share → Add to Home Screen".
    - **Not supported.**
    - **Blocked:** permission denied, with how to allow it in settings.
    - **Off:** a button to turn on.
    - **On:** "Send a test" and "Turn off".
  - On Android, after turning on, a tip about exempting Chrome from battery optimisation.
- **Sign out:** if this device has a subscription, the web calls `DELETE /api/push/subscriptions` first. A failure there doesn't block sign-out.
- **The service worker** only handles `push` (shows the notification, `dir` from the payload language) and `notificationclick` (focuses an open tab or opens `url`). No caching, no offline.
- **Copy and layout:** EN and AR keys at parity, RTL-safe, built on `src/lib/ui`, phone first.
- **Comments:** only where intent isn't obvious, above the code, never end-of-line.

## Review Focus

1. Changing date or time while select mode is on: the selection clears and the bar never writes to the previous session. Pinned in Task 2.
2. An iPhone in Safari (not standalone) must never show the "Turn on" button, because subscribing would fail there. Pinned in Task 4.
3. A permission that was already denied shows the "Blocked" state, not a button that silently does nothing. Pinned in Task 4.
4. A subscription that the browser still has but the API lost (for example the endpoint was deleted after a 410) shows "Off", and turning on re-sends it. Pinned in Task 4.
5. Arabic RTL: the sub-group headers and the select bar mirror correctly, and the notification shows right to left. Checked in Task 5.

---

### Task 1: Types, grouping helper and messages

**Files:**
- Modify: `src/lib/api/board-types.ts` (`BoardRider.trainer: NamedRef | null`), `src/lib/forms/board.ts`, `src/lib/forms/board.test.ts`, `messages/en.json`, `messages/ar.json`, `src/lib/messages.test.ts`

**Interfaces:**
- Produces:
  - `trainerGroups(arena: BoardArena, riders: BoardRider[]): {trainer: NamedRef | null, riders: BoardRider[]}[]`.
    - It returns one group with the arena's trainer when every rider follows a single trainer.
    - Otherwise it returns groups in first-seen order, with the `null` ("No trainer") group last.
    - A rider's trainer is `rider.trainer ?? arena.trainer`.
  - **Messages:**
    - `board_select`, `board_select_done`, `board_selected_count` ("{count} selected"), `board_set_trainer`, `board_same_as_arena`
    - `reminders_title`, `reminders_intro`, `reminders_ios_install`, `reminders_unsupported`, `reminders_blocked`, `reminders_turn_on`, `reminders_on`, `reminders_test`, `reminders_test_sent`, `reminders_turn_off`, `reminders_battery_tip`
    - `error_bookings_required`, `error_bookings_mixed_sessions`, `error_push_disabled`, `error_subscription_invalid`
- [ ] **Step 1: Write the failing tests** for `trainerGroups`:
  - all following Omar → one group `Omar`
  - two Omar and one with own trainer Ahmed → `[Omar(2), Ahmed(1)]`
  - an arena with no trainer and one rider with Ahmed → `[Ahmed(1), No trainer(n)]`
  - no trainers at all → one group with `trainer: null`
- [ ] **Step 2: Run** `npx vitest --run src/lib/forms/board.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the helper and the messages.
- [ ] **Step 4: Run** the tests, `npm run check` and `npx eslint .`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add trainer groups and reminder messages`

---

### Task 2: Trainer groups on the board

**Files:**
- Modify: `src/lib/components/BoardSession.svelte` (sub-groups, select checkboxes), `src/lib/components/BoardPlanner.svelte` (select mode state, bar, reset on `sessionKey`), `src/lib/components/RiderSheet.svelte` (trainer choice)
- Create: `src/lib/components/SelectBar.svelte`
- Test: `src/lib/components/board-session.svelte.test.ts`, `src/lib/components/board-planner.svelte.test.ts`, `src/lib/components/rider-sheet.svelte.test.ts`

**Interfaces:**
- Consumes: Task 1 `trainerGroups`. API `PUT /api/board/riders/trainer {bookingIds, trainerId}` returns a `BoardSession`.
- Produces:
  - `BoardSession` gets `selecting: boolean`, `selected: Set<string>` and `ontoggle: (bookingId: string) => void`. When `selecting` is true, a row click toggles the rider instead of calling `onrider`.
  - `SelectBar` props: `{session, selected: string[], locale, onsession, ondone}`.
- [ ] **Step 1: Write the failing tests:**
  - An arena with riders on Omar and Ahmed shows "Omar · 2" and "Ahmed · 1". An arena all on Omar shows no sub-header.
  - In select mode, clicking two rows and choosing "Omar" sends one PUT with both booking ids and `trainerId`. "Same as arena" sends `null`. The returned session replaces the board and select mode ends.
  - Changing `sessionKey` (a rerender with another start) clears the selection, with no request sent.
  - The rider sheet's trainer choice sends `{bookingIds: [id], trainerId}` and shows the rider's current trainer selected.
  - With `editable: false` there's no Select action and no trainer choice in the sheet.
- [ ] **Step 2: Run** `npx vitest --run src/lib/components/`. Expected: FAIL.
- [ ] **Step 3: Implement.** The select bar sits fixed above the bottom navigation and shows "{count} selected", "Trainer…" and "Done".
- [ ] **Step 4: Run** the tests, check and lint. Expected: PASS.
- [ ] **Step 5: Commit** `feat: give a group of riders a trainer from the board`

---

### Task 3: Manifest and service worker

**Files:**
- Create: `src/routes/manifest.webmanifest/+server.ts`, `src/service-worker.ts`, `static/icons/icon-192.png`, `static/icons/icon-512.png`, `static/icons/apple-touch-icon.png` (rendered from the existing hoof favicon)
- Modify: `src/app.html` or the root layout head (`<link rel="manifest">`, `apple-touch-icon`, `theme-color`), `src/lib/forms/manifest.ts` + test

**Interfaces:**
- Produces:
  - `webManifest(tenant, locale): object`. For an academy host it gives `name` and `short_name` (the academy name in the locale), `start_url: "/"`, `display: "standalone"`, `theme_color` (the academy accent tone the hooks already compute), `background_color`, `dir` and `lang`, plus the icons. The platform host gets "sijjel".
  - The service worker handles `push` and `notificationclick` only.
- [ ] **Step 1: Write the failing tests:**
  - `webManifest` for an Arabic academy gives the Arabic name, `dir: "rtl"` and `display: "standalone"`.
  - The service-worker handlers are pure functions exported from `src/lib/push/sw-handlers.ts`. Test that `notificationOptions({title, body, url, tag, lang: 'ar'})` gives `dir: 'rtl'`, the tag, and `data.url`, and that `pickClient(clients, url)` prefers an open same-origin client.
- [ ] **Step 2: Run** `npx vitest --run src/lib/forms/manifest.test.ts src/lib/push`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `src/service-worker.ts` imports the handlers.
  - Keep SvelteKit's automatic registration.
- [ ] **Step 4: Run** the tests, `npm run check` and `npm run build`. Expected: PASS, and the build output contains `service-worker.js`.
- [ ] **Step 5: Commit** `feat: make the academy site installable with a notifications service worker`

---

### Task 4: The reminders page and sign-out

**Files:**
- Create: `src/lib/push/device.ts` (+ test), `src/routes/(academy)/(staff)/reminders/+page.server.ts`, `+page.svelte`, `src/lib/components/RemindersPanel.svelte`, `src/lib/components/reminders-panel.svelte.test.ts`
- Modify: `src/routes/+layout.svelte` (app bar button for staff; unsubscribe on sign-out)

**Interfaces:**
- Produces:
  - **In `device.ts`:**
    - `type ReminderState = 'ios_install' | 'unsupported' | 'blocked' | 'off' | 'on'`
    - `detectState(env: {userAgent, standalone: boolean, hasPush: boolean, permission: NotificationPermission, subscribed: boolean}): ReminderState`. It checks iOS without standalone first, then no PushManager, then `denied`, then subscribed.
    - `subscribeDevice(publicKey: string, locale): Promise<void>`: requests permission from the tap, subscribes with `applicationServerKey`, and POSTs `{endpoint, keys, language}`.
    - `unsubscribeDevice(): Promise<void>`
    - `isAndroid(ua)`
  - **The page load** fetches `GET /api/push/key`. On 404 the page shows `error_push_disabled`.
  - **`subscribed`** means the browser has a subscription AND the API accepted it in this session. On every page open with a browser subscription the page re-POSTs it, so an endpoint the API lost is restored (Review Focus 4).
- [ ] **Step 1: Write the failing tests:**
  - `detectState`:
    - iPhone UA, not standalone, even with `hasPush` → `ios_install`
    - standalone iPhone with `default` → `off`
    - `denied` → `blocked`
    - no PushManager → `unsupported`
    - subscribed → `on`
  - `RemindersPanel` (with stubbed `navigator` and `fetch`):
    - In `ios_install` there's no "Turn on" button, and the how-to is shown.
    - "Turn on" POSTs the subscription with `language: 'ar'` in Arabic.
    - After turning on with an Android UA, the battery tip shows.
    - "Send a test" POSTs `/api/push/test` and shows `reminders_test_sent`.
    - "Turn off" DELETEs and shows `off`.
  - Layout: signing out with a subscription calls DELETE before logout, and a failing DELETE still signs out.
- [ ] **Step 2: Run** `npx vitest --run src/lib/push src/lib/components/reminders-panel.svelte.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the tests, check and lint. Expected: PASS.
- [ ] **Step 5: Commit** `feat: let trainers turn session reminders on for their phone`

---

### Task 5: End to end and phone check

**Files:**
- Modify: `e2e/board.e2e.ts`, `README.md`

- [ ] **Step 1: Extend `board.e2e.ts`.**
  1. Three riders book the same session.
  2. On the board, tap Select, tick two riders and choose the owner as trainer.
  3. Open the third rider and choose another staff member.
  4. Reload and see both sub-groups.
- [ ] **Step 2: Rebuild the `sijjel-api-e2e` image from the M6 API branch** (never the `sijjel-api-api` tag), and run `npx playwright test`. Expected: all pass.
- [ ] **Step 3: Check on the throwaway stack:**
  - the board sub-groups and the select bar in Arabic RTL at 390px
  - `/reminders` in Chromium: turn on, send a test, and see the notification
- [ ] **Step 4: README:** the reminders page, plus a pointer to the API README's HTTPS-from-a-phone notes. The user checks real delivery on an Android phone and an iPhone.
- [ ] **Step 5: Run every check and commit** `test: cover trainer groups end to end`
