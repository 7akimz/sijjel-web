# Academy branding: logo, cover photo, colour and welcome line

## Why

Each academy should feel like its own app. Riders open "Orlando Equestrian Academy", not
sijjel. Today the brand colour, welcome line, logo and cover can only be set in the database,
so no academy can brand itself. The owner of Orlando should be able to do it from their phone
in a minute, without knowing anything about colours or image sizes.

What success looks like: the owner uploads their logo and cover photo, the app picks the
colour from the logo, they write one welcome line in English and Arabic, and every rider sees
their academy's look from the next page load.

## Goals

- Academy admins set the logo, cover photo, colour and welcome line in **Settings → Branding**.
- The colour is **suggested from the logo**. The owner never types a colour code.
- Riders, staff and visitors see the logo in the app bar and the cover on the home page.

## Non-goals

- A second brand colour. Tried and rejected: one colour only; other logo colours stay in the
  logo and cover.
- A colour wheel or hex field.
- Cropping or positioning tools for the images.
- House rules (the columns exist; not part of this work).
- Platform admin editing an academy's branding.
- Moving files to S3 or a CDN (comes with AWS hosting, which is on hold).

## Anti-goals

- Anything that reads as technical to an owner: colour codes, pixel sizes, file formats in the
  copy.
- A colour choice that makes text hard to read. Any chosen colour must stay readable in light
  and dark mode.
- An academy without uploads looking broken or empty.

## What people see

### App bar

- With a logo: the logo, as a small rounded square, replaces the initials mark next to the
  academy name, on every page of the academy's subdomain.
- Without a logo: the initials mark, as today.

### Home page (decided: "cover band", version A in the mockups)

- With a cover: the cover photo runs edge to edge across the top of the home page, above
  "Welcome to …". The logo sits on the cover's lower edge, at the start side (left in English,
  right in Arabic), larger than in the app bar, with a ring in the page background colour.
- With a logo and no cover: no band. The page starts as today. Decided: the logo is not
  repeated on the page since it's in the app bar.
- With a cover and no logo: the band shows without the overlapping logo.
- The welcome line shows under "Welcome to …" in the viewer's language, as today. Everyone who
  opens the academy home page sees it: riders, staff, admins and signed-out visitors.
- Link previews: *my call:* the cover becomes the page's `og:image` when present, so a shared
  academy link shows the photo.

### Colour

- One colour per academy (`primary_color`). The app already turns it into readable light and
  dark tones (`src/lib/theme/accent.ts`); nothing about that changes.
- Buttons, chips, links, the progress bar and the active tab use it.

## Settings → Branding (academy admins only)

A new card on the settings list, "Branding", leading to one page with four sections and one
Save button (mockup: "B, automatic with taps to change", single colour).

1. **Logo.** Shows the current logo or the initials. "Upload logo" / "Change logo" opens the
   phone's photo picker. "Remove" when one is set.
2. **Cover photo.** Shows the current cover or an empty frame. "Upload cover photo" / "Change
   cover photo", and "Remove".
3. **Colour.**
   - When a logo is picked, the app finds its colours and **selects the strongest one** for the
     owner.
   - Shown as up to 4 round swatches from the logo, plus the sijjel brown (`#7A5230`) as the last
     swatch. One tap selects. The selected one has a tick.
   - A small preview under the swatches: a button and a chip in the selected colour.
   - Before any logo is uploaded: only the current colour and the sijjel brown.
   - Copy: "From your logo. Tap another to change."
   - The swatches are only offered when a new logo is picked or on page load from the current
     logo; the stored value is just the one chosen colour.
4. **Welcome line.** Two text fields, "Welcome line (English)" and "Welcome line (Arabic)",
   each optional, up to 200 characters. *My call:* 200, not the column's 4000, since it's one
   line under a heading.

Picked images are held in the page (shown as previews) until Save. Save uploads any new or
removed images, then stores the colour and welcome lines, and shows "Saved." on the page.
*My call:* if an upload fails, nothing after it is saved and the error shows on that section,
so the owner can retry. Removing the logo leaves the colour as it is. The new look appears on the next
page load or navigation; *my call:* after saving, the page reloads the app's data so the app
bar and accent update straight away for the owner.

Trainers and riders don't see the card or the page.

## Colour from the logo

- Done in the browser when the owner picks a logo, before upload.
- Use `@material/material-color-utilities` (already a dependency): `QuantizerCelebi` on the
  logo's pixels, then `Score.score` to rank colours suitable as a brand colour. Take the top 4.
- Pixels that are fully or mostly transparent are skipped. A logo with no usable colour
  (black and white) yields no suggestions; the swatches show just the current colour and the
  sijjel brown, and the current colour stays selected.
- The chosen colour is stored as `#RRGGBB` in `academy_branding.primary_color`, which already
  validates that format.
- Expectation for Orlando's logo (navy and gold): navy or gold as the top suggestions. Either is
  fine because the tone generation keeps text readable; the owner taps the one they like.

## Images

- **Accepted:** JPEG, PNG and WebP from the picker. HEIC from iPhones is converted by the
  browser's picker in most cases; if a file can't be read, show "This photo couldn't be used.
  Try a JPEG or PNG."
- **Resized in the browser before upload** (canvas), so phones never send multi-megabyte photos:
  - Logo: fit within 512×512, PNG if the source has transparency, else JPEG at 0.85.
  - Cover: fit within 1600×1600, JPEG at 0.85.
- **Server checks:** the API accepts at most 2 MB per image, decodes it to confirm it's a real
  JPEG/PNG/WebP, and refuses anything else (`image_invalid`, `image_too_large`).
- *My call:* no fixed aspect ratio. The cover band uses `object-fit: cover` centred, the logo a
  rounded square with `object-fit: cover`. Owners don't crop.

## Storage and serving (builder's area, with these decisions)

- **Image bytes are not stored in the database** (decided). They live in file storage behind a
  small interface (save, open, delete by key), so moving to S3 with hosting means adding one
  implementation, not changing callers.
- For now the only implementation writes to a directory on disk, set by an environment
  variable (for example `FILES_DIR`). In compose it is a named Docker volume mounted into the api
  container, so files survive rebuilds. Tests use a temporary directory.
- The database keeps only metadata in a new `files` table (id, academy_id, content_type,
  size, created_at). The existing `logo_file_id` / `cover_file_id` columns point at it. The
  storage key is derived from the academy and file id, never from user input.
- Replacing or removing an image deletes the old file row and its stored bytes. Files belong to
  their academy (`ON DELETE CASCADE` from academies). *My call:* if deleting the bytes fails
  after the row is gone, log it and move on; an orphaned file costs disk, not correctness.
- The web app's same-origin `/api` proxy runs on adapter-node, whose default request body limit
  is 512 KB. Raise it (`BODY_SIZE_LIMIT`) to at least the API's 2 MB, or uploads of large covers
  will fail before reaching the API.
- `GET /api/files/{id}` serves the bytes publicly (logos and covers are public on the academy
  site anyway) with `Cache-Control: public, max-age=31536000, immutable`, since a new upload gets
  a new id.
- `GET /api/tenant` adds `logoUrl` and `coverUrl` (null when unset), as the main spec already
  says.
- Admin endpoints (academy admin role, Origin check like every unsafe method):
  - `GET /api/academy/branding`
  - `PUT /api/academy/branding` with `{primaryColor, welcomeTextEn, welcomeTextAr}`
  - `PUT /api/academy/branding/logo` and `PUT /api/academy/branding/cover` taking the image
    body; `DELETE` on each removes it.
  - Exact paths and body encoding are the builder's call, matching the existing API style.

## Copy (EN / AR)

| Key | English | Arabic |
|---|---|---|
| settings card title | Branding | الهوية |
| settings card body | Logo, cover photo, colour and welcome line. | الشعار وصورة الغلاف واللون ورسالة الترحيب. |
| logo | Logo | الشعار |
| cover | Cover photo | صورة الغلاف |
| colour | Colour | اللون |
| colour hint | From your logo. Tap another to change. | من شعارك. اضغط على لون آخر لتغييره. |
| welcome en | Welcome line (English) | رسالة الترحيب (بالإنجليزية) |
| welcome ar | Welcome line (Arabic) | رسالة الترحيب (بالعربية) |
| image invalid | This photo couldn't be used. Try a JPEG or PNG. | تعذّر استخدام هذه الصورة. جرّب صورة JPEG أو PNG. |
| image too large | This photo is too large. | هذه الصورة كبيرة جدًا. |

Upload/Change/Remove buttons follow the same pattern. The builder writes the rest in the same
plain tone.

## Constraints

- Mobile-first, RTL-correct (logical CSS only), dark mode, sijjel design system components.
- Tenant isolation: an academy's admin can only change its own branding; file ids from another
  academy can't be attached.
- The first HTML still carries the academy accent (no colour flash); the logo `<img>` in the
  app bar is in the SSR output.
- No test data in the dev database.

## Left to the builder

- Exact API shapes, the `files` migration, and how the web proxy passes image bodies.
- How the swatches are ranked beyond `Score.score`'s order, and deduplicating near-identical
  colours.
- Loading states while an image uploads.
