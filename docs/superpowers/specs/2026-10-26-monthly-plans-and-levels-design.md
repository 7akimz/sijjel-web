# Monthly plans, plan levels and moving riders up — Design

## Intent

Two things about how riders are set up don't match how Egyptian academies work.

**Plans are sold per calendar month.** The user's academy sells, for example:

| Plan | Lessons a month | Price |
|---|---|---|
| Beginner (Egyptian horses) | 4 / 8 / 12 | 2,200 / 3,500 / 4,500 EGP |
| Jumping course | 8 / 12 / 20 | 4,500 / not known / 7,500 EGP |

A rider pays at the start of a calendar month for N lessons. Whatever is left at the end of the month is lost, and there's no weekly limit inside the month (the user's answers). sijjel counts plans as "N sessions a week", so an "8 a month" rider would be held to 2 a week.

**Riders evolve.** A future jumper starts in flatwork and moves up. Today the invite sets a discipline and level, and the only way to change it later is to edit the rider, with no record of the change. The user expects moves to happen at the start of a month ("next month we start jumping lessons"). That's the user's guess, not something confirmed.

**Prices sometimes follow the level.** The user's academy prices every beginner level the same and jumping separately, which a plan's discipline already covers. Other academies the user called price each flatwork level differently, and one said its fifth level is jumping. sijjel can't tie a plan to a level today.

## Goals

1. A plan is **N lessons per calendar month** at a monthly price.
2. A plan can optionally cover only some levels of its discipline, so academies that price per level can set that up and riders only get plans that fit their level.
3. Staff (owners, admins and trainers) can move a rider to another level or discipline, starting today or on the 1st of next month, and sijjel keeps a history of every move.

## Non-goals

- Weekly plans. Every plan counts per month (the user's choice).
- Horse types such as "Egyptian horses" as a plan rule. School horses' level ranges already keep strong horses from beginners. The user will ask their academy about horse types.
- Riders seeing their own level history. Staff only for now.
- Changes to payments. The existing monthly "paid" marks stay as they are.
- Default level ladders. These stay as they are unless academies ask (the user's earlier decision). The user isn't sure academies agree on a level list, especially Level 4.

## Anti-goals

- **Forcing per-level pricing on academies that don't use it.** A plan with no levels ticked covers every level of its discipline, and a plan with no discipline covers everyone, as today.
- **Silent rule-breaking.** The server, not only the screens, refuses a plan that doesn't fit the rider's discipline and level. Today only the web filters by discipline.
- **Losing what a rider already booked.** A move never cancels or changes existing bookings.

## Decisions made with the user

| Topic | Decision |
|---|---|
| Plan count | Lessons per calendar month only, replacing per week. |
| Month | Calendar month. Leftover lessons are lost. |
| Plan levels | Optional. A plan with a discipline can tick any levels of that discipline's ladder. |
| Moving up | An easy step on the rider's page: the next level, or any level or discipline. |
| History | Kept for every move, shown to staff. |
| Who moves riders | Owners, admins and trainers. |
| When a move starts | Today, or the 1st of next month. Next month is the default (the user's guess at how academies work). |
| Plan changes | Never mid-month. A rider keeps the plan they paid for until the month ends; a new plan always starts on the 1st. A move "from today" changes the level now and the plan on the 1st. |

## Behaviour

### Monthly lessons

- A plan has a name (EN and AR), **lessons a month** (1–62), a monthly price, an optional discipline and, with a discipline, optional levels.
- **Counting:** a rider's active bookings in a session's calendar month, by the session's date in the academy's time zone, count against that month's lessons. Cancelled bookings don't count. Booking a 2 November session uses November's lessons.
- **The limit:** a rider can't book past it. Staff booking for a rider get a warning they can confirm past, as with today's weekly limit.
- **The rider's home** shows lessons left in the current month, for example "Left this month: 5 of 8". Avoid wording that needs plural forms; the app's messages have none.
- **Existing plans** convert at 4× their weekly count, so "2 a week" becomes "8 a month".
- **Plans change only on the 1st.** Choosing a new plan for an existing rider, in a move or in the rider form, makes it the rider's coming plan from the 1st of next month. Until then they keep their current plan, even if it doesn't cover their new level. A month's lessons are always counted against one plan. The only plan that starts mid-month is a new rider's first plan, from the invite.

### Plan levels

- Ticking levels needs a discipline. The ticked levels must belong to that discipline's ladder.
- **A plan fits a rider when** it has no discipline, or its discipline is the rider's and it has no levels or includes the rider's level.
- The server enforces the fit when a rider is invited, edited or moved. The invite form and the rider form only offer plans that fit.
- Plans keep the existing "active" switch. Retired plans aren't offered.
- **Ladders:** removing a level that a plan covers is blocked, with the same "in use" treatment horses get.

### Moving a rider

- **The Level section** on the rider's page shows their current discipline and level, plus:
  - **Move to <next level>**, when there is a next level on their ladder;
  - **Change level…**, to pick any level of any discipline the academy teaches.
- **Start date:** "From 1 <next month>" (the default) or "From today", by the academy's calendar.
- **The plan:** if the rider's plan doesn't fit the new level, staff pick one that does in the same step. If it fits, it stays, and staff may still change it. The chosen plan always starts on the 1st of next month. In a move "from today", the level changes now and the plan switch waits for the 1st.
- **Coming changes** show on the rider's page with **Cancel**: a coming move ("Moves to Show jumping · Level 1 on 1 Nov") and a coming plan ("Plan changes to Jumping course, 8 a month on 1 Nov"). A rider has at most one of each; making another replaces it.
- **On the start date** the rider's discipline and level switch, and on the 1st their coming plan takes over. Booking checks for sessions on or after those dates already use the coming level and plan before the switch. For example, a November session booked in October counts against the November plan's lessons and matches horses by the new level.
- **Existing bookings are kept.** The board already flags a horse that no longer suits a rider's level.
- **History:** one entry per move that took effect, with from, to, the plan change, the start date, who made the move and when. Accepting an invite records the starting discipline and level. Staff see it on the rider's page, newest first.
- **The rider edit form** no longer edits discipline and level; those go through moves so the history stays complete. The plan stays in the form. It must fit, and a change becomes the coming plan from the 1st.
- **Riders** can't move themselves.
- **Trainers** can't open plan settings today. To pick a plan during a move, they need to see the plans that fit. *(My call: they see those, read-only.)*

## Left to the builder

- How coming moves take effect on the 1st. They must apply even if nobody opens the app that day.
- Table and API shapes, and how the history and coming move are stored.
- Exact copy in English and Arabic. Arabic calls a plan "خطة".
- How the ladder editor shows a level a plan uses.
