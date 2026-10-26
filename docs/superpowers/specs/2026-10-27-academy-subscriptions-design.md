# Academy subscriptions

## Why

sijjel is about to go online for a trial with real academies. Each academy will pay the platform
monthly, priced by how many riders it has. The platform admin needs to:
- see who has paid and who hasn't;
- give a new academy a free period so it can try the app;
- have booking stop on its own when an academy stops paying, without the academy losing its data.

Payment happens outside the app for now. Academies pay the platform admin by InstaPay or cash, and
the admin marks the month paid.

## Goals

- **Platform plans.** The platform admin defines plans priced by rider count, for example "Up to
  50 riders, EGP X a month". Each academy is on one plan.
- **Paid periods.** The admin records each payment, which covers one month. Each academy has a
  "paid until" date.
- **Free time.** The admin can give an academy free time, for example 30 days when it is added.
- **Grace, then blocking.** When paid or free time runs out, there are 7 days of grace. After
  that, new bookings are refused, while everything stays viewable.
- **Rider limit.** The owner sees "Riders: 47 of 50". At the limit, new rider invites are refused
  until the academy moves to a bigger plan. Existing riders are not affected.
- **Platform list.** The platform admin sees every academy's plan, rider count, status and paid
  until date, and can filter by status.

## Non-goals (later)

- Online payment through Paymob, Fawry or similar. That needs a registered business with the
  provider. The design records how each month was paid, so an online method can be added later
  without reshaping anything.
- Coupon codes that academies type in themselves. These come with academy self-sign-up, which
  doesn't exist; the platform admin still creates every academy.
- Yearly billing.
- Emails or push notifications about payments. There is no email yet.
- Invoices or receipts.

## Anti-goals

- An academy that doesn't pay must never lose data, and its riders must never lose bookings they
  already have.
- A rider must never be blamed. The message riders see while booking is blocked doesn't mention
  payment.
- Academies that existed before this feature must keep working exactly as today until the admin
  puts them on a plan.

## Decisions

### Plans (platform admin)

- A platform plan has an English and an Arabic name, a maximum number of riders, a monthly price
  in EGP (whole pounds), and active or retired. All prices are in EGP.
- Plans are managed at `/platform/plans`, a list plus an add and edit form, like the academy's own
  plans page.
- A retired plan can't be given to an academy. Academies already on it keep it.
- *My call:* a plan's rider limit is required, and is at least 1.

### An academy's subscription

- An academy has an optional plan and a coverage end date, "paid until", which is the first day
  not covered. It is a date on the academy's calendar (its time zone).
- **Entries.** Coverage is built from entries the admin records, kept as history:
  - **Paid month:** the amount (defaulting to the plan's price), the method (`instapay`, `cash`
    or `other`), an optional note, who recorded it and when. It moves "paid until" forward by one
    calendar month, to the academy's billing day (see below): 15 Nov becomes 15 Dec.
  - **Free time:** a number of days (1–366) and an optional note, such as "trial". It moves "paid
    until" forward by that many days.
- **Anchoring.** A month runs from the day the academy started paying. *My call:* coverage stays
  contiguous. An entry always extends from the current "paid until", even when that is in the
  past, so a late payment covers the month that was due, not a month starting today.
  - **Restart:** for an academy that was blocked for a long time and comes back, the paid-month
    form has "Start from today". It sets "paid until" to one month after today instead.
- **Billing day.** *My call:* each academy keeps a billing day of the month, so the day doesn't
  slip after a short month. With a billing day of 31, coverage runs 31 Jan to 28 Feb, then
  28 Feb to 31 Mar.
  - A paid month always ends on the billing day, or on the last day of a shorter month.
  - Free time ends wherever its days end, and that day becomes the new billing day. The month
    the academy starts paying after a trial is then "the day they started".
  - "Start from today" makes today's day the billing day.
  - Undo puts back both "paid until" and the billing day from before that entry.
- **First coverage.** An academy with no coverage yet starts from today. Its first entry, usually
  free time for a trial, starts today.
- **Undo.** *My call:* the admin can delete the most recent entry to fix a mistake, which moves
  "paid until" back. Older entries can't be deleted.

### Status

Status is computed from today (the academy's calendar) and "paid until":

| Status | When |
|---|---|
| No plan | The academy has no plan. Nothing is limited or blocked, which is today's behaviour. |
| Free | Covered, and the most recent entry is free time. |
| Paid | Covered, and the most recent entry is a paid month. |
| Due soon | Covered, but "paid until" is 3 days away or less. *My call.* |
| Grace | Not covered, and less than 7 days past "paid until". |
| Blocked | 7 or more days past "paid until". |

- An academy that is put on a plan but has no entries yet is **Blocked** from the start. *My
  call:* the plan form therefore has an optional "Free days to start with" field, defaulting to
  30, so putting an academy on a plan and giving its trial is one step.
  - The field shows only while the academy has no entries. Moving an academy that already has
    entries to another plan never adds free time.
- **No going back to No plan.** *My call:* once an academy is on a plan, the select no longer
  offers No plan. Otherwise taking an academy off its plan would be an easy way around
  blocking. To pause charging an academy, the admin gives it free time.

### Blocked

While an academy is Blocked:
- **Refused:** new bookings, both a rider booking and staff booking for a rider. The API returns
  409 `academy_blocked`.
- **Still works:** everything else, including viewing, cancelling, the planning board, settings,
  members and invites. Only new bookings stop.
- **Riders** see on the booking page: "Booking is paused at this academy. Please contact the
  academy." The slot list still shows, with Book disabled.
- **Owners and admins** see a banner on every academy page: "Your sijjel subscription is unpaid.
  Booking is paused until it's paid."

During Due soon and Grace, academy admins see a banner on every page:
- Due soon: "Your sijjel subscription is due on {date}."
- Grace: "Your sijjel subscription is overdue. Booking stops on {date}."

Trainers and riders don't see these banners. Every banner says how to pay: "Pay by InstaPay or
cash and let us know." *My call:* this is one fixed message for now, not an editable setting.

### Rider limit

- **The count** is active rider memberships plus pending rider invites (not accepted, not revoked,
  not expired). Suspended riders don't count.
- **At or over the limit, these are refused** with 409 `rider_limit_reached`:
  - creating a rider invite;
  - adding the rider role to an existing member;
  - reactivating a suspended rider.
- **Unaffected:** trainer and admin invites, and existing riders.
- **Where the owner sees it:**
  - Members page: "Riders: 47 of 50".
  - Invite page: the same line, and at the limit, "You've reached your plan's rider limit. Ask
    sijjel to move you to a bigger plan." with the rider choice disabled.
- **Moving to a smaller plan.** *My call:* the admin can move an academy to a plan whose limit is
  below its current riders. Nothing is removed. New riders are refused until the count is under
  the limit. The platform form warns: "This academy has 63 riders, more than this plan's 50."
- An academy with No plan has no limit.

### Platform academies list

- Each row in `/platform/academies` shows, alongside today's columns:
  - the plan name;
  - riders "47 of 50";
  - a status chip;
  - "Paid until 15 Nov".
- A status filter offers: All, Due soon, Grace, Blocked, Free, Paid and No plan.
- *My call:* the default sort is by most urgent status (Blocked, Grace, Due soon) and then by
  paid until.
- The academy's own platform page, `/platform/academies/{id}`, shows:
  - **Plan:** a select with the "Free days to start with" field.
  - **Mark month paid:** amount, method and note, with "Start from today" when the academy isn't
    covered.
  - **Give free time:** days and a note.
  - **Entries:** newest first, with Undo on the newest.

### Owner's view

- *My call:* academy admins get a Subscription page under settings,
  `/settings/subscription`, read-only. It shows:
  - the plan and its price;
  - "Riders: 47 of 50";
  - the status, and "paid until";
  - the last 6 entries.
- Trainers and riders don't see this page.

## Constraints

- Follow the existing stack and patterns:
  - Go API: sqlc, goose, `academy_id` in every tenant query, problem+json codes.
  - SvelteKit web: Paraglide EN/AR, RTL, the sijjel design system.
- **Clock.** Status uses the academy's calendar and the API's injected clock, so tests can set the
  date.
- **Race safety.** The rider-limit check and the booking check run inside the same transaction as
  the write, with the academy row locked for the rider-limit check, so two invites can't both take
  the last place.
- **Arabic.** Every new text has an Arabic version, and every new screen works right to left at
  390 px.
- **Copy.** Plain, short and calm. No wording that shames the academy in front of riders.

## Left to the builder

- Table and column names, and whether "paid until" is stored or derived from entries. If it is
  stored, it must stay consistent with the entries, including after Undo.
- How the academy banner gets its status: in the layout data, or a small endpoint.
- Exact layout of the platform academy page, following the design system.
