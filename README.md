# sijjel-web

The web app for sijjel, session planning for riding academies. It is a SvelteKit app rendered on the server (`adapter-node`). The browser only ever talks to this app: `/api/*` is proxied to [sijjel-api](../sijjel-api) on the same origin, so session cookies stay host-only and `SameSite=Strict`.

- **Platform site** (`localhost`): platform admins sign in, manage the discipline catalogue, create academies and copy owner invitation links.
- **Academy sites** (`{slug}.localhost`): invitees open their link, create an account or sign in, and land on the academy home. Riders see their plan, the sessions left this week and their bookings there, and book at `/book`.

The first HTML of every page already carries the academy accent colours, the theme (`sijjel_theme` cookie), `lang`/`dir` (`PARAGLIDE_LOCALE` cookie, else the academy's default language), and the link-preview tags.

Design system: https://claude.ai/artifact/HysWBDjQnrq5zDEoY1cZqj. Its tokens and component CSS live in `src/lib/styles`, and the Svelte components in `src/lib/ui`. In development, `/design` shows every component.

## Development

Requires Node 24 and a running API on port 8080 (see the sijjel-api README).

```sh
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173 for the platform site and http://alfaris.localhost:5173 for an academy. Browsers resolve `*.localhost` to the loopback address without any hosts-file changes.

| Variable  | Default                 | Purpose                                      |
| --------- | ----------------------- | -------------------------------------------- |
| `API_URL` | `http://localhost:8080` | sijjel-api base URL, used only on the server |

All user-facing text lives in `messages/en.json` and `messages/ar.json`. API error codes map to `error_<code>` keys.

### Academy admin pages

An academy's active admins get Home, Horses and Settings in the navigation. Until opening hours, an arena and a school horse exist, the home page shows a setup checklist linking to:

- `/settings/hours`: weekly opening hours, session length, break and time zone, with a live preview of session times
- `/settings/booking-rules`, `/settings/arenas`, `/settings/closed-dates`, `/settings/disciplines`
- `/horses`, `/horses/new`, `/horses/{id}`: school horses, their level range, rider weight limit and unavailable dates

Admins also get `/settings/plans` (weekly session limit and monthly price) and `/members/invite`, which makes an invitation link to send on WhatsApp or show as a QR code (drawn by the `qrcode` package). When an hours change or a closure would hit existing bookings, the page lists them; closing days can cancel them in the same step.

Other visitors get a 403 page on these routes.

### Members and booking

- Admins and trainers get Members: `/members` (filter by riders, trainers or, for admins, unpaid this month, plus pending invitations) and `/members/{id}`, where admins edit the rider, mark this month paid, register an own horse and suspend or reactivate. Staff can cancel bookings there and book on the rider's behalf at `/members/{id}/book`, confirming past a weekly limit or an unpaid month.
- Riders get Book: `/book` shows a week of sessions with places left and suitable horses free, and books after a confirmation. Riders cancel from their home until the academy's cancellation cutoff.

### Planning board

Admins and trainers get Board: `/board?date&start` shows one session at a time, opening on the session in progress or the next one. Riders are grouped by arena, with the trainer named once per arena and riders without an arena under "Not placed". Tapping a rider opens a sheet with their recent rides and notes, the horses that can take them (the others greyed out with the reason), the arenas with places left, and a note on this ride. "Suggest horses" fills riders who have no horse, preferring the horse each rode recently, and never moves a horse someone picked. Past sessions only take notes.

## Tests

```sh
npm run check
npm run lint
npx vitest --run
```

Vitest runs `*.svelte.test.ts` component tests in headless Chromium and the other `*.test.ts` files in Node.

The end-to-end suite builds the app, serves it on port 4173 and drives both hosts against a throwaway API and Postgres (compose project `sijjel-e2e`, `e2e/compose.yaml`). Postgres keeps its data in memory. The global setup removes any leftover stack, starts a fresh one with its own platform admin, and removes it again when the run ends, pass or fail, so your dev database is never touched.

```sh
(cd ../sijjel-api && docker compose --profile app build)
npx playwright test
```

The suite runs the `sijjel-api-api` image, so rebuild it after API changes; the academy setup tests need the API from Milestone 3 onwards, the booking test the API from Milestone 4, and the board test the API from Milestone 5. Set `E2E_API_IMAGE` to use another image, and `E2E_API_PORT` (default 18080) if that port is taken.

## Container

```sh
(cd ../sijjel-api && docker compose --profile app up -d)
docker compose up -d --build
curl -s localhost:3000/healthz
```

The `web` service joins the API stack's `sijjel-api_default` network and listens on `127.0.0.1:3000`. The image runs as the `node` user and reports health from `/healthz`, which doesn't call the API.

Behind a TLS-terminating proxy, also set adapter-node's `PROTOCOL_HEADER=x-forwarded-proto` and `HOST_HEADER=x-forwarded-host`. Academy subdomains share one deployment, so don't set `ORIGIN`.
