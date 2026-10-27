# Web Academy Branding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Academy admins brand their academy from Settings → Branding (logo, cover, colour suggested from the logo, welcome line EN/AR); everyone sees the logo in the app bar and the cover band on the home page.

**Architecture:** Pure helpers (`src/lib/theme/logo-colours.ts`, `src/lib/forms/image.ts`) do colour suggestion and in-browser resizing; a `BrandingForm` component owns the settings flow; `AppShell` and a new `AcademyCover` render the brand. The API plan (`sijjel-api/docs/superpowers/plans/2026-10-27-api-academy-branding.md`) provides the endpoints.

**Tech Stack:** SvelteKit / Svelte 5, Paraglide EN/AR, `@material/material-color-utilities` 0.3 (`QuantizerCelebi`, `Score`), vitest-browser-svelte, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-27-academy-branding-design.md`

## Global Constraints

- One colour per academy; swatches = up to 4 from the logo + sijjel brown `#7A5230` last; no colour wheel or hex field.
- Logo resized to fit 512×512 (PNG if it has transparency, else JPEG 0.85); cover to fit 1600×1600 (JPEG 0.85). Uploads are `image/png` or `image/jpeg` only.
- Welcome lines optional, at most 200 characters each.
- Picked images are previews until Save; Save uploads/removes images first, then PUTs colour and welcome lines; a failed upload stops the rest and shows its error on that section.
- Home: with a cover, edge-to-edge band with the logo on its lower edge at the inline-start side; logo but no cover → no band and no page logo (app bar only).
- Copy and Arabic exactly as in the spec's copy table; logical CSS only; dark mode; mobile-first.
- Admins only (the settings card and route live under `(academy)/(admin)`).
- API image routes: `PUT|DELETE /api/academy/branding/{logo|cover}`, `GET|PUT /api/academy/branding`, files at `logoUrl`/`coverUrl` (`/api/files/<id>`).

## Review Focus

- A black-and-white logo: no suggested swatches; current colour stays selected. → Task 2 test.
- A 4000×3000 photo picked as cover is uploaded at most 1600 px wide. → Task 2 test.
- Arabic: the cover's logo sits on the right. → Task 3 test.
- A failed logo upload: no PUT of colour/welcome is sent, error shows in the logo section. → Task 4 test.
- Covers bigger than adapter-node's default 512 KB body limit reach the API in production. → Task 5 (`BODY_SIZE_LIMIT`).

---

### Task 1: Types, upload client and app bar logo

**Files:**
- Modify: `src/lib/api/types.ts` (`Academy` gains `logoUrl: string | null; coverUrl: string | null`), `src/lib/api/client.ts`, `src/lib/ui/AppShell.svelte`, `src/routes/+layout.svelte`, `src/lib/ui/ui.svelte.test.ts`, any test fixtures building an `Academy` (add the two nulls)
- Create: `src/lib/api/branding-types.ts`, `src/lib/api/client.test.ts` (if none exists; else extend)

**Interfaces:**
- Produces:
  - `type Branding = { primaryColor: string; welcomeTextEn: string | null; welcomeTextAr: string | null; logoUrl: string | null; coverUrl: string | null }` in `branding-types.ts`
  - `upload<T>(path: string, blob: Blob, method?: 'PUT'): Promise<T>` in `client.ts` — sends the blob as the body with `content-type: blob.type`, same error handling as `api`.
  - `AppShell` `brand` prop gains `logo?: string | null`; when set renders `<img class="sj-mark sj-mark--logo" src={logo} alt="">` instead of the initials.

- [ ] **Step 1: Failing tests:** `AppShell` with `brand.logo: '/api/files/x'` renders an `img` with that `src` inside the brand link and no initials text; without `logo` shows the initials. `upload('/academy/branding/logo', new Blob([…], {type:'image/png'}))` calls fetch with `PUT`, body the blob, header `content-type: image/png` (stub `fetch`).
- [ ] **Step 2: Run** `npx vitest run src/lib/ui/ui.svelte.test.ts src/lib/api` — Expected: FAIL.
- [ ] **Step 3: Implement**; `.sj-mark--logo` uses `object-fit: cover` and a 1px `--line` border; layout passes `logo: tenant.academy.logoUrl`.
- [ ] **Step 4: Run** the same — Expected: PASS. Then `npm run check`.
- [ ] **Step 5: Commit** `feat: the academy logo in the app bar`.

### Task 2: Colour suggestions and image resizing

**Files:**
- Create: `src/lib/theme/logo-colours.ts`, `src/lib/theme/logo-colours.test.ts`, `src/lib/forms/image.ts`, `src/lib/forms/image.svelte.test.ts` (browser: needs canvas)

**Interfaces:**
- Produces:
  - `suggestColours(pixels: Uint8ClampedArray): string[]` — RGBA bytes in, up to 4 `#RRGGBB` (uppercase) out, best first. Skips pixels with alpha < 128; `QuantizerCelebi.quantize(argb, 128)` then `Score.score(map, { desired: 4, filter: true, fallbackColorARGB: SENTINEL })` and drop the sentinel, so a colourless logo returns `[]`. Removes near duplicates (same hex).
  - `swatchesFor(suggested: string[], current: string): string[]` — `unique([...suggested, current, '#7A5230'])`, keeping order (case-insensitive), at most 6.
  - `loadImage(file: Blob): Promise<HTMLImageElement | ImageBitmap>` (throws `ImageError('image_invalid')` when the browser can't decode)
  - `resizeImage(source, max: number, kind: 'logo' | 'cover'): Promise<Blob>` — fits within `max`×`max` without upscaling; logo → PNG if any pixel alpha < 255 else JPEG 0.85; cover → JPEG 0.85.
  - `imagePixels(source, size = 128): Uint8ClampedArray` — downscaled RGBA for `suggestColours`.

- [ ] **Step 1: Failing tests:**
  - `suggestColours` with 70 % navy `(41,52,79)` + 30 % gold `(201,162,39)` pixels → contains a hex within 12 of navy on every channel, and length ≤ 4.
  - Only black and white pixels → `[]`. Fully transparent pixels plus a few navy → navy only.
  - `swatchesFor(['#29344F'], '#7A5230')` → `['#29344F', '#7A5230']`; `swatchesFor([], '#1E6B52')` → `['#1E6B52', '#7A5230']`.
  - Browser: a 4000×3000 canvas `toBlob` (JPEG) → `resizeImage(…, 1600, 'cover')` decodes to width 1600, height 1200, type `image/jpeg`; a 200×100 opaque PNG as logo → stays 200×100, `image/jpeg`; a PNG with a transparent pixel → `image/png`. `loadImage(new Blob(['%PDF'], {type:'image/png'}))` rejects with `image_invalid`.
- [ ] **Step 2: Run** `npx vitest run src/lib/theme/logo-colours.test.ts src/lib/forms/image.svelte.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** Use `createImageBitmap` for decoding and an `OffscreenCanvas` (fallback `document.createElement('canvas')`) for drawing.
- [ ] **Step 4: Run** — Expected: PASS.
- [ ] **Step 5: Commit** `feat: suggest colours from a logo and resize photos before upload`.

### Task 3: Cover band on the home page

**Files:**
- Create: `src/lib/components/AcademyCover.svelte`, `src/lib/components/academy-cover.svelte.test.ts`
- Modify: `src/routes/+page.svelte`

**Interfaces:**
- Consumes: `Academy.coverUrl`, `Academy.logoUrl` (Task 1).
- Produces: `AcademyCover` props `{ cover: string; logo: string | null; name: string }`.

- [ ] **Step 1: Failing tests:** renders an `img` with `src` = cover and empty `alt`, and the logo `img` when given; no logo `img` when `logo` is null. In a `dir="rtl"` wrapper 400 px wide, the logo's bounding box right edge is within 40 px of the wrapper's right edge (inline-start); in `ltr`, its left edge within 40 px of the left.
- [ ] **Step 2: Run** `npx vitest run src/lib/components/academy-cover.svelte.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** Band breaks out of `.sj-page` padding to full width, height 160 px (200 px from 720 px wide), `object-fit: cover` centred; logo 72 px rounded square, `inset-inline-start: var(--space-4)`, overlapping the lower edge by half, ring `3px solid var(--bg)`. Home page: render it above the welcome heading when `academy.coverUrl`; add `<meta property="og:image" content={new URL(academy.coverUrl, page.url).href}>` when set.
- [ ] **Step 4: Run** — Expected: PASS; `npm run check`.
- [ ] **Step 5: Commit** `feat: the cover photo across the academy home page`.

### Task 4: Settings → Branding

**Files:**
- Create: `src/lib/components/BrandingForm.svelte`, `src/lib/components/branding-form.svelte.test.ts`, `src/routes/(academy)/(admin)/settings/branding/+page.server.ts`, `src/routes/(academy)/(admin)/settings/branding/+page.svelte`
- Modify: `src/routes/(academy)/(admin)/settings/+page.svelte` (Branding card, icon `palette`), `messages/en.json`, `messages/ar.json`, `src/lib/messages.test.ts`

**Interfaces:**
- Consumes: `Branding`, `upload` (Task 1); `suggestColours`, `swatchesFor`, `loadImage`, `resizeImage`, `imagePixels` (Task 2).
- Produces: `BrandingForm` props `{ branding: Branding; onsaved: (b: Branding) => void }`; the page calls `invalidateAll()` in `onsaved`.

Copy (EN / AR), message keys prefixed `branding_`: `title` Branding / الهوية; `card_body` Logo, cover photo, colour and welcome line. / الشعار وصورة الغلاف واللون ورسالة الترحيب.; `logo` Logo / الشعار; `cover` Cover photo / صورة الغلاف; `colour` Colour / اللون; `colour_hint` From your logo. Tap another to change. / من شعارك. اضغط على لون آخر لتغييره.; `welcome_en` Welcome line (English) / رسالة الترحيب (بالإنجليزية); `welcome_ar` Welcome line (Arabic) / رسالة الترحيب (بالعربية); `upload_logo` Upload logo / رفع الشعار; `change_logo` Change logo / تغيير الشعار; `upload_cover` Upload cover photo / رفع صورة الغلاف; `change_cover` Change cover photo / تغيير صورة الغلاف; `remove` Remove / إزالة; `saved` Saved. / تم الحفظ.; `swatch` Colour {n} / اللون {n} (each swatch radio's accessible name). Errors: `error_image_invalid` This photo couldn't be used. Try a JPEG or PNG. / تعذّر استخدام هذه الصورة. جرّب صورة JPEG أو PNG.; `error_image_too_large` This photo is too large. / هذه الصورة كبيرة جدًا.; `error_color_invalid` Pick a colour. / اختر لونًا.; `error_welcome_too_long` Keep the welcome line to 200 characters. / اجعل رسالة الترحيب 200 حرف على الأكثر.

- [ ] **Step 1: Failing tests** (stub `fetch`; stub `resizeImage`/`loadImage` via `vi.mock('#lib/forms/image.js')` returning a small PNG blob and pixels of navy):
  - `suggests the logo colour after picking a logo`: set the logo file input → swatch radio "Colour 1" is checked and its colour is the navy suggestion; the preview button uses it.
  - `saves the logo before the colour and welcome lines`: pick logo, type English welcome, Save → fetch calls in order `PUT /api/academy/branding/logo` (blob body), then `PUT /api/academy/branding` with `{primaryColor, welcomeTextEn, welcomeTextAr}`; "Saved." shows; `onsaved` called with the last response.
  - `stops when an upload fails`: logo PUT answers 400 `image_invalid` → only one fetch call, "This photo couldn't be used. Try a JPEG or PNG." inside the Logo section.
  - `removes the cover`: with `coverUrl` set, Remove then Save → `DELETE /api/academy/branding/cover` then the PUT.
  - `checks the welcome length`: 201 characters → "Keep the welcome line to 200 characters." and no fetch.
  - messages test: the four error codes exist in EN and AR.
- [ ] **Step 2: Run** `npx vitest run src/lib/components/branding-form.svelte.test.ts src/lib/messages.test.ts` — Expected: FAIL.
- [ ] **Step 3: Implement.** File inputs are visually hidden `accept="image/*"` behind Buttons. On page load with an existing logo, compute swatches from `logoUrl` (same origin). Swatches are a radio group (`fieldset` + `legend` "Colour"), round 40 px, tick on the checked one, keyboard-operable. Preview: a `Button` and a `StatusChip` styled with the chosen colour's `accentVars(...).light` tones (scoped `style` on a wrapper). Welcome fields use `TextField` with errors. Paraglide compile after adding messages.
- [ ] **Step 4: Run** — Expected: PASS; `npm run check`, `npx eslint src`.
- [ ] **Step 5: Commit** `feat: academy admins brand their academy in settings`.

### Task 5: Production body limit and end-to-end

**Files:**
- Modify: `Dockerfile` (`ENV … BODY_SIZE_LIMIT=3M`), `e2e/compose.yaml` (no change expected: the API image carries a writable files dir), create `e2e/branding.e2e.ts`

- [ ] **Step 1: Write** `e2e/branding.e2e.ts`: owner of a new academy (`createAcademy`, `inviteOwner`, `signUpOwner`, `setUpAcademy` helpers) opens `/settings/branding`, sets the logo input to a generated 64×64 navy PNG buffer and the cover input to a 2000×1200 JPEG buffer (both drawn on a canvas inside `page.evaluate` and returned as base64 from `toDataURL('image/png')` / `toDataURL('image/jpeg', 0.9)`, then passed to `setInputFiles` as `{ name, mimeType, buffer }`), types the English welcome "Flatwork in Cairo", saves, sees "Saved."; then on `/` the app bar brand link has an `img`, the cover band `img` is visible, "Flatwork in Cairo" is visible.
- [ ] **Step 2: Run** `E2E_API_IMAGE=sijjel-api-e2e npm test` after rebuilding the e2e API image from the API branch (`docker build -q --network host -t sijjel-api-e2e .` in sijjel-api) — Expected: the new spec passes with the rest.
- [ ] **Step 3: Commit** `test: branding end to end; raise the body limit for photos`.
