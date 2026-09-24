#!/usr/bin/env node
/**
 * probe-affiliated.mjs — computed-style probe for the `.is-affilliated` (sic)
 * banner variant. No recorded route renders it (the fixtures' banners are all
 * bannerType "shamanicca"), so captures cannot reach it. This injects the
 * class onto the real, rendered banners and prints every computed property
 * that changes, for the content banner (.blog-banner) and the sidebar banner
 * (.blog-sidebar__banner). Run it on the BEFORE and AFTER builds of a phase
 * (--out) and diff the JSON.
 *
 * Usage (replay proxy + production build up, same env as capture.mjs):
 *   node scripts/probe-affiliated.mjs [--base http://localhost:3010] [--replay http://localhost:4001] [--media replay|record-missing] [--out file.json]
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import { attachTracker, newProbeContext, parseProbeArgs, replayMisses, settlePage } from './lib/probe-common.mjs';

const { base, replay, out, media } = parseProbeArgs(process.argv);

// Route + width chosen so the banner is actually rendered: the sidebar is
// display:none below 1280px.
const TARGETS = [
  { route: '/blog', width: 1440, selector: '.blog-banner', label: 'content banner (.blog-banner) @1440' },
  { route: '/blog', width: 375, selector: '.blog-banner', label: 'content banner (.blog-banner) @375' },
  { route: '/blog', width: 1440, selector: '.blog-sidebar__banner', label: 'sidebar banner (.blog-sidebar__banner) @1440' },
];
const CLASS = 'is-affilliated';

await fetch(`${replay}/__misses/reset`, { method: 'POST' }).catch(() => {});
const browser = await chromium.launch();
const results = [];
const problems = [];

for (const t of TARGETS) {
  const { context, mediaMisses } = await newProbeContext(browser, { base, width: t.width, height: 900, media });
  const page = await context.newPage();
  const tracker = attachTracker(page);
  await page.goto(new URL(t.route, base).toString(), { waitUntil: 'load', timeout: 60000 });
  await settlePage(page, tracker);
  const r = await page.evaluate(async ([selector, cls]) => {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`${selector} not found`);
    const read = () => {
      const snap = {};
      for (const root of [el, ...el.querySelectorAll('*')]) {
        const key = root === el ? '(banner)' : `${root.tagName.toLowerCase()}${root.className && typeof root.className === 'string' ? '.' + root.className.trim().split(/\s+/)[0] : ''}`;
        const cs = getComputedStyle(root);
        for (let i = 0; i < cs.length; i++) {
          const n = cs[i];
          if (n.startsWith('--')) continue;
          snap[`${key} | ${n}`] = cs.getPropertyValue(n);
        }
        const rect = root.getBoundingClientRect();
        snap[`${key} | rect`] = [rect.x, rect.y, rect.width, rect.height].map((v) => Math.round(v * 100) / 100).join(',');
      }
      return snap;
    };
    const had = el.classList.contains(cls);
    if (had) throw new Error(`${selector} already has ${cls}: the probe expects the non-affiliated recorded state`);
    const before = read();
    el.classList.add(cls);
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    const after = read();
    el.classList.remove(cls);
    const changed = [];
    for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (before[k] !== after[k]) changed.push({ prop: k, before: before[k], after: after[k] });
    }
    return { compared: Object.keys(before).length, changed };
  }, [t.selector, CLASS]);
  results.push({ ...t, ...r });
  if (mediaMisses.length) problems.push(`${t.label}: ${mediaMisses.length} media miss(es)`);
  await context.close();
}
await browser.close();

const misses = await replayMisses(replay);
if (misses.length) problems.push(`${misses.length} replay proxy miss(es)`);

for (const r of results) {
  console.log(`\n${r.label}: ${r.compared} computed values compared, ${r.changed.length} change(s) when .${CLASS} is added`);
  for (const c of r.changed) console.log(`  ${c.prop}: ${c.before}  ->  ${c.after}`);
}
if (out) fs.writeFileSync(out, JSON.stringify(results, null, 2));
if (problems.length) {
  console.error(`\nPROBE INVALID: ${problems.join('; ')}`);
  process.exit(1);
}
