#!/usr/bin/env node
/**
 * probe-overflow.mjs — numeric horizontal-overflow probe for the blog routes.
 * No screenshots. For every blog route at every width it prints
 * documentElement.scrollWidth against window.innerWidth (and the widest
 * element past the right edge when there is overflow), so the `1fr` grid
 * question on .blog-layout can be answered with numbers instead of pictures.
 *
 * Usage (replay proxy + production build up, same env as capture.mjs):
 *   node scripts/probe-overflow.mjs [--base http://localhost:3010] [--replay http://localhost:4001] [--media replay|record-missing] [--out file.json]
 *
 * Exit code 1 if any replay-proxy or media miss happened (a miss means the
 * numbers were measured on a broken page).
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { attachTracker, newProbeContext, parseProbeArgs, replayMisses, settlePage } from './lib/probe-common.mjs';

const { base, replay, out, media } = parseProbeArgs(process.argv);

const ROUTES = [
  ['blog', '/blog'],
  ['blog-category', '/blog/category/ancient-traditions'],
  ['blog-post', '/blog/the-wheel-of-the-year-a-complete-guide-to-wiccan-sabbats'],
  ['blog-all', '/blog/all'],
  ['blog-all-p2', '/blog/all?page=2'],
  ['blog-post-video', '/blog/be-resilient-positive-subliminal-affirmations'],
];
const WIDTHS = [320, 375, 620, 768, 1024, 1366, 1440];
const HEIGHT = 900;

await fetch(`${replay}/__misses/reset`, { method: 'POST' }).catch(() => {});
const browser = await chromium.launch();
const rows = [];
const problems = [];

for (const [name, routePath] of ROUTES) {
  for (const width of WIDTHS) {
    const { context, mediaMisses } = await newProbeContext(browser, { base, width, height: HEIGHT, media });
    const page = await context.newPage();
    const tracker = attachTracker(page);
    await page.goto(new URL(routePath, base).toString(), { waitUntil: 'load', timeout: 60000 });
    await settlePage(page, tracker);
    const m = await page.evaluate(() => {
      const de = document.documentElement;
      let worst = null;
      for (const el of document.body.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.position === 'fixed') continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        if (r.right > window.innerWidth + 0.5 && (!worst || r.right > worst.right)) {
          worst = { right: Math.round(r.right * 10) / 10, el: `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}` };
        }
      }
      const layout = document.querySelector('.blog-layout');
      return {
        scrollWidth: de.scrollWidth,
        innerWidth: window.innerWidth,
        clientWidth: de.clientWidth,
        layoutCols: layout ? getComputedStyle(layout).gridTemplateColumns : null,
        worst,
      };
    });
    const overflow = m.scrollWidth - m.innerWidth;
    rows.push({ route: name, width, scrollWidth: m.scrollWidth, innerWidth: m.innerWidth, overflow, layoutCols: m.layoutCols, worst: overflow > 0 ? m.worst : null });
    if (mediaMisses.length) problems.push(`${name}@${width}: ${mediaMisses.length} media miss(es)`);
    await context.close();
  }
}
await browser.close();

const misses = await replayMisses(replay);
if (misses.length) problems.push(`${misses.length} replay proxy miss(es)`);

const header = ['route', ...WIDTHS.map(String)];
console.log('documentElement.scrollWidth - window.innerWidth (0 = no horizontal overflow)\n');
console.log(header.map((h, i) => h.padEnd(i === 0 ? 16 : 7)).join(''));
for (const [name] of ROUTES) {
  const cells = WIDTHS.map((w) => {
    const r = rows.find((x) => x.route === name && x.width === w);
    return String(r.overflow).padEnd(7);
  });
  console.log(name.padEnd(16) + cells.join(''));
}
const offenders = rows.filter((r) => r.overflow > 0);
if (offenders.length) {
  console.log('\noverflowing cells (widest element past the right edge):');
  for (const r of offenders) console.log(`  ${r.route}@${r.width}: +${r.overflow}px  ${r.worst ? `${r.worst.el} right=${r.worst.right}` : ''}`);
}
console.log('\n.blog-layout grid-template-columns at >=1280:');
for (const r of rows.filter((x) => x.width >= 1366 && x.layoutCols && x.layoutCols !== 'none')) console.log(`  ${r.route}@${r.width}: ${r.layoutCols}`);

if (out) fs.writeFileSync(out, JSON.stringify(rows, null, 2));
if (problems.length) {
  console.error(`\nPROBE INVALID: ${problems.join('; ')}`);
  process.exit(1);
}
