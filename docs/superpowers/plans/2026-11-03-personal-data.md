# Personal data (web) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The web app shows each member's own name with no way for staff to change it, and has no
age, weight, rider limits or horse weight limit anywhere.

**Architecture:** This follows the API plan on the API branch `feat/personal-data`, whose image is
built as `sijjel-api-e2e` for the e2e tests. Form logic changes in `src/lib/forms/*` come first,
under unit tests. Then the screens and types, then the e2e helpers.

**Tech Stack:** SvelteKit / Svelte 5, Paraglide EN/AR, vitest (server and browser), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-03-personal-data-design.md` (same file in both repos)

## Global Constraints

- No staff screen can change a member's name.
- No new field on the invite, sign-up, accept step or account page.
- Age and weight are removed completely, including read-only displays.
- Remove the messages that served only the removed fields, from both `messages/en.json` and `messages/ar.json`. `messages.test.ts` must still pass.
- Don't put Arabic script in chat replies (it's fine in files).
- **Commits:** end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`, and are chained with `&&`.

## Review Focus

1. **A member page saved after this change:** the request carries no `displayName`, `age` or `weightKg`, or the API refuses it as unknown fields. Covered by the `toMemberRequest` test in Task 1.
2. **The booking rules page saved after this change:** the request has no limit fields. Covered by the `toBookingRulesRequest` test (or equivalent) in Task 2.
3. **A horse saved after this change:** no `maxRiderWeightKg` is sent. Covered by the `horse.ts` test in Task 2.
4. **The board and rider sheet for a rider:** no weight line, and no crash on the missing field. Covered by the rider-sheet test in Task 2.
5. **The invite form for a rider:** it submits without age. Covered by the `invite-member` tests in Task 1.

---

### Task 1: Member and invite forms lose name, age and weight

**Files:**
- Modify:
  - `src/lib/forms/invite-member.ts`: `RiderForm` loses `age` and `weightKg`; `riderErrors(f: RiderForm): FieldErrors` (no `rules` parameter); `inviteMemberErrors(f: InviteMemberForm): FieldErrors`; `toInviteRequest` has no age or weight; `RiderRules` and `optionalNumber` go if nothing else uses them;
  - `src/lib/forms/member.ts`: `MemberForm` loses `displayName`, `age` and `weightKg`; `memberErrors(f: MemberForm): FieldErrors`; `toMemberRequest` sends `{roles, ...rider fields}`;
  - `src/lib/components/InviteMemberForm.svelte`: the age and weight fields go, and the `rules` prop goes if unused;
  - `src/routes/(academy)/(admin)/members/invite/+page.svelte`, if it passes `rules`;
  - `src/routes/(academy)/(staff)/members/[id]/+page.svelte`:
    - the name `TextField` goes; the `<h1>` already shows the name;
    - the age and weight fields go;
    - `shownFields` loses `displayName`, `age` and `weightKg`.
- Test: `src/lib/forms/invite-member.test.ts`, `src/lib/forms/member.test.ts`, `src/lib/components/invite-member-form.svelte.test.ts`

**Interfaces:**
- **Consumes:** the API (Tasks 1 and 3 of the API plan): `MemberInput` and `RiderFields` without name, age and weight.
- **Produces:** `riderErrors(f)`, `inviteMemberErrors(f)` and `memberErrors(f)`, all without rules.

- [ ] **Step 1: Write the failing tests:**
  - **`invite-member.test.ts`:**
    - `toInviteRequest(rider())` has no `age` or `weightKg` keys;
    - `inviteMemberErrors(rider())` is `{}`, with no rules argument;
    - remove the age and weight cases.
  - **`member.test.ts`:** `toMemberRequest(...)` has no `displayName`, `age` or `weightKg` keys (Review Focus 1).
  - **`invite-member-form.svelte.test.ts`:**
    - `screen.getByLabelText('Age')` and `getByLabelText(/Weight/)` are absent;
    - drop `rules` from the props if the prop goes.
- [ ] **Step 2: Run them.** `npx vitest run src/lib/forms/invite-member.test.ts src/lib/forms/member.test.ts src/lib/components/invite-member-form.svelte.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the signatures above and remove the fields from both screens.
- [ ] **Step 4: Run the checks.** `npx vitest run && npm run check && npx eslint src`. Expected: PASS, 0 errors.
- [ ] **Step 5: Commit.** `git commit -m "feat: staff can't edit a member's name, and invites and members have no age or weight"`

### Task 2: Settings, horses, lists and board lose limits, age and weight

**Files:**
- Modify:
  - `src/lib/api/academy-types.ts` (`BookingRules` without `minRiderAge`, `maxRiderAge` and `maxRiderWeightKg`), `member-types.ts` (`Member` and `PendingInvite` without `age` and `weightKg`), `board-types.ts` (rider without `weightKg`);
  - `src/lib/forms/booking-rules.ts` and its test;
  - `src/routes/(academy)/(admin)/settings/booking-rules/+page.svelte`;
  - `src/lib/forms/horse.ts`, its test, `src/lib/components/HorseForm.svelte`, and `src/routes/(academy)/(admin)/horses/+page.svelte`;
  - `src/routes/(academy)/(staff)/members/+page.svelte`: the age line in rows and in pending invites;
  - the board and rider sheet components that show weight, found with `grep -rn weightKg src/lib/components`;
  - test fixtures: `level-fixtures.ts`, `board.test.ts`, `board-planner.svelte.test.ts` and `rider-sheet.svelte.test.ts`;
  - `messages/en.json` and `messages/ar.json`: remove the keys that are no longer used.
- Test: the files above.

**Interfaces:**
- **Consumes:** the API (Tasks 2 and 3): the types listed above.

- [ ] **Step 1: Write the failing tests:**
  - **Booking rules:** the request built from the form has no `minRiderAge`, `maxRiderAge` or `maxRiderWeightKg` keys (Review Focus 2).
  - **`horse.test.ts`:** the horse request has no `maxRiderWeightKg` (Review Focus 3).
  - **`rider-sheet.svelte.test.ts`:** a rider without `weightKg` renders with no weight text (Review Focus 4).
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement:**
  - Remove the fields from the types, forms and screens.
  - Find the unused message keys with `grep` for each `m.<key>(` in `src`, and delete them from both message files.
- [ ] **Step 4: Run the checks.** `npx vitest run && npm run check && npx eslint src && npx prettier --check src messages`. Expected: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: no rider limits, horse weight limit, age or weight on any screen"`

### Task 3: End-to-end

**Files:**
- Modify:
  - `e2e/helpers.ts`: `inviteRider(owner, slug, opts: { name: string; plan: string })` no longer fills Age;
  - every caller that passes `age`: `e2e/board.e2e.ts`, `members.e2e.ts`, `booking.e2e.ts`, `phone-identity.e2e.ts`, `subscriptions.e2e.ts` and others found with `grep -rn "age:" e2e`;
  - `e2e/members.e2e.ts`: one new assertion.

- [ ] **Step 1: Write the failing assertion.**
  - In `members.e2e.ts` "a trainer moves a rider up…", Layla signs up through `signUp`, which uses the name passed, "Layla".
  - Add a sign-up name different from the invite's: invite "Layla", sign up as "Layla Hassan".
  - The owner's member list shows "Layla Hassan".
  - The member page has the heading "Layla Hassan" and no textbox labelled "Your name" or "Name".
  - Adjust the later `/^Layla/` selectors, which still match.
- [ ] **Step 2: Rebuild the API image** from the API branch (`docker build -q --network host -t sijjel-api-e2e .` in `sijjel-api`), then run `E2E_API_IMAGE=sijjel-api-e2e npx playwright test e2e/members.e2e.ts`. Expected: FAIL until the helpers drop Age, because the API refuses `age`.
- [ ] **Step 3: Update the helpers and callers.**
- [ ] **Step 4: Run the full suite.** `E2E_API_IMAGE=sijjel-api-e2e npm test`. Expected: all unit and e2e tests pass.
- [ ] **Step 5: Commit.** `git commit -m "test: e2e invites carry no age, and members show their own name"`
