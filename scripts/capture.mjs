#!/usr/bin/env node
/**
 * capture.mjs — Playwright screenshot capture for visual verification.
 *
 * Usage:
 *   node scripts/capture.mjs <outputDir> [--base http://localhost:3000]
 *
 * Reads visual/routes.json for the viewport list, route list (each route may
 * override the default viewport list via its own "viewports" array of names),
 * and the "states" list (interaction states captured per route/viewport as a
 * *viewport* screenshot, not full-page, since the elements they exercise —
 * the gallery modal, the sticky bar — are fixed-position and a stitched
 * full-page capture would render them wrong).
 *
 * Every wait below is a condition, not a fixed sleep: the goal is that
 * capturing the same build twice, back to back, produces byte-identical
 * screenshots (see docs/VISUAL-VERIFICATION.md, "Determinism test"). Any
 * wait that times out throws, and the whole capture run exits non-zero —
 * a partial or premature screenshot is worse than no screenshot, because it
 * looks like evidence.
 *
 * See docs/VISUAL-VERIFICATION.md for the manual protocol this automates.
 */
import { chromium } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = argv.slice(2);
  const positional = [];
  let base = 'http://localhost:3000';
  let replay = null;
  let only = null;
  let media = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base') {
      base = args[i + 1];
      i++;
    } else if (args[i] === '--replay') {
      replay = args[i + 1];
      i++;
    } else if (args[i] === '--media') {
      media = args[i + 1];
      if (media !== 'record' && media !== 'record-missing' && media !== 'replay') {
        console.error('--media must be "record", "record-missing", or "replay"');
        process.exit(1);
      }
      i++;
    } else if (args[i] === '--only') {
      only = args[i + 1].split(',');
      i++;
    } else {
      positional.push(args[i]);
    }
  }
  if (positional.length !== 1) {
    console.error('Usage: node scripts/capture.mjs <outputDir> [--base http://localhost:3000] [--replay http://localhost:4001] [--only label,label] [--media record|record-missing|replay]');
    process.exit(1);
  }
  return { outputDir: positional[0], base, replay, only, media };
}

const { outputDir, base, replay, only, media } = parseArgs(process.argv);

const manifestPath = path.join(rootDir, 'visual', 'routes.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

const resolvedOutputDir = path.isAbsolute(outputDir) ? outputDir : path.resolve(process.cwd(), outputDir);
fs.mkdirSync(resolvedOutputDir, { recursive: true });

// Keys and payload shapes read from source — see report.
const COOKIE_CONSENT_KEY = 'shamanicca-cookie-consent';
const COOKIE_CONSENT_VALUE = JSON.stringify({
  version: 1,
  analytics: false,
  timestamp: new Date().toISOString(),
});
const NEWSLETTER_DISMISSED_KEY = 'shamanicca_newsletter_dismissed';
const NEWSLETTER_DISMISSED_VALUE = '1';

// The Next.js dev overlay mounts a <nextjs-portal> custom element (shadow DOM)
// directly under <body>. Hiding the host element hides the whole overlay.
const HIDE_DEV_INDICATOR_CSS = 'nextjs-portal { display: none !important; }';

// ---------------------------------------------------------------------------
// Media cache (browser side). Product/blog images load from the live media
// domain, and the GraphQL/REST replay proxy cannot cover them: a live image
// that arrives late, or not at all, changes layout and pixels between
// otherwise identical runs. --media record stores the bytes of every REMOTE
// image the browser requests on first sight; --media replay fulfils from disk
// and treats a miss as a failure of the capture (never a fallthrough to the
// network). Only remote media is cached — the app's own local assets must
// keep coming from the build under test, or a phase that changes an icon
// would be masked by a cached copy of the old one.
// ---------------------------------------------------------------------------

// The media cache lives outside the repo (binary artifacts in git history are
// permanent): $CAPTURE_MEDIA_DIR, defaulting to a per-user cache directory.
const mediaDir = process.env.CAPTURE_MEDIA_DIR
  ? path.resolve(process.env.CAPTURE_MEDIA_DIR)
  : path.join(os.homedir(), '.shamanicca-visual-cache', 'phase-6', 'media');
const baseOrigin = new URL(base).origin;

function mediaKeyFor(requestUrl) {
  const u = new URL(requestUrl);
  if (u.origin === baseOrigin) {
    // Next's image optimizer: cache only when its source is remote.
    if (u.pathname !== '/_next/image') return null;
    const src = u.searchParams.get('url') || '';
    if (!/^https?:\/\//.test(src)) return null;
    return `next-image ${u.pathname}${u.search}`;
  }
  // Direct image request to a remote host (the WordPress media domain).
  return requestUrl;
}

function assertMediaCacheReady() {
  if (media === 'record' || media === 'record-missing') {
    fs.mkdirSync(mediaDir, { recursive: true });
    return;
  }
  const populated = fs.existsSync(mediaDir) && fs.readdirSync(mediaDir).some((f) => f.endsWith('.bin'));
  if (!populated) {
    console.error(
      `--media replay needs a populated media cache, but none was found at ${mediaDir}.\n` +
      `Set CAPTURE_MEDIA_DIR to the cache directory (default: ~/.shamanicca-visual-cache/phase-6/media), ` +
      `or create one with a --media record pass. Before and after captures must use the same cache.`,
    );
    process.exit(1);
  }
}

async function installMediaCache(context, misses) {
  const pendingRecordings = new Map();
  await context.route('**/*', async (route) => {
    const request = route.request();
    if (request.resourceType() !== 'image') return route.continue();
    const key = mediaKeyFor(request.url());
    if (key === null) return route.continue();

    const id = crypto.createHash('sha256').update(key).digest('hex').slice(0, 32);
    const metaPath = path.join(mediaDir, `${id}.json`);
    const binPath = path.join(mediaDir, `${id}.bin`);

    if (fs.existsSync(binPath) && fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      return route.fulfill({ status: 200, contentType: meta.contentType, body: fs.readFileSync(binPath) });
    }
    if (media === 'replay') {
      misses.push(key);
      console.error(`[media] MISS ${key}`);
      return route.abort('failed');
    }
    if (media === 'record-missing') {
      if (!pendingRecordings.has(key)) {
        pendingRecordings.set(key, (async () => {
          if (fs.existsSync(binPath) || fs.existsSync(metaPath)) {
            throw new Error(`Incomplete cache entry; refusing to overwrite: ${key}`);
          }
          const response = await route.fetch();
          const body = await response.body();
          if (response.status() !== 200 || body.length === 0) {
            throw new Error(`Cannot record ${key}: HTTP ${response.status()}, ${body.length} bytes`);
          }
          const contentType = response.headers()['content-type'] || 'application/octet-stream';
          // Exclusive creation protects existing files even if another process writes this key.
          fs.writeFileSync(binPath, body, { flag: 'wx' });
          fs.writeFileSync(metaPath, JSON.stringify({ key, contentType }, null, 2), { flag: 'wx' });
          console.log(`[media] RECORDED ${key}`);
          return { status: 200, contentType, body };
        })());
      }
      try {
        return await route.fulfill(await pendingRecordings.get(key));
      } catch (error) {
        misses.push(key);
        console.error(`[media] RECORD FAILED ${key}: ${error.message}`);
        return route.abort('failed');
      }
    }
    const response = await route.fetch();
    const body = await response.body();
    if (response.status() === 200 && body.length > 0) {
      fs.writeFileSync(binPath, body);
      fs.writeFileSync(metaPath, JSON.stringify({ key, contentType: response.headers()['content-type'] || 'application/octet-stream' }, null, 2));
    }
    return route.fulfill({ response, body });
  });
}

// ---------------------------------------------------------------------------
// Wait primitives — every one of these is a condition, never a bare sleep.
// ---------------------------------------------------------------------------

async function withHardTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms waiting for: ${label}`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function waitFontsReady(page, timeoutMs = 15000) {
  await withHardTimeout(page.evaluate(() => document.fonts.ready), timeoutMs, 'document.fonts.ready');
}

// Scroll settle = 3 consecutive equal window.scrollY readings on consecutive
// animation frames. Not `scrollend`: with `behavior: 'instant'` a scroll that
// doesn't actually move anything (already at that position) never fires
// `scrollend` at all, which would hang every settle-wait on a no-op scroll.
async function waitScrollSettled(page, timeoutMs = 10000) {
  await withHardTimeout(
    page.evaluate(() => new Promise((resolve) => {
      let last = window.scrollY;
      let stable = 0;
      function tick() {
        const y = window.scrollY;
        if (y === last) {
          stable++;
        } else {
          stable = 0;
          last = y;
        }
        if (stable >= 3) {
          resolve(undefined);
          return;
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    })),
    timeoutMs,
    'window.scrollY to settle (3 consecutive equal rAF readings)',
  );
}

// Scroll to the bottom in half-viewport steps (this is what triggers
// lazy-loaded images along the way), settling after every step, then a final
// scroll to the true bottom. All scrolling is `behavior: 'instant'` — smooth
// scrolling has no fixed duration and is exactly the kind of thing that
// produces a different final frame on two otherwise-identical runs.
async function scrollToBottomInSteps(page, timeoutMs = 30000) {
  await withHardTimeout(
    page.evaluate(async () => {
      function waitSettled() {
        return new Promise((resolve) => {
          let last = window.scrollY;
          let stable = 0;
          function tick() {
            const y = window.scrollY;
            if (y === last) {
              stable++;
            } else {
              stable = 0;
              last = y;
            }
            if (stable >= 3) {
              resolve(undefined);
              return;
            }
            requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
      }
      const step = window.innerHeight / 2;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await waitSettled();
      }
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
      await waitSettled();
    }),
    timeoutMs,
    'scroll-to-bottom stepping to settle',
  );
}

async function scrollToTop(page, timeoutMs = 10000) {
  await withHardTimeout(
    page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })),
    timeoutMs,
    'scroll-to-top to issue',
  );
  await waitScrollSettled(page, timeoutMs);
}

// Every visible <img> (display:none is excluded) — scoped to the whole
// document for a full-page capture, or to the current viewport rect for a
// state capture — must reach naturalWidth > 0 and a resolved decode(). A
// failure here REJECTS; it does not let the capture proceed half-loaded.
async function waitImagesReady(page, { scope = 'fullpage', timeoutMs = 30000 } = {}) {
  const ready = page.evaluate(async (scope) => {
    function isEligible(el) {
      if (getComputedStyle(el).display === 'none') return false;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      if (scope === 'fullpage') return true;
      return rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
    }

    const imgs = Array.from(document.images).filter(isEligible);
    await Promise.all(imgs.map(async (img) => {
      if (!img.complete) {
        await new Promise((resolve, reject) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', () => reject(new Error(`image failed to load: ${img.src}`)), { once: true });
        });
      }
      if (img.naturalWidth === 0) throw new Error(`image loaded with naturalWidth 0: ${img.src}`);
      await img.decode();
    }));

    const bgUrls = new Set();
    for (const el of document.querySelectorAll('*')) {
      if (!isEligible(el)) continue;
      const bg = getComputedStyle(el).backgroundImage;
      const m = bg && bg.match(/url\(["']?(.*?)["']?\)/);
      if (m && m[1] && !m[1].startsWith('data:')) bgUrls.add(m[1]);
    }
    await Promise.all([...bgUrls].map((src) => new Promise((resolve, reject) => {
      const probe = new Image();
      probe.onload = () => resolve(undefined);
      probe.onerror = () => reject(new Error(`background image failed to load: ${src}`));
      probe.src = src;
    })));
  }, scope);

  await withHardTimeout(ready, timeoutMs, `all in-viewport-scope (${scope}) images to load and decode`);
}

// Covers both CSS Animations and CSS Transitions — Chromium's
// Element.getAnimations() returns Transitions as Animation objects too, so
// awaiting `.finished` on both is sufficient and avoids a separate
// `transitionend` listener (which can miss a transition that already
// finished before the listener attached). Infinite-iteration animations are
// excluded — they never finish, and none of the states this script captures
// depend on one (the sticky bar's entrance and the wishlist hover both have
// finite durations).
async function waitAnimationsSettled(page, selector, timeoutMs = 5000) {
  await withHardTimeout(
    page.evaluate((sel) => {
      const root = sel ? document.querySelector(sel) : document.documentElement;
      if (!root) return Promise.resolve();
      const anims = root.getAnimations({ subtree: true }).filter((a) => {
        const timing = a.effect && a.effect.getTiming ? a.effect.getTiming() : null;
        return !timing || timing.iterations !== Infinity;
      });
      return Promise.all(anims.map((a) => a.finished.catch(() => undefined)));
    }, selector),
    timeoutMs,
    `animations/transitions on "${selector}" to finish`,
  );
}

async function resetMouse(page) {
  await page.mouse.move(0, 0);
}

// Whole-document transition/animation settle (Phase 6.0c task 4). Catches
// things like GoTop.tsx — a position:fixed button whose visibility is a
// scroll-driven React state flip, inheriting .btn's `transition: all 200ms
// ease` — which no per-component wait was watching, and which a screenshot
// taken right after a scroll would catch mid-fade. Two rAF first (let the
// browser paint whatever the scroll/click just triggered), then loop
// checking document.getAnimations() until it's empty (ignoring
// infinite-iteration animations, which never finish) for 2 consecutive
// checks — awaiting one batch of `.finished` can itself trigger a new
// transition (e.g. a chained hover/focus style), so a single empty check
// isn't enough.
async function waitTransitionsSettled(page, timeoutMs = 10000) {
  await withHardTimeout(
    page.evaluate(async () => {
      function raf() {
        return new Promise((resolve) => requestAnimationFrame(resolve));
      }
      await raf();
      await raf();
      let emptyStreak = 0;
      while (emptyStreak < 2) {
        // A finished animation stays in document.getAnimations() until it is
        // cancelled or its target is removed (e.g. the sticky bar's entrance,
        // which remains mounted) — it has nothing left to wait for, and
        // counting it would make "empty" unreachable.
        const anims = document.getAnimations().filter((a) => {
          if (a.playState === 'finished' || a.playState === 'paused') return false;
          const timing = a.effect && a.effect.getTiming ? a.effect.getTiming() : null;
          return !timing || timing.iterations !== Infinity;
        });
        if (anims.length === 0) {
          emptyStreak++;
        } else {
          emptyStreak = 0;
          await Promise.all(anims.map((a) => a.finished.catch(() => undefined)));
        }
        await raf();
      }
    }),
    timeoutMs,
    'finite animations/transitions to finish (2 consecutive empty frames)',
  );
}

// Looping animations (iterations: Infinity — e.g. a spinner) never satisfy
// waitTransitionsSettled's "empty" check by design, and never will. Freeze
// every one of them at a fixed frame (currentTime: 0) right before the
// screenshot, so its exact rendered frame doesn't depend on how many
// milliseconds of wall-clock time happened to elapse before the shot.
async function freezeLoopingAnimations(page) {
  await page.evaluate(() => {
    for (const a of document.getAnimations()) {
      const timing = a.effect && a.effect.getTiming ? a.effect.getTiming() : null;
      if (timing && timing.iterations === Infinity) {
        a.pause();
        a.currentTime = 0;
      }
    }
  });
}

// Tracks in-flight requests to /graphql and any WP REST path (wp-json, plus
// the three Next.js API routes that proxy to WP/GraphQL server-side) on a
// given page. Attach before navigating, so nothing is missed between
// goto() and the first evaluate() call.
function attachNetworkTracker(page) {
  const inFlight = new Set();
  const isTracked = (url) =>
    url.includes('/graphql') ||
    url.includes('/wp-json') ||
    url.includes('/api/cms/announcement') ||
    url.includes('/api/cms/hero') ||
    url.includes('/api/blog/categories') ||
    url.includes('/api/shop/categories');
  const onRequest = (req) => {
    if (isTracked(req.url())) inFlight.add(req);
  };
  const onSettle = (req) => inFlight.delete(req);
  page.on('request', onRequest);
  page.on('requestfinished', onSettle);
  page.on('requestfailed', onSettle);
  return { size: () => inFlight.size };
}

// Waits for 0 tracked requests for 2 consecutive animation frames, checked
// from the Node side (not inside page.evaluate — the tracker lives in the
// Playwright process, not the page). This runs before every other readiness
// check: fonts/scroll/images being "ready" means nothing if a GraphQL
// response the page is about to render from hasn't arrived yet — this is
// what makes the blog page's separate affiliatedBanner fetch (a distinct
// client-side GraphQL call from useBanners.ts, unrelated to the page's
// server-rendered post list) safe to capture without a bespoke wait for
// that one component.
async function waitNetworkQuiet(page, tracker, timeoutMs = 15000) {
  await withHardTimeout(
    (async () => {
      let quietStreak = 0;
      while (quietStreak < 2) {
        if (tracker.size() === 0) {
          quietStreak++;
        } else {
          quietStreak = 0;
        }
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      }
    })(),
    timeoutMs,
    'in-flight /graphql and WP REST requests to reach 0 (2 consecutive frames)',
  );
}

// A frame can still differ between two captures of an already-settled page —
// observed as a handful of antialiased pixels on a rounded thumbnail corner
// that flipped in roughly one of three isolated runs, with byte-identical
// image data (raster timing, not content). So "ready" is also a property of
// the rendered frame itself: take screenshots until two consecutive frames
// are byte-identical, write only that frame, and fail — never write —
// if it doesn't converge.
async function writeStableScreenshot(page, outputPath, fullPage, { maxAttempts = 8 } = {}) {
  let previous = await page.screenshot({ fullPage });
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const current = await page.screenshot({ fullPage });
    if (current.equals(previous)) {
      fs.writeFileSync(outputPath, current);
      return;
    }
    previous = current;
  }
  throw new Error(`rendered frame did not stabilise: ${maxAttempts} consecutive screenshots kept differing`);
}

// Search pages fetch client-side (SEARCH_PRODUCTS / SEARCH_POSTS in
// search.tsx) — the only two possible end states for a pinned, non-empty
// `?q=` query are the results grid or the "No products/articles found"
// message. Both grids render their items as <article> elements
// (ProductsGrid, BlogGrid). This asserts one of those two positive
// conditions is met — never "the loading text is gone", which would also be
// true before the fetch has even started.
async function waitSearchResultsSettled(page, timeoutMs = 15000) {
  const results = page.locator('main article').first();
  const empty = page.locator('main p', { hasText: /No (products|articles) found for/ }).first();
  await withHardTimeout(
    Promise.race([
      results.waitFor({ state: 'attached', timeout: timeoutMs }),
      empty.waitFor({ state: 'attached', timeout: timeoutMs }),
    ]),
    timeoutMs,
    'search results grid or empty-state message to appear',
  );
}

// ---------------------------------------------------------------------------
// Gallery-specific settle check (Phase 6.0 amendment 1).
// ---------------------------------------------------------------------------

async function waitGallerySettled(page, targetIndex, timeoutMs = 10000) {
  await withHardTimeout(
    page.evaluate(async (targetIndex) => {
      function waitStable(getValue) {
        return new Promise((resolve) => {
          let last = getValue();
          let stable = 0;
          function tick() {
            const v = getValue();
            if (v === last) {
              stable++;
            } else {
              stable = 0;
              last = v;
            }
            if (stable >= 3) {
              resolve(undefined);
              return;
            }
            requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
      }

      const track = document.querySelector('.gallery__track');
      const slides = document.querySelectorAll('.gallery__slide');
      const target = slides[targetIndex];
      if (!track || !target) throw new Error('gallery track or target slide not found in DOM');

      await waitStable(() => track.scrollLeft);
      await waitStable(() => window.scrollY);

      const delta = Math.abs(track.scrollLeft - target.offsetLeft);
      if (delta > 1) {
        throw new Error(
          `gallery did not settle on slide ${targetIndex}: track.scrollLeft=${track.scrollLeft}, target.offsetLeft=${target.offsetLeft}`,
        );
      }
    }, targetIndex),
    timeoutMs,
    `.gallery__track to settle on slide ${targetIndex}`,
  );
}

async function waitModalReady(page, expectedIndex, timeoutMs = 15000) {
  await page.locator('.gallery__modal').waitFor({ state: 'attached', timeout: timeoutMs });
  await withHardTimeout(
    page.evaluate(async (expectedIndex) => {
      const modalImg = document.querySelector('.gallery__modal .modal__image img');
      const activeThumb = document.querySelectorAll('.gallery__modal .modal__thumbs .thumb')[expectedIndex];
      if (!modalImg) throw new Error('modal image element not found');
      if (!activeThumb || !activeThumb.classList.contains('is-active')) {
        throw new Error(`modal thumb ${expectedIndex} is not marked is-active`);
      }
      if (!modalImg.complete) {
        await new Promise((resolve, reject) => {
          modalImg.addEventListener('load', resolve, { once: true });
          modalImg.addEventListener('error', () => reject(new Error(`modal image failed to load: ${modalImg.src}`)), { once: true });
        });
      }
      if (modalImg.naturalWidth === 0) throw new Error(`modal image naturalWidth is 0: ${modalImg.src}`);
      await modalImg.decode();
    }, expectedIndex),
    timeoutMs,
    `modal image ${expectedIndex} to load and decode`,
  );
}

// ---------------------------------------------------------------------------
// Interaction-state handlers. Each performs its action sequence, waits on the
// condition that actually defines "the state has been reached" (never a
// sleep), and — where the element isn't already on-screen at initial scroll
// position — positions the viewport for the screenshot with an instant
// window.scrollTo (never scrollIntoView, which does not accept
// behavior: 'instant' the same way and is used elsewhere in the app for
// smooth, non-deterministic scrolling).
// ---------------------------------------------------------------------------

const STATE_HANDLERS = {
  'product:thumb-2': async (page) => {
    await page.locator('.gallery__thumbs .thumb').nth(1).click();
    await resetMouse(page);
    await waitGallerySettled(page, 1);
  },

  'product:last-image': async (page) => {
    const thumbs = page.locator('.gallery__thumbs .thumb');
    const count = await thumbs.count();
    const lastIndex = count - 1;
    await thumbs.nth(lastIndex).click();
    await resetMouse(page);
    await waitGallerySettled(page, lastIndex);
    const disabled = await page.locator('.nav--next').isDisabled();
    if (!disabled) throw new Error('expected .nav--next to be disabled after selecting the last image');
  },

  'product:modal-image-2': async (page) => {
    await page.locator('.gallery__thumbs .thumb').nth(1).click();
    await resetMouse(page);
    await waitGallerySettled(page, 1);
    await page.locator('.gallery__slide').nth(1).locator('.image-button').click();
    await resetMouse(page);
    await waitModalReady(page, 1);
  },

  'product:modal-thumb-4': async (page) => {
    await page.locator('.gallery__slide').nth(0).locator('.image-button').click();
    await resetMouse(page);
    await waitModalReady(page, 0);
    await page.locator('.gallery__modal .modal__thumbs .thumb').nth(3).click();
    await resetMouse(page);
    await waitModalReady(page, 3);
  },

  'product:sticky-bar-visible': async (page) => {
    await withHardTimeout(
      page.evaluate(() => {
        const anchor = document.querySelector('.product__desc') || document.querySelector('footer');
        if (!anchor) throw new Error('no anchor element found to scroll the CTA out of view');
        const rect = anchor.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + rect.top, behavior: 'instant' });
      }),
      10000,
      'scroll past the main CTA to issue',
    );
    await waitScrollSettled(page);
    await page.locator('.product-sticky-bar').waitFor({ state: 'attached', timeout: 10000 });
    await waitAnimationsSettled(page, '.product-sticky-bar', 5000);
  },

  'product:size-error': async (page) => {
    await page.locator('.product__cta').click();
    await resetMouse(page);
    await page.locator('#size-error').waitFor({ state: 'attached', timeout: 5000 });
    await withHardTimeout(
      page.evaluate(() => {
        const errEl = document.querySelector('#size-error');
        const field = document.querySelector('.product__options .field');
        const select = document.querySelector('#size');
        if (!errEl || !errEl.textContent || !errEl.textContent.trim()) throw new Error('#size-error text is empty');
        if (!field || !field.classList.contains('field--error')) throw new Error('.field--error class was not applied');
        if (!select || select.getAttribute('aria-invalid') !== 'true') throw new Error('#size aria-invalid was not set to true');
      }),
      5000,
      'size-error state (text, field--error class, aria-invalid) to apply',
    );
    await withHardTimeout(
      page.evaluate(() => {
        const field = document.querySelector('.product__options .field');
        const rect = field.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + rect.top - 100, behavior: 'instant' });
      }),
      5000,
      'scroll to the size field to issue',
    );
    await waitScrollSettled(page);
  },

  // Wishlist toggling requires WishlistContext to have hydrated
  // (products/[slug].tsx guards on `hydrated && wishlistId`) — there is no
  // DOM signal for that without an app-code change, which is out of scope
  // for this PR. This polls the actual condition we care about (did the
  // click take effect) rather than sleeping a guessed hydration duration,
  // and is bounded by the same hard timeout as every other wait here.
  'product:wishlist-saved': async (page) => {
    const btn = page.locator('.product__wishlist-btn');
    await withHardTimeout(
      (async () => {
        const deadline = Date.now() + 8000;
        while (Date.now() < deadline) {
          await btn.click();
          await resetMouse(page);
          const saved = await btn.evaluate((el) => el.classList.contains('is-wishlisted'));
          if (saved) return;
          await page.waitForTimeout(100);
        }
        throw new Error('wishlist button never reached is-wishlisted (WishlistContext likely never hydrated)');
      })(),
      8000,
      'wishlist button to hydrate and toggle is-wishlisted',
    );
    await withHardTimeout(
      page.evaluate(async () => {
        const img = document.querySelector('.product__wishlist-btn img');
        if (!img) throw new Error('wishlist icon <img> not found');
        if (!img.src.includes('icon-heart-full')) throw new Error('wishlist icon did not swap to the filled heart');
        if (!img.complete) {
          await new Promise((resolve, reject) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', () => reject(new Error('wishlist icon failed to load')), { once: true });
          });
        }
        if (img.naturalWidth === 0) throw new Error('wishlist icon naturalWidth is 0');
        await img.decode();
      }),
      5000,
      'filled-heart wishlist icon to load and decode',
    );
    // The is-wishlisted class change triggers the button's own
    // border/color/background transitions (150ms, per the Phase 6 READ) —
    // without this, the screenshot can land mid-transition depending on how
    // fast the retry loop above happened to resolve.
    await waitAnimationsSettled(page, '.product__wishlist-btn', 3000);
  },

  // Hover only — do NOT reset the mouse afterward (amendment 7's exception),
  // or the hover state we're trying to capture would end before the shot.
  'product:wishlist-hover': async (page) => {
    await page.locator('.product__wishlist-btn').hover();
    await waitAnimationsSettled(page, '.product__wishlist-btn', 3000);
  },

  // #size:focus is what's styled in the compiled CSS, not #size:focus-visible
  // (confirmed against the compiled output in the Phase 6 READ) — so a
  // programmatic .focus() and a real Tab-key focus render identically here.
  // Simulating Tab for real would mean hard-coding a tab-stop count through
  // the header nav and gallery controls, which is WP-content-dependent
  // (nav item count) and would make this state nondeterministic in exactly
  // the way this whole PR exists to eliminate.
  'product:size-focused': async (page) => {
    await page.locator('#size').focus();
    await resetMouse(page);
    await withHardTimeout(
      page.evaluate(() => {
        if (document.activeElement?.id !== 'size') throw new Error('#size did not receive focus');
      }),
      2000,
      '#size to receive focus',
    );
    await withHardTimeout(
      page.evaluate(() => {
        const el = document.querySelector('#size');
        const rect = el.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + rect.top - 100, behavior: 'instant' });
      }),
      5000,
      'scroll to the size field to issue',
    );
    await waitScrollSettled(page);
  },
};

// ---------------------------------------------------------------------------
// Job list
// ---------------------------------------------------------------------------

const viewportByName = new Map(manifest.viewports.map((v) => [v.name, v]));

function resolveViewports(route) {
  const names = route.viewports || manifest.defaultViewports;
  return names.map((name) => {
    const vp = viewportByName.get(name);
    if (!vp) throw new Error(`route "${route.name}" references unknown viewport "${name}"`);
    return vp;
  });
}

const jobs = [];

for (const route of manifest.routes) {
  for (const viewport of resolveViewports(route)) {
    jobs.push({ route, viewport, state: null, label: `${route.name}__${viewport.name}` });
  }
}

for (const stateEntry of manifest.states || []) {
  const route = manifest.routes.find((r) => r.name === stateEntry.route);
  if (!route) throw new Error(`state "${stateEntry.name}" references unknown route "${stateEntry.route}"`);
  for (const viewportName of stateEntry.viewports) {
    const viewport = viewportByName.get(viewportName);
    if (!viewport) throw new Error(`state "${stateEntry.name}" references unknown viewport "${viewportName}"`);
    jobs.push({
      route,
      viewport,
      state: stateEntry.name,
      label: `${route.name}__${viewport.name}__${stateEntry.name}`,
    });
  }
}

if (only) {
  const wanted = new Set(only);
  for (let i = jobs.length - 1; i >= 0; i--) if (!wanted.has(jobs[i].label)) jobs.splice(i, 1);
  if (jobs.length === 0) throw new Error(`--only matched no capture labels: ${only.join(', ')}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (media) assertMediaCacheReady();
  const browser = await chromium.launch();
  let failures = [];
  let count = 0;
  let lastMissCount = 0;

  if (replay) {
    // Reset the proxy's miss log at the start of a run so misses are
    // attributed to this run's captures only.
    await fetch(`${replay}/__misses/reset`, { method: 'POST' }).catch(() => {});
  }

  try {
    for (let i = 0; i < jobs.length; i++) {
      const { route, viewport, state, label } = jobs[i];
      console.log(`[${i + 1}/${jobs.length}] ${label} ...`);
      const startedAt = Date.now();
      let context;
      try {
        context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: 1,
        });

        await context.addInitScript(
          ({ cookieKey, cookieValue, newsletterKey, newsletterValue }) => {
            window.localStorage.setItem(cookieKey, cookieValue);
            window.localStorage.setItem(newsletterKey, newsletterValue);
          },
          {
            cookieKey: COOKIE_CONSENT_KEY,
            cookieValue: COOKIE_CONSENT_VALUE,
            newsletterKey: NEWSLETTER_DISMISSED_KEY,
            newsletterValue: NEWSLETTER_DISMISSED_VALUE,
          },
        );

        const mediaMisses = [];
        if (media) await installMediaCache(context, mediaMisses);

        const page = await context.newPage();
        await page.addStyleTag({ content: HIDE_DEV_INDICATOR_CSS });

        // Attach before goto() so no request in the initial navigation is
        // missed by the tracker.
        const tracker = attachNetworkTracker(page);

        const url = new URL(route.path, base).toString();
        await page.goto(url, { waitUntil: 'load', timeout: 60000 });

        // Network-quiet runs first: nothing else "being ready" means
        // anything if a GraphQL/WP-REST response the page still needs to
        // render from hasn't arrived yet.
        await waitNetworkQuiet(page, tracker);
        await waitFontsReady(page);

        const isSearchRoute = route.path.startsWith('/search');
        if (isSearchRoute) {
          // Kept: network-quiet only proves the HTTP request finished, not
          // that React has re-rendered from it yet — this is still the
          // authoritative "did the page reach a real terminal state" check.
          await waitSearchResultsSettled(page);
        }

        if (state) {
          // Interaction states: viewport screenshot, not full-page. Base
          // waits still apply (network, fonts, search results) but not the
          // scroll-to-bottom sweep — the state handler owns scroll
          // positioning for whatever it needs in view.
          const handler = STATE_HANDLERS[`${route.name}:${state}`];
          if (!handler) throw new Error(`no state handler registered for "${route.name}:${state}"`);
          await handler(page);
          await waitNetworkQuiet(page, tracker);
          await waitImagesReady(page, { scope: 'viewport', timeoutMs: 30000 });
          await waitTransitionsSettled(page);
          await freezeLoopingAnimations(page);

          const outputPath = path.join(resolvedOutputDir, `${label}.png`);
          if (mediaMisses.length > 0) throw new Error(`${mediaMisses.length} media cache miss(es): ${mediaMisses.join('; ')}`);
          await writeStableScreenshot(page, outputPath, false);
        } else {
          await scrollToBottomInSteps(page);
          await waitTransitionsSettled(page);
          await waitNetworkQuiet(page, tracker);
          await waitImagesReady(page, { scope: 'fullpage', timeoutMs: 30000 });
          await scrollToTop(page);
          await waitTransitionsSettled(page);
          await freezeLoopingAnimations(page);

          const outputPath = path.join(resolvedOutputDir, `${label}.png`);
          if (mediaMisses.length > 0) throw new Error(`${mediaMisses.length} media cache miss(es): ${mediaMisses.join('; ')}`);
          await writeStableScreenshot(page, outputPath, true);
        }

        if (mediaMisses.length > 0) {
          throw new Error(`${mediaMisses.length} media cache miss(es): ${mediaMisses.join('; ')}`);
        }

        if (replay) {
          const missesRes = await fetch(`${replay}/__misses`);
          const misses = await missesRes.json();
          if (misses.length > lastMissCount) {
            const newMisses = misses.slice(lastMissCount);
            lastMissCount = misses.length;
            throw new Error(
              `${newMisses.length} replay proxy miss(es) during this capture: ${newMisses.map((m) => `${m.kind} ${JSON.stringify(m.key)}`).join('; ')}`,
            );
          }
        }

        await context.close();
        count++;
        console.log(`    done in ${Date.now() - startedAt}ms`);
      } catch (err) {
        if (context) await context.close().catch(() => {});
        failures.push({ route: route.name, viewport: viewport.name, state, error: err });
        console.error(`FAILED ${label}: ${err.message}`);
        // No partial screenshot is written on failure — the try block only
        // reaches page.screenshot() after every wait above has resolved.
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`${count} of ${jobs.length} captures written to ${resolvedOutputDir}`);

  if (failures.length > 0) {
    console.error(`${failures.length} capture(s) failed:`);
    for (const f of failures) {
      const stateSuffix = f.state ? `__${f.state}` : '';
      console.error(`  - ${f.route}__${f.viewport}${stateSuffix}: ${f.error.message}`);
    }
    process.exit(1);
  }
}

main();
