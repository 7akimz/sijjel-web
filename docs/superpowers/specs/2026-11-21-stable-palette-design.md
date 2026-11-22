# Stable palette: olive grounds and a hunter green default

Approved screenshots (2026-11-21), saved next to this file in `2026-11-21-stable-palette/`. They show the real rider and staff pages in four columns: today with no logo, Stable with no logo, today with a navy logo, Stable with a navy logo. The "Stable" columns are the target.

## Why

The user finds the brown-and-sand palette looks fake. Two reasons hold up:
- A cream ground with a brown accent is the most common look of generated sites right now.
- Every neutral is tinted the same brown (the "white" cards, the "black" text, the borders), so the app looks like a sepia filter, not like real materials.

The user wanted a palette taken from a real, published source rather than invented, and specific to riding.

## Goals

- Neutrals and status colours come from a published palette, with exact values.
- The app feels like a yard: grey-green grounds and hunter green, not brown.
- Academy logo colours keep working exactly as they do now.

## Non-goals

- How the academy colour is chosen or turned into tokens (`accentVars`, `suggestColours`) stays as it is.
- Fonts, layout and components stay.
- Token names stay (`brass`, `paddock`, `stone` and so on), so no component changes.

## Anti-goals

- Any neutral tinted brown or orange.
- Text or buttons below the contrast the design system promises.

## Approaches considered

- **Radix Colors** (`@radix-ui/colors` 3.0.0): 12-step scales with matching dark scales, built for UI contrast. **Chosen.**
- IBM Carbon: very neutral, but reads as enterprise software.
- Tailwind's default colours: so widely used it risks looking generic again.

Within Radix, the user compared Sage, Olive and Gray with near-black buttons, then a riding-specific "Stable" version, and picked Stable. A leather-brown "pending" colour (Radix bronze) was mocked and dropped: it read as "suspended" and brought the brown back.

## The palette

Exact values from `@radix-ui/colors` 3.0.0. `olive N` means step N of the olive scale; `oliveDark N` means step N of the dark scale.

| Token | Day | Night |
|---|---|---|
| `ground` | olive 2 `#f8faf8` | oliveDark 2 `#181917` |
| `surface` | `#ffffff` | oliveDark 3 `#212220` |
| `surface-sunk` | olive 3 `#eff1ef` | oliveDark 1 `#111210` |
| `line` | olive 6 `#d7dad7` | oliveDark 6 `#383a36` |
| `line-strong` | olive 9 `#898e87` | oliveDark 9 `#687066` |
| `ink` | olive 12 `#1d211c` | oliveDark 12 `#eceeec` |
| `ink-muted` | olive 11 `#60655f` | oliveDark 11 `#afb5ad` |
| `brass` / `brass-soft` (pending) | amber 12 `#4f3422` / amber 3 `#fff7c2` | amberDark 11 `#ffca16` / amberDark 3 `#302008` |
| `paddock` / `paddock-soft` (active) | grass 11 `#2a7e3b` / grass 3 `#e9f6e9` | grassDark 11 `#71d083` / grassDark 3 `#1b2a1e` |
| `danger` / `danger-soft` | red 11 `#ce2c31` / red 3 `#feebec` | redDark 11 `#ff9592` / redDark 3 `#3b1219` |
| `on-danger` | `#ffffff` | redDark 1 `#191111` |
| `stone` / `stone-soft` (suspended) | olive 11 `#60655f` / olive 4 `#e7e9e7` | oliveDark 11 `#afb5ad` / oliveDark 4 `#282a27` |

Two values differ from the mock-ups, after the contrast check (WCAG, measured):
- **Day `brass` is amber 12, not 11.** Amber 11 gives 4.25:1 on its soft background and 4.40:1 on the ground, under the 4.5:1 that small text needs. Amber 12 gives 10.5:1; Radix documents step 12 as its high-contrast text step. The yellow background still carries "pending".
- **Night `line-strong` is oliveDark 9, not 8.** Step 8 gives 2.55:1 for field borders, under the 3:1 that controls need. Step 9 gives 3.12:1.

The values go in both places that hold them: `tokens.css` and the device-dark block in `base.css`.

**Builder's call:** the veils and shadows (`--hover-veil`, `--scrim`, `--shadow-raised`) switch from brown rgba to the same rgba built on olive 12 `#1d211c`, with the same opacities.

## Hunter green: the default colour

Hunter green `#355E3B`, the traditional hunting green, replaces brown `#7A5230` wherever the app needs a colour and has no academy logo colour:

- **Platform pages and the main address:** the four accent tokens in `tokens.css` and `base.css` are what `accentVars('#355E3B')` gives (Day `#35693e` / `#ffffff` / `#b7f1ba` / `#002109`; Night `#9bd4a0` / `#003914` / `#1c5129` / `#b7f1ba`). That keeps the default on the same path as any academy colour.
- **Academies without a logo colour (API):**
  - `defaultPrimaryColor` in `internal/app/branding.go`;
  - the `COALESCE(…, '#7A5230')` in `internal/store/queries/sign_in_links.sql`;
  - a new migration that changes the column default.
- **Builder's call:** the same migration moves academies still on exactly `#7A5230` to `#355E3B`. Nobody can tell a deliberate brown from the untouched default, and no real academy is live yet.
- **The branding swatches:** the last fallback swatch, `SIJJEL_BROWN` in `src/lib/theme/logo-colours.ts`, becomes hunter green (renamed to fit).
- **The install manifest:** `DEFAULT_ACCENT` and `GROUND` in `src/lib/forms/manifest.ts`.
- **The app icon:** `src/lib/assets/favicon.svg` gets a hunter green background, keeping the cream horseshoe and brass nails. The three PNGs in `static/icons/` are rendered again from it.

## Also updated

- `CLAUDE.md`, under Design: the "stable layer" line (sand grounds, leather ink) and the Night line ("warm tack-room browns") describe the new palette.
- The published sijjel design system artifact, so it doesn't contradict the app.
- Tests that pin `#7A5230` as the default (web and API) move to `#355E3B`. Tests that use `#7A5230` only as an example brand colour can stay.

## Known and accepted

- With no logo colour, the booked card's soft colour in Day is a fairly bright mint (`#b7f1ba`), close to the green "Paid" chip. It comes from the same logo-colour code as any academy colour. To look at again in the preview.
- Settled on 2026-11-22: `accent-soft` and `on-accent-soft` now come from Material's muted secondary palette (Day `#d4e8d1` / `#0f1f11`, Night `#3a4b3a` / `#d4e8d1` for hunter green), for every academy colour.

## Delivery

Two branches, `feat/stable-palette` in sijjel-web and sijjel-api, previewed together on :3001 before merging.
