# Web Milestone 5: Planning Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A phone-first `/board` page where staff see one session at a time, place riders on horses and in arenas, set trainers, suggest horses, and write ride notes.

**Architecture:** A server load fetches `GET /api/board`. Client actions call the board endpoints through `api()` and replace the session with the returned `BoardSession`. A rider sheet component holds the history, horse picker, arena picker and note.

**Tech Stack:** SvelteKit 3 / Svelte 5 runes, Paraglide EN/AR, Vitest (node + browser), Playwright.

**Spec:** `docs/superpowers/specs/2026-10-19-planning-board-design.md`. The API contract is in `sijjel-api/docs/superpowers/plans/2026-10-19-api-m5-planning-board.md` (the `BoardSession`, `HorsePicker` and error codes there are binding).

## Global Constraints

- **Layout:** one session at a time (the user's choice, mockup A).
  - A row of session times sits at the top; a time with a problem gets a small dot.
  - Riders are grouped by arena, with the trainer named once per group, and a "Not placed" group comes first.
  - Each row shows only the rider and their horse, or "Pick horse".
- **Problems are quiet:** a small brass icon on the row, and the explanation inside the sheet. No banners on the board.
- **Design system:** built on `src/lib/ui`, phone first. EN and AR keys at parity, RTL-safe (`directional` icons, `dir="ltr"` on times).
- **Access:** staff only, via the existing `(academy)/(staff)` guard. The "Board" nav item uses icon `view_agenda` and sits right after Home for admins and trainers.
- **Comments:** only where intent isn't obvious, above the code, never end-of-line.

## Review Focus

1. A placement refused with 409 (someone else just took the horse): the sheet shows the reason in words, refreshes the picker, and the board isn't left showing the stale horse. Pinned in Task 3.
2. A past session: the time row still works, but the sheet offers no horse or arena changes, only the note. Pinned in Task 3.
3. Switching date or time while the sheet is open: the sheet closes, and it never writes to the previous session. Pinned in Task 2.
4. Arabic RTL: the time row scrolls from the start edge, and chevrons flip. Checked in Task 5.
5. Tapping "Suggest horses" twice quickly: one request only (busy guard). Pinned in Task 4.

---

### Task 1: Types, helpers, messages and navigation

**Files:**
- Create: `src/lib/api/board-types.ts`, `src/lib/forms/board.ts`, `src/lib/forms/board.test.ts`
- Modify: `messages/en.json`, `messages/ar.json`, `src/lib/messages.test.ts` (new error and problem codes), `src/routes/+layout.svelte` (nav)

**Interfaces:**
- Produces:
  - Types mirroring the API: `BoardSession`, `BoardRider`, `BoardArena`, `BoardTime`, `HorsePicker`, `PickerHorse`, `Ride`, `PlacementResult`.
  - `groupByArena(session: BoardSession): {arena: BoardArena | null, riders: BoardRider[]}[]`: the "Not placed" group (`arena: null`) comes first and only when non-empty, then arenas in the API's order, including empty ones.
  - `problemText(code: string, locale): string` via `board_problem_<code>`.
  - `horseStateText(h: PickerHorse, locale): string`: `free` → "", `current` → "Current", `taken` → "With {name}", `resting` → "Resting: {used} of {max} today", `unavailable` → "Unavailable today", `unsuitable` → "Not for this rider".
  - `defaultArenaFor(picker: HorsePicker, session: BoardSession): string | null`: the arena of the most recent ride that has an arena, if it still has `placesLeft > 0`; else null.

- [ ] **Step 1: Write the failing tests** in `board.test.ts`:
  - `groupByArena` puts unplaced riders first, keeps empty arenas, and omits "Not placed" when everyone is placed.
  - `horseStateText` for each state, including "Resting: 3 of 3 today".
  - `defaultArenaFor` returns the last ride's arena, skips a full arena (null), and returns null with no history.
  - `problemText('horse_unavailable', 'en')` is the message text.
- [ ] **Step 2: Run** `npx vitest --run src/lib/forms/board.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Add messages (EN and AR):
  - `nav_board`, `board_title`, `board_not_placed`, `board_no_trainer`, `board_pick_horse`, `board_suggest`, `board_suggest_done`, `board_no_sessions`, `board_past_note_only`
  - the sheet strings: `board_history`, `board_no_history`, `board_horse`, `board_arena`, `board_trainer`, `board_note`, `board_note_hint` ("Optional. You can dictate with the keyboard's microphone."), `board_save`, `board_places_left`, `board_unplaceable`
  - `board_problem_*` for the five problem codes
  - `error_*` for the new API codes
  - the horse state texts
- [ ] **Step 4: Run** the tests, `npm run check`, `npx eslint .`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: add planning board types, helpers and messages`

---

### Task 2: The board page

**Files:**
- Create: `src/routes/(academy)/(staff)/board/+page.server.ts`, `+page.svelte`, `src/lib/components/BoardSession.svelte`
- Test: `src/lib/components/board-session.svelte.test.ts`

**Interfaces:**
- Consumes: Task 1 helpers.
- Produces:
  - **The page:**
    - The load reads `?date` and `?start` and calls `GET /api/board`.
    - The app bar shows a date input (defaulting to the API's date); changing it navigates to `?date=`.
    - The time row has a link per `times` entry (`?date&start`), marks the current one, and shows the dot for `hasProblem`.
  - **`BoardSession` component** props: `{session: BoardSession, locale, onrider: (r: BoardRider) => void, ontrainer: (a: BoardArena) => void}`.
    - It renders the groups; a group header reads "{arena} · {trainer | No trainer}" with its count.
    - A row shows the avatar initial, the name, and the horse name, own horse name or "Pick horse".
    - A row with problems gets a brass `warning` icon (`aria-label` = the problem text).

- [ ] **Step 1: Write the failing component test:**
  - with a session holding one unplaced rider, two arenas (one with trainer "Omar") and a placed rider with `problems: ['horse_unavailable']`, it shows the "Not placed" group first
  - it shows "Main arena · Omar" and "Side arena · No trainer"
  - it shows "Pick horse" on the unplaced row
  - it shows an icon labelled with the problem text on the placed row
  - clicking a row calls `onrider` with that rider
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** the component and page. Wrap the page body in `{#key session.date + session.start}` so a date or time change closes any open sheet.
- [ ] **Step 4: Run** the tests and check. Expected: PASS.
- [ ] **Step 5: Commit** `feat: show one session of the planning board`

---

### Task 3: The rider sheet

**Files:**
- Create: `src/lib/components/RiderSheet.svelte`
- Test: `src/lib/components/rider-sheet.svelte.test.ts`
- Modify: the board page (open the sheet, apply results)

**Interfaces:**
- Produces: `RiderSheet` props `{session: BoardSession, rider: BoardRider, locale, onclose: () => void, onsession: (s: BoardSession, unplaceable: string[]) => void}`.
  - On open it fetches `GET /api/board/horses?bookingId=`. It shows:
    - the rider's level and history (date, horse, arena, trainer, note)
    - the problem texts for this rider
    - the horse list with each horse's note and state text; only `free` and `current` horses can be chosen
    - the arena choices with places left, pre-selected by `defaultArenaFor` when the rider has none
    - a note textarea (500 characters max)
  - **Save:**
    1. sends `PUT /api/bookings/{id}/placement {horseId, arenaId}` when the horse or arena changed
    2. sends `PUT /api/bookings/{id}/note` when the note changed
    3. calls `onsession`
    4. closes the sheet
  - When `session.editable` is false, only the note is shown and saved.
  - On a 409 the sheet shows `errorText(code)`, re-fetches the picker and stays open.
  - The board shows `board_unplaceable` with the names in a pending `Banner` after a placement returns them.

- [ ] **Step 1: Write the failing component tests** (stub `fetch`, as the closed-dates page test does):
  - It renders the history and the horses, with "With Layla" on a taken horse and that horse not selectable.
  - Choosing a free horse and saving sends `{horseId, arenaId}`, with the default arena from history.
  - A 409 `horse_taken` shows "That horse was just given to someone else." and refetches the picker (two GETs).
  - When not editable, no horse list is shown and saving sends only the note.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** The sheet is a full-height panel on phones and a side panel from 720px, using existing `Card` and `Button` styles. Focus moves to its heading on open, and Escape closes it.
- [ ] **Step 4: Run** the tests, check and lint. Expected: PASS.
- [ ] **Step 5: Commit** `feat: place a rider and write a ride note from the board`

---

### Task 4: Trainers and suggestions

**Files:**
- Modify: the board page, `BoardSession.svelte`
- Create: `src/lib/components/TrainerPicker.svelte`
- Test: `src/lib/components/trainer-picker.svelte.test.ts`

**Interfaces:**
- Produces:
  - `TrainerPicker` props `{session, arena, locale, onclose, onsession}`. It lists `session.staff` plus "No trainer", and `PUT /api/board/trainer`.
  - A "Suggest horses" button sits under the time row, shown only when `editable` and at least one school rider has no horse. It calls `POST /api/board/suggest`, then shows `board_suggest_done` ("Horses suggested for {count} riders.").

- [ ] **Step 1: Write the failing tests:**
  - `TrainerPicker` lists staff and "No trainer"; choosing one sends `{date, start, arenaId, trainerId}`; "No trainer" sends `trainerId: null`.
  - The suggest button is disabled while its request is in flight, so a double click sends one POST.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the tests, check and lint. Expected: PASS.
- [ ] **Step 5: Commit** `feat: set session trainers and suggest horses from the board`

---

### Task 5: End-to-end journey and docs

**Files:**
- Create: `e2e/board.e2e.ts`
- Modify: `e2e/helpers.ts` (reuse `setUpAcademy`, `inviteRider`), `README.md`

- [ ] **Step 1: Write `board.e2e.ts`.** The owner:
  1. sets up the academy and a second horse
  2. invites two riders who each book the same first bookable slot through the API from their own pages
  3. opens Board, selects that session, and sees both under "Not placed"
  4. places rider one on Zahra in the main arena
  5. taps "Suggest horses" and sees rider two get the other horse
  6. sets the trainer
  7. opens rider one and writes a note
  8. reopens the sheet and sees the note in the board row's sheet
- [ ] **Step 2: Rebuild the API image from the M5 API branch, and run `npx playwright test`.** Expected: all pass (5 tests).
- [ ] **Step 3: Check on the throwaway stack:** the board in Arabic RTL on a 390px viewport, and a trainer account can place riders.
- [ ] **Step 4: README:** the board route.
- [ ] **Step 5: Run every check and commit** `test: cover planning a session end to end`
