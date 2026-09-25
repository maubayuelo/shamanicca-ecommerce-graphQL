#!/usr/bin/env node
/**
 * Build an offline BEFORE/AFTER flicker viewer from PNG captures.
 *
 * Usage:
 *   npm run flicker -- --before <dir> --after <dir> [--only id,...] [--all]
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = { before: null, after: null, only: null, all: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--before') options.before = args[++i];
    else if (arg === '--after') options.after = args[++i];
    else if (arg === '--only') options.only = new Set(args[++i].split(',').filter(Boolean));
    else if (arg === '--all') options.all = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.before || !options.after) {
    throw new Error('Usage: npm run flicker -- --before <dir> --after <dir> [--only id,...] [--all]');
  }
  return options;
}

function pngFiles(dir) {
  return new Map(
    fs.readdirSync(dir)
      .filter((name) => name.endsWith('.png'))
      .map((name) => [name.slice(0, -4), path.join(dir, name)]),
  );
}

function dataUrl(buffer) {
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function readPng(file) {
  const image = sharp(file).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

function pixelAt(image, x, y) {
  if (x >= image.width || y >= image.height) return null;
  const offset = (y * image.width + x) * 4;
  return image.data.subarray(offset, offset + 4);
}

function differs(a, b) {
  if (!a || !b) return true;
  return a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2] || a[3] !== b[3];
}

function diffPixelCount(before, after) {
  let count = 0;
  for (let y = 0; y < Math.max(before.height, after.height); y++) {
    for (let x = 0; x < Math.max(before.width, after.width); x++) {
      if (differs(pixelAt(before, x, y), pixelAt(after, x, y))) count++;
    }
  }
  return count;
}

async function makeDiffOverlay(before, after) {
  const output = Buffer.alloc(after.width * after.height * 4);
  for (let y = 0; y < after.height; y++) {
    for (let x = 0; x < after.width; x++) {
      const source = pixelAt(after, x, y);
      const previous = pixelAt(before, x, y);
      const offset = (y * after.width + x) * 4;
      if (differs(previous, source)) {
        output[offset] = 235;
        output[offset + 1] = 45;
        output[offset + 2] = 45;
        output[offset + 3] = 255;
      } else {
        const grey = Math.round(source[0] * 0.299 + source[1] * 0.587 + source[2] * 0.114);
        output[offset] = grey;
        output[offset + 1] = grey;
        output[offset + 2] = grey;
        output[offset + 3] = source[3];
      }
    }
  }
  return sharp(output, { raw: { width: after.width, height: after.height, channels: 4 } })
    .png()
    .toBuffer();
}

function viewerHtml(captures) {
  const json = JSON.stringify(captures).replace(/</g, '\\u003c');
  const initial = captures.length ? captures[0].id : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Capture flicker viewer</title>
<style>
  :root { color-scheme: dark; font: 14px/1.4 system-ui, sans-serif; }
  body { margin: 0; background: #202124; color: #f5f5f5; }
  header { position: sticky; top: 0; z-index: 3; padding: 12px 16px;
    background: #202124ee; backdrop-filter: blur(8px); border-bottom: 1px solid #444; }
  h1 { display: inline; margin: 0 18px 0 0; font-size: 16px; }
  button { color: inherit; background: #303134; border: 1px solid #666;
    border-radius: 4px; padding: 6px 10px; cursor: pointer; }
  button:hover { background: #45464a; }
  #index { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
  #index button { font-size: 12px; text-align: left; }
  #index button.active { outline: 2px solid #8ab4f8; }
  .badge { color: #9be7a2; }
  .badge.changed { color: #ff9d9d; }
  main { padding: 16px; }
  #title { margin: 0 0 8px; font-size: 16px; }
  #meta { color: #c8c8c8; margin-bottom: 12px; }
  #stage { position: relative; overflow: auto; background: #777; min-height: 240px;
    text-align: center; }
  .frame { display: inline-block; position: relative; margin: 0 8px 16px;
    vertical-align: top; text-align: left; }
  .frame img { display: block; width: auto; height: auto; max-width: none;
    image-rendering: auto; }
  body.fit .frame img { max-width: min(100%, 1440px); height: auto; }
  .frame-label { position: sticky; top: 0; z-index: 1; display: inline-block;
    padding: 3px 6px; background: #000b; font-weight: 700; }
  .after-layer, .diff-layer { display: none; }
  .flicker .before-layer { display: block; }
  .flicker .after-layer { display: none; }
  .flicker.show-after .before-layer { display: none; }
  .flicker.show-after .after-layer { display: block; }
  .diff .before-layer, .diff .after-layer { display: none; }
  .diff .diff-layer { display: block; }
  #empty { padding: 40px 0; color: #ddd; }
</style>
</head>
<body class="fit">
<header>
  <h1>BEFORE ↔ AFTER capture flicker</h1>
  <button id="pause" type="button">Pause</button>
  <button id="diff" type="button">D: diff</button>
  <button id="zoom" type="button">Z: 1:1</button>
  <span>Space toggles · D diff · Z zoom</span>
  <div id="index"></div>
</header>
<main>
  <h2 id="title"></h2>
  <div id="meta"></div>
  <div id="stage"></div>
  <div id="empty" hidden>No differing captures.</div>
</main>
<script>
const captures = ${json};
let selected = ${JSON.stringify(initial)};
let paused = false;
let diffMode = false;
let fitMode = true;
let showingAfter = false;
let timer;
const index = document.getElementById('index');
const stage = document.getElementById('stage');
const title = document.getElementById('title');
const meta = document.getElementById('meta');
const empty = document.getElementById('empty');

function current() { return captures.find((capture) => capture.id === selected); }
function renderIndex() {
  index.replaceChildren();
  captures.forEach((capture) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = capture.id === selected ? 'active' : '';
    button.innerHTML = '<span>' + capture.id.replaceAll('&', '&amp;').replaceAll('<', '&lt;') + '</span> ' +
      '<span class="badge' + (capture.diff ? ' changed' : '') + '">' +
      (capture.diff ? capture.diff + ' px differ' : 'identical') + '</span>';
    button.onclick = () => { selected = capture.id; render(); };
    index.append(button);
  });
}
function frame(label, source, className) {
  const wrapper = document.createElement('div');
  wrapper.className = 'frame ' + className;
  const caption = document.createElement('div');
  caption.className = 'frame-label';
  caption.textContent = label;
  const image = document.createElement('img');
  image.src = source;
  image.alt = label;
  wrapper.append(caption, image);
  return wrapper;
}
function render() {
  const capture = current();
  if (!capture) { empty.hidden = false; stage.replaceChildren(); return; }
  empty.hidden = true;
  title.textContent = capture.id;
  meta.textContent = capture.heightText + (capture.diff ? ' · ' + capture.diff + ' differing pixels' : ' · identical');
  stage.className = diffMode ? 'diff' : (showingAfter ? 'flicker show-after' : 'flicker');
  stage.replaceChildren(
    frame('BEFORE (main)', capture.before, 'before-layer'),
    frame('AFTER (branch)', capture.after, 'after-layer'),
    frame('DIFF', capture.diffImage, 'diff-layer'),
  );
  document.body.classList.toggle('fit', fitMode);
  document.body.classList.toggle('one-to-one', !fitMode);
  renderIndex();
}
function restartTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    if (!paused && !diffMode) { showingAfter = !showingAfter; render(); }
  }, 700);
}
document.getElementById('pause').onclick = () => {
  paused = !paused;
  document.getElementById('pause').textContent = paused ? 'Play' : 'Pause';
};
document.getElementById('diff').onclick = () => { diffMode = !diffMode; render(); };
document.getElementById('zoom').onclick = () => { fitMode = !fitMode; render(); };
document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') { event.preventDefault(); paused = true; showingAfter = !showingAfter; render(); }
  else if (event.key.toLowerCase() === 'd') { diffMode = !diffMode; render(); }
  else if (event.key.toLowerCase() === 'z') { fitMode = !fitMode; render(); }
});
render();
restartTimer();
</script>
</body>
</html>`;
}

async function main() {
  const options = parseArgs(process.argv);
  const beforeDir = path.resolve(options.before);
  const afterDir = path.resolve(options.after);
  const beforeFiles = pngFiles(beforeDir);
  const afterFiles = pngFiles(afterDir);
  const ids = [...new Set([...beforeFiles.keys(), ...afterFiles.keys()])]
    .filter((id) => !options.only || options.only.has(id));
  const captures = [];

  for (const id of ids) {
    const beforeFile = beforeFiles.get(id);
    const afterFile = afterFiles.get(id);
    if (!beforeFile || !afterFile) {
      captures.push({
        id,
        before: beforeFile ? dataUrl(fs.readFileSync(beforeFile)) : '',
        after: afterFile ? dataUrl(fs.readFileSync(afterFile)) : '',
        diff: 0,
        heightText: beforeFile ? 'AFTER missing' : 'BEFORE missing',
        diffImage: '',
      });
      continue;
    }
    const [before, after] = await Promise.all([readPng(beforeFile), readPng(afterFile)]);
    const diff = diffPixelCount(before, after);
    const diffImage = await makeDiffOverlay(before, after);
    captures.push({
      id,
      before: dataUrl(fs.readFileSync(beforeFile)),
      after: dataUrl(fs.readFileSync(afterFile)),
      diff,
      diffImage: dataUrl(diffImage),
      heightText: before.height === after.height
        ? `height ${before.height}px`
        : `height ${before.height} → ${after.height}px`,
    });
  }

  captures.sort((a, b) => Number(b.diff > 0) - Number(a.diff > 0) || a.id.localeCompare(b.id));
  const visible = options.all ? captures : captures.filter((capture) => capture.diff > 0);
  const outputPath = path.join(afterDir, '..', 'flicker.html');
  fs.writeFileSync(outputPath, viewerHtml(visible));
  console.log(`${visible.length} capture(s) in ${outputPath}`);
  if (!options.all && captures.length !== visible.length) {
    console.log(`${captures.length - visible.length} identical capture(s) hidden; use --all to show them`);
  }
  if (!visible.length) console.log('No differing captures; use --all to include identical captures.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
