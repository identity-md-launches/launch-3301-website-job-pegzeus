# Pegzeus ($PEGZEUS) landing page

A single static marketing page for Pegzeus ($PEGZEUS), a community tribute token for
[@pegzeus](https://x.com/pegzeus) in the IMD ecosystem. Tagline: "The thunderbolt carrier of Olympus."

- English only, one page, hash links between sections (no routing, no server).
- No wallet connection, no signing, no forms, no market data.
- The official contract address has not been supplied, so the page shows **CA: TBA** and
  the Copy CA button is disabled. No contract address appears anywhere in the source or export.
- Tokenomics are shown only as labelled placeholders (`{{SUPPLY}}`, `{{LIQUIDITY}}`,
  `{{AGENTS}}`, `{{REQUESTER}}`), marked "not live data".

The finished, self-contained static export is committed in `dist/`. It needs no build step
to host: serve or pin the `dist/` folder as is. All asset URLs are relative (`./assets/...`),
so it works from an IPFS gateway subpath, an ENS name or any static host.

## Layout

```
index.html              page markup (Vite entry)
src/main.ts             contract-address slot + Copy CA behaviour (only script on the page)
src/config.ts           OFFICIAL_CA setting (empty = "CA: TBA")
src/styles.css          all styles: tokens, components, sections
src/assets/             logo (original on green + white cutout), vendored fonts + licences
public/                 favicon.png, apple-touch-icon.png, og-image.png (copied verbatim)
dist/                   committed production export
tests/e2e.mjs           Playwright interaction + layout checks against dist/
DESIGN.md               design system of the implemented page
artifacts/validation.md build, test and design-review record
```

Stack: Vite 6 + TypeScript 5 (vanilla, no framework). Fonts are vendored latin subsets of
Space Grotesk, Instrument Serif and JetBrains Mono (SIL OFL, licences in `src/assets/fonts/`).

## Install, preview, rebuild

Requires Node 20+ (built with Node 24.21.0, npm 11.19.0).

```sh
npm ci                 # install from package-lock.json
npm run dev            # local dev server with hot reload
npm run build          # tsc --noEmit (typecheck) then vite build -> dist/
npm run preview        # serve the built dist/ locally
npm run typecheck      # typecheck only
```

Commit `dist/` after every rebuild: the publisher serves the committed export and does not rebuild.

### Interaction checks

```sh
npx playwright install chromium   # once, downloads the browser to your user cache
npm run test:e2e                  # runs tests/e2e.mjs against dist/
```

`tests/e2e.mjs` serves `dist/` under a `/preview/` subpath (to catch broken relative URLs),
blocks every external request, and checks: no horizontal overflow at 320/390/1440, the main
action and CA row on the first 390x844 screen, share metadata, favicon and og:image resolve,
"CA: TBA", Copy CA disabled, all X and Buy on IMD links, the exact footer disclaimer,
placeholder tokenomics, no form controls, the thesis built from HTML (no bitmap), keyboard
skip link and Tab order, the focus ring, the section nav, and no console errors. Screenshots
go to `test/scratch/shots/`. Run with a third argument `ca` against a build that has an
address set to check the Copy CA path (see below).

## Adding the official contract address (later)

Only when the requester supplies the official address:

1. Set `OFFICIAL_CA` in `src/config.ts` to the address (`0x` + 40 hex characters), or build
   with `VITE_PEGZEUS_CA=0x... npm run build`.
2. `npm run build`, check the hero shows the address and Copy CA copies it, then commit `dist/`.

Every `[data-ca]` slot (hero, About, Tokenomics, How to buy, footer) then shows the address,
and Copy CA becomes active. A value that is not a valid address is ignored and the page keeps
showing "CA: TBA". Never paste an address found on an explorer or launch site.

## Validation results (this build)

Run on 2026-11-19 against the final source. Full record: `artifacts/validation.md`.

| Check | Command | Result |
| --- | --- | --- |
| Typecheck + production build | `npm run build` | passed, `tsc --noEmit` clean, vite built `dist/` (~200 KB) |
| Interaction/layout tests | `node tests/e2e.mjs dist test/scratch/shots` | 34/34 passed |
| Copy CA path (scratch build, synthetic test address, not committed) | `VITE_PEGZEUS_CA=0x… vite build --outDir test/scratch/dist-ca` then `node tests/e2e.mjs test/scratch/dist-ca test/scratch/shots ca` | 7/7 passed |
| Design probe taste@1 | `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` | 16/16 passed |

Limitations: checks ran in headless Chromium 159 only (no WebKit/Safari, no physical
device, no screen reader, no native 200% zoom). This machine lacked Chromium's system
libraries, so they were extracted from Ubuntu packages into `/tmp` and loaded with
`LD_LIBRARY_PATH`, outside the repository. External links (x.com, imd.fun) were not loaded
during tests; only their `href` values were checked.

## Content rules kept

- No invented price, market cap, holders, supply or allocation. No fee or pool details.
- No claim that @pegzeus deployed, requested or issued the token. The page frames it as a
  community tribute and says it is not issued or endorsed by him.
- Warning not to use PEGZEUS contracts found on explorers; name disclaimer (no peg,
  collateral or redemption).
- Logo: @pegzeus's public X profile picture (white bolt outline with a Pegasus head on
  #00BF62). The original is used on green; a transparent white cutout on dark backgrounds.
