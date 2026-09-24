/**
 * probe-common.mjs — shared setup for the numeric probes (probe-overflow.mjs,
 * probe-affiliated.mjs). Probes never take screenshots; they need the same
 * hermetic conditions as capture.mjs, so this mirrors three things from it
 * (keep them in sync): the consent/newsletter init script, the media-cache
 * REPLAY behaviour (a miss aborts the image and is reported, never fetched
 * live), and the blank-document embed blocker.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function parseProbeArgs(argv, extra = {}) {
  const opts = { base: 'http://localhost:3010', replay: 'http://localhost:4001', out: null, media: 'replay', ...extra };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--base') opts.base = argv[++i];
    else if (argv[i] === '--replay') opts.replay = argv[++i];
    else if (argv[i] === '--out') opts.out = argv[++i];
    else if (argv[i] === '--media') {
      opts.media = argv[++i];
      if (opts.media !== 'replay' && opts.media !== 'record-missing') {
        console.error('--media must be "replay" or "record-missing"');
        process.exit(1);
      }
    } else {
      console.error(`unknown argument: ${argv[i]}\nUsage: node ${path.basename(argv[1])} [--base http://localhost:3010] [--replay http://localhost:4001] [--media replay|record-missing] [--out file.json]`);
      process.exit(1);
    }
  }
  return opts;
}

// media: 'replay' (default; a miss is reported) or 'record-missing' (an
// image with no cache entry is fetched live and stored with exclusive writes,
// never overwriting; needed once when a probe visits a width no capture uses).
export async function newProbeContext(browser, { base, width, height, media = 'replay' }) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    window.localStorage.setItem('shamanicca-cookie-consent', JSON.stringify({ version: 1, analytics: false, timestamp: new Date().toISOString() }));
    window.localStorage.setItem('shamanicca_newsletter_dismissed', '1');
  });

  const mediaDir = process.env.CAPTURE_MEDIA_DIR
    ? path.resolve(process.env.CAPTURE_MEDIA_DIR)
    : path.join(os.homedir(), '.shamanicca-visual-cache', 'phase-6', 'media');
  const baseOrigin = new URL(base).origin;
  const mediaMisses = [];
  await context.route('**/*', async (route) => {
    const request = route.request();
    if (request.resourceType() !== 'image') return route.continue();
    const u = new URL(request.url());
    let key;
    if (u.origin === baseOrigin) {
      if (u.pathname !== '/_next/image') return route.continue();
      const src = u.searchParams.get('url') || '';
      if (!/^https?:\/\//.test(src)) return route.continue();
      key = `next-image ${u.pathname}${u.search}`;
    } else {
      key = request.url();
    }
    const id = crypto.createHash('sha256').update(key).digest('hex').slice(0, 32);
    const metaPath = path.join(mediaDir, `${id}.json`);
    const binPath = path.join(mediaDir, `${id}.bin`);
    if (fs.existsSync(binPath) && fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      return route.fulfill({ status: 200, contentType: meta.contentType, body: fs.readFileSync(binPath) });
    }
    if (media === 'record-missing') {
      if (fs.existsSync(binPath) || fs.existsSync(metaPath)) {
        mediaMisses.push(`${key} (incomplete cache entry; refusing to overwrite)`);
        return route.abort('failed');
      }
      const response = await route.fetch();
      const body = await response.body();
      if (response.status() !== 200 || body.length === 0) {
        mediaMisses.push(`${key} (HTTP ${response.status()}, ${body.length} bytes)`);
        return route.abort('failed');
      }
      const contentType = response.headers()['content-type'] || 'application/octet-stream';
      fs.writeFileSync(binPath, body, { flag: 'wx' });
      fs.writeFileSync(metaPath, JSON.stringify({ key, contentType }, null, 2), { flag: 'wx' });
      console.log(`[media] RECORDED ${key}`);
      return route.fulfill({ status: 200, contentType, body });
    }
    mediaMisses.push(key);
    return route.abort('failed');
  });

  await context.route('**/*', async (route) => {
    let host;
    try {
      host = new URL(route.request().url()).hostname;
    } catch {
      return route.fallback();
    }
    if (!/(^|\.)(youtube\.com|youtube-nocookie\.com|vimeo\.com)$/i.test(host)) return route.fallback();
    return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><html><head><meta charset="utf-8"><title></title></head><body></body></html>' });
  });

  return { context, mediaMisses };
}

// Waits for fonts, then for the page's own GraphQL/REST calls to finish, then
// for layout to hold still (3 equal scrollWidth/scrollHeight rAF readings).
export async function settlePage(page, tracker, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  await page.evaluate(() => document.fonts.ready);
  let quiet = 0;
  while (quiet < 2) {
    if (Date.now() > deadline) throw new Error('timed out waiting for in-flight GraphQL/REST requests');
    quiet = tracker.size() === 0 ? quiet + 1 : 0;
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
  }
  await page.evaluate(() => new Promise((resolve) => {
    const read = () => `${document.documentElement.scrollWidth}x${document.documentElement.scrollHeight}`;
    let last = read();
    let stable = 0;
    const tick = () => {
      const v = read();
      if (v === last) stable++;
      else { stable = 0; last = v; }
      if (stable >= 3) resolve(undefined);
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }));
}

export function attachTracker(page) {
  const inFlight = new Set();
  const tracked = (url) => url.includes('/graphql') || url.includes('/wp-json') || url.includes('/api/');
  page.on('request', (r) => { if (tracked(r.url())) inFlight.add(r); });
  page.on('requestfinished', (r) => inFlight.delete(r));
  page.on('requestfailed', (r) => inFlight.delete(r));
  return { size: () => inFlight.size };
}

export async function replayMisses(replay) {
  try {
    const res = await fetch(`${replay}/__misses`);
    return await res.json();
  } catch {
    return [];
  }
}
