# sijjel-web

## Designing UI

The design system is the source of truth: https://claude.ai/artifact/HysWBDjQnrq5zDEoY1cZqj (read `project/README.md` and the component READMEs). In this repo it lives in `src/lib/styles/{tokens,base,components}.css` and `src/lib/ui/`.

### Design the page and the app, not the element

- A change is judged by how it fits the whole page and the rest of the app, not by how one element looks on its own.
- Before changing a screen, open the sibling pages and copy how they already do the same thing: page width, title row, section headings, lists, actions, empty states. Reuse the existing `sj-` classes and `#lib/ui` components before writing page-local CSS.
- A pattern the app doesn't have yet needs a reason, and the user sees a visual preview of it before any code.

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
