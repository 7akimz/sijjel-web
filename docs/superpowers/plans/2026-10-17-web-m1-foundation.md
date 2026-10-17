# sijjel-web Milestone 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A SvelteKit SSR app built on the sijjel design system. It covers:
- **Platform admins** (on `localhost`): sign in, manage the discipline catalogue, create academies and copy owner invite links.
- **Invitees** (on the academy subdomain): open the link, see a branded invite page, sign up or sign in, and land on their academy's home.

The first HTML of every page already carries the academy's colours, theme, language direction and link-preview tags.

**Architecture:**
- `hooks.server.ts` resolves, per request:
  - the tenant, through the Go API using the forwarded host
  - the signed-in user and membership
  - theme and locale
- It then injects `lang`/`dir`/`data-theme` and the academy accent variables into `app.html` through `transformPageChunk`.
- A catch-all `src/routes/api/[...path]/+server.ts` proxies browser calls to Go on the same origin.
- UI lives in `src/lib/ui` (Svelte 5 components reproducing the design system's `sj-` anatomy) and `src/lib/styles` (tokens and component CSS copied from the design system artifact).
- Pages call `/api` with `fetch` and JSON only (no SvelteKit form actions).

**Tech Stack:**
- Node 24.22
- `sv` 1.1.1 scaffold, SvelteKit 3.1 with Svelte 5.57, `@sveltejs/adapter-node` 6
- Paraglide JS 2.29 (en, ar)
- `@material/material-color-utilities` ^0.3.0 (0.4.0 has a broken ESM import)
- Vitest 5 with `@testing-library/svelte`
- Playwright 1.64

**Spec:** `docs/superpowers/specs/2026-10-17-sijjel-design.md`, plus the design system at https://claude.ai/artifact/HysWBDjQnrq5zDEoY1cZqj. Read its `project/README.md`, `project/tokens.css` and `project/components/bundle.css` with the Artifact read action before Task 2.

**Depends on:** `sijjel-api` plan `2026-10-17-api-m1-foundation.md`. Its endpoints and payloads (`/api/tenant`, `/api/auth/*`, `/api/me`, `/api/membership`, `/api/platform/*`, `/api/invites/{token}[/accept]`), its error codes, and `TRUST_PROXY` reading `X-Forwarded-Host`.

**Branch:** create `feat/m1-foundation` from `main` before Task 1.

## Global Constraints

- Put Node 24 on PATH: `export PATH="$(dirname "$(fnm exec --using=24.22.0 which node)"):$PATH"` (the `fnm` default is 22).
- **Server-only env:** `API_URL` (dev `http://localhost:8080`), read via `$env/dynamic/private`. There is no API URL in client code; the browser always calls same-origin `/api`.
- **Design system rules** (from the artifact README):
  - tokens only, never literal colours in components
  - logical CSS only
  - 44px touch targets
  - sentence case
  - 24-hour times with Western digits
  - bottom bar below 720px
  - focus ring: 2px `--focus` with a 2px offset
- **Theme:** cookie `sijjel_theme` = `light` | `dark` | `system` (default `system`). The SSR output is `data-theme="light|dark"` when explicit; with `system`, it omits the attribute and the CSS uses `prefers-color-scheme`.
- **Locale:** cookie `PARAGLIDE_LOCALE` (`en` | `ar`), else the academy's `defaultLanguage`, else `en`. SSR sets `<html lang dir>` (`ar` → `rtl`).
- **Every user-facing string** exists in both `messages/en.json` and `messages/ar.json`. Every API error code shown in the UI has a message key `error_<code>`.
- **Code comments (user rule):** no commented-out code, no end-of-line comments, no past-tense change narration. Comments go above the code and only when intent isn't obvious.
- **Commits:** every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Docker builds here** need `--network host`; that never goes into repo files.

## Review Focus

1. **API unreachable during SSR:** the page must render a branded "can't reach sijjel" state with HTTP 503, not crash into a blank or generic error page. Pinned in Task 3 by `resolveTenant` returning `{kind:'unavailable'}` on fetch failure, and its test.
2. **Unknown academy subdomain:** it must render the "couldn't find this academy" page with HTTP 404, and `/login` must not be offered there. Pinned in Task 3 (hooks test) and Task 5 (route guard).
3. **The proxy must not leak or drop headers:** it forwards the `Cookie`, `Origin` and `Content-Type` headers and the body; it sets `X-Forwarded-Host` from the browser's Host; and it passes back `Set-Cookie` and the status unchanged. Pinned in Task 3 by `buildUpstreamRequest`/`toClientResponse` tests.
4. **Invite link preview:** a crawler that runs no JavaScript must see the academy name in `<title>` and `og:title`. Pinned in Task 6 by the SSR test with `curl`-style fetch in the Playwright suite.
5. **An academy colour with poor contrast** (e.g. pale yellow `#FFE45C`): generated accent tones must keep `on-accent` ≥ 4.5:1 on `accent` in both themes. Pinned in Task 3 by the `accentVars` contrast test.

---

### Task 1: Scaffold the SvelteKit app

**Files:**
- Create: the project at the repo root via `sv`, `.env.example`, `.gitignore` additions
- Modify: `vite.config.ts` (`server.allowedHosts: ['.localhost']`, `server.port: 5173`), `svelte.config.js` (adapter-node)

**Interfaces:**
- Produces:
  - A project that builds and tests.
  - Scripts `dev`, `build`, `preview`, `test` (vitest run), `test:e2e` (playwright), `check` (svelte-check), `lint`, `format`.

- [ ] **Step 1: Scaffold into the existing repo**

  Run from the repo root:

  ```
  npx sv@1.1.1 create . --template minimal --types ts \
    --add prettier eslint vitest="usages:unit,component" playwright="demo:no" sveltekit-adapter="adapter:node" paraglide="languageTags:en,ar" \
    --install npm --no-dir-check
  ```

  If an add-on prompts anyway, accept the stated option. Remove any demo routes or messages that the add-ons generate.
- [ ] **Step 2: Configure**
  - Add `server.allowedHosts` and the port in `vite.config.ts`.
  - Run `npm i @material/material-color-utilities@^0.3.0`.
  - Create `.env.example` with `API_URL=http://localhost:8080`.
- [ ] **Step 3: Verify**

  Run `npm run check`, `npm run test -- --run` and `npm run build`.
  Expected: all succeed. A trivial generated test is fine.
- [ ] **Step 4: Commit**

  Message: `chore: scaffold SvelteKit app with adapter-node, paraglide, vitest and playwright`

---

### Task 2: Design system styles and Svelte UI kit

**Files:**
- Create:
  - styles: `src/lib/styles/tokens.css` (from the artifact's `project/tokens.css`), `src/lib/styles/components.css` (from `project/components/bundle.css`, without the Google Fonts `@import`), `src/lib/styles/base.css` (body uses `--ground`/`--ink`/`--font-body`; dark tokens also under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { … } }`)
  - components: `src/lib/ui/Button.svelte`, `TextField.svelte`, `SelectField.svelte`, `CheckboxField.svelte`, `StatusChip.svelte`, `Card.svelte`, `AppShell.svelte`, `SessionSlot.svelte`, `ListRow.svelte`, `EmptyState.svelte`, `Banner.svelte`, `Icon.svelte`, `index.ts`
  - style guide: `src/routes/design/+page.svelte`, `src/routes/design/+page.server.ts` (404 unless `dev`)
- Modify: `src/app.html` (Google Fonts `<link>` for IBM Plex Sans, IBM Plex Sans Arabic, Readex Pro and Material Symbols Rounded, as in the artifact `@import`), `src/routes/+layout.svelte` (imports the three CSS files)
- Test: `src/lib/ui/ui.svelte.test.ts`

**Interfaces:**
- Produces Svelte 5 components (props via `$props()`, children via snippets). Class names match the design system:
  - `Button`: `{variant?: 'primary'|'secondary'|'quiet'|'danger' = 'primary'; type?: 'button'|'submit' = 'button'; disabled?; block?; icon?: string; href?: string; onclick?; children}`. Renders an `<a>` when `href` is set.
  - `TextField`: `{label; value = $bindable(); type?: 'text'|'email'|'password'|'time'|'number' = 'text'; hint?; error?; name?; autocomplete?; required?; dir?}`. Links the label and `aria-describedby`; sets `aria-invalid` when `error` is set.
  - `SelectField`: `{label; value = $bindable(); options: {value: string; label: string}[]; error?}`.
  - `CheckboxField`: `{label; checked = $bindable()}`.
  - `StatusChip`: `{tone: 'pending'|'active'|'stone'|'danger'|'level'|'neutral'; dot?: boolean; children}`.
  - `Card`: `{raised?: boolean; children}`.
  - `AppShell`: `{brand: {name: string; mark: string}; nav: {href: string; label: string; icon: string}[]; current: string; actions?: Snippet; footer?: Snippet; children}`. The app bar always shows; the nav items render in the app bar from 720px and in the bottom bar below.
  - `SessionSlot`: `{start: string; end: string; placesLeft: number; capacity: number; horsesFree: number; horsesTotal: number; state: 'open'|'last-horse'|'no-horse'|'full'|'booked'; note: string; action?: Snippet}`.
  - `ListRow`: `{initials: string; title: string; subtitle?: string; highlight?: boolean; trailing?: Snippet}`.
  - `EmptyState`: `{icon; title; children; action?: Snippet}`.
  - `Banner`: `{tone: 'success'|'pending'|'danger'; icon; children}`.
  - `Icon`: `{name: string; size?: 20|24; filled?: boolean; directional?: boolean}`.
  - **`/design` route** (dev only): every component in every variant, with a light/dark/system switch and an EN/AR switch, using sample academy data from the artifact (Al Faris).
- [ ] **Step 1: Fetch the design system files**

  Use the Artifact `read` action on https://claude.ai/artifact/HysWBDjQnrq5zDEoY1cZqj for `project/tokens.css` and `project/components/bundle.css`. Copy them as described above.
- [ ] **Step 2: Write failing component tests**
  - `Button` with `variant='danger'` renders `class` containing `sj-btn--danger`; with `href` it renders an `<a>`.
  - `TextField` with `error` sets `aria-invalid="true"` and renders the error text, linked through `aria-describedby`.
  - `StatusChip tone='pending' dot` has `sj-chip--pending sj-chip--status`.
  - `SessionSlot state='no-horse'` has `sj-slot--closed` and renders `horsesTotal` markers, of which `horsesTotal - horsesFree` are `--taken`.
- [ ] **Step 3: Run them to see them fail**, then implement the components and the `/design` page
- [ ] **Step 4: Verify**

  Run `npm run test -- --run` and `npm run check`.
  Expected: green. Open `/design` in `npm run dev` and compare it with the artifact previews in light and dark, EN and AR.
- [ ] **Step 5: Commit**

  Message: `feat: add the sijjel design system styles, Svelte UI kit and /design route`

---

### Task 3: API proxy, SSR tenant/session/theme/locale and accent generation

**Files:**
- Create: `src/routes/api/[...path]/+server.ts`, `src/lib/server/proxy.ts`, `src/lib/server/api.ts`, `src/lib/server/tenant.ts`, `src/lib/theme/accent.ts`, `src/lib/theme/theme.ts`, `src/hooks.server.ts` (merged with the Paraglide hook), `src/app.d.ts` (Locals)
- Modify: `src/app.html` (`<html lang="%lang%" dir="%dir%" %theme_attr%>`; `%academy_style%` in the head)
- Test: `src/lib/server/proxy.test.ts`, `src/lib/server/tenant.test.ts`, `src/lib/theme/accent.test.ts`, `src/lib/theme/theme.test.ts`

**Interfaces:**
- Produces:
  - **Upstream request:** `buildUpstreamRequest(request: Request, apiUrl: string, path: string, search: string): Request`.
    - Same method and body (streamed with `duplex: 'half'`).
    - Forwards `cookie`, `content-type`, `origin`, `accept`.
    - Sets `x-forwarded-host` from the incoming `host`.
    - Never forwards `host` or `connection`.
  - **Client response:** `toClientResponse(upstream: Response): Response` keeps the status, body, `content-type` and every `set-cookie` (`getSetCookie()`).
  - **Proxy route:** `+server.ts` exports `GET POST PUT PATCH DELETE`, each calling the two functions. If the API is unreachable it returns 503 problem+json `{code:'server_unreachable'}`.
  - **API client:** `apiFetch(event, path, init?)` is the server-side fetch to `API_URL`, forwarding the cookie and `x-forwarded-host`.
  - **Tenant:** `resolveTenant(fetchFn, host): Promise<Tenant>` with
    - `Tenant = {kind:'platform'} | {kind:'academy'; academy: AcademyTenant} | {kind:'unknown'} | {kind:'unavailable'}`
    - 404 → `unknown`; a network error or 5xx → `unavailable`.
  - **Accent tones:** `accentVars(hex: string): {light: Record<string,string>; dark: Record<string,string>}`.
    - From the `SchemeTonalSpot` primary palette: `--accent` = tone 40 / 80, `--on-accent` = 100 / 20, `--accent-soft` = 90 / 30, `--on-accent-soft` = 10 / 90.
    - An invalid hex returns `{light:{}, dark:{}}`.
  - **Accent CSS:** `accentStyle(vars): string` returns `<style id="academy-accent">:root{…}[data-theme="dark"]{…}@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){…}}</style>`.
  - **Theme:** `themeFromCookie(value?: string): 'light'|'dark'|'system'` and `themeAttr(theme): string` (`data-theme="dark"` or `""`).
  - **`handle` hook:**
    1. Run Paraglide's server middleware.
    2. Set `event.locals.tenant`. Only when the tenant is known, also set `user` (`/api/me`, `null` on 401) and `membership` (academy hosts, `/api/membership`, `null` on 404).
    3. Resolve `event.locals.locale` and `theme`.
    4. `transformPageChunk` replaces `%lang%`, `%dir%`, `%theme_attr%` and `%academy_style%`.
    5. When the tenant is `unknown` or `unavailable`, every page route except `/design` renders the status page through the layout (Task 5). The HTTP status is 404 or 503 respectively.
- [ ] **Step 1: Write failing tests**
  - `buildUpstreamRequest`: incoming Host `alfaris.localhost:5173` with a cookie → upstream URL `${apiUrl}/api/tenant?x=1`, with `x-forwarded-host` set to that host, the cookie kept, and no `host` header.
  - `toClientResponse`: two `set-cookie` headers stay two.
  - `resolveTenant`: platform JSON → platform; 404 → unknown; a thrown error → unavailable; 502 → unavailable.
  - `accentVars('#1E6B52')`: light `--accent` matches `/^#[0-9a-f]{6}$/`, and for seeds `#1E6B52`, `#FFE45C`, `#000000`, `#FFFFFF` the contrast of `--on-accent` on `--accent` is ≥ 4.5 in both themes. Use a local WCAG helper in the test.
  - `accentVars('teal')` → empty.
  - `themeFromCookie('dark')` → dark; `themeFromCookie('x')` → system.
- [ ] **Step 2: Run them to see them fail**, then implement
- [ ] **Step 3: Verify**

  Run `npm run test -- --run` and `npm run check`. Then, with the API stack running (`sijjel-api`: `docker compose --profile app up -d`), run `npm run dev` and:
  - `curl -s http://localhost:5173/api/tenant` → platform JSON
  - `curl -s -o /dev/null -w '%{http_code}' http://missing.localhost:5173/` → `404`
- [ ] **Step 4: Commit**

  Message: `feat: proxy the API and render tenant, theme, locale and academy accent in SSR`

---

### Task 4: Messages, shell layout, theme and language switches

**Files:**
- Create: `messages/en.json` and `messages/ar.json` (replacing the generated demo messages), `src/routes/+layout.server.ts`, `src/lib/components/ThemeSwitch.svelte`, `src/lib/components/LanguageSwitch.svelte`, `src/lib/components/StatusPage.svelte`, `src/routes/theme/+server.ts` (POST sets the theme cookie)
- Modify: `src/routes/+layout.svelte`
- Test: `src/lib/components/switches.svelte.test.ts`

**Interfaces:**
- Produces:
  - `+layout.server.ts` returns `{tenant, user, membership, locale, theme}` from locals.
  - **The layout:**
    - Wraps pages in `AppShell`. The brand is the academy name and mark (initials) on academy hosts, `sijjel` on the platform host.
    - Nav: platform admins on the platform host get Academies and Disciplines; academy members get Home.
    - Actions: `LanguageSwitch`, `ThemeSwitch` and a sign-in or sign-out button.
    - Footer: "Powered by sijjel" on academy hosts.
    - Unknown or unavailable tenants render `StatusPage` instead of the page.
  - `LanguageSwitch` shows the other language's native name. It sets `PARAGLIDE_LOCALE` through Paraglide's `setLocale` and reloads.
  - `ThemeSwitch` cycles system → light → dark. It POSTs `/theme` `{theme}` (which sets a one-year cookie), then updates `document.documentElement` immediately.
  - **Message keys** (EN + AR):
    - Navigation and shell: `nav_academies`, `nav_disciplines`, `nav_home`, `action_sign_in`, `action_sign_out`, `powered_by`
    - Theme and status: `theme_system`, `theme_light`, `theme_dark`, `status_unknown_title`, `status_unknown_body`, `status_unavailable_title`, `status_unavailable_body`
    - API errors: `error_<code>` for every code in the API plan, among them `login_failed`, `unauthorized`, `forbidden`, `origin_mismatch`, `academy_not_found`, `platform_only`, `slug_invalid`, `slug_reserved`, `slug_taken`, `email_invalid`, `email_taken`, `email_mismatch`, `password_too_short`, `password_too_long`, `disciplines_required`, `discipline_unknown`, `discipline_key_taken`, `level_name_required`, `level_name_too_long`, `level_duplicate`, `invite_invalid`, `already_member`, `not_a_member`, `validation_failed`, `server_unreachable`, `internal_error`, `invalid_json`
- [ ] **Step 1: Write failing tests**
  - `ThemeSwitch` cycles labels: system → light → dark.
  - `LanguageSwitch` shows "العربية" when the locale is `en`.
- [ ] **Step 2: Run them to see them fail**, then implement
- [ ] **Step 3: Verify**

  Run `npm run test -- --run`, `npm run check` and `npm run build`. In dev, toggling Arabic flips the layout to RTL, and theme changes survive a reload with no flash.
- [ ] **Step 4: Commit**

  Message: `feat: add bilingual shell with theme and language switches`

---

### Task 5: Sign-in and the platform admin area

**Files:**
- Create:
  - `src/routes/login/+page.svelte`, `src/routes/login/+page.ts` (blocked on unknown or unavailable tenants)
  - `src/routes/(platform)/platform/+layout.server.ts` (requires the platform host and `user.isPlatformAdmin`, else a redirect to `/login` or a 403 page)
  - `src/routes/(platform)/platform/academies/+page.svelte`, `src/routes/(platform)/platform/academies/+page.server.ts` (loads the list)
  - `src/routes/(platform)/platform/disciplines/+page.svelte`, `+page.server.ts`
  - `src/lib/api/client.ts`, `src/lib/api/errors.ts`, `src/lib/forms/academy.ts`, `src/lib/forms/ladder.ts`
- Modify: `src/routes/+page.svelte` (platform home: a signed-out sign-in prompt; a platform admin is redirected to `/platform/academies`; other users see "Open your academy's link to continue")
- Test: `src/lib/api/errors.test.ts`, `src/lib/forms/academy.test.ts`, `src/lib/forms/ladder.test.ts`

**Interfaces:**
- Produces:
  - **API client:** `api<T>(path, {method?, body?}): Promise<T>` is a browser fetch to same-origin `/api` with JSON. On non-2xx it throws `ApiError {status; code; fields: Record<string,string[]>}`, parsed from problem+json. A network failure gives `code:'server_unreachable'`.
  - `errorText(code: string): string` maps to `m['error_' + code]` when the key exists, else `m.error_internal_error()`.
  - **Academy form:**
    - `AcademyForm {slug; nameEn; nameAr; timeZone; defaultLanguage: 'en'|'ar'; disciplineIds: string[]}`
    - `toCreateAcademyRequest(form)` trims and lowercases the slug and trims the names
    - `academyFormErrors(form): Record<string,string[]>` mirrors the API: `slug_invalid` (same regex), `name_required`, `disciplines_required`
  - **Ladder form:**
    - `LadderRow {nameEn; nameAr}`
    - `moveRow(rows, from, to)`, `addRow(rows)`, `removeRow(rows, i)`
    - `ladderErrors(rows)` mirrors `ValidateLadder`: 1–12 rows, names 1–40, no duplicate EN names
  - **Pages:**
    - **Login:** email, password and a submit button, on both hosts. Errors are translated. On success it calls `invalidateAll()` and goes to `returnTo` or `/`.
    - **Academies page:** a list (name, slug, discipline chips, owners) plus a "New academy" card form. The time zone defaults to the browser's; disciplines are checkboxes from the catalogue. Each academy row has an "Invite owner" action that POSTs `/api/platform/academies/{id}/owner-invites` and shows the returned URL in a read-only field with a Copy button (falling back to selecting the text) and the expiry date.
    - **Disciplines page:** the catalogue list. Each discipline expands to edit its EN/AR names and its default ladder (reorder up/down, add, remove), saving with PUT. A "New discipline" form takes a key, the names and a ladder.
- [ ] **Step 1: Write failing tests**
  - `ApiError` parsing from a 400 with `errors.slug`; `server_unreachable` on a `TypeError`.
  - `toCreateAcademyRequest`: `' AlFaris '` → `'alfaris'`.
  - `academyFormErrors`: empty disciplines → `disciplines_required`.
  - `moveRow`, then `ladderErrors` (13 rows, a duplicate EN name).
- [ ] **Step 2: Run them to see them fail**, then implement
- [ ] **Step 3: Verify**

  Run `npm run test -- --run` and `npm run check`. Then, manually against the API stack:
  1. Create a platform admin with the API CLI.
  2. Sign in at `localhost:5173`.
  3. Create `alfaris` (Dressage and Show jumping).
  4. Invite the owner and copy the link.
  5. A normal user can't open `/platform/academies` (redirect or 403).
- [ ] **Step 4: Commit**

  Message: `feat: add sign-in and the platform admin area`

---

### Task 6: Invite acceptance and academy home

**Files:**
- Create: `src/routes/(academy)/invite/[token]/+page.server.ts` (loads the preview via `apiFetch`; returns 404 status with `invite_invalid` when invalid), `src/routes/(academy)/invite/[token]/+page.svelte`, `src/routes/(academy)/home/+page.svelte`
- Modify: `src/routes/+page.svelte` (on academy hosts: signed-in members see the academy home content; signed-out visitors see a branded sign-in prompt)
- Test: `src/lib/forms/invite.test.ts`, `e2e/foundation.test.ts`

**Interfaces:**
- Produces:
  - **Invite form:** `InviteSignUp {displayName; email; password}` and `inviteFormErrors(form, invitedEmail?: string)`, with `name_required`, `email_invalid`, `password_too_short` (< 10) and `email_mismatch` (when the invite named an email and it differs, case-insensitive).
  - **Invite page:**
    - SSR `<svelte:head>` with `<title>{academy name}: invitation</title>` and `og:title`, `og:description` (the role, plus the discipline and level for riders) and `og:site_name` = the academy name.
    - The body shows what the invite grants, using `StatusChip`s for role, discipline and level.
    - Signed out: the sign-up form (prefilled email when the invite names one) plus a "Already have an account? Sign in" link to `/login?returnTo=/invite/{token}`.
    - Signed in: an "Accept invitation" button.
    - On success it calls `invalidateAll()` and goes to `/`. `already_member` also goes to `/` with a banner.
    - Invalid invites render an `EmptyState` with `error_invite_invalid`.
  - **Academy home:** the display title with the academy name, its welcome text in the current locale (if any), a membership card (role chips, discipline and level chips) and an `EmptyState` for "Booking opens soon".
  - **Playwright `e2e/foundation.test.ts`:** runs against `npm run build && npm run preview` with `API_URL` pointing at the compose API. Setup creates the platform admin through `docker compose exec`, controlled by env `E2E_API_COMPOSE_DIR`. The test:
    1. Signs in as the platform admin.
    2. Creates academy `e2e{timestamp}`.
    3. Invites its owner and reads the link.
    4. Opens it on the academy host and asserts SSR `<title>` and `og:title` contain the academy name, through `request.get(url)` (no JS).
    5. Signs up.
    6. Lands on the academy home showing "Admin".
    7. Switches to Arabic → `html[dir=rtl]`.
    8. Switches to dark → `html[data-theme=dark]`.
- [ ] **Step 1: Write the failing unit tests** for `inviteFormErrors`, then implement the pages
- [ ] **Step 2: Run `npm run test -- --run` and `npm run check`**
- [ ] **Step 3: Run `npm run test:e2e`** with the API stack up

  Expected: pass.
- [ ] **Step 4: Commit**

  Message: `feat: accept academy invites and show the academy home`

---

### Task 7: Container, compose and README

**Files:**
- Create: `Dockerfile`, `.dockerignore`, `compose.yaml`, `README.md`

**Interfaces:**
- Produces:
  - **Dockerfile:**
    - build stage `node:24-alpine`: `npm ci`, `npm run build`, `npm prune --omit=dev`
    - runtime `node:24-alpine` with `USER node`, `ENV NODE_ENV=production PORT=3000`
    - copies `build/`, `package.json` and production `node_modules`
    - `HEALTHCHECK` using `wget -qO- http://127.0.0.1:3000/healthz`
    - `CMD ["node","build"]`
  - **Health route** `src/routes/healthz/+server.ts`: returns `ok` without calling the API.
  - **compose.yaml:** service `web`, `API_URL=http://api:8080`, ports `127.0.0.1:3000:3000`, joining the external network `sijjel-api_default`. The API stack must run first.
  - **README:** dev (`npm run dev` with the API on 8080), tests, e2e, container run, and the design-system link.
- [ ] **Step 1: Build and run**
  1. `docker build --network host -t sijjel-web-web .`
  2. With the API stack up, `docker compose up -d`.
- [ ] **Step 2: Verify**
  - `curl -s localhost:3000/healthz` → `ok`.
  - `curl -s -H 'Host: alfaris.localhost:3000' localhost:3000/` contains the academy name in `<title>`.
  - `docker compose exec web id -u` → `1000`.
  - The deep link `/platform/academies` → 200 or a redirect, never 404.
- [ ] **Step 3: Run `npm run test -- --run`**
- [ ] **Step 4: Commit**

  Message: `chore: add container, compose and README`
