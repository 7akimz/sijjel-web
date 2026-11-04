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

The design system is the source of truth: https://claude.ai/artifact/HysWBDjQnrq5zDEoY1cZqj (read `project/README.md` and the component READMEs). In this repo it lives in `src/lib/styles/{tokens,base,components}.css` and `src/lib/ui/`.

### Design the page and the app, not the element

- A change is judged by how it fits the whole page and the rest of the app, not by how one element looks on its own.
- Before changing a screen, open the sibling pages and copy how they already do the same thing: page width, title row, section headings, lists, actions, empty states. Reuse the existing `sj-` classes and `#lib/ui` components before writing page-local CSS.
- A pattern the app doesn't have yet needs a reason.

### Preview before code

Every UI change, even one built only from existing patterns, starts with a visual preview the user approves before any Svelte code is written:

1. Write a throwaway static HTML file outside the repo (in the session scratchpad). Inline `src/lib/styles/{tokens,base,components}.css` and the Google Fonts link (IBM Plex Sans and Plex Sans Arabic, Readex Pro, Material Symbols Rounded). Use the real `sj-` classes, and copy any component-scoped CSS (for example `DateRangeField`'s fieldset reset) so the mock-up matches the app.
2. Use real copy from `messages/en.json` and `ar.json` and realistic data (Arabic and English names, a long note, an empty state).
3. Lay out side-by-side frames:
   - phone frames, 390px wide, in English Day and Arabic Night (`data-theme`, `dir`);
   - a frame with the main interaction open (form, sheet, select mode);
   - one desktop frame at the real page width (`--content-max`), so the screen can be compared with its sibling pages.
4. Screenshot it with Playwright (run the script from inside the repo so `playwright` resolves, then delete it), look at the image, and fix anything off before showing it.
5. Show the user the screenshot and the file path. Build only after they say yes.

### Layout rules

- Every page is a `.sj-page`, capped at `--content-max`. Never narrow or widen a single page; only staff tables may run full width.
- The title row is `.sj-page-head`. Actions in it are labelled buttons (icon plus text), like "Invite" on Members.
- Mobile first: the bottom bar is below 720px, and the app bar takes over above it. Tap targets are at least 44px.
- Use logical properties only (`margin-inline`, `padding-inline`, `inset-inline-*`), so Arabic mirrors without extra rules.

### Colour and meaning

- One primary button per screen.
- `accent` is only for the primary action, the active navigation item, selected states and links. Never use it for status or large fills.
- A status is a chip: a soft fill, its strong ink, and a word. Pending or awaiting action is brass, active is paddock, inactive or suspended is stone, errors are danger.
- Colour, position or a bare number never carries meaning alone. A count gets an icon and words ("0 of 5" with the group icon, and a label for screen readers).

### Copy

- Use sentence case, plain words, and the riders' and staff's own vocabulary (session, arena, school horse, trainer, level).
- Every string exists in `messages/en.json` and `messages/ar.json`. For counts, use the existing plural helpers (`countText`, `riderCountText` in `src/lib/forms/subscription.ts`), not Paraglide plural syntax.

### Checking a design

- Look at the real page after every rebuild. A screenshot from before the last change, or from the wrong output path, proves nothing.
- Check at 390px and 1440px, in Arabic and English, and in Day and Night. Compare the screen with a neighbouring page at the same width.
- Branches are tried as a preview on localhost:3001 before the user merges them.
