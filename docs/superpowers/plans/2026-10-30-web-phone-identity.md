# Web Phone Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** People sign in with "Phone or email", sign up on invites with a phone, are pointed to sign-in when they already have an account, and manage their own phone, email and name on `/account`. Staff see the account phone read-only.

**Architecture:**
- **Pure helpers** (`src/lib/forms/invite.ts`, a new `src/lib/account.ts`) hold the validation and the "already has an account" and "needs a phone" decisions.
- **Components:**
  - a new `AccountForm.svelte` holds the account page's form;
  - the login and invite routes change their fields;
  - a root layout load redirects accounts without a phone.
- **The API plan** (`sijjel-api/docs/superpowers/plans/2026-10-30-api-phone-identity.md`) provides `POST /api/auth/login {identifier, password}`, `GET`/`PUT /api/me` and the invite `phone`/`phoneLocked` fields.

**Tech Stack:** SvelteKit / Svelte 5, Paraglide EN/AR, vitest-browser-svelte, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-30-phone-identity-design.md`

## Global Constraints

- **Phone fields:** `type="tel"`, `inputmode="tel"`, `autocomplete="tel"`, `dir="ltr"`. The client never rewrites the typed digits; the API normalises them, Arabic digits included.
- **Sign-in:** one field, `identifier`, labelled "Phone or email" with a plain text keyboard, plus the password. Every failure shows `error_login_failed`.
- **Copy:** the spec's copy table, EN/AR, verbatim:
  - `field_identifier`, `field_phone`, `field_email_optional`
  - `error_login_failed` (replaced), `error_phone_taken`, `error_phone_invalid`, `error_phone_mismatch`
  - `invite_has_account` (with `{academy}`)
  - `account_title`, `account_add_phone`, `member_phone_hint`
  - `account_saved`: "Saved." / "تم الحفظ."
- **Layout:** logical CSS only, dark mode, mobile-first, sijjel UI components.
- **`Me.email` and `Member.email`** become `string | null`; `Me` gains `phone: string | null`.

## Review Focus

- An existing development account without a phone opens any page and lands on `/account` with "Add your phone number to continue."; `/login`, `/api/*` and `/account` itself never redirect. → Task 3 test.
- A rider who already has an account fills in the invite's sign-up form, gets `phone_taken`, and sees the "already have an account" panel with a sign-in link that pre-fills their phone. → Task 2 test.
- On an Arabic page, the phone field still reads left to right and accepts `٠١٠…`. → Task 1 test (dir and inputmode attributes) and the e2e in Task 5.
- The member page shows the phone as text with a WhatsApp link and no input, and the member PUT body never has `phone`. → Task 4 test.
- A locked invite phone can't be edited (readonly), and a mismatch shows `error_phone_mismatch`. → Task 2 test.

---

### Task 1: Sign in with phone or email

**Files:**
- Modify: `src/lib/ui/TextField.svelte` (type `'tel'` adds `inputmode="tel"`), `src/lib/ui/fields.svelte.test.ts`, `src/lib/api/types.ts` (`Me`), `src/lib/api/member-types.ts` (`Member.email` nullable), `src/routes/login/+page.ts`, `src/routes/login/+page.svelte`, `messages/en.json`, `messages/ar.json`, `src/lib/messages.test.ts`

**Interfaces:**
- Produces:
  - `TextField` `type` accepts `'tel'`.
  - The login load returns `{ returnTo, identifier }`. `identifier` comes from the `identifier` query parameter, trimmed and at most 254 characters, or `''`.
  - Messages `field_identifier`, `field_phone`, `field_email_optional`, `error_phone_taken`, `error_phone_invalid`, `error_phone_mismatch`, and the new `error_login_failed` text.

- [ ] **Step 1: Failing tests.**
  - `fields.svelte.test.ts`: a `TextField` with `type="tel"` and `dir="ltr"` renders `input[type=tel][inputmode=tel][dir=ltr]`.
  - `messages.test.ts`: the new keys exist in both languages. `en.error_login_failed` is `"The phone, email or password is wrong."`.
- [ ] **Step 2: Run** `npx vitest run src/lib/ui/fields.svelte.test.ts src/lib/messages.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Login sends `{ identifier: identifier.trim(), password }`.
  - The field is `TextField label={m.field_identifier()} name="identifier" autocomplete="username" dir="ltr"`, pre-filled from `data.identifier`.
  - Update every `Me.email` and `Member.email` use so it compiles. Show `—` where an email is missing in member lists.
- [ ] **Step 4: Run** the tests again, plus `npm run check`. Expected: PASS, 0 errors.
- [ ] **Step 5: Commit** `feat: sign in with a phone or email`.

### Task 2: Invite sign-up with a phone

**Files:**
- Modify: `src/lib/forms/invite.ts`, `src/lib/forms/invite.test.ts`, `src/routes/(academy)/invite/[token]/+page.svelte`, the invite preview type (wherever `InvitePreview` is declared), `messages/*.json`

**Interfaces:**
- Consumes: Task 1 messages and the `TextField` tel type.
- Produces:
  - `InviteSignUp { displayName: string; phone: string; email: string; password: string }`.
  - `toSignUpRequest(form) → { displayName, phone, email: string | null, password }`, with each field trimmed and a blank email sent as `null`.
  - `inviteFormErrors(form, invited: { email?: string | null; phone?: string | null; phoneLocked?: boolean }) → FieldErrors`:
    - an empty phone → `phone: ['phone_invalid']`;
    - a non-blank email that isn't valid → `email_invalid`;
    - `email_mismatch` as today, when an invited email is set;
    - name and password as today.
    - It doesn't check `phone_mismatch`: digits in Arabic or other formats can't be compared reliably in the browser, so the API decides.
  - `existingAccount(error: ApiError, form: InviteSignUp): string | null` returns `form.phone.trim()` for `phone_taken`, `form.email.trim()` for `email_taken`, else `null`.
  - Message `invite_has_account`.

- [ ] **Step 1: Failing tests** in `invite.test.ts`:
  - An empty phone gives `phone_invalid`.
  - Phone `٠١٠١٢٣٤٥٦٧٨` with an empty email passes.
  - Email `x` gives `email_invalid`.
  - `toSignUpRequest` sends `email: null` for `'  '`.
  - `existingAccount(new ApiError(409,'phone_taken'), form)` returns the phone; for `'email_taken'` it returns the email; for `'already_member'` it returns `null`.
- [ ] **Step 2: Run** `npx vitest run src/lib/forms/invite.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The page's sign-up form has name, phone (pre-filled from `preview.phone`, readonly when `preview.phoneLocked`), email (`field_email_optional`, readonly when `preview.email` is set) and password.
  - When `accept` fails and `existingAccount(...)` returns a value, replace the form with a `Banner` showing `m.invite_has_account({ academy })` and a primary `Button`. The button's href is `/login?returnTo=<invite path>&identifier=<value>`, built with `URLSearchParams` and `resolve`.
- [ ] **Step 4: Run** the tests and `npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: invites sign up with a phone and point existing accounts to sign in`.

### Task 3: Your account page and the add-a-phone redirect

**Files:**
- Create: `src/lib/account.ts`, `src/lib/account.test.ts`, `src/lib/components/AccountForm.svelte`, `src/lib/components/account-form.svelte.test.ts`, `src/routes/account/+page.svelte`, `src/routes/account/+page.ts`
- Modify: `src/routes/+layout.server.ts` (redirect), `src/routes/+layout.svelte` (an app-bar `account_circle` button labelled `account_title`, placed before Sign out), `messages/*.json`

**Interfaces:**
- Consumes: the `Me` type (Task 1).
- Produces:
  - `needsPhone(user: Me | null, pathname: string): boolean`. True when the user is signed in, `user.phone` is null, and `pathname` is not `/account` and doesn't start with `/login`, `/api/`, `/healthz` or `/theme`.
  - `AccountForm` props `{ me: Me; onsaved: (me: Me) => void }`. It PUTs `/api/me` `{displayName, phone, email: email.trim() || null}`. It shows field errors from the API, the 409 codes on their own fields (`phone_taken` → phone, `email_taken` → email) and `account_saved` on success.
  - In the root `+layout.server.ts`, `needsPhone(locals.user, url.pathname)` → `redirect(303, '/account?add_phone=1')`. The account page shows `Banner` `account_add_phone` when `add_phone` is present.

- [ ] **Step 1: Failing tests.**
  - `account.test.ts`, `needsPhone`:
    - `{phone:null}` on `/` → true;
    - on `/account`, `/login?x`, `/api/me` → false;
    - `{phone:'2010…'}` → false;
    - `null` user → false.
  - `account-form.svelte.test.ts`, with `fetch` stubbed:
    - **Saves:** change the phone, Save → one PUT with `{displayName, phone:'01000000001', email:null}`; "Saved." shows; `onsaved` is called with the response.
    - **Taken phone:** a 409 `phone_taken` response → "An account with this phone number already exists." shows under the Phone field.
    - **Empty phone:** clearing the phone and saving → no fetch and `phone_invalid` text shows.
- [ ] **Step 2: Run** `npx vitest run src/lib/account.test.ts src/lib/components/account-form.svelte.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The page title is `account_title`.
  - `onsaved` calls `invalidateAll()`, then `goto('/')` when `add_phone` was set.
- [ ] **Step 4: Run** the tests, `npm run check` and `npx eslint src`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: your account page, and accounts add a phone before going on`.

### Task 4: Staff see the account phone read-only

**Files:**
- Modify: `src/lib/forms/member.ts`, `src/lib/forms/member.test.ts`, `src/lib/api/member-types.ts` (`MemberInput` drops `phone`), `src/routes/(academy)/(staff)/members/[id]/+page.svelte`, `messages/*.json` (`member_phone_hint`)

**Interfaces:**
- Produces: `MemberForm` without `phone`; `toMemberInput` never returns `phone`.

- [ ] **Step 1: Failing test** in `member.test.ts`: `toMemberInput(...)` for a rider and for a trainer has no `phone` key (`expect(result).not.toHaveProperty('phone')`).
- [ ] **Step 2: Run** `npx vitest run src/lib/forms/member.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The member page drops the phone `TextField` and drops `'phone'` from `shownFields`.
  - When `member.phone` is set, it shows the number (`dir="ltr"`) with the existing WhatsApp link, and `member_phone_hint` in small muted text below.
- [ ] **Step 4: Run** the test and `npm run check`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: staff see the account phone, riders change it themselves`.

### Task 5: End to end with phones

**Files:**
- Modify: `e2e/config.ts` (`ADMIN_PHONE = '01000000000'`), `e2e/global-setup.ts` (`admin create --phone ADMIN_PHONE --email ADMIN_EMAIL`), `e2e/helpers.ts`
- Create: `e2e/phone-identity.e2e.ts`

**`e2e/helpers.ts` changes:**
- `signInAsPlatformAdmin` fills "Phone or email".
- `signUpOwner` fills a phone: `e2ePhone(slug)`, a new exported helper returning `010` plus 8 digits from a hash of `slug`.
- Rider sign-up helpers fill a phone the same way.

- [ ] **Step 1: Write** `phone-identity.e2e.ts`, `a rider joins a second academy by signing in with their phone in Arabic digits`:
  - Create academies A and B with owners.
  - A's owner invites a rider using the existing rider-invite helper. A new browser page signs up on A's invite with name "Nour", phone `01055500011` and no email.
  - B's owner invites a rider. A fresh browser page (signed out) opens B's invite and fills name and the same phone. Submitting shows "You already have a sijjel account. Sign in to join …".
  - Clicking Sign in shows the identifier pre-filled. Replace it with `٠١٠٥٥٥٠٠٠١١` and enter the password. That lands back on the invite with the Accept button; accept → B's home page.
  - On A's host, sign in on a new page with `+20 105 550 0011` → A's home page.
- [ ] **Step 2: Run** `E2E_API_IMAGE=sijjel-api-e2e npm test`, after `docker build -q --network host -t sijjel-api-e2e .` on the API branch. Expected: every unit test and every e2e spec passes, including the new one.
- [ ] **Step 3: Commit** `test: riders across academies sign in by phone end to end`.
