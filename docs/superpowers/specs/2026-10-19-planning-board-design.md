# Milestone 5: Planning board — Design

## Intent

Riders book a time slot; nobody has yet decided which horse, arena or trainer they get. The planning board is where staff decide that, one session at a time.

The user rides at a show-jumping academy and doesn't run one. What they described:
- The head coach picks each rider's horse at the arena, from what he knows about the rider right now (what they're working on, what went wrong last time) and about each horse ("Stella is clever but needs a push into canter"). One time the rider's leg kept coming out on one horse, so the coach moved them back to Stella.
- The academy has a main arena and a side arena; total beginners and lunge lessons go to the side arena.
- Several people teach: the head coach, his son, and grooms who also coach beginners, usually in the side arena.
- At a usual academy the session grid is real: everyone in the 18:00 session stops at 18:30 together and the next riders get on. The user's own academy is an outlier with flexible start times; the app follows the usual academy.

So the board is a quick phone tool used standing in the arena. It doesn't plan the week ahead and it doesn't decide for the coach; it remembers for him.

## Goals

1. Staff see one session at a time: its booked riders grouped by arena, each row showing the rider and their horse (or "Pick horse"), with the trainer named once per arena.
2. Staff pick a rider's horse and arena, and a trainer for each arena in a session.
3. While picking a horse, staff see the rider's recent rides (horse, date, note) and each horse's own note, and only horses that can actually take the rider are offered.
4. Staff can leave an optional free-text note on a ride after the session. It shows up the next time someone picks a horse for that rider.
5. A "Suggest horses" action fills riders who have no horse yet with a workable assignment, preferring a horse the rider rode recently. Staff can change any of it.
6. Problems that arise after placing (a horse marked unavailable, a rider's level changed, an arena made smaller) show as a small mark on the affected row, explained on tap.
7. Every placement records who made it and when.

## Non-goals (this phase)

- Notifications, including the "session time is up" reminder. That's the next milestone. The user's note for it: the reminder matters mainly for the trainer, who stops all riders at once; riders may not need it.
- Showing riders their horse, arena or trainer ahead of the session. The user said leave it for later.
- A view for grooms ("horses needed tonight"). The user wasn't sure about it.
- Warnings about a horse working back-to-back sessions. That's normal when sessions end on time.
- Flexible start times or overrunning sessions.
- Sessions longer than one slot. The user noted other academies charge double for a 60-minute session; that belongs to plans and booking later.
- Attendance and no-shows.

## Anti-goals

- **A cluttered board.** The user rejected a busy layout and a loud warning. Each rider row shows the rider and horse only; everything else is one tap away. Warnings are a small mark, not a banner.
- **The app deciding.** Suggestions only fill gaps when staff press the button, and never overwrite a horse someone picked.
- **Required notes.** The board works with no notes at all. Notes are free text, not presets, because riding problems are too varied for a fixed list.

## Decisions made with the user

| Topic | Decision |
|---|---|
| Layout | One session at a time (mockup option A): pick the time from a row at the top; riders grouped by arena with the trainer named once per arena; row = rider + horse. |
| Who places | Any active staff member (admin or trainer, including groom-coaches) can place riders and set trainers. Riders can't change anything. |
| Notes | Free text, optional, typed or dictated through the phone keyboard. Ride history (horse, arena, trainer) is remembered automatically. Horses have their own standing note. |
| Clashes | No back-to-back warning. Only hard rules (below) block a choice. |
| Grooms | Not in this milestone. |
| Order | Board first; notifications next. |

## Calls made by the assistant (the user can overturn these)

### The board
- The board opens on today and the session in progress, or the next one; staff can change the date and the time.
- A time with a problem gets a small dot in the time row.
- Riders without an arena sit in a "Not placed" group at the top of the session.
- All staff see the whole board. A trainer's own arena groups aren't filtered or highlighted in this phase.
- Own-horse riders show their own horse and only need an arena.
- Staff can only change sessions from today on; past sessions are read-only, apart from adding notes.

### Placing a rider
- Placing sets the horse, the arena, or both, for one booking.
- Hard rules: a placement that breaks one is rejected, and the picker doesn't offer what would break it.
  - A school horse must be active, not unavailable that day, of the rider's discipline, cover the rider's level, and carry the rider's weight.
  - A school horse can't be given to two riders in the same session.
  - A school horse can't go past its daily session limit.
  - An own-horse rider can't be given a school horse, and vice versa.
  - An arena can't take more riders in a session than its capacity.
- A placement that is allowed but leaves another rider that day without any workable horse is accepted, and the response lists those riders. This follows the original spec's rule on pins.
- The horse picker lists suitable horses first, those free in this session at the top. Horses that can't take the rider are shown greyed out with the reason ("Taken: with Layla", "Resting: 3 of 3 today", "Unavailable today", "Not for this level"), so the coach knows why a favourite isn't offered.
- The arena picker shows each arena with its places left in this session. The rider's arena from their last ride is pre-selected when there's room.
- Removing a placement (back to "Pick horse") is allowed.

### Trainers
- One trainer per arena per session, chosen from active staff. It's optional; a group without a trainer says "No trainer".
- Setting the trainer for an arena in one session doesn't copy to other sessions. A "Same trainer for the rest of the evening" shortcut is left for later.

### Suggestions
- "Suggest horses" works on one session. It runs the existing day matcher with every placed horse pinned, then fills only riders with no horse. Among workable choices it prefers the horse the rider rode most recently.
- If no workable assignment exists for some riders, they stay on "Pick horse" with a small mark.
- Suggest doesn't choose arenas or trainers.

### Problems after placing
These are shown, not blocked, because they reflect reality (original spec, rule 7):
- A placed horse became unavailable, inactive, or no longer covers the rider's level or weight.
- An arena's capacity shrank below the riders placed in it, or the arena was deactivated.
- A rider's discipline changed so the placed horse no longer matches.

Each shows as a small mark on the row and a dot on the time; tapping the row explains it.

Whether a placement with a problem still holds its horse (settled after the builder check):
- **The horse can't work** (marked unavailable that day, or made inactive): the placement no longer holds it. The horse isn't offered to anyone anyway, the rider counts as needing a horse for booking checks and the day matcher, and "Suggest horses" may replace it.
- **The horse can still work but no longer suits the rider** (the rider's level, weight or discipline changed): the placement still holds the horse. It counts as taken in that session and toward its daily limit, because unless the coach changes it, that rider rides that horse. The day matcher needs a pinned edge for these placements that skips the suitability check. "Suggest horses" leaves them alone.

### Notes
- One note per ride (booking), up to 500 characters, editable by any staff member. The last editor and time are stored and shown.
- Notes are staff-only; riders never see them.
- A rider's history shows their last 5 rides with horse, date and note.
- Horse notes use the existing `horses.notes` field, editable on the horse page as today.

### Audit
- Each booking stores who last set its horse and arena, and when. Each session trainer stores who set it.

## Data changes (new migration)

- `bookings`: add `placed_by uuid` (users), `placed_at timestamptz`, and a partial unique index on `(academy_id, date, start_time, assigned_horse_id)` where active and a horse is assigned (named in the original spec as a safety net). `arena_id` gets a foreign key to arenas within the academy.
- `session_trainers`: `academy_id`, `date`, `start_time`, `arena_id`, `trainer_membership_id`, `set_by`, `set_at`; unique on `(academy_id, date, start_time, arena_id)`.
- `ride_notes`: `booking_id` (unique), `academy_id`, `body` (1–500 chars), `updated_by`, `updated_at`.

## API (academy host, active staff)

- `GET /api/board?date=YYYY-MM-DD&start=HH:MM`: the session's riders with level, weight-relevant fields, horse source, placement and problems; arenas with capacity, places left and trainer; and the list of session times that day with a has-problem flag. Without `start`, the session in progress or the next one.
- `GET /api/board/horses?bookingId=`: every school horse with suitability for that rider and its state in that session (free, taken by whom, resting, unavailable, reason), plus the rider's last 5 rides with notes.
- `PUT /api/bookings/{id}/placement` `{horseId?, arenaId?}`: sets or clears; 409 with a code for a broken hard rule; 200 with `unplaceable` riders when the rest of the day is affected.
- `POST /api/board/suggest` `{date, start}`: fills riders with no horse and returns the updated session.
- `PUT /api/board/trainer` `{date, start, arenaId, trainerId|null}`.
- `PUT /api/bookings/{id}/note` `{body}`; an empty body deletes the note.

Concurrency: placement, suggest and trainer changes take the same academy-day advisory lock as booking, so two staff placing at once can't give one horse to two riders, and booking can't race a placement.

## Web

- A "Board" item in the staff navigation (admins and trainers).
- `/board`: layout A. A date control in the app bar, a row of session times, then the session's arena groups with rider rows.
- Tapping a rider opens a sheet with the rider's history and last note, the horse picker, the arena picker, and a note field.
- Tapping an arena group's trainer opens a small picker.
- EN and AR with RTL, phone first, built on the sijjel design system.

## Testing

- Domain: the matcher's suggestion prefers the most recent horse and never moves a pinned horse.
- API: each hard rule is rejected; problems appear after unavailability, a level change and a capacity change; two concurrent placements of one horse leave exactly one; cross-academy isolation; trainers and admins can place, riders get 403.
- Web: unit tests for grouping and problem labels; one end-to-end journey: book two riders, open the board, place one by hand, suggest the other, set a trainer, write a note, and see it in the next session's history.

## Open for the builder

Exact copy, icons, and the board's empty and loading states.
