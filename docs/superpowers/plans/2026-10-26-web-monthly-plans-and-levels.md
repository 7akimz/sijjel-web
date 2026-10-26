# Monthly Plans, Plan Levels and Moving Riders (Web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:**
- Plans read as "N lessons a month" and can cover chosen levels.
- Riders see "Left this month".
- Staff move riders from a Level section on the rider's page, with coming changes and history.

**Architecture:**
- Mirrors the API plan, `sijjel-api/docs/superpowers/plans/2026-10-26-api-monthly-plans-and-levels.md`, which must be merged first, with the `sijjel-api-e2e` image rebuilt from it.
- Fitting is a pure helper shared by the invite form, the rider form and the move dialog.
- The Level section and the move dialog are new components. The 442-line rider page only hosts them.

**Tech Stack:** SvelteKit 3 / Svelte 5 runes, TypeScript, Paraglide EN/AR, Vitest browser tests, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-26-monthly-plans-and-levels-design.md`

## Global Constraints

- **API changes from the API plan:**
  - Plan fields are `lessonsPerMonth` (1–62) and `levels` (`{id, nameEn, nameAr, position}[]`, where empty means all levels); input uses `levelIds`.
  - `PlanSummary` has `lessonsPerMonth`, `usedThisMonth`, `leftThisMonth`, `monthStart` and `monthEnd`, and no week fields.
  - The booking warning and reason is `monthly_limit`, replacing `weekly_limit`.
  - New field errors:
    - `lessons_per_month_invalid`
    - `levels_need_discipline`
    - `level_unknown`
    - `plan_not_for_rider`
    - `plan_required`
    - `level_unchanged`
    - `level_moves_only`
    - `start_invalid`
  - `Member` gains `comingMove` (`{discipline, level, from}` or null), `comingPlan` (`{plan, from}` or null) and `levelHistory`, newest first: `{from: {discipline, level} | null, to: {discipline, level}, plan: Plan | null, startsOn, madeBy, madeAt}[]`.
  - Move routes:
    - `POST /api/academy/members/{id}/move` with body `{disciplineId, levelId, start: 'today'|'next_month', planId?}`, returning `Member`
    - `DELETE /api/academy/members/{id}/move`
    - `DELETE /api/academy/members/{id}/coming-plan`
  - `GET` plans and `GET` disciplines are open to trainers.
- **Fit rule:** a plan fits when it has no discipline, or its discipline is the rider's and it has no levels or includes the rider's level. Only active plans are offered.
- **Staff:** owners, admins and trainers can move riders. The rider edit form, which is admin-only, no longer edits discipline or level.
- **Plan changes start on the 1st:**
  - Picking a different plan in the rider form or the move dialog shows that it starts on the 1st of next month.
  - A move's start is "From 1 <Month>" (the default) or "From today".
- **Copy:**
  - EN and AR for every message.
  - Arabic calls a plan "خطة".
  - Counts use a label-plus-number style ("Left this month: 5 of 8", "8 a month" in a chip), never "N riders"-style plurals.
  - Mixed-direction names go in `<bdi>`.
- **Conventions:**
  - Use the design-system components (`#lib/ui`) and `resolve()` for every link and `goto`.
  - Run `npm run check`, `npx eslint .` and Prettier before each commit.
  - Run e2e with `E2E_API_IMAGE=sijjel-api-e2e`.
  - Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **A coming change shown in Arabic and on a phone.** Dates (`formatDate`), levels and plan names must read right to left, and the Cancel buttons must not wrap off-screen. Check with a throwaway Arabic screenshot pass at 390 px in Task 4.
2. **A rider whose current plan doesn't fit after a move "from today".** The rider form must still save other edits: it sends the unchanged plan, and the API accepts it. The plan select must show the current plan even though it no longer "fits". Pinned in Task 3: `keeps the current plan as an option even when it no longer fits`.
3. **A trainer opening a rider's page.** The trainer sees the Level section and can move the rider, but sees no edit form and no payments. Pinned in Task 4 e2e.
4. **Plan levels when the discipline changes in the plan form.** Ticks from the old discipline must be dropped, not sent. Pinned in Task 1: `clears ticked levels when the discipline changes`.
5. **Booking pages without the week fields.** The rider's book page must still open on the current week. Pinned in Task 2 by the existing booking e2e.

---

### Task 1: Plan form and list: lessons a month and levels

**Files:**
- Modify:
  - `src/lib/api/member-types.ts`: `Plan`, `PlanInput`
  - `src/lib/forms/plan.ts` and its test
  - `src/lib/components/PlanForm.svelte`
  - `src/routes/(academy)/(admin)/settings/plans/+page.svelte`
  - `messages/en.json`, `messages/ar.json`
- Test: `src/lib/forms/plan.test.ts`, `src/lib/components/plan-form.svelte.test.ts` (new)

**Interfaces:**
- Produces:
  - `Plan.lessonsPerMonth: number`
  - `Plan.levels: { id: string; nameEn: string; nameAr: string; position: number }[]`
  - `PlanInput.lessonsPerMonth`, `PlanInput.levelIds: string[]`
  - `planErrors` checks 1–62 with `lessons_per_month_invalid`.

- [ ] **Step 1: Write tests.**
  - `plan.test.ts`: 0 and 63 are invalid, 62 is valid.
  - `plan-form.svelte.test.ts`:
    - `shows level checkboxes for the chosen discipline`: no checkboxes for "Any discipline", the Dressage ladder's names after choosing Dressage, and the submit body carrying the ticked `levelIds`.
    - `clears ticked levels when the discipline changes`: tick a Dressage level, switch to Show jumping, and the body has `levelIds: []`.
- [ ] **Step 2: Run** `npx vitest run src/lib/forms/plan.test.ts src/lib/components/plan-form.svelte.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The field label is "Lessons a month" / "عدد الحصص في الشهر".
  - The levels are a `CheckboxField` group titled "Levels (optional)", with the hint "Leave empty for every level." It only appears once a discipline is chosen.
  - The plan list chip reads "8 a month", and a plan's levels show as a second muted line (the names joined with " · "), or nothing when empty.
  - Replace `plan_sessions`, `plan_per_week` and `error_sessions_per_week_invalid`.
- [ ] **Step 4: Run** the tests and `npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: plans count lessons a month and can cover chosen levels`.

### Task 2: Monthly limit in rider and booking screens

**Files:**
- Modify:
  - `src/lib/api/member-types.ts`: `PlanSummary`
  - `src/lib/components/RiderHome.svelte` and its test
  - `src/lib/forms/booking.ts` and its test (`warningTexts`, the reason texts)
  - `src/routes/(academy)/(rider)/book/+page.server.ts` and `+page.svelte`
  - messages
  - `e2e/helpers.ts`, `e2e/booking.e2e.ts`, `e2e/board.e2e.ts`, `e2e/setup.e2e.ts` (plan form labels)

**Interfaces:**
- Consumes: `PlanSummary.{lessonsPerMonth, usedThisMonth, leftThisMonth, monthStart, monthEnd}`.
- Produces: the rider book page's first week is `weekStartOf(academyToday(tenant.academy.timeZone))`, as the staff book page already does.

- [ ] **Step 1: Update tests.**
  - `rider-home.svelte.test.ts` expects "Left this month: 1 of 2", and after cancelling a booking "Left this month: 2 of 2".
  - `booking.test.ts` maps `monthly_limit` to the new warning text.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - English messages:
    - `rider_plan_left` is "Left this month: {left} of {total}".
    - `slot_reason_monthly_limit` is "You've used this month's lessons".
    - `error_monthly_limit` is "This rider has used this month's lessons. Book anyway?"
  - Arabic for each:
    - "المتبقي هذا الشهر: {left} من {total}"
    - "استخدمت حصص هذا الشهر"
    - "استخدم هذا الفارس حصص الشهر. هل تريد الحجز على أي حال؟"
  - Delete `weekly_limit` texts.
- [ ] **Step 4: Run** `E2E_API_IMAGE=sijjel-api-e2e npm test`. Expected: PASS. Fix the e2e plan-form labels ("Lessons a month").
- [ ] **Step 5: Commit** with `feat: show and enforce lessons left this month`.

### Task 3: Offer only plans that fit

**Files:**
- Create: `src/lib/forms/plans-fit.ts`, `src/lib/forms/plans-fit.test.ts`, `src/lib/forms/month.ts`, `src/lib/forms/month.test.ts`
- Modify:
  - `src/lib/components/InviteMemberForm.svelte`
  - `src/routes/(academy)/(staff)/members/[id]/+page.server.ts`: also return `today: academyToday(tenant.academy.timeZone)` for all staff
  - `src/routes/(academy)/(staff)/members/[id]/+page.svelte`: the rider form loses its discipline and level selects; plan options use the helper
  - `src/lib/forms/member.ts` and its test: `toMemberInput` still sends the member's current `disciplineId` and `levelId` unchanged
  - messages: `error_plan_not_for_rider`, `error_level_moves_only`, `member_plan_from` ("Starts on {date}")

**Interfaces:**
- Produces:
  - `planFits(plan: Plan, disciplineId: string, levelId: string): boolean`
  - `plansFor(plans: Plan[], disciplineId: string, levelId: string, keep?: string): Plan[]`: the active plans that fit, plus the plan with id `keep` when given, even if retired or no longer fitting.
  - `firstOfNextMonth(today: string): string`, in `month.ts`.
  - Page data `today` (`YYYY-MM-DD`, academy calendar).

- [ ] **Step 1: Write `plans-fit.test.ts`.**
  - `fits plans with no discipline, the rider's discipline and no levels, or including the level`
  - `refuses another discipline or levels without the rider's`
  - `leaves out retired plans`
  - `keeps the current plan as an option even when it no longer fits`
  - `month.test.ts`: `firstOfNextMonth('2026-10-26')` is `'2026-11-01'`, `firstOfNextMonth('2026-12-15')` is `'2027-01-01'`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** the helper. Use it in the invite form (with discipline and level from the form) and in the rider form (with the member's discipline and level, `keep` = the current plan id). When the rider form's plan differs from the current one, show the hint `member_plan_from` with `formatDate(firstOfNextMonth(data.today), locale)`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** with `feat: offer only plans that fit the rider; plan changes start next month`.

### Task 4: Level section, move dialog, coming changes and history

**Files:**
- Create:
  - `src/lib/components/MemberLevel.svelte` and `member-level.svelte.test.ts`
  - `src/lib/components/MoveRider.svelte` and `move-rider.svelte.test.ts`
  - `src/lib/forms/move.ts` and `move.test.ts`
- Modify:
  - `src/lib/api/member-types.ts`: `ComingMove`, `ComingPlan`, `LevelChange`, `Member` fields
  - `src/routes/(academy)/(staff)/members/[id]/+page.server.ts`: load disciplines and plans for all staff; booking rules and schedule stay admin-only
  - `src/routes/(academy)/(staff)/members/[id]/+page.svelte`: render `MemberLevel` for riders, for all staff
  - messages
  - `e2e/members.e2e.ts` (new)

**Interfaces:**
- Produces:
  - `nextLevel(ladder: AcademyLevel[], levelId: string): AcademyLevel | null`, in `move.ts` (the ladder is already in order).
  - Consumes `plansFor` and `firstOfNextMonth` from Task 3.
  - `MemberLevel` props: `{ member: Member; disciplines: AcademyDisciplines; plans: Plan[]; today: string; locale: Locale; onchange: (m: Member) => void }`.
  - `MoveRider` props: `{ member; disciplines; plans; today; locale; target?: { disciplineId: string; levelId: string }; onmoved: (m: Member) => void; oncancel: () => void }`.

- [ ] **Step 1: Write tests.**
  - `move.test.ts`:
    - `nextLevel` gives the following level in ladder order, and null at the top or for an unknown id.
  - `member-level.svelte.test.ts`:
    - It shows "Flatwork · Level 1" and a "Move to Level 2" button.
    - It shows no move button at the top of the ladder.
    - It shows a coming move, "Moves to Show jumping · Level 1 on 1 Nov", with a Cancel button that calls `DELETE .../move`. Stub `fetch`, as `rider-sheet.svelte.test.ts` does.
    - It shows a coming plan with Cancel.
    - It lists history newest first: "Level 1 → Level 2 · 3 Nov · Omar", and the starting entry as "Started at Level 1 · 1 Oct".
  - `move-rider.svelte.test.ts`:
    - The start defaults to "From 1 November", with "From today" as the other choice.
    - When the current plan fits the target, there is no plan select and the body has no `planId`.
    - When it doesn't, the plan select (from `plansFor`) is required, and submitting without it shows `plan_required` text.
    - The "Change level…" mode offers every taught discipline and its ladder.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `MemberLevel` is a `Card` titled "Level" / "المستوى".
  - `MoveRider` replaces the card's body inline. It is not a modal.
  - Chosen copy, EN / AR:
    - "Move to {level}" / "انقل إلى {level}"
    - "Change level…" / "تغيير المستوى…"
    - "From 1 {month}" / "من 1 {month}"
    - "From today" / "من اليوم"
    - "Moves to {discipline} · {level} on {date}" / "ينتقل إلى {discipline} · {level} في {date}"
    - "Plan changes to {plan} on {date}" / "تتغير الخطة إلى {plan} في {date}"
    - "Started at {level} · {date}" / "بدأ في {level} · {date}"
    - "Cancel" uses the existing cancel message.
- [ ] **Step 4: Write `e2e/members.e2e.ts`: `a trainer moves a rider up next month and the owner sees the history`.** The flow:
  1. Set up the academy.
  2. Create a plan "Beginner, 8 a month" for Dressage Intro only, and a plan "Preliminary, 8 a month" for Preliminary only.
  3. Invite Layla at Intro on the Beginner plan, and invite and sign up trainer Omar.
  4. Omar opens Layla's page: there is no "Save" button for the profile, and the Level card shows "Move to Preliminary".
  5. Omar clicks it, picks "Preliminary, 8 a month", and keeps "From 1 <next month>".
  6. The card shows the coming move and the coming plan.
  7. The owner reloads Layla's page and sees both coming lines.
  8. The owner cancels the move.
- [ ] **Step 5: Run** `E2E_API_IMAGE=sijjel-api-e2e npm test`. Expected: PASS.
- [ ] **Step 6: Do a throwaway Arabic phone check.** Write a temporary spec at 390 px with `PARAGLIDE_LOCALE=ar` on the academy host, as before. Take screenshots of the Level card with a coming move, a coming plan and history, and of the move dialog. Read them, fix anything right-to-left or overflowing, then delete the temporary spec.
- [ ] **Step 7: Commit** with `feat: move riders between levels with coming changes and history`.

### Task 5: Docs

- [ ] **Step 1: Update `README.md`.** Change the plans line to lessons a month and levels, and add a "Levels" line: staff move riders from the rider's page, now or from the 1st, and plans change on the 1st.
- [ ] **Step 2: Run** `E2E_API_IMAGE=sijjel-api-e2e npm test` and `npx eslint .`. Expected: PASS.
- [ ] **Step 3: Commit** with `docs: monthly plans and moving riders`.
