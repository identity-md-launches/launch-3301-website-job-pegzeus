# DESIGN.md: Pegzeus ($PEGZEUS) landing page

Source of truth: `src/styles.css` (all tokens and components), `index.html` (markup),
`src/main.ts` (contract-address behaviour). Values below are copied from that source.

## Overview

A one-page tribute site for the IMD community. The brand is loud and simple: brand green
#00BF62, black ink and white, with the @pegzeus mark (white bolt outline with a Pegasus head)
as the only picture. Sections alternate solid colour bands ("tones"): green hero, black
About, cream Thesis, white Tokenomics, black How to buy, black footer. Each band sets its own
semantic colour tokens, so components look right on any band without variants.

The hierarchy is one big headline per screen, a plain explanatory line under each heading,
and a single filled action per view. Lightning appears only once, as the jagged edge between
the hero and the About band (`.bolt-edge`). It also appears as the bolt icon in the
explorer warning. The Thesis band has its own secondary style (cream paper, black ink, serif
titles, mono function names) and nothing else uses it.

## Colors

Primitives (`:root`, `src/styles.css`). Components never use them directly:

| Token | Value | Use |
| --- | --- | --- |
| `--green-500` | `#00bf62` | Brand green: hero/header band, accent fills, links and icons on black |
| `--green-400` | `#2dd47f` | Hover for green fills only |
| `--ink-950` | `#0a0a0a` | Black: dark bands, text on green/white, primary button |
| `--ink-900` | `#151515` | Raised surface on black (callouts, mark figure) |
| `--ink-800` | `#2a2a2a` | Rules on black, primary button hover |
| `--ink-600` | `#525252` | Muted text on white |
| `--ink-400` | `#a3a3a3` | Muted text on black |
| `--white` | `#ffffff` | Text on black, light band background, execute bricks |
| `--paper-100` | `#f3f3f1` | Tile surface on white |
| `--cream-50` | `#fbf8f1` | Era card surface (thesis) |
| `--cream-100` | `#f5f1e8` | Thesis band background (from the brief) |
| `--cream-ink` | `#161410` | Thesis text, borders, transfer bricks |
| `--cream-ink-600` | `#5b554a` | Thesis muted text, "still being built" bricks |

Semantic roles are set by tone classes. Put a tone class on a band; children read only these:

| Role | `.tone-green` | `.tone-dark` | `.tone-light` | `.tone-cream` |
| --- | --- | --- | --- | --- |
| `--color-bg` | green-500 | ink-950 | white | cream-100 |
| `--color-text` | ink-950 | white | ink-950 | cream-ink |
| `--color-text-muted` | ink-950 | ink-400 | ink-600 | cream-ink-600 |
| `--color-surface` | ink-950 | ink-900 | paper-100 | cream-50 |
| `--color-rule` | ink-950 | ink-800 | paper-100 | cream-ink |
| `--color-link` | ink-950 | green-500 | ink-950 | cream-ink |
| `--color-accent` | (unset) | green-500 | (unset) | (unset) |
| `--color-focus` | ink-950 | white | ink-950 | cream-ink |

Rules: white text never sits on green (it fails contrast); text on green is always ink.
Green is used as *text* only on black. All rendered text pairs passed the taste@1 contrast
check (4.5:1, 3:1 large) at 320/390/1440. See `artifacts/validation.md`. There is no dark/light
theme switch; the bands are fixed.

## Typography

Fonts are vendored latin subsets in `src/assets/fonts/` (SIL OFL), declared with `@font-face`
at the top of `src/styles.css`, `font-display: swap`:

| Family token | Face | Weights loaded | Role |
| --- | --- | --- | --- |
| `--font-sans` | Space Grotesk (variable 300–700) | 400, 500, 700 used | Everything by default |
| `--font-serif` | Instrument Serif | 400 | Thesis only: title, era years, era quotes |
| `--font-mono` | JetBrains Mono | 400 | Code and data: `transfer()` etc., bricks, CA value, `{{PLACEHOLDER}}` tokens |

Scale (five sizes, `:root`):

| Token | Value | Rendered 390 / 1440 | Use |
| --- | --- | --- | --- |
| `--fs-1` | `0.875rem` | 14 / 14 | Labels, captions, bricks, notes, small buttons |
| `--fs-2` | `1.0625rem` | 17 / 17 | Body (set on `body`), buttons |
| `--fs-3` | `1.25rem` | 20 / 20 | Lead, section intros, h3, CA value in tiles |
| `--fs-4` | `clamp(1.75rem, 1.3rem + 1.8vw, 2.5rem)` | 28 / 40 | h2, thesis era titles |
| `--fs-5` | `clamp(2.375rem, 1.6rem + 3.6vw, 4.5rem)` | 39.5 / 72 | h1 only |

Weights: `--fw-regular` 400 (body, serif, mono), `--fw-medium` 500 (links, labels, nav),
`--fw-bold` 700 (headings, buttons). Line heights: headings 1.1 (h1 1.02), body 1.55, lead
1.45, intros 1.5, era quotes 1.35. Letter-spacing: h1 `-0.035em`, h2 `-0.02em`, otherwise
natural. No uppercase transforms or tracked caps anywhere. Headings use `text-wrap: balance`;
paragraphs use `text-wrap: pretty`. Intros cap at `40rem`, section heads at `44rem` (thesis
head `56rem` so the formula fits one line on desktop). `code` inherits size (`font-size: 1em`)
so mono never adds a size step.

## Layout

- Container: `.wrap`, max content width `--content-max: 72rem` plus `--gutter`
  (`clamp(1rem, 0.5rem + 2.5vw, 2rem)`) on each side.
- Bands: `.section` padding-block `--section-pad: clamp(4rem, 3rem + 5vw, 7rem)`. Hero top
  padding `clamp(1rem, 0.5rem + 3vw, 3.5rem)`.
- Space steps: `--space-1` 0.5rem, `-2` 0.75rem, `-3` 1rem, `-4` 1.5rem, `-5` 2rem, `-6` 3rem.
  Intra-group gaps use 1–3, between groups 4–6.
- Breakpoints (content-driven, `min-width`):
  - `34rem`: fact rows become label/value columns; token grid 2 columns.
  - `56rem`: header nav appears; hero becomes two columns (copy 1.25fr / logo 0.75fr) and
    the small logo above the h1 is replaced by the large logo; About, How to buy and footer
    become multi-column grids.
  - `64rem`: thesis eras become three columns; token grid 4 columns, Contract tile full width.
- Mobile (390): single column; the hero shows the logo, h1, lead, Buy on IMD, Follow
  @pegzeus, CA: TBA and Copy CA inside the first 844px screen. Header keeps the brand at left
  and the X link at right; section links are hidden (the page is one scroll).
- Overflow: `body { overflow-x: clip }` is a guard only; nothing overflows at 320/390/1440
  (tested). Long values (`.is-address`, `.token-value`, `.inline-link`) use
  `overflow-wrap: anywhere` and are never truncated.
- Logical properties (`margin-block`, `padding-inline`, `inset-inline`) are used throughout.

## Elevation & Depth

Flat. No drop shadows. Depth comes from tone changes and surfaces (`--color-surface`).
`box-shadow` is used only as a solid ring around round logos (`0 0 0 2px|3px|4px ink`),
never with a border on the same element. Borders mark structure: era cards (2px ink),
explorer warning callout (2px accent), fact rows and step rows (1px rule).

## Shapes

- `--radius-sm` 0.25rem: bricks, CA label chip, skip link.
- `--radius-md` 1rem: callouts, era cards, token tiles.
- `--radius-lg` 1.5rem: mark figure.
- `--radius-pill` 999px: buttons, header X link, thesis tags.
- Circles: all logo instances (`border-radius: 50%`) to read as the X profile picture.
- Dashed borders mean "not live yet": disabled Copy CA, "still being built" bricks,
  "trust-minimized for now" tag.

## Components

All are CSS patterns in `src/styles.css` used from `index.html`; there is no component library.

- **Button `.btn`**: pill, min-height 3rem, `--fs-2` bold, transitions only
  `background-color, color, scale` (150ms, `--ease-out`), `scale: 0.96` on press when motion is
  allowed. Variants: `.btn-primary` (ink fill, white text; for green bands),
  `.btn-secondary` (2px ink outline; hover inverts), `.btn-accent` (green fill, ink text;
  for black bands), `.btn-small` (min-height 2.75rem, `--fs-1`). Hover is gated by
  `@media (hover: hover)`. One filled action per view.
- **Copy CA `#copy-ca`** (`.btn-small`): native `disabled` while no address is set
  (dashed outline), described by `#copy-ca-hint`. When enabled it copies with
  `navigator.clipboard`, sets `data-state="copied"|"error"` for 2s and writes to the
  `role="status"` region `#copy-ca-status`. Logic in `src/main.ts`.
- **CA slot `[data-ca]`**: any element with this attribute is filled by `src/main.ts`
  with "TBA" or the configured address (and gets `.is-address`). `.ca-label` is the hero chip
  (ink background, green mono value); `.ca-inline` keeps "CA: TBA" on one line in prose.
- **Header `.site-header`**: brand link (40px round logo + name) at the leading edge,
  `.site-nav` (≥56rem) and `.header-x` pill at the trailing edge. Not sticky.
- **Callout `.callout` / `.callout-warn`**: icon + h4 + text on `--color-surface`; warn
  adds a 2px accent border and the bolt icon. Uses `role="note"`.
- **Facts list `.facts`**: `<dl>` rows separated by rules.
- **Era card `.era`** (thesis): serif title (`.era-year` + chain), serif quote, `.stack`
  (`role="group"` with an `aria-label` naming the function stack) of `.layer` rows
  (`.layer-fn` mono label + `.bricks`), then `.era-tags`. `margin-block-start: auto` on the
  stack keeps every transfer brick on a shared baseline across the three cards.
- **Brick `.brick`**: mono `--fs-1`, 2px border, studs drawn by `::before`
  (repeating gradient using `--stud`). Variants `.brick-transfer` (ink fill, full row),
  `.brick-exec` (white fill), `.brick-future` (dashed, muted). `.brick-note` labels a row.
- **Tag `.tag` / `.tag-quiet`**: pill labels under a stack (solid / dashed).
- **Token tile `.token-tile`**: label, mono value, note; `.token-tile-wide` is the
  full-width green Contract tile.
- **Steps `.steps`**: ordered list with CSS counters in accent green.
- **Skip link `.skip-link`**: first focusable element, revealed on focus, targets `#main`.
- **Focus**: `:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px }`.
  The tone sets the colour (ink on green/white/cream, white on black).

## Do's and Don'ts

- Do start a new section as `<section class="section tone-…"><div class="wrap">` with a
  `.section-head` (h2 + one `.section-intro` sentence). Pick the tone for contrast with
  neighbours; never put white text on green.
- Do use only `--fs-1`…`--fs-5`; do not add sizes. `--fs-5` is reserved for the single h1.
- Do keep one filled button per view: `.btn-primary` on green, `.btn-accent` on black.
- Do render any contract address only through `[data-ca]` + `src/config.ts`; never hard-code
  one in markup.
- Do use mono only for code/data (function names, placeholders, addresses).
- Don't add kicker labels above headings, uppercase text, emoji or em dashes.
- Don't reuse the cream/serif thesis style outside the thesis.
- Don't add more lightning devices; the hero edge and the warning icon are the only ones.
- Don't add wallet connection, forms, or numbers that are not supplied by the requester.

Recipe for one more section: copy the Tokenomics block in `index.html`, change the tone
class, keep `.section-head`, and build content from `.callout`, `.facts`, `.token-tile` or
`.steps`. Run `npm run build` and `npm run test:e2e`, then commit `dist/`.
