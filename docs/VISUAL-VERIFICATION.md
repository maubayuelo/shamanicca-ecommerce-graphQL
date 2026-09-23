# Visual verification

Traditional gates cannot see. `tsc`, ESLint and Vitest will all stay green while
the header collapses on mobile. During the SCSS → Tailwind migration, this
procedure is the only real gate on the thing actually being changed.

`AGENTS.md` requires visual confirmation for any change that alters what the
user sees. This file is that procedure.

It is manual on purpose. Automating it before we know what we are comparing
would be automating the wrong thing.

---

## Decisions

**D1 — Reference.** Two tiers.

- *Fast loop*, while working: local dev server.
- *Formal gate*, before merging any phase: Vercel preview vs Vercel production.

The fast tier never substitutes for the formal one. A phase is not verified
until it has passed the formal gate.

**D3 — Viewports.** 375 · 768 · 1440.

**D4 — Location.** `visual/`, git-ignored. This document is committed; the
images are not. Binary artifacts in git history are permanent and never get
cleaned up.

```
visual/
├── baseline/          Full sweep of the site before the migration. Captured once.
└── <phase>/
    ├── before/        Only the surface this phase touches.
    └── after/
```

Filenames are flat inside each folder — no subdirectories. The name carries
route, viewport and state:

```
<route>__<viewport>[__<state>].png
```

Examples: `home__375.png` · `home__375__menu-open.png` ·
`cart__1440__filled.png`

`__` (double underscore) separates fields. Multi-word route names use a hyphen:
`blog-post`, `shop-category`.

**D5 — Pass criterion.** Any pixel difference is a regression until its cause
can be named.

- A named, intended difference is logged as an accepted diff in the phase notes.
- An unexplained difference blocks the phase.

"Looks fine" is not the standard. "I can explain every difference" is.

**D2b — Scope per round.** During a phase, capture only the surface that phase
touches. Run the full sweep once, as the merge gate for that phase.

A full sweep is ~39 captures per side. Doing that after every stylesheet edit is
expensive enough that it would get skipped — and a procedure that gets skipped
is worse than no procedure, because it creates false confidence.

---

## Pinned URLs

Dynamic routes must resolve to the **same content every round**. Change the
product or the post and every difference observed afterwards is meaningless.
These are fixed for the duration of the migration.

| Slug | URL |
|---|---|
| `home` | `/` |
| `shop` | `/shop` |
| `shop-category` | `/shop/posters` |
| `product` | `/products/merkaba-rider-womens-t-shirt` |
| `blog` | `/blog` |
| `blog-category` | `/blog/category/ancient-traditions` |
| `blog-post` | `blog/the-wheel-of-the-year-a-complete-guide-to-wiccan-sabbats` |
| `search-shop` | `/search?q=tshirt&scope=shop` |
| `search-blog` | `/search?q=wicca&scope=blog` |
| `cart` | `/cart` |
| `wishlist` | `/wishlist` |
| `about` | `/about` |
| `contact` | `/contact` |
| `404` | `/this-page-does-not-exist` |

`product` should be one with several gallery images and a long description — it
exercises more CSS than a sparse one.

---

## Capture list

### Routes (13 × 3 viewports)

```
home__<vp>            shop__<vp>            shop-category__<vp>
product__<vp>         blog__<vp>            blog-category__<vp>
blog-post__<vp>       search-shop__<vp>     search-blog__<vp>
cart__<vp>            wishlist__<vp>        about__<vp>
contact__<vp>         404__<vp>
```

### States

States only exist after an interaction. A route can pass while its overlay is
wrecked — and overlays, fixed positioning and transforms are exactly where a
SCSS → Tailwind migration breaks.

```
home__375__menu-open              home__768__menu-open
home__375__menu-search-open       home__1440__menu-search-open
cart__375__filled                 cart__1440__filled
cart__375__empty                  cart__1440__empty
product__375__gallery-open        product__1440__gallery-open
shop__375__filter-open            shop__1440__filter-open
```

The mobile menu is only captured below the desktop breakpoint. Cart and overlay
states are captured at the extremes only — 768 adds nothing 375 and 1440 do not
already show.

---

## Capture method — pinned per viewport

Rendering differs between capture methods. Mixing them across a BEFORE/AFTER
pair produces differences that have nothing to do with the code.

| Viewport | Method |
|---|---|
| 375 | Chrome DevTools device toolbar (Cmd+Shift+M), width 375 |
| 768 | **Real browser window resized to 768** via window-resizer extension |
| 1440 | Chrome DevTools device toolbar, width 1440 |

768 uses a different method because DevTools emulation at that width produced
white bands in stitched full-page captures. The workaround is legitimate; what
matters is that AFTER uses the same method as BEFORE.

Capture with Cmd+Shift+P → "Capture full size screenshot". Save as **PNG** —
JPEG compression artifacts shimmer under flicker comparison and read as changes.

---

## Determinism protocol

These pages are not deterministic. None of the following is caused by CSS, and
every one of them will show up as a diff if not controlled:

- WordPress content changing between captures
- Cookie consent banner present in one capture, dismissed in the other
- Cart and wishlist persisting in `localStorage`
- Lazy-loaded images not yet arrived when the capture fires
- Web fonts swapping mid-capture
- The product gallery's scroll carousel sitting at a different offset
- Animations mid-flight

Rules:

1. **Capture BEFORE and AFTER in the same session, minutes apart.** Time is the
   largest source of drift. Last week's screenshots are not a baseline.
2. Same browser profile, same window, 100% zoom.
3. Handle the consent banner identically both times — dismissed, or visible, but
   the same.
4. Same cart state. Empty for routes other than the cart captures.
5. **Scroll slowly to the bottom, wait 2–3 seconds, scroll back to the top, then
   capture.** Scrolling is what triggers lazy loading; Cmd+↓ is too fast.
6. **Open each capture immediately after taking it.** Verifying at capture time
   costs seconds. Discovering a corrupt baseline three phases in costs the whole
   comparison.

Known limitation: Chrome clips full-page captures past roughly 16,000px. Long
pages at 375 hit this first. If a capture is truncated at the bottom rather than
banded in the middle, capture it at 50% zoom and note it here so AFTER matches.

---

## Comparing

Do **not** view the two images side by side.

Open BEFORE and AFTER in macOS Preview as two tabs and flip between them with
the arrow keys. Flicker comparison: when images alternate in the same screen
position, the eye catches a 4px shift instantly. Side by side, it misses it
entirely.

---

## Workflow per phase

```bash
PHASE=phase-1-header
mkdir -p "visual/$PHASE"/{before,after}
```

1. Write this phase's route + state list — only the surface being touched.
2. **BEFORE**: on `main`, capture that list at all three viewports.
3. Do the work.
4. **AFTER**: same browser, same session, same list, same order.
5. Compare by flicker.
6. Log every accepted diff in the phase notes, with its cause.
7. **Merge gate**: full sweep, Vercel production vs Vercel preview.
8. An unexplained difference blocks the phase. It does not get merged and
   revisited.

---

## Later

Once several phases have run manually and the failure modes are understood,
Playwright's `toHaveScreenshot()` automates the capture and the diff. Not before
— automating a comparison whose ground rules are still being discovered would
encode the wrong rules and hide the interesting failures behind a green check.

---

## Automated capture

`scripts/capture.mjs` automates the *capture* step above — navigating to each
pinned route at each viewport, suppressing the cookie banner and newsletter
modal, waiting out fonts and lazy images, and writing a full-page PNG. It does
not compare images; comparison is still the manual flicker method above.
Interaction-state captures (menus, overlays, hover, filters) are not covered —
they will be added to the script as phases need them.

The route and viewport list lives in `visual/routes.json`, generated from the
pinned URL table above.

```bash
node scripts/capture.mjs <outputDir> [--base http://localhost:3000]
# or
npm run capture -- <outputDir> [--base http://localhost:3000]
```

### BEFORE (reference commit, port 3001)

Capture from a separate git worktree so the working copy is untouched:

```bash
git worktree add ../shamanicca-before <reference-commit-or-branch>
cd ../shamanicca-before
npm install
npm run dev -- --port 3001
# in another terminal, from the main working copy:
node scripts/capture.mjs visual/<phase>/before --base http://localhost:3001
```

Remove the worktree when done: `git worktree remove ../shamanicca-before`.

### AFTER (working copy, port 3000)

```bash
npm run dev
node scripts/capture.mjs visual/<phase>/after --base http://localhost:3000
```

Run BEFORE and AFTER in the same session per the determinism protocol above.