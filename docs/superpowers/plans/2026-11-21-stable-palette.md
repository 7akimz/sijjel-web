# Stable Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the brown-and-sand palette with Radix olive grounds, Radix status colours and a hunter green default, in the web app and in the API's default academy colour.

**Architecture:**
- **Web:** the colours live as CSS tokens in `src/lib/styles/tokens.css`, with the device-dark copy in `base.css`. They change in place; components keep the same token names. Hunter green replaces brown in the four places that hard-code the default: the swatch fallback, the manifest, the favicon and the icons.
- **API:** one migration changes the column default and moves academies still on the old brown. One constant and one query change with it.

**Tech Stack:** SvelteKit 5 + vitest (server project, `src/**/*.test.ts` in Node), Go + goose + sqlc + Testcontainers.

**Spec:** `docs/superpowers/specs/2026-11-21-stable-palette-design.md` (screenshots in `docs/superpowers/specs/2026-11-21-stable-palette/`)

## Global Constraints

- Every value comes from the spec's palette table, which is copied from `@radix-ui/colors` 3.0.0. No other colours.
- Hunter green is `#355E3B`. The old default to replace is `#7A5230`, matched without regard to case.
- The default accent tokens are exactly what `accentVars('#355E3B')` returns:
  - Day: `#35693e` / `#ffffff` / `#b7f1ba` / `#002109`
  - Night: `#9bd4a0` / `#003914` / `#1c5129` / `#b7f1ba`
- Token names don't change (`ground`, `surface`, `brass`, `paddock`, `stone`…), and components aren't edited.
- Contrast (WCAG):
  - text pairs: 4.5:1 or more;
  - `line-strong` against `surface` and `ground`: 3:1 or more.
- Branches are `feat/stable-palette` in both repos; the web branch already exists.
- Commits end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- The dev database must never be migrated by this branch. The preview uses `sijjel_preview`.

## Review Focus

1. **The device-dark block drifts from `[data-theme='dark']`.** Someone on "Device" theme with a dark phone must get exactly the Night palette. Task 3 pins this with `device dark matches Night`.
2. **Tokens outside the table keep a brown tint**, such as `--hover-veil`, `--scrim`, `--shadow-raised` and `--focus`. Hovers, sheets and shadows must have no brown cast. Task 3 pins this with `no brown rgba left`.
3. **An academy whose colour is stored in lower case (`#7a5230`) is skipped by the migration.** It must move like the upper-case one. Task 1 seeds both cases.
4. **An academy with a chosen colour gets moved.** Only the exact old default may change. Task 1 seeds a navy academy and asserts it's untouched.
5. **The branding page still offers brown as the fallback swatch** after the default changes. The fallback must be hunter green. Task 4 updates the swatch tests to expect `#355E3B`.

---

### Task 1: API default colour is hunter green (sijjel-api)

**Files:**
- Create: `sijjel-api/migrations/00030_hunter_green_default.sql`
- Create: `sijjel-api/internal/store/hunter_green_migration_test.go`
- Modify: `sijjel-api/internal/app/branding.go:26` (`defaultPrimaryColor`)
- Modify: `sijjel-api/internal/store/queries/sign_in_links.sql:2` (the `COALESCE` fallback), then `make generate`
- Modify: `sijjel-api/internal/httpapi/branding_test.go:25`

**Interfaces:**
- Produces: new academies, and academies on the old default, have `primary_color = '#355E3B'`. The web tasks rely on this value only through the API.

- [ ] **Step 1:** In sijjel-api, `git checkout -b feat/stable-palette` from `main`.
- [ ] **Step 2: Write the failing tests.**
  - `TestHunterGreenMigration` in `internal/store/hunter_green_migration_test.go`, following `member_left_migration_test.go`, with `const hunterGreenVersion = 30`:
    1. `seedLadders`, add two more academies, then `provider.DownTo(ctx, hunterGreenVersion-1)`.
    2. Insert `academy_branding` rows for three academies: `'#7A5230'`, `'#7a5230'` and `'#29344F'`.
    3. Run `provider.Up(ctx)`.
    4. Assert the first two are `'#355E3B'` and the third is still `'#29344F'`.
    5. Insert a branding row for a fourth academy without `primary_color` and assert it gets `'#355E3B'`.
  - In `TestBranding_GetStartsWithDefaults`, expect `"#355E3B"`.
- [ ] **Step 3: Run them to see them fail.**
  - Run: `go test ./internal/store -run TestHunterGreenMigration -count=1` and `go test ./internal/httpapi -run TestBranding_GetStartsWithDefaults -count=1`
  - Expected: FAIL. The migration test fails on `DownTo` (no version 30); the branding test fails with `primaryColor = #7A5230`.
- [ ] **Step 4: Write the migration.**
  - Up:
    - `ALTER TABLE academy_branding ALTER COLUMN primary_color SET DEFAULT '#355E3B';`
    - `UPDATE academy_branding SET primary_color = '#355E3B' WHERE upper(primary_color) = '#7A5230';`
  - Down: restores only the default (`'#7A5230'`). Moved rows can't be told apart from chosen ones, so they stay.
  - Each part gets a one-line comment above it saying why.
  - Then set `defaultPrimaryColor = "#355E3B"`, change the `COALESCE` fallback to `'#355E3B'`, and run `make generate`.
- [ ] **Step 5: Run the tests to see them pass, then the whole suite.**
  - Run: the two commands from Step 3, then `make test`
  - Expected: PASS, and `ok` for every package.
- [ ] **Step 6:** Check the README and `docs/superpowers/specs/` for the old default with `grep -rn "7A5230" README.md docs/superpowers/specs`, and update any rule text that states it. Then commit as "Hunter green is the default academy colour".

### Task 2: Palette check helper (sijjel-web)

**Files:**
- Create: `sijjel-web/src/lib/theme/contrast.ts`
- Test: `sijjel-web/src/lib/theme/contrast.test.ts`

**Interfaces:**
- Produces: `contrastRatio(a: string, b: string): number`. It takes `#rrggbb` hex and returns the WCAG 2.x ratio, 1 to 21. Task 3 uses it.

- [ ] **Step 1: Write the failing tests:**
  - `contrastRatio('#000000', '#ffffff')` is `21`.
  - `contrastRatio('#ffffff', '#ffffff')` is `1`.
  - `contrastRatio('#60655f', '#f8faf8')` rounds to `5.68` (`toBeCloseTo(5.68, 2)`).
  - The order of the arguments doesn't matter.
- [ ] **Step 2:** Run `npx vitest run src/lib/theme/contrast.test.ts`. Expected: FAIL, because the module isn't found.
- [ ] **Step 3:** Implement it with relative luminance from sRGB (threshold 0.03928) and `(L1 + 0.05) / (L2 + 0.05)`.
- [ ] **Step 4:** Run it again. Expected: PASS. Commit as "Contrast ratio helper for palette checks".

### Task 3: Olive and Radix tokens, hunter green default accent (sijjel-web)

**Files:**
- Modify: `sijjel-web/src/lib/styles/tokens.css` (the `[data-theme='light']` and `[data-theme='dark']` blocks)
- Modify: `sijjel-web/src/lib/styles/base.css:1-29` (the device-dark block)
- Test: `sijjel-web/src/lib/theme/palette.test.ts`

**Interfaces:**
- Consumes: `contrastRatio` (Task 2) and `accentVars` (`src/lib/theme/accent.ts`).

- [ ] **Step 1: Write the failing tests.** In `palette.test.ts`, read the three blocks as `Record<string, string>` with a small parser in the test: Day and Night from `tokens.css`, device dark from `base.css`.
  - `Day and Night match the spec`: every row of the spec's palette table, Day and Night, with its exact hex. That covers `ground`, `surface`, `surface-sunk`, `line`, `line-strong`, `ink`, `ink-muted`, `brass`, `brass-soft`, `paddock`, `paddock-soft`, `danger`, `on-danger`, `danger-soft`, `stone` and `stone-soft`.
  - `the default accent is hunter green`: the four accent tokens in each theme equal `accentVars('#355E3B').light` and `.dark`.
  - `device dark matches Night`: every token in the `base.css` block equals the Night block.
  - `text is readable`, in each theme, at 4.5 or more:
    - `ink` and `ink-muted` on `ground`, `surface` and `surface-sunk`;
    - each status text on its soft colour (`brass`/`brass-soft`, `paddock`/`paddock-soft`, `danger`/`danger-soft`, `stone`/`stone-soft`);
    - `on-accent` on `accent`, `on-accent-soft` on `accent-soft`, and `on-danger` on `danger`.
  - `borders are visible`: `line-strong` on `surface` and on `ground`, at 3 or more, in each theme.
  - `no brown rgba left`: neither file contains `rgba(42, 33, 26` or `rgba(255, 244, 230` (the old brown veils).
- [ ] **Step 2:** Run `npx vitest run src/lib/theme/palette.test.ts`. Expected: FAIL on the spec values, for example `ground` is `#f5f0e6`, not `#f8faf8`.
- [ ] **Step 3: Set the tokens** in both files to the spec table and the Global Constraints accent values.
  - `--hover-veil`, `--scrim` and `--shadow-raised` keep their opacities, rebuilt on `rgb(29, 33, 28)` (olive 12) for Day.
  - The dark veil `rgba(255, 244, 230, 0.1)` becomes `rgba(236, 238, 236, 0.1)` (oliveDark 12).
  - Leave `--focus` as `var(--ink)` and `--qr-ground` as `#ffffff`.
- [ ] **Step 4: Run the tests.**
  - Run: `npx vitest run src/lib/theme/palette.test.ts`, then `npx vitest run`
  - Expected: PASS, and the full suite green. If a pair fails, the spec value is wrong: stop and report it instead of picking another colour.
- [ ] **Step 5:** Commit as "Stable palette: olive grounds, Radix statuses, hunter green default".

### Task 4: Hunter green replaces brown outside the tokens (sijjel-web)

**Files:**
- Modify: `sijjel-web/src/lib/theme/logo-colours.ts`: rename `SIJJEL_BROWN` to `SIJJEL_GREEN = '#355E3B'`, and update the doc comment on `swatchesFor` ("then the sijjel green").
- Modify: `sijjel-web/src/lib/forms/manifest.ts:4-5`: `DEFAULT_ACCENT = '#355e3b'`, `GROUND = '#f8faf8'`.
- Modify: `sijjel-web/src/lib/assets/favicon.svg`: the background `fill` becomes `#355e3b`. The horseshoe (`#fdf8f0`) and nails (`#e2b45e`) stay.
- Replace: `sijjel-web/static/icons/icon-192.png` (192), `icon-512.png` (512) and `apple-touch-icon.png` (180), rendered from the new SVG.
- Test:
  - `src/lib/theme/logo-colours.test.ts:45-53`
  - `src/lib/forms/manifest.test.ts:27-35`
  - `src/lib/components/branding-form.svelte.test.ts:168-183`

**Interfaces:**
- Consumes: Task 1's default (`#355E3B`) as the colour academies get from the API.

- [ ] **Step 1: Update the tests to the new default.**
  - Every expectation where `#7A5230` is the sijjel fallback swatch or the manifest default becomes `#355E3B` / `#355e3b`. That includes the `swatchesFor` lists, the manifest `theme_color` for the platform, and the branding form's last swatch.
  - Fixtures where `#7A5230` is just an academy's stored colour (`branding-form` line 22, `my-academies` line 11, `accent.test.ts` seeds) stay.
- [ ] **Step 2:** Run `npx vitest run src/lib/theme src/lib/forms/manifest.test.ts src/lib/components/branding-form.svelte.test.ts`. Expected: FAIL on the swatch and manifest expectations.
- [ ] **Step 3:** Make the code changes listed under Files, apart from the icons.
- [ ] **Step 4:** Run the same tests. Expected: PASS.
- [ ] **Step 5: Render the three PNGs from `favicon.svg`.**
  - Use the Playwright Chromium already installed: a page sized to the icon, the SVG at full size, and `screenshot({ omitBackground: false })`. Use a throwaway script in the scratchpad, not in the repo.
  - Check: `file static/icons/*.png` shows 192x192, 512x512 and 180x180. Open `icon-192.png` and see a green tile with the cream horseshoe.
- [ ] **Step 6:** Run `npx vitest run && npm run check && npx eslint src e2e && npx prettier --check src e2e messages`. Expected: all clean. Commit as "Hunter green replaces brown as the default colour".

### Task 5: Docs describe the new palette (sijjel-web)

**Files:**
- Modify: `sijjel-web/CLAUDE.md:55` and `:77`
- Update: the published design system artifact, https://claude.ai/artifact/HysWBDjQnrq5zDEoY1cZqj (read it first; its `project/README.md` comes first).

- [ ] **Step 1: Update `CLAUDE.md`.**
  - Line 55 becomes "A fixed stable layer (olive grounds and ink, with amber, grass, red and olive status colours from Radix Colors) …". Keep the rest of the sentence about the four accent tokens.
  - Line 77 becomes "Night is olive-dark, not inverted Day."
  - Add one line that the default accent is hunter green `#355E3B`, sent through `accentVars` like any academy colour.
- [ ] **Step 2: Update the design system artifact.**
  - Read it with the Artifact tool and change its palette values and wording to the spec's table and hunter green.
  - Republish it to the same URL. If it's built from a design-system type and the change isn't clear, stop and ask instead of guessing.
- [ ] **Step 3:** Run `npx prettier --check CLAUDE.md`. Commit as "Docs: stable palette".

### Task 6: Preview both branches on :3001 (no merge)

- [ ] **Step 1:** Build and run the API and web previews as in the "Preview before merge" recipe.
  - Copy dev into `sijjel_preview`, then `sijjel-api-preview` with `DATABASE_URL=…/sijjel_preview` and the files volume read-only.
  - Run `sijjel-web-preview` with `API_URL=http://sijjel-api-preview:8080`.
  - Expected: `curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/` prints `200`, and in `sijjel_preview`, Alfaris (on the old brown) now has `#355E3B`. The dev database still says `#7A5230`.
- [ ] **Step 2: Check the pages with a headless browser at 390px, Day and Night:**
  - the platform academy page;
  - Alfaris rider home and the board (hunter green, no logo);
  - Orlando rider home (navy logo).
  - Check the Day booked-card mint the spec flags, and run the ux-laws review on the screenshots.
- [ ] **Step 3:** Tell the user the preview is up and what to try. Don't merge, and ask before dropping `sijjel_preview`.
