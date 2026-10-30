# Phone as the account identity

The first of three pieces about riders who belong to more than one academy. The other two pieces
are "a rider leaves an academy" and "details carry over, with level sharing by choice". They get
their own specs.

## Why

Riders in Egypt know themselves by their phone number, not an email address. Today an account is an
email address, and each academy keeps its own copy of the rider's phone, typed by staff. That causes
three problems:

- **Dead end on joining a second academy.** A rider moving from academy A to academy B opens B's
  invite and sees a sign-up form. If they type the email they used at A, they get "email taken" and
  have to find "Sign in" themselves.
- **No sign-in by phone.** The one identifier riders actually remember can't be used to sign in.
- **One person, several phone numbers.** The same person can have a different phone in every
  academy, and nothing connects those copies to the person.

Success looks like this:

- A rider signs in with their phone number and password on any academy's address.
- When they join a second academy, the invite page sees they already have an account and asks them
  to sign in.
- Every academy sees the same, current phone number for that person.

## Goals

- Every new account has a phone number. It is unique across sijjel.
- Email is optional. When it's set, it is also unique and can be used to sign in.
- One sign-in field, "Phone or email", plus the password.
- Sign-up on an invite asks for the phone (required) and the email (optional). A phone or email that
  already has an account leads straight to signing in.
- One phone per person, on the account. Every academy the person belongs to sees it, and the
  WhatsApp links use it.
- People can change their own phone, email and name on a "Your account" page.

## Non-goals

- Checking that a number belongs to the person with SMS or WhatsApp codes. Decided: not now. It
  needs a message provider, and it comes later, probably with hosting.
- "Forgot password". It needs codes too. Until then, support resets passwords with a CLI command
  (below).
- Changing your password from the account page. *My call:* left out to keep this piece small. It's an
  easy follow-up.
- Leaving an academy, and carrying details over to a new academy. Those are the next two pieces.

## Anti-goals

- **Revealing who has an account.** Sign-in must never say whether a phone or email exists. Sign-up
  may say a phone or email is taken, because that's unavoidable for uniqueness, but only to the
  person filling in the form.
- **Staff changing someone's sign-in.** Once the phone identifies a person, staff in any academy
  editing it would mean staff could take over an account. Staff therefore see the phone but can't
  change it.
- **Locking out today's accounts.** Every existing account keeps working.

## What changes for people

### Signing in (`/login`, platform and academy hosts)

- **One field**, labelled "Phone or email", plus "Password". The keyboard is the normal text
  keyboard, because an email needs letters.
- **How the field is read.** Anything containing `@` is treated as an email. Anything else is read as
  a phone number and normalised with `domain.NormalizePhone`:
  - On an academy's address, a local number starting with `0` uses the academy's
    `country_calling_code`.
  - On the platform address, it uses a new `DEFAULT_CALLING_CODE` setting (default `20`).
  - `+20…` and `0020…` work everywhere. Arabic-Indic digits work, as they do today.
- **Wrong details** still show the single "The phone, email or password is wrong." Nothing says which
  part was wrong.

### Signing up on an invite (`/invite/[token]`)

- **Fields:** name, phone (required), email (optional), password.
  - The phone is pre-filled from the invite when staff entered one, and the rider can correct it.
  - On an owner invite from the platform, a phone or email the platform admin entered is fixed,
    as the email is today.
- **When the phone or email already has an account**, the API returns `phone_taken` or
  `email_taken`. The page then:
  - replaces the form with "You already have a sijjel account. Sign in to join {academy}.";
  - shows a Sign in button that goes to `/login?returnTo=/invite/{token}`, with the phone or email
    already filled in.
- **Signed-in visitors** see only the Accept button, as today. The invite's phone is never compared
  with their account's phone, because it's only where staff sent the link.

### Your account (`/account`, every host, signed in)

- **Fields:** name, phone and email (optional). Save shows "Saved."
- **Errors:** `phone_taken`, `email_taken`, `phone_invalid` and `email_invalid` show on their
  fields.
- **Where it lives:** linked from the app bar's account menu, or from the profile area for riders.
  *My call:* next to "Sign out", wherever that sits today.
- **Accounts without a phone.** Accounts made before this change have no phone. After signing in
  they are sent to `/account` with a banner, "Add your phone number to continue." Every other page
  sends them back until a phone is saved. This affects only existing development accounts and the
  platform admin.

### Staff screens

- **What staff see.** Wherever staff see a member's phone today (the member page and its WhatsApp
  link), they see the account's phone instead.
- **Read only.** On the member page the phone is no longer an editable field. *My call*, for the
  anti-goal above. A hint under it reads "Riders change their number from their account."
- **Invites.** Staff still type a phone on an invite. It's where the WhatsApp message goes, and it
  pre-fills sign-up.

## Data (builder's area, with these decisions)

**Migration `00017_phone_identity.sql`:**

- **`users.phone`:** a new column, `text NULL UNIQUE`, with `CHECK (phone ~ '^[0-9]{8,15}$')`. It
  holds international digits such as `201001234567`.
- **`users.email`:** drop `NOT NULL`. Keep it unique (citext).
- **At least one identifier:** add `CHECK (phone IS NOT NULL OR email IS NOT NULL)`.
- **Copying phones across:** for each user without a phone, copy the phone from their most recently
  created membership that has one, unless another user already has that number. Then drop
  `memberships.phone`.
- **Down migration:** re-adds `memberships.phone`, filled from `users.phone`. It doesn't restore
  `NOT NULL` on email if any user has no email; it fails loudly instead.
- **`invites.phone` is unchanged.** Accepting an invite no longer copies it anywhere.

**Accounts:**

- New accounts are created with a phone. `createUser` takes phone and email, and email may be
  empty.
- `ValidateNewAccount` adds `phone_invalid`. Email is validated only when it's given.
- A unique violation maps to `phone_taken` or `email_taken`, depending on which constraint fired.
- `Login(identifier, password)` uses a new `GetUserByPhone` query beside `GetUserByEmail`. The timing
  equaliser (`dummyHash`) covers both.

**API:**

- `POST /api/auth/login` takes `{identifier, password}`. The old `{email, password}` body is
  dropped; both repos ship together.
- `GET /api/invites/{token}` (the preview) adds `phone`, so sign-up can pre-fill it. Whoever holds
  the link is the person it was sent to.
- Sign-up on an invite takes `{displayName, phone, email?, password}`.
- `GET /api/me` adds `phone`, and `email` becomes nullable.
- `PUT /api/me` takes `{displayName, phone, email}`.
- Owner invites take an optional `phone` beside `email`. On sign-up, a phone that doesn't match the
  invite's returns `phone_mismatch`, as `email_mismatch` works today.
- `PUT /api/academy/members/{id}` drops `phone`.

**CLI:**

- `sijjel-api admin create --phone <number> [--email <email>] [--name <name>]`. It finds an
  existing account by phone, then by email, and grants the platform-admin flag.
- `sijjel-api user reset-password --phone <number>` (or `--email`). It reads the new password from
  stdin and ends that user's sessions. This is support's tool until codes exist.
- `sijjel-api user set-phone --email <email> --phone <number>`. Support uses it to fix a number
  someone claimed wrongly.

## Copy (EN / AR)

| Key | English | Arabic |
|---|---|---|
| field identifier | Phone or email | الهاتف أو البريد الإلكتروني |
| field phone | Phone | الهاتف |
| field email optional | Email (optional) | البريد الإلكتروني (اختياري) |
| error login_failed | The phone, email or password is wrong. | الهاتف أو البريد الإلكتروني أو كلمة المرور غير صحيحة. |
| error phone_taken | An account with this phone number already exists. | يوجد حساب بهذا الرقم بالفعل. |
| error phone_invalid | Enter a phone number, like 010 1234 5678. | أدخل رقم هاتف، مثل 010 1234 5678. |
| error phone_mismatch | Use the phone number this invitation was sent to. | استخدم رقم الهاتف الذي أُرسلت إليه هذه الدعوة. |
| invite has account | You already have a sijjel account. Sign in to join {academy}. | لديك حساب في سجل بالفعل. سجّل الدخول للانضمام إلى {academy}. |
| account title | Your account | حسابك |
| add phone banner | Add your phone number to continue. | أضف رقم هاتفك للمتابعة. |
| member phone hint | Riders change their number from their account. | يغيّر الفرسان أرقامهم من حساباتهم. |

The builder writes the rest in the same plain tone.

## Constraints

- **Accepted risk until codes exist:** anyone can sign up with a number that isn't theirs. Mitigations:
  - Staff-entered invite phones are pre-filled.
  - Owner invites can lock the phone.
  - Support has `set-phone` and `reset-password`.
- **End-to-end helpers** (`e2e/helpers.ts`) sign up and sign in by phone from now on.
- **Tests:** follow the existing patterns, `newTestEnv` in the API and vitest-browser plus Playwright
  in the web app. No test data goes in the dev database.
- **Interface:** mobile-first, RTL-correct, dark mode, on sijjel design-system components.
- **Phone fields:** `inputmode="tel"`, `autocomplete="tel"`, and `dir="ltr"` inside Arabic pages.

## Left to the builder

- The exact query names and how the login handler tells phones from emails beyond the `@` rule.
- Whether the "add your phone" redirect lives in the web hooks or in the layout load.
- Where `/account` is linked from on each host, if no account menu exists yet.
