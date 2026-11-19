# Platform academy pages: a guided "New academy" flow and a tabbed academy page

Approved mock-ups (2026-11-19), saved next to this file:
- tabs: `2026-11-19-platform-academy-pages/academy-page.png` (frames 4 and 5 show Give free time and Block in place)
- flow: `2026-11-19-platform-academy-pages/new-academy-flow.png`

The mock-ups win where this text and they disagree, with two exceptions:
- the tab is called Subscription, even where the desktop frame's caption says Billing;
- the "New academy" frames of the tabs mock-up show a Setup card before an owner exists, which is wrong (see Overview).

## Why

The platform admin opened an academy's page on a phone and found it "really really confusing", without trying to do anything in particular.

The page (`/platform/academies/[id]`) shows every form at once, one card after another:
- package
- mark paid
- give free time
- history
- block
- booking setup
- owner and setup

The academies list is busy too. Each row carries discipline chips, an owner chip, a setup chip, a package chip, the status, invite buttons and a "Subscription" link. Adding an academy is an inline form on that list, followed by an inline invite form on the row.

Adding an academy and looking after an existing one are different jobs, so they get different screens.

## Goals

- **Add an academy in a guided flow,** one decision per screen, with progress always visible.
- **An existing academy's page reads at a glance on a phone.** Status first, and one main action per tab. Each less frequent action sits in the card it belongs to, so there is no menu to discover.
- **Reuse only the patterns the app already has,** each with the meaning it already has (see `CLAUDE.md`, "Patterns in the app").

## Non-goals

- No API changes. The flow uses the existing endpoints:
  - `POST /platform/academies`
  - `PUT /platform/academies/{id}/package`
  - `POST /platform/academies/{id}/owner-invites`
- How subscriptions, trials or invites work stays as it is.
- No "Finish adding" resume link on the list. The academy page shows what is missing.
- Deleting academies is not part of this.

## Anti-goals

- Two main buttons on one screen.
- A tab or row that looks like navigation but acts as a button.
- Losing work: once the academy is created in step 2, leaving the flow never loses it.

## Approaches considered

For the academy page:
- **A: summary first, with actions in a sheet and a More menu.**
- **B: tabs.** The user picked B, because it fits the app: the rider and horse pages already switch views of one item with underlined tabs.
  - A ⋮ More menu in the header (as on the rider profile) was mocked and rejected by the user as not fitting the design.
  - Its two actions moved into the Subscription tab's cards. The rider and staff profiles keep their menu.
- **C: an overview with Settings-style rows to sub-pages.** Rejected: those rows mean "a settings sub-page" in this app, and Block would be a row that acts as a button.

For adding an academy:
- **A setup checklist on the academy page.** Rejected by the user. It mixes adding an academy with looking after one, and you would still need to know to go to another tab.
- **A separate step-by-step flow.** Chosen.

## Part 1: the "New academy" flow

### Route

The flow lives at `/platform/academies/new`. "New academy" on the list (`sj-page-head` primary button, icon `add`) links there. The inline `NewAcademyForm` on the list goes away.

### Every step has

- A quiet ✕ link at the top:
  - **steps 1–2:** "Academies", back to the list; nothing has been saved yet;
  - **steps 3–4:** "Finish later", to the new academy's page.
- The title "New academy".
- A `ProgressBar` with "Step N of 4 · <name>" under it.
- One card with that step's fields, then a row of actions: the primary on the end side, quiet ones on the start side.

### The steps

1. **Academy:** web address (with the existing slug hint), name in English, name in Arabic. Button: **Next**, which checks these fields locally and makes no call.
2. **How it runs:** country (with the currency and calling-code hint), time zone, default language, disciplines taught, who books sessions.
   - Buttons: **Back** (quiet), and **Create academy**, which sends the one existing `POST /platform/academies` with the fields from steps 1 and 2.
   - If the API rejects a step-1 field (for example, the web address is taken), the flow goes back to step 1 and shows the error under that field.
3. **Package:** a success banner, "{name} is created. Next, its package.", then the package (only active packages of the academy's country), free days to start with, and "Start the free days when setup is finished" (checked by default).
   - Buttons: **Skip for now** (quiet), and **Save package**, which calls `PUT …/package` with `freeDays` and `startAfterSetup`.
4. **Owner:** "The owner gets a link to sign up and set up the academy.", then their name, phone (optional) and email (optional), with the existing hints.
   - Buttons: **Skip for now** (quiet), and **Create invitation**.
   - Once the invitation is created, the card becomes the existing `InviteShareCard` (WhatsApp as primary, QR code), followed by a secondary **Go to the academy** button.

### Finishing

**Go to the academy**, **Skip for now** on step 4, and **Finish later** all open `/platform/academies/{id}`. The Overview there shows a success banner:
- "{name} is added. The trial starts when {owner} finishes setting it up." when an owner was invited and a trial waits for setup;
- "{name} is added." otherwise.

### Notes

- **Back is only possible before the academy exists** (steps 1↔2). Afterwards, details change on the academy's Settings tab.
- **The step and the academy id live in the page's state.** Reloading the flow after step 2 starts it over at step 1. The academy is not lost: it is on the list, and its page shows what is missing.

## Part 2: the academy page, with tabs

### Header (every tab)

- A quiet back button, "Academies".
- The academy name as `sj-title`.
- Status chips:
  - the subscription status;
  - "Blocked" when blocked;
  - "Riders: N of M", with the group icon.
- Underlined tabs (`.tabs`, links with `aria-current`, `?tab=` in the URL, as on `members/[id]`): **Overview** (default), **Subscription**, **Settings**.

### Overview

- **Package card**, with one of:
  - the package name and limit, the monthly price, and "Paid until {date}" or the waiting text;
  - while the trial waits for setup: "N free days start when setup is finished." and a secondary "Start the trial now";
  - with no package: "No package yet." and a secondary "Choose a package", linking to `?tab=subscription`.
- **Owner card:** the existing `AcademyOwner` content (invite status, send again, cancel invite, or the invite form via "Invite owner").
- **Setup card:** the existing `AcademySetup`, only when the owner has joined (`showsSetup`).
- **The success banner** from the flow, when arriving from it.

### Subscription

1. **Package card:**
   - a heading, the package line and the price;
   - a quiet **Change** button that opens the package select (and, before any entry, free days and "start after setup") inline in the same card, with Save and Cancel;
   - with no package, the select is open from the start.
2. **Mark month paid**, as now: amount, paid by, note, and "Start from today" when unpaid. This is the tab's one primary button.
   - While the trial waits for setup, this card is replaced by "Payments and free time open once the trial starts."
   - With no package, it is not shown.
3. **Payments and free time** history, with Undo on the newest entry, as now.
   - A quiet **Give free time** button (icon `redeem`) in the card's heading row; it wraps under the heading on narrow phones.
   - Tapping it opens days, a note, a secondary "Give free time" button and Cancel inside this card, above the entries.
   - The button is hidden while the form is open, and shown only when Give free time is shown today: with a package, and not while the trial waits for setup.
4. **A danger banner at the top when unpaid**, built from the existing `subscription_unpaid_months` text, plus the amount owed and "Booking is blocked." only when blocked.
5. **Block booking card**, the last card on the tab:
   - **Not blocked:** "New bookings stop until you unblock this academy or record a paid month." and a secondary **Block booking** (icon `block`).
     - Tapping it turns the card raised, with the existing `subscription_block_confirm` text, a danger **Block booking** and Cancel.
   - **Blocked:** a short line saying bookings are stopped and that recording a paid month also unblocks, and a secondary **Unblock** (the existing `subscription_unblock`, icon `lock_open`).
   - Always shown, as the block card is today.

### Settings

The existing `AcademyBookingSetup`: country and who books.

## Part 3: the academies list

- Each row is a whole-row link to the academy (the "Whole-row link in a list" pattern), with:
  - the name;
  - the status chip, plus "Blocked";
  - the rider count;
  - the "Paid until" or unpaid line.
- The row's buttons and extra chips go away: invite, send again, discipline, owner, setup and package chips, and the "Subscription" link.
- The status filter stays.

## Copy

- **New strings, in en and ar:**
  - "Step {n} of {total}";
  - the step names (Academy, How it runs, Package, Owner);
  - Next, Back, Skip for now, Finish later, Go to the academy;
  - the two "is created" / "is added" banners;
  - the owner step's intro sentence;
  - the tab names (Overview, Subscription, Settings);
  - Change;
  - the block card's short lines.
- **Existing keys reused wherever they exist:** `academy_*`, `subscription_*`, `owner_*`, `invite_*`.

## Calls left to the builder

- How the flow keeps its step: component state, or `?step=` in the URL. With `?step=`, steps 3–4 also need the academy id in the URL.
- Splitting `NewAcademyForm` into its two step components, or giving it a `step` prop.
- Splitting `AcademySubscription` into tab-sized components. The tests move with the behaviour.
- The e2e tests that walk these pages (`foundation`, `owners`, `subscriptions`, and any that use the "Subscription for {name}" link or row buttons) are updated to the new screens.
