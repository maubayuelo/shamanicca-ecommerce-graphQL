# Phase 6 capture fixtures

Recorded GraphQL and WP/WooCommerce REST responses, replayed by
`scripts/graphql-replay.mjs` so a capture run never touches the live backend.
One set for the whole of Phase 6 (6b product, 6c sticky bar, 6d gallery):
BEFORE and AFTER builds replay these same files.

- `graphql/` — POST /graphql, keyed by hash of operationName + query + variables
- `rest/` — everything else (WP REST, CMS routes, WooCommerce REST), keyed by
  method + path + query sorted by key, with consumer_key, consumer_secret and
  any token/auth-like param stripped from the key and never stored
- Images are NOT in this folder (binary artifacts in git history are
  permanent). The browser-side media cache lives in `$CAPTURE_MEDIA_DIR`
  (default `~/.shamanicca-visual-cache/phase-6/media`), is git-ignored, and must
  be the same directory for before and after captures. A missing or empty cache
  is a hard error. See docs/VISUAL-VERIFICATION.md.
- Request headers are never stored.

## Provenance

- Recorded: 2026-09-23
- Recorded from commit: `960f2b5` (main, Phase 6a merge) plus this branch's
  uncommitted capture-script changes
- Upstream: https://master.shamanicca.com (live WordPress/WooCommerce)

## Hand edits (all done by `scripts/fixture-tools.mjs`, none by hand)

1. `instock --slug merkaba-rider-womens-t-shirt` — the pinned product is
   genuinely OUT OF STOCK in WooCommerce (all 4 variations, confirmed in admin
   on the recording date). The recorded GetProductBySlug response was edited so
   every variation `stockStatus` is `IN_STOCK`, so the `product` route and its
   size/CTA states are reachable. **This response is NOT live data.**
   The untouched original is kept beside it as `<hash>.orig.json`.
2. `alias --slug merkaba-rider-womens-t-shirt --as merkaba-rider-womens-t-shirt-oos`
   — the ORIGINAL unedited response stored under the request key for the slug
   `merkaba-rider-womens-t-shirt-oos`, replacing the live "no product" error
   that recording produced for that slug. Serves the `product-oos` route
   (`/products/merkaba-rider-womens-t-shirt-oos`). Two things differ from the
   original: the request key's slug, and `data.product.id`, which gets an
   `-alias-<slug>` suffix. The app's server-side Apollo client is one
   long-lived cache that normalizes entities by id; with the real product's id,
   the aliased and real responses were the same cache entity and whichever was
   written last (ISR regeneration order) decided the stock state of both pages.
   `data.product.slug` still reads `merkaba-rider-womens-t-shirt`; the page does
   not compare it to the URL.

## Notes on content

- Search (`?q=tshirt&scope=shop`, `?q=wicca&scope=blog`): recorded with real
  results (3 products; 10+ articles), not the empty state.
- Blog promo banner (the client-side `affiliatedBanner` GraphQL query, used by
  blog, blog-category and blog-post): **present** in these recordings — the
  "Intentioned Apparel / Shop Now!" block appears on blog, blog-category and
  blog-post at 768 and 1440 (confirmed by opening the images; at 375 it is
  below the fold of the reviewed crop). It was absent in one live capture
  earlier, so any future re-recording must be checked for it.
- `product` is IN STOCK in these fixtures only because of edit 1; live it is
  out of stock.

## Contents at recording

135 GraphQL responses (+1 `.orig.json` backup, never served), 60 REST
responses: 197 files, 1.3 MB. The recorded media cache is 110 images, 16 MB,
kept outside the repo. 0 hits for `ck_` / `cs_` in any fixture.

## Additive recordings

Made with `graphql-replay.mjs record-missing` (existing fixture files are
served from disk and can never be overwritten; new keys are written with an
exclusive write). Every pre-existing fixture file is byte-identical
(`comm -23` of the before/after SHA-256 lists is empty; 196 files before).

**2026-09-24, Phase 7.0** (recorded from `ea23fe0`, main after the Phase 6d
merge; new routes `blog-all`, `blog-all-p2`, `blog-post-video`). 5 new files,
all `graphql/`:

| File | Operation | Variables | Why |
|---|---|---|---|
| `cf2d643e…` | `GetAllPostsWithTotal` | `size 9, offset 10` | `/blog/all` page 1 |
| `b2e74728…` | `GetAllPostsCursor` | `first 9` | `/blog/all` page 1 fallback (and page 2's first hop) |
| `09fc46d1…` | `GetAllPostsWithTotal` | `size 9, offset 19` | `/blog/all?page=2` |
| `f21be47a…` | `GetAllPostsCursor` | `first 9, after <cursor>` | `/blog/all?page=2` fallback |
| `30f66178…` | `GetCategoryBanner` | `id 8` | the `blog-post-video` post's category |

- **The two `GetAllPostsWithTotal` files are GraphQL errors, not data**
  (`Field "offsetPagination" is not defined by type "RootQueryToPostConnectionWhereArgs"`,
  HTTP 200). That is the live backend's behaviour on the recording date, and
  it is why `/blog/all` always takes its cursor fallback. Kept as recorded.
- These are live responses recorded a day after the rest of the set; a post
  list on `/blog/all` reflects the backend on 2026-09-24.
- Media: 17 new cache entries (34 files) outside the repo, added with
  `--media record-missing`; the original 222 files are byte-identical. That
  includes three product-gallery images no capture had needed before (the
  sale product's later slides).
- 0 hits for `ck_` / `cs_` in the new files.

## Re-recording

Deliberate and separate: re-record only in its own commit, never as a side
effect of a phase. Procedure: docs/VISUAL-VERIFICATION.md, "Recording fixtures".
