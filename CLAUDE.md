# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

sijjel-web is the SvelteKit front end of sijjel, a booking and planning app for riding academies. Its backend is the sibling Go repo `../sijjel-api`. `README.md` describes every area of the app (setup, members, booking, the board, subscriptions, reminders) and how to run the container.

## Commands

Node 24 is required. The API must be running on :8080 for `npm run dev`.

```sh
npm run dev                         # http://localhost:5173 (platform), http://alfaris.localhost:5173 (an academy)
npx vitest run                      # unit + component tests
npx vitest run src/lib/forms/board.test.ts   # one file (add -t "name" for one test)
npm run check                       # svelte-check / types
npx eslint src e2e
npx prettier --check src e2e messages   # or npm run format to fix
npx playwright test                 # e2e; builds the app and starts a throwaway API + Postgres
npx playwright test e2e/board.e2e.ts
```

- The e2e suite runs the `sijjel-api-api` image by default. Rebuild it after API changes (`cd ../sijjel-api && docker compose --profile app build`), or point `E2E_API_IMAGE` at another image. The stack is the compose project `sijjel-e2e` and never touches the dev database.
- The container build (`docker compose up -d --build`) serves on 127.0.0.1:3000 and joins the `sijjel-api_default` network.

## Architecture

- **Server-rendered, with one origin.** The browser only talks to this app. `src/routes/api/[...path]/+server.ts` proxies `/api/*` to `API_URL` (`#lib/server/proxy.ts`), so session cookies stay host-only.
- **Every request starts in `src/hooks.server.ts`:**
  - It loads the tenant (platform or academy, from the Host), the user and the membership into `locals` (`#lib/server/context.ts`).
  - It picks the locale: the `PARAGLIDE_LOCALE` cookie, else the academy's default language.
  - It puts the academy accent colours, the theme, `lang` and `dir` into the first HTML.
- **Route groups carry access control** in their `+layout.server.ts`:
  - `(academy)` requires an academy host;
  - inside it, `(admin)`, `(staff)` and `(rider)` check the membership and send signed-out users to `/login?returnTo=…`;
  - `(platform)` is the platform host.
- **Data flow:**
  - Page loads run on the server and call the API with `apiLoad`/`apiFetch` (`#lib/server/api.ts`).
  - Writes from the browser use `api()` in `#lib/api/client.ts`. It always sends `content-type: application/json`, even with no body, because SvelteKit's CSRF check rejects a body-less write without it.
  - API failures become `ApiError` with the API's `code`, shown through the `error_<code>` messages.
  - Response types live in `#lib/api/*-types.ts`.
- **Where logic lives:**
  - `src/lib/forms/` and the other plain `.ts` files hold pure logic (form parsing, grouping, plural text), tested in Node.
  - `src/lib/components/` holds feature components, tested as `*.svelte.test.ts` in headless Chromium through vitest browser mode.
  - `src/lib/ui/` holds design-system primitives (`Button`, `Icon`, `Banner`, `EmptyState`…).
- **Svelte 5 runes are forced** for all project files. Imports use the `#lib/...` alias with a `.js` extension.
- **i18n is Paraglide.** Every string lives in both `messages/en.json` and `messages/ar.json`; `src/lib/paraglide/` is generated. Pass `{ locale }` explicitly in components that receive it as a prop.
- **The dev style guide** at `/design` shows every component.

## Designing UI

### What the design system is for

sijjel follows its own design system, the source of truth for every screen: https://claude.ai/artifact/HysWBDjQnrq5zDEoY1cZqj (`project/README.md` and `project/components/*/README.md`). In this repo it lives in `src/lib/styles/{tokens,base,components}.css` (the `sj-` classes) and `src/lib/ui/` (the Svelte components); `/design` shows every component.

- **Two layers.** A fixed stable layer (sand grounds, leather ink, brass, paddock and stone signals) makes every academy feel like sijjel. A single academy accent, generated from the academy's brand colour, makes it feel like theirs. Only the four accent tokens (`accent`, `on-accent`, `accent-soft`, `on-accent-soft`) change per academy; status colours never do.
- **Who it is for.** A rider booking an evening session on a phone in a car park, and a trainer assigning horses on a tablet in the arena office. Design for one hand, glare and a hurry first; the desktop is the same page, wider.
- **Why it matters here.** The user judges sijjel by how it feels to use. Screens that each look fine but behave differently make the app harder to learn, so consistency across pages beats a clever single screen.

### How to follow it

1. **Design the page and the app, not the element.** A change is judged by how it fits the whole page and the rest of the app. Before changing a screen, open its sibling pages and copy how they already do the same thing: page width, title row, section headings, lists, actions, empty states.
2. **One pattern, one meaning.** Reuse a pattern only for the job it already does elsewhere (see "Patterns in the app" below). Two things that look alike must behave alike, and something that behaves differently must look different. Before reusing a pattern, check every place it is used and what it means there.
3. **Reuse before writing.** Use the `sj-` classes and `#lib/ui` components before page-local CSS. A pattern the app doesn't have yet needs a reason, goes through the preview and UX review, and is added to the patterns list below.
4. **Preview, review, then build** (see "Preview before code").

### Foundations

- **Surfaces.** Paint the page `ground`, put content on `surface`, recess wells, avatars and neutral chips into `surface-sunk`. Cards are separated by a 1px `line` border, not a shadow; `shadow-raised` is only for things that float (dialogs, menus, sheets, the sticky bar).
- **Text.** `ink` for text, `ink-muted` for secondary text, hints and metadata. Control edges (inputs, selects, secondary buttons) use `line-strong`; dividers use `line`.
- **Accent** is only for the one primary action on a screen, the active navigation item, selected states and links. Never for status, large fills or body text.
- **Status** is a soft fill, its strong ink and a word: Pending `brass`, Active `paddock`, Suspended or Inactive `stone`, errors and Unavailable `danger`. Colour, position or a bare number never carries meaning alone; a count gets an icon and words ("0 of 5" with the group icon, and a label for screen readers).
- **Type.** Readex Pro for `display`, `title` and `heading`; IBM Plex Sans (and Plex Sans Arabic) for running text. At most one `display` per screen; page titles are `title`, section and card headings `heading`. Times and counts use tabular numerals. Inputs are 16px so phones never zoom.
- **Spacing.** 4px base (`space-1` 4 … `space-12` 48). Lay out with flex or grid `gap`, not margins. The side gutter is `space-4` at every width.
- **Layout.** Every page is a `.sj-page`, capped at `--content-max`; never narrow or widen a single page (only staff tables may run full width). Below 720px navigation is the bottom bar, above it the app bar. Tap targets are at least 44px both ways.
- **Direction.** Logical properties only (`margin-inline`, `padding-inline`, `inset-inline-*`), so Arabic mirrors without extra rules. Icons that point (arrows, chevrons) flip with `directional`; icons that depict don't. Use `<bdi>` for user-entered text (names, notes, reasons) rather than `dir="auto"`, which shifts alignment.
- **Shape and states.** `radius-md` for buttons, inputs and nav items, `radius-lg` for cards and sheets, `radius-pill` for chips, `radius-sm` for avatars. Hover lays `hover-veil` over the fill. Focus is a solid 2px `focus` ring 2px outside the control. Disabled controls drop to 45% and say why nearby. Motion is 150ms ease-out, none under `prefers-reduced-motion`.
- **Themes.** Day and Night are both first-class; Night is warm tack-room browns, not inverted Day. Check both.
- **Icons.** Material Symbols Rounded, weight 400, unfilled, 24px (20px in chips and dense rows); filled only for the active bottom-bar item. Horses use the custom horseshoe icon in `Icon`.

### Components and when to use them

- **Button** (`#lib/ui` `Button`): one action each, the label says what happens ("Book 19:00", "Mark unavailable").
  - primary: the one main action on the screen; never two side by side;
  - secondary: alternatives and navigation-like actions;
  - quiet: low-emphasis actions and links, such as "All horses" back links and "Show older rides";
  - danger: destructive, always confirmed first;
  - icon-only (`label` prop): only for a familiar action on an item, such as the Edit pencil, with an `aria-label`.
- **StatusChip**: labels a state or category in one to three words; never a button. Status chips have a dot and a word, level chips use the accent-soft, neutral chips are for roles, kinds and ranges.
- **Banner**: a state that applies to the whole page or the action just taken (saved, pending, error), inline at the top of the content it concerns. A danger banner scrolls itself into view when it appears; wrap a saved banner in `use:reveal={saves}` so it does too.
- **EmptyState**: what will appear here, why it matters, and the first step. Never a dead end; staff get the action. A muted sentence is enough for an empty sub-list inside a page ("No unavailable dates.").
- **List rows** (`sj-list`, `sj-list__row`, `ListRow`): one member or horse with the facts staff scan for and at most one action; 64px tall, divided by `line`; name and secondary line truncate (wrap only text that must be read whole, such as notes).
- **Fields** (`TextField`, `SelectField`, `DateRangeField`, `CheckboxField`): label always visible above, hint below, an error replaces the hint and names the fix.
- **SessionSlot**: one bookable time; the app's signature element for riders. Staff see places and suitable horses side by side. Riders get the `compact` slot: no counts, only a note when it can't be booked or is theirs (Full, no suitable horse, Booked), with the action on the same row.
- **AppShell**: app bar with the academy mark, navigation in the bottom bar on phones, language switch showing the other language's name.

### Patterns in the app, and what each one means

Keep this list current. A new use of a pattern must mean the same thing as the uses already here.

| Pattern                                              | Means                                                            | Where                                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Pill links (`.filter` with `aria-current`)           | Narrow **one list** to a category; the page stays the same       | Horses by discipline, Riders by payment                                         |
| Underlined tabs (`.tabs`, links with `aria-current`) | Switch between views of one item under its header                | Horse page: Unavailable dates, Rides; rider page: Profile, Rides                |
| Day strip and time pills                             | Pick the day or time the board shows                             | Board (`BoardDays`, `BoardTimes`)                                               |
| Time pills with a count and `aria-pressed`           | Choose a time; the count is how many dates it is free on         | Book a month (`BookMonth`): one time per weekday                                |
| `sj-page-head` with a labelled button                | The page's title and its main action                             | Horses "New horse", Riders "Invite rider", Staff "Invite staff", Board "Select" |
| Quiet back button above the title                    | Go up one level                                                  | Horse page "All horses", rider and staff profiles, Staff "Settings"             |
| Whole-row link in a list                             | Open that item                                                   | Horses list, Riders list, Staff list, ride rows                                 |
| Row with an icon, title, description and a chevron   | Go to a sub-page of settings                                     | Settings (including Staff)                                                      |
| `<details>` fold with a count                        | Hide the older or secondary part of the same content             | "Earlier (N)" unavailable dates, member level "History", rider rides by month   |
| Icon-only secondary pencil in the header             | Edit this item on its own page                                   | Horse page, rider and staff profiles                                            |
| More menu (`MoreMenu`) next to the pencil            | Less frequent actions on this item, such as Mark left or Suspend | Rider and staff profiles                                                        |
| `h2.sj-heading` sections, one after another          | Parts of one page, all visible                                   | Rider profile, staff profile                                                    |
| Bottom sheet                                         | Act on one rider or session without leaving the board            | Board rider sheet                                                               |
| Success banner with a follow-up action               | What just happened, and the next thing worth doing about it      | Closed dates: share on WhatsApp                                                 |
| Quiet offer under the item it is about               | A small optional next step, shown once, with "Not now"           | Rider home: turn on notifications under a cancelled session                     |

### Preview before code

Every UI change, even one built only from existing patterns, starts with a visual preview the user approves before any Svelte code is written:

1. Write a throwaway static HTML file outside the repo (in the session scratchpad). Inline `src/lib/styles/{tokens,base,components}.css` and the Google Fonts link (IBM Plex Sans and Plex Sans Arabic, Readex Pro, Material Symbols Rounded). Use the real `sj-` classes, and copy any component-scoped CSS (for example `DateRangeField`'s fieldset reset) so the mock-up matches the app.
2. Use real copy from `messages/en.json` and `ar.json` and realistic data (Arabic and English names, a long note, an empty state).
3. Lay out side-by-side frames:
   - phone frames, 390px wide, in English Day and Arabic Night (`data-theme`, `dir`);
   - a frame with the main interaction open (form, sheet, select mode);
   - one desktop frame at the real page width (`--content-max`), so the screen can be compared with its sibling pages.
4. Screenshot it with Playwright (run the script from inside the repo so `playwright` resolves, then delete it), look at the image, and fix anything off before showing it.
5. Run a UX review of the preview with the `ux-laws` skill. UX matters most to the user, so no design skips this step. Check the screen against the laws (proximity, similarity, Fitts, Hick, Von Restorff, cognitive load, Jakob's law against the app's own pages), against the design system, and against the patterns table: does every reused pattern mean here what it means elsewhere? Fix what it finds in the preview, take the screenshot again, and list the findings and fixes for the user.
6. Show the user the screenshot, the file path and the review. Build only after they say yes.

### Copy

- Plain, warm and direct, like a good yard manager. Speak to the reader as "you".
- Sentence case everywhere, never all caps. Use the riders' and staff's own words (session, arena, school horse, own horse, trainer, level, limit).
- Errors say what went wrong and what to do, with no apologies and no codes on screen.
- Every string exists in `messages/en.json` and `messages/ar.json`. Times use the 24-hour clock and digits are Western in both languages. No emoji.
- For counts, use the plural helpers (`countText` and the helpers built on it in `src/lib/forms/`), not Paraglide plural syntax. In Arabic a label form ("al-hisas: 5") avoids plural forms where a sentence would need them.

### Checking a design

- Look at the real page after every rebuild. A screenshot from before the last change, or from the wrong output path, proves nothing.
- Check at 390px and 1440px, in Arabic and English, and in Day and Night. Compare the screen with a neighbouring page at the same width.
- Branches are tried as a preview on localhost:3001 before the user merges them.
