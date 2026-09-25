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

**D3 — Viewports.** 375 · 768 · 1440 by default. `product` and `product-sale`
additionally capture at 620 (midpoint of the Phase 6a 601–639 shifted band),
1024 (the `lg` breakpoint boundary used throughout `product.scss`) and 1366
(a common laptop width otherwise unsampled between 1024 and 1440). A route
opts into a non-default viewport list via a `"viewports"` array of names on
its entry in `visual/routes.json`; routes without one get the default three.

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

A full sweep is 94 captures per side (Phase 7.0; it was ~39 originally). Doing that after every stylesheet edit is
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
| `product-oos` | `/products/merkaba-rider-womens-t-shirt-oos` (recorded alias — see "Hermetic captures"; 375 and 1440 only) |
| `product-sale` | `/products/philosophers-stone-unlimited-being-womens-t-shirt` |
| `blog` | `/blog` |
| `blog-category` | `/blog/category/ancient-traditions` |
| `blog-post` | `blog/the-wheel-of-the-year-a-complete-guide-to-wiccan-sabbats` |
| `blog-all` | `/blog/all` (page 1; paginator, anchor variant) |
| `blog-all-p2` | `/blog/all?page=2` (375 and 1440 only) |
| `blog-post-video` | `/blog/be-resilient-positive-subliminal-affirmations` (a post with an embedded video; 375 and 1440 only) |
| `search-shop` | `/search?q=tshirt&scope=shop` |
| `search-blog` | `/search?q=wicca&scope=blog` |
| `cart` | `/cart` |
| `wishlist` | `/wishlist` |
| `about` | `/about` |
| `contact` | `/contact` |
| `404` | `/this-page-does-not-exist` |

`product` should be one with several gallery images and a long description — it
exercises more CSS than a sparse one.

`product-sale` is pinned to a product confirmed (by querying the live
endpoint directly, not assumed) to be on sale — `regularPrice ($49.50) >
price ($39.50)`, which is what `products/[slug].tsx` computes `isOnSale`
from — with all four size variations in stock, so it exercises the sale
price line, the savings badge and the gallery SALE badge (rendered on every
slide) without also being the out-of-stock fixture. It captures the base
three viewports plus the same 620/1024/1366 extras as `product`, but no
interaction states — those are scoped to `product` only (see States below).

---

## Capture list

### Routes

13 routes × 3 default viewports, plus `product` and `product-sale` at 3
additional viewports each (620, 1024, 1366), plus `product-oos` at 375 and 1440
(full-page base capture of the recorded out-of-stock alias, no separate state).
Phase 7.0 added `blog`, `blog-category`, `blog-post` and `blog-all` at 620 and
1366 (the 601–639 and 1280–1439 bands), `blog-all` (page 1), and `blog-all-p2`
and `blog-post-video` at 375 and 1440 — 86 route captures in total, plus 8
states in Phase 7.0 on top of the earlier ones (94 per side):

```
home__<vp>            shop__<vp>            shop-category__<vp>
product__<vp>         product-oos__<vp>     product-sale__<vp>
blog__<vp>            blog-category__<vp>   blog-post__<vp>
blog-all__<vp>        blog-all-p2__<vp>     blog-post-video__<vp>
search-shop__<vp>     search-blog__<vp>     cart__<vp>
wishlist__<vp>        about__<vp>           contact__<vp>
404__<vp>
```

**Full-page captures never paint an out-of-process iframe.** A cross-origin
`<iframe>` (the blog post's video) comes out as a blank rectangle in a
`fullPage` screenshot — always, deterministically — but is painted in a
viewport screenshot. `capture.mjs` answers every request to an embed host
(youtube.com, youtube-nocookie.com, vimeo.com) with one blank document, so the
embed's content can never vary; in `blog-post-video__<vp>` you see the slot
(the `.post-video` box: aspect ratio, spacing, the caption below it), not a
video.

### States

States only exist after an interaction. A route can pass while its overlay is
wrecked — and overlays, fixed positioning and transforms are exactly where a
SCSS → Tailwind migration breaks. Interaction states are captured as
**viewport** screenshots (not full-page) after scrolling the relevant element
into view, because fixed-position elements (the gallery modal, the sticky
bar) render wrong in a stitched full-page capture.

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

#### Product states (Phase 6.0)

All on the `product` route only (`visual/routes.json`'s `states` array),
fresh browser context per state (no shared storage), driven by
`scripts/capture.mjs`'s `STATE_HANDLERS`:

| State | Viewports | Selector(s) | Wait condition |
|---|---|---|---|
| `thumb-2` | 375, 768, 1440 | `.gallery__thumbs .thumb:nth-child(2)` | `.gallery__track.scrollLeft` stable for 3 consecutive rAF and within 1px of the target slide's `offsetLeft`; `window.scrollY` stable |
| `last-image` | 768, 1440 | last `.gallery__thumbs .thumb`, then `.nav--next` | same gallery-settle condition, then asserts `.nav--next` is disabled |
| `modal-image-2` | 375, 1440 | thumb 2, then that slide's `.image-button` | gallery-settle on slide 2, then `.gallery__modal .modal__image img` decoded and `.modal__thumbs .thumb:nth-child(2)` marked `is-active` |
| `modal-thumb-4` | 375, 1440 | open modal on image 1, then `.modal__thumbs .thumb:nth-child(4)` | modal image decoded and thumb 4 marked `is-active` — modal thumbnails only change the modal's own active state, they do not scroll the underlying gallery track |
| `sticky-bar-visible` | 375, 768, 1440 | scroll to `.product__desc`, then `.product-sticky-bar` | scroll settled, then every finite-iteration animation on `.product-sticky-bar` (the entrance) has resolved via `getAnimations().finished` |
| `size-error` | 375, 1440 | `.product__cta` clicked with no size selected | `#size-error` has non-empty text, `.product__options .field` has class `field--error`, `#size` has `aria-invalid="true"` |
| `wishlist-saved` | 375, 1440 | `.product__wishlist-btn` | polls click → `is-wishlisted` class (bounded retry, since `WishlistContext` hydration has no DOM signal without an app-code change), then the swapped heart icon is decoded |
| `wishlist-hover` | 1440 | `.product__wishlist-btn` (`.hover()`, no click) | `getAnimations().finished` on the button (150ms hover transition) |
| `size-focused` | 1440 | `#size` (`.focus()`) | `document.activeElement.id === 'size'` |

#### Blog, share-icon and paginator states (Phase 7.0)

Same rules as above (viewport screenshots, fresh context, `STATE_HANDLERS`,
mouse to 0,0 except for hover states). A hover state asserts
`element.matches(':hover')` before the shot, so it cannot pass unless the
browser really reports the hover.

| State (`route:state`) | Viewport | Action | Wait condition |
|---|---|---|---|
| `shop:paginator-hover` | 1440 | scroll `.paginator` 300px from the top, hover the first page button that is neither `.is-active` nor `.is-disabled` (page 2; the shop paginator is the `<button>` variant) | `:hover` asserted; `getAnimations()` settled on `.paginator` (120ms transition) |
| `blog-all:paginator-anchor-hover` | 1440 | same, on the anchor variant. Page 1 is current and its previous item is disabled, so **current and disabled are both in the shot** | asserts `.is-disabled`, `.is-active` and `.paginator__item a` exist; `:hover`; animations settled |
| `blog-post:share-hover` | 1440 | hover the "Share on X" link | `:hover`; animations settled (0.2s background transition) |
| `blog-post:share-focus` | 1440 | focus "Share on Facebook", `Shift+Tab`, `Tab` (a real keyboard focus, relative to the target, no hard-coded tab count), mouse to 0,0 | `document.activeElement` is that link and `:focus-visible` matches |
| `blog-post:url-copied` | 1440 | click "Copy link" | `li[aria-live]` is visible with the text "URL Copied". The component clears it with `setTimeout(…, 1200)`; a per-state **init script** (`STATE_INIT_SCRIPTS`) swallows exactly that delay, so the state persists until the shot. Clipboard permissions are granted to the origin |
| `blog:sidebar-banner-hover` | 1440 | scroll `.blog-sidebar__banner` 250px from the top, hover it | `:hover`; animations settled |
| `blog:content-banner-hover` | 1440 | same for the first `.blog-banner` | `:hover`; animations settled |
| `blog:main-article-hover` | 1440 | hover `.blog-main-article h1 a` | `:hover`; animations settled |

The `.is-affilliated` (sic) banner variant is **not** capturable: every
recorded banner is `bannerType: ["shamanicca"]`, and its query has no
variables, so there is no key to alias. Use `scripts/probe-affiliated.mjs`.

**Why `.focus()` and not a real Tab keypress** for `size-focused`: the
compiled CSS styles `#size:focus`, not `#size:focus-visible` — confirmed
against the compiled output during the Phase 6 READ. A programmatic focus
and a keyboard-driven focus render identically under `:focus`. Simulating a
real Tab sequence would mean hard-coding a tab-stop count through the header
nav and gallery controls, and the header nav's item count is WordPress
content, not fixed — that would make this state's setup nondeterministic,
which is exactly what this PR exists to eliminate elsewhere.

Excluded from this PR: touch swipe (the gallery's scroll listener is
attached to the viewport, not the track, so swipe-to-active sync is already
flagged as unreliable in the Phase 6 READ and shouldn't be baselined until
that's fixed), the native `<select>` popup (an OS-level surface, not part of
the page's render tree), and the filter drawer (`ProductFilterPanel` isn't
mounted on any route today).

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
modal, waiting out fonts and lazy images, and writing a full-page PNG. For
interaction states (`visual/routes.json`'s `states` array) it instead runs a
named handler that performs the action sequence and writes a **viewport**
screenshot. It does not compare images; comparison is still the manual
flicker method above, or the decoded-pixel compare used for a phase gate.

Every wait in the script is a condition — no in-flight /graphql or WP REST
requests, fonts ready, images decoded, scroll position settled for 3
consecutive frames, running finite animations/transitions finished (finished,
paused and infinite animations are skipped; infinite ones are frozen at
currentTime 0 right before the shot) — never a fixed sleep. A wait that times out throws, the capture
that was in progress is not written (no partial screenshots), and the whole
run exits non-zero naming the route, viewport and state that failed. See
"Determinism test" below for why this matters enough to test on its own.

The route, viewport and state list lives in `visual/routes.json`, generated
from the pinned URL table above. A route may override the default viewport
list with its own `"viewports"` array of names.

```bash
node scripts/capture.mjs <outputDir> [--base http://localhost:3000]
# or
npm run capture -- <outputDir> [--base http://localhost:3000]
```

`npm run flicker -- --before <dir> --after <dir>` writes an offline viewer.
It defaults to differing captures; pass `--all` to include identical files.
Use Space, D, and Z to pause/toggle, show the diff overlay, and change zoom.

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

---

## Hermetic captures: record once, replay everywhere

The live WordPress/WooCommerce backend is not deterministic enough to be a
capture fixture (search returned different result sets for the same query
seconds apart; the pinned product's stock changed). So captures run against
**recorded** responses, served by `scripts/graphql-replay.mjs`. One set,
`visual/fixtures/phase-6/{graphql,rest}/`, covers the whole phase; its
`README.md` records the date, the commit it was recorded from and every edit.
The fixtures are public storefront data (no secrets) and **are committed**.

The proxy serves GraphQL (`POST /graphql`) and REST (WP REST, the CMS routes,
the WooCommerce fallback) on one port. In replay mode it never contacts the
live backend: an unknown request returns HTTP 500, is logged loudly and is
listed at `GET /__misses`. `capture.mjs --replay <proxy-url>` checks that list
after every capture and fails the run on any miss, naming the route, viewport,
state and missed key. `consumer_key`, `consumer_secret` and any
token/auth-like parameter are stripped from stored keys and bodies, and
request headers are never stored — after recording, `grep -rE "ck_|cs_"
visual/fixtures` must return nothing.

### Every fetch env var must point at the proxy — at BUILD and at RUNTIME

`NEXT_PUBLIC_*` values are inlined into the client bundle by `next build`;
server-side code reads its env when the process starts. Set all of these for
both `npm run build` and `npm run start`:

```bash
export NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4001/graphql
export NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4001/graphql
export GRAPHQL_ENDPOINT=http://localhost:4001/graphql
export NEXT_PUBLIC_WP_BASE_URL=http://localhost:4001
export WORDPRESS_API_URL=http://localhost:4001/wp-json
export WC_STORE_URL=http://localhost:4001
export NEXT_PUBLIC_WC_STORE_URL=http://localhost:4001
```

Restarting the server does not change a page that was already prerendered
(ISR output lives in `.next`): switching the proxy from record to replay
requires a **fresh build** (`rm -rf .next`), not just a restart. Kill the old
server by port (`lsof -t -iTCP:<port> -sTCP:LISTEN`) — a leftover
`next-server` process will keep answering with its old pages.

### Recording fixtures (deliberate, its own commit)

```bash
# 1. proxy in record mode, app built and started with the env vars above
node scripts/graphql-replay.mjs record --upstream https://master.shamanicca.com --port 4001
rm -rf .next && npm run build && npm run start -- -p 3010
# 2. one full capture run, so every request the captures make is recorded
node scripts/capture.mjs /tmp/record-pass --base http://localhost:3010
# 3. post-process (never hand-edit fixture JSON)
node scripts/fixture-tools.mjs instock --slug merkaba-rider-womens-t-shirt
node scripts/fixture-tools.mjs alias --slug merkaba-rider-womens-t-shirt --as merkaba-rider-womens-t-shirt-oos
# 4. update fixtures README (date, commit, edits), grep for secrets, commit
# 5. stop the proxy; restart it in replay mode, delete .next, rebuild, restart
node scripts/graphql-replay.mjs replay --port 4001
```

`instock` rewrites the recorded product response so the 4 variations are
`IN_STOCK` (the real product is out of stock, so its size/CTA states would
otherwise be unreachable); `alias` stores the untouched original under the
slug `merkaba-rider-womens-t-shirt-oos`, which the `product-oos` route
captures — one build, both stock states. The aliased response gets its own
`data.product.id`: the app's server-side Apollo client is one long-lived cache
normalized by id, so a shared id would let whichever response was written last
(ISR regeneration order) decide the stock state of both pages — and identical
runs would agree on the wrong answer. The aliased body still says
`slug: merkaba-rider-womens-t-shirt`; the product page does not compare it to
the URL, so it renders rather than 404s. **Always look at the images**: two
identical runs prove determinism, not that the right state was captured.

### Runbook (copy-paste)

Everything runs from the repo root. The env vars come from the command line
only; never put them in `.env.local`. Use `next dev` for nothing here — this is
production build vs production build.

```bash
# 0. free the ports (3010 = app, 4001 = proxy); nothing may be listening
kill -9 $(lsof -t -iTCP:3010 -sTCP:LISTEN) $(lsof -t -iTCP:4001 -sTCP:LISTEN) 2>/dev/null
lsof -nP -iTCP:3010 -iTCP:4001 -sTCP:LISTEN          # must print nothing

# 1. the seven env vars, for BOTH build and start
export NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4001/graphql
export NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4001/graphql
export GRAPHQL_ENDPOINT=http://localhost:4001/graphql
export NEXT_PUBLIC_WP_BASE_URL=http://localhost:4001
export WORDPRESS_API_URL=http://localhost:4001/wp-json
export WC_STORE_URL=http://localhost:4001
export NEXT_PUBLIC_WC_STORE_URL=http://localhost:4001
export CAPTURE_MEDIA_DIR=~/.shamanicca-visual-cache/phase-6/media   # same for before AND after

# 2. proxy in replay mode (never contacts the live backend)
node scripts/graphql-replay.mjs replay --port 4001 &

# 3. FRESH build, then start
rm -rf .next && npm run build
npm run start -- -p 3010 &

# 4. the server must be serving THIS build
curl -s localhost:3010/ | grep -o '"buildId":"[^"]*"'; cat .next/BUILD_ID   # must match

# 5. capture (fails on any proxy miss, media miss, or timed-out wait)
node scripts/capture.mjs visual/<phase>/<before|after> \
  --base http://localhost:3010 --replay http://localhost:4001 --media replay

# 6. compare before/after: decoded pixels, zero tolerance, dimensions first
#    (see "Comparing"); then LOOK at the images.

# 7. clean up: stop both servers, delete the proxy-built .next
kill -9 $(lsof -t -iTCP:3010 -sTCP:LISTEN) $(lsof -t -iTCP:4001 -sTCP:LISTEN); rm -rf .next
```

Rules: before and after builds use the **same committed fixture set and the
same `CAPTURE_MEDIA_DIR`**; each is a fresh build (`rm -rf .next`) — restarting
a server does not change pages already prerendered; a leftover `next-server`
keeps answering with its old pages, so check the ports in step 0. After step 7,
the next normal `npm run build` uses the live endpoint again (it reads
`.env.local`, which this procedure never touches).

### Adding fixtures without touching existing ones: `record-missing`

When a phase needs a route the set does not cover, do **not** re-record.
`record-missing` is replay plus an additive top-up: a key that has a fixture
file is served from disk and never forwarded; a key with none is forwarded
upstream and stored with an exclusive write, so an existing file can never be
overwritten (5xx upstream responses are passed through, not stored).

```bash
# 0. fingerprint what exists
(cd visual/fixtures/phase-6 && find graphql rest -type f -name '*.json' | sort | xargs shasum -a 256) > /tmp/fixtures-before.sha
# 1. proxy in record-missing mode; build with the env vars above; start
node scripts/graphql-replay.mjs record-missing --upstream https://master.shamanicca.com --port 4001
rm -rf .next && npm run build && npm run start -- -p 3010
# 2. a full capture with the new routes/states, media topped up too
node scripts/capture.mjs /tmp/record-pass --base http://localhost:3010 \
  --replay http://localhost:4001 --media record-missing
curl -s localhost:4001/__recorded          # exactly which keys were added
# 3. prove additive: recompute the list; `comm -23 before after` must be empty
# 4. list the new files in the fixtures README, secret-scan, commit
# 5. stop the proxy, restart in REPLAY mode, delete .next, rebuild, restart —
#    and only then run the acceptance captures
```

Some recordings are the live backend's real behaviour, not what the code
"should" do: `GetAllPostsWithTotal` (WPGraphQL offset pagination) is recorded
as a GraphQL error today, so `/blog/all` always takes its cursor fallback — the
fixtures keep that.

Within a phase, the BEFORE build and the AFTER build both replay the **same
committed fixture set** — never re-record between them. Re-recording is a
separate commit with its own explanation, because it changes what every
future comparison is measured against.

### Images: the browser-side media cache

A layout change that resizes images can change srcset choices → media misses. Top up the cache with --media record-missing on the BEFORE build; never overwrite.

A capture can also miss an image **no earlier run ever requested**: Chrome
lazy-loads by distance from the viewport, and that distance depends on the
network speed it estimates at startup, so a slide two swipes away in the
product gallery is requested in some runs and not others. Fill those with a
`--media record-missing` pass (the numeric probes take the same flag) rather
than trusting a lucky run.

The proxy cannot cover images, and they turned out not to be a theoretical
risk: with GraphQL/REST replayed but images live, back-to-back runs still
differed (a live gallery image once loaded with `naturalWidth 0`; one page came
out 125px taller in one run; antialiased pixels flipped on a thumbnail corner)
even though the CDN returns byte-identical data. `capture.mjs --media` fixes
that with the same rule as the proxy:

- `--media record` — the first sight of each REMOTE image (WordPress media
  domain, and `/_next/image` requests whose source is remote) stores its bytes
  in `$CAPTURE_MEDIA_DIR` (default `~/.shamanicca-visual-cache/phase-6/media`).
  The cache is **not committed** (binary artifacts in git history are
  permanent; `visual/fixtures/**/media/` is git-ignored). A missing or empty
  cache is a hard error naming the variable and the path.
- `--media replay` — fulfils from disk; a miss aborts that image, fails the
  capture (no screenshot is written) and names the missed URL.
- The app's own local assets are never cached, so a phase that changes an icon
  or a local image is still measured against the build under test.

Record it in the same pass as the GraphQL/REST fixtures:
`node scripts/capture.mjs /tmp/record-pass --base ... --replay ... --media record`.
Every acceptance/before/after run then uses `--media replay`, and **before and after must use the same fixture set AND the same `CAPTURE_MEDIA_DIR`** — a different image cache is a different baseline.

Also worth knowing: a screenshot is only written after two consecutive frames
are byte-identical (`writeStableScreenshot`), and `--only label,label` runs a
subset of captures for debugging.

## Numeric probes (no screenshots)

Captures cannot reach every state, and a picture is a poor way to answer a
numeric question. Two probes run against the same replay proxy and production
build as `capture.mjs` (same consent init script, same media-cache replay, same
embed blocker; both exit 1 on any proxy or media miss, because numbers measured
on a broken page are worthless). `--media record-missing` tops up an image a
probe visits at a width no capture uses.

```bash
node scripts/probe-overflow.mjs   [--out overflow.json]   # scrollWidth - innerWidth
node scripts/probe-affiliated.mjs [--out affiliated.json] # .is-affilliated computed diff
```

- `probe-overflow.mjs` — every blog route (`blog`, `blog-category`, `blog-post`,
  `blog-all`, `blog-all-p2`, `blog-post-video`) at 320/375/620/768/1024/1366/1440:
  `documentElement.scrollWidth` against `window.innerWidth`, the widest element
  past the right edge when there is overflow, and `.blog-layout`'s grid columns
  at ≥1280. Phase 7.0 result: **0 overflow in all 42 cells.**
- `probe-affiliated.mjs` — the `.is-affilliated` (sic) banner variant is never
  rendered by any recorded route. The probe adds the class to the real rendered
  content banner (375, 1440) and sidebar banner (1440) and prints every computed
  value that changes. Run it on the BEFORE and AFTER builds (`--out`) and diff
  the JSON. Phase 7.0 baseline: exactly one change per banner, `background-color`
  (content banner `rgba(0,0,0,0)` → `rgb(248,248,248)`; sidebar banner
  `rgb(255,255,255)` → `rgb(240,240,240)`).

### Chromium runs with `--disable-partial-raster`

Viewport (non-full-page) screenshots of `/blog` at 1440 flipped between two
frames in about one of three fresh contexts: a handful of antialiased pixels,
one or two levels apart, on a rounded image corner. Partial raster re-rasters
only the invalidated part of a tile over the previous raster, so which frame
you get depends on which partial updates happened first. With
`--disable-partial-raster` 12 of 12 fresh contexts were identical, and the
extra frame-stability wait, disabling transitions and GPU flags were each
tried and did not help. **A capture set made before Phase 7.0 is not
pixel-comparable to one made after it**: 3 of the 71 older captures
(`product__375`, `product-sale__375`, `product__1440__wishlist-hover`) differ
by a few antialiased pixels. Every phase captures BEFORE and AFTER with the
same script version, so this only matters if you compare against an old
directory.

---

## Determinism test

The capture script's own waits are a claim: that capturing the same build
twice, back to back, produces byte-identical output. That claim has to be
tested on its own, separately from any before/after comparison — a
nondeterministic wait would otherwise show up as an unexplained diff in a
real phase comparison and get investigated as if it were a code regression.

Run it against **one production build in replay mode** (fresh build, env vars
above), not `next dev` — dev-mode compilation and Fast Refresh introduce their
own timing variance, and live data introduces its own:

```bash
node scripts/capture.mjs visual/<phase>/run1 --base http://localhost:3010 --replay http://localhost:4001 --media replay
node scripts/capture.mjs visual/<phase>/run2 --base http://localhost:3010 --replay http://localhost:4001 --media replay
```

Both runs must also finish with 0 proxy misses and 0 media misses. Phase 7.0
result: **94/94 identical** between back-to-back runs, about 111s per run. Run both in
one shell invocation (no gap) and confirm `scripts/capture.mjs` did not change
between them — a run made with an older script does not count. Phase 6.0
result: 71/71 identical, about 84s per run.

Then decode-pixel compare every matching filename between `run1` and
`run2` — dimensions first, then a full per-pixel diff, zero tolerance, no
resizing (the same protocol as a before/after phase gate). **Expect every
file identical.** Any difference is nondeterminism in the capture script
itself, not a code change, and must be fixed before that script version is
trusted for a merge gate.

The most likely source of a failure here is anything still timed rather than
awaited on a real signal — check first whether a wait condition was skipped
for a particular state (e.g. a new state added later without going through
`STATE_HANDLERS`'s existing settle helpers), not whether the underlying page
behavior is actually flaky.