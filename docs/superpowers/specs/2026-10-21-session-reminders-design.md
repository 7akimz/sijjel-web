# Milestone 6: Session reminders — Design

## Intent

At a usual academy the session grid is real: everyone in the 18:00 session stops at 18:30 together and the next riders get on. When a session runs over, two things go wrong. The user described both from their own riding:

- **The next rider waits.** The user once waited 10–15 minutes for a rider to dismount before they could mount.
- **The horse goes straight from one rider to the next with no break.** On that day the mare had just finished a long session; a groom and the user both said she would tire, and the head coach still said mount.

The trainer is the one who stops all riders at once, so the trainer is the one who needs to know the time is up. This milestone sends each assigned trainer a single "Time's up" notification on their phone when their session ends. It reminds; it doesn't decide anything.

The user's own academy is an outlier (flexible times, decided on a whim); the app follows the usual academy, as on the board.

## Goals

1. When a session ends, every trainer assigned in it gets one phone notification: "Time's up".
2. A trainer can be assigned to a single rider, not only to an arena, because at some academies (the user's included) trainers teach particular riders; arena-wide trainers are more common for beginners.
3. Trainers turn reminders on once, with guidance for the steps their phone needs, and can turn them off.

## Non-goals (this phase)

- Reminders for riders or admins. The user: "just the trainers for now".
- Any notification before the end ("5 minutes left"). The user chose a single notification so it isn't annoying.
- Timers inside a lesson (for example 5 minutes trotting). The user said those weren't real timed blocks.
- Warnings about a horse working back to back. Discussed and parked by the user ("we can't put any rules here for now, let's wait and see"). Research notes for later: typical school horses work about 2 hours a day; a 2023 study (Ijichi et al., 30 horses) found pain scores rose with hours worked; a fit horse needs about 10–15 minutes for heart rate and temperature to recover, longer in humidity. No research was found on back-to-back sessions specifically.
- WhatsApp, SMS or email.
- A native app.

## Anti-goals

- **Annoying notifications.** One per trainer per session end, nothing else.
- **Notifying people who aren't involved.** Only trainers assigned in that session. A session with nobody assigned notifies nobody, not even admins (the user's decision).
- **A cluttered board.** The per-rider trainer must not add noise to rows that simply follow their arena's trainer.

## Decisions made with the user

| Topic | Decision |
|---|---|
| Who | Only trainers assigned in the ending session: an arena's trainer, or a trainer set for one rider. |
| Several trainers | A session can have several trainers (one per arena plus per-rider ones); each gets the reminder. |
| Nobody assigned | Nobody is notified. |
| When | Once, at the session's end time. |
| Riders | Not in this milestone. |
| Back-to-back horse warning | Parked. |

## Research that shaped it

- **iPhone (about 12% of phones in Egypt, Statcounter, August 2026):** web push works from iOS 16.4, **only** for a site added to the home screen; never from a Safari or Chrome tab. Permission must be asked from a user tap. Developers report subscriptions occasionally disappearing.
- **Android (about 88%):** web push works in Chrome without installing. Battery optimisation on some brands (Xiaomi, Oppo, Samsung and others) can delay delivery; exempting Chrome from battery optimisation fixes it.
- Web push needs HTTPS (or localhost) and a service worker.

## Calls made by the assistant (the user can overturn these)

### Per-rider trainer
- A booking can carry its own trainer. When set, it replaces the arena's trainer for that rider; when not set, the rider follows the arena's trainer as today.
- Set from the rider sheet on the board, with the same staff list as the arena trainer picker plus "Same as arena".
- The board row shows a trainer name only when it differs from the arena's trainer, so the usual case stays as clean as today. The group header still names the arena trainer.
- Any staff member can set it, past sessions can't be changed, and it takes the academy-day lock like other placements. The last setter and time are stored.
- A rider with a per-rider trainer but no arena still counts: that trainer is reminded.

### Who is reminded, exactly
A session is identified by date and start time in the academy's time zone. At the end of a session, the recipients are the distinct set of:
- the trainer of each arena in that session that has at least one active booking **following the arena's trainer** (placed in that arena with no per-rider trainer), and
- the per-rider trainer of each active booking in that session.

So an arena trainer whose riders all have their own trainers isn't teaching anyone in that session and isn't reminded, and neither is the trainer of an empty arena. A trainer whose membership isn't active at send time (suspended, or no longer staff) or who has no reminder subscription is skipped.

**The session's end** is the latest `end_time` among the session's active bookings, because that is the time the riders booked. If the academy later changes its session length, existing bookings keep their booked end and the reminder follows them.

### The notification
- Title: "Time's up". Body: the session time and what the trainer has: "18:00 session · Main arena", or a rider's name for a per-rider trainer, or a short list if both ("Main arena, Layla").
- In the language the app was showing on that device when reminders were turned on, stored on the subscription and updated whenever the device re-subscribes. (Nothing in the app saves a user's language today; the language switch only sets a cookie.)
- One notification per trainer per session, even if they have several arenas or riders.
- Tapping it opens the board at the next session that day (or the ended one if it was the last), on the academy's site.
- Sessions on closed dates, with only cancelled bookings, or with no bookings never notify.

### Sending
- The API sends Web Push (VAPID) itself. The keys and a contact address come from environment variables like other config. They're optional: without them the API starts, logs once that reminders are off, `GET /api/push/key` answers 404, and the web hides "Session reminders". A dev command generates a key pair. There's no production flag in config, so this avoids inventing one.
- A background loop in the API checks about every 30 seconds for sessions whose end time has passed.
- Each (academy, date, start time, trainer) is sent at most once, recorded in a table, so restarts and several API instances never double-send.
- A reminder more than 10 minutes late (API down at the time) is dropped, because a late "Time's up" is worse than none.
- A push endpoint that answers 404 or 410 is deleted; other failures are logged and not retried.

### Subscriptions and setup
- A subscription belongs to a user on one academy (the site's origin) and one device. A trainer can have several devices.
- In the app menu, staff (admins and trainers) get "Session reminders", showing on/off for this device.
- Turning on:
  - **iPhone not added to the home screen:** a short how-to (Share → Add to Home Screen) instead of the button.
  - **Otherwise:** a button that asks the phone for permission and saves the subscription.
  - **Android:** after turning on, a tip about exempting Chrome from battery optimisation.
- A "Send a test" button sends one notification to this device so the trainer can see it works.
- Turning off deletes this device's subscription. So does signing out on that device, so a shared or handed-over phone stops getting the previous trainer's reminders.
- Suspension and role changes keep subscriptions; the send-time check skips anyone who isn't active staff, so a reactivated trainer doesn't have to set up again.
- The web app gets a manifest (academy name, icon, theme colour from the academy accent) and a service worker that only shows notifications and opens the board on tap. No offline mode.

## Data changes (new migration)

- `bookings`: add `trainer_membership_id` (memberships within the academy, nullable), `trainer_set_by`, `trainer_set_at`.
- `push_subscriptions`: id, academy_id, user_id, endpoint (unique), p256dh, auth, language (`en`/`ar`), user_agent, created_at, last_success_at.
- `session_reminders_sent`: academy_id, date, start_time, trainer_membership_id, sent_at; primary key on the first four.

## API (academy host)

- `PUT /api/bookings/{id}/trainer` `{trainerId | null}`: active staff only; null means "same as arena".
- `GET /api/board` includes each rider's own trainer (id, name) when set.
- `GET /api/push/key`: the VAPID public key.
- `POST /api/push/subscriptions` `{endpoint, keys, language}`: staff only; upserts by endpoint for the current user and academy.
- `DELETE /api/push/subscriptions` `{endpoint}`: removes the current user's subscription. The web also calls it before signing out.
- `POST /api/push/test`: sends a test notification to the current user's subscriptions on this academy.

## Testing

- Domain: recipients for a session (arena trainers with riders following them, an arena trainer whose riders all have their own trainers, per-rider trainers, empty arenas, nobody assigned, cancelled bookings), the session end from booked end times, and the wording, including the combined case.
- API: per-rider trainer rules (staff only, past sessions refused, cross-academy isolation); the reminder loop with a fake clock and a fake push sender: sends once, never twice across two runs, skips closed dates and sessions over 10 minutes late, deletes a 410 endpoint.
- Web: the reminders page states (iPhone not installed, permission denied, on, off), the rider sheet's trainer choice, and the board row showing a trainer only when it differs. End to end: set a per-rider trainer on the board and see it after reload. Real delivery is checked by hand on an Android phone and an iPhone; that needs HTTPS, so the builder notes how to reach the dev stack over HTTPS.

## Open for the builder

Exact copy, the icon set for the manifest, the push library, and the loop's exact interval.
