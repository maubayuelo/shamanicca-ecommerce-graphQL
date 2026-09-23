#!/usr/bin/env node
/**
 * capture.mjs — Playwright full-page screenshot capture for visual verification.
 *
 * Usage:
 *   node scripts/capture.mjs <outputDir> [--base http://localhost:3000]
 *
 * Reads visual/routes.json for the viewport list and route list, then writes
 * <outputDir>/<route>__<viewport>.png for every route x viewport combination.
 *
 * See docs/VISUAL-VERIFICATION.md for the manual protocol this automates.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = argv.slice(2);
  const positional = [];
  let base = 'http://localhost:3000';
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base') {
      base = args[i + 1];
      i++;
    } else {
      positional.push(args[i]);
    }
  }
  if (positional.length !== 1) {
    console.error('Usage: node scripts/capture.mjs <outputDir> [--base http://localhost:3000]');
    process.exit(1);
  }
  return { outputDir: positional[0], base };
}

const { outputDir, base } = parseArgs(process.argv);

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

async function scrollToBottomInSteps(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 300));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 1000));
  });
}

async function main() {
  const browser = await chromium.launch();
  let failures = [];
  let count = 0;
  let i = 0;
  const total = manifest.viewports.length * manifest.routes.length;

  try {
    for (const viewport of manifest.viewports) {
      for (const route of manifest.routes) {
        const label = `${route.name}__${viewport.name}`;
        console.log(`[${i + 1}/${total}] ${route.name}__${viewport.name} ...`);
        const startedAt = Date.now();
        try {
          const context = await browser.newContext({
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
            }
          );

          const page = await context.newPage();
          await page.addStyleTag({ content: HIDE_DEV_INDICATOR_CSS });

          const url = new URL(route.path, base).toString();
          await page.goto(url, { waitUntil: 'load', timeout: 60000 });
          await page.waitForTimeout(2000);
          await page.evaluate(() => document.fonts.ready);

          await scrollToBottomInSteps(page);
          await page.waitForTimeout(1000);
          await Promise.race([
            (async () => {
              await page.evaluate(async () => {
                await Promise.all(
                  Array.from(document.images)
                    .filter((img) => !img.complete)
                    .map((img) => new Promise((resolve) => {
                      img.addEventListener('load', resolve, { once: true });
                      img.addEventListener('error', resolve, { once: true });
                    }))
                );
              });
              await page.evaluate(async () => {
                const urls = new Set();
                for (const el of document.querySelectorAll('*')) {
                  const bg = getComputedStyle(el).backgroundImage;
                  const m = bg && bg.match(/url\(["']?(.*?)["']?\)/);
                  if (m && m[1] && !m[1].startsWith('data:')) urls.add(m[1]);
                }
                await Promise.all([...urls].map((src) => new Promise((resolve) => {
                  const img = new Image();
                  img.onload = img.onerror = resolve;
                  img.src = src;
                })));
              });
            })(),
            new Promise((resolve) => setTimeout(resolve, 30000)),
          ]);
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.waitForTimeout(500);

          const outputPath = path.join(resolvedOutputDir, `${label}.png`);
          await page.screenshot({ path: outputPath, fullPage: true });

          await context.close();
          count++;
          console.log(`    done in ${Date.now() - startedAt}ms`);
        } catch (err) {
          failures.push({ route: route.name, viewport: viewport.name, error: err });
          console.error(`FAILED ${label}: ${err.message}`);
        }
        i++;
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`${count} of ${manifest.viewports.length * manifest.routes.length} captures written to ${resolvedOutputDir}`);

  if (failures.length > 0) {
    console.error(`${failures.length} capture(s) failed:`);
    for (const f of failures) {
      console.error(`  - ${f.route}__${f.viewport}: ${f.error.message}`);
    }
    process.exit(1);
  }
}

main();
