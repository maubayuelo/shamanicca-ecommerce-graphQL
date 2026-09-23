#!/usr/bin/env node
/**
 * fixture-tools.mjs — post-processes recorded GraphQL fixtures so the
 * out-of-stock pinned product can serve two states from one recorded set,
 * without a second build. Never hand-edit fixture JSON directly — this
 * script is the only sanctioned way to produce the "product" (edited)
 * fixture, so the edit is reproducible and documented in one place.
 *
 * Usage:
 *   node scripts/fixture-tools.mjs instock --slug merkaba-rider-womens-t-shirt [--dir visual/fixtures/phase-6]
 *   node scripts/fixture-tools.mjs alias --slug merkaba-rider-womens-t-shirt --as merkaba-rider-womens-t-shirt-oos [--dir visual/fixtures/phase-6]
 *
 * "instock": finds the recorded GetProductBySlug response for --slug,
 * backs up the untouched original alongside it (<hash>.orig.json, created
 * once, never overwritten), then edits every variation's stockStatus to
 * IN_STOCK in the live fixture file. Idempotent — running it twice edits
 * from the same untouched backup, not from an already-edited file.
 *
 * "alias": takes the ORIGINAL (unedited) response for --slug — the backup
 * if "instock" already ran, otherwise the live file — and stores it under the
 * hash the app will look up when it requests --as. Unedited except for the
 * request key's slug variable and data.product.id, which is made unique so
 * Apollo's server-side cache cannot merge it with the real product. This must run using the
 * pre-edit data regardless of what order the two commands are invoked in,
 * which is why "instock" never overwrites its .orig backup.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = argv.slice(2);
  const cmd = args[0];
  if (cmd !== 'instock' && cmd !== 'alias') {
    console.error('Usage: node scripts/fixture-tools.mjs <instock|alias> --slug <slug> [--as <alias-slug>] [--dir visual/fixtures/phase-6]');
    process.exit(1);
  }
  const opts = { cmd, dir: path.join(rootDir, 'visual', 'fixtures', 'phase-6'), slug: null, as: null };
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--slug') opts.slug = args[++i];
    else if (args[i] === '--as') opts.as = args[++i];
    else if (args[i] === '--dir') opts.dir = path.isAbsolute(args[i + 1]) ? args[++i] : path.resolve(process.cwd(), args[++i]);
  }
  if (!opts.slug) { console.error('--slug is required'); process.exit(1); }
  if (cmd === 'alias' && !opts.as) { console.error('alias requires --as <alias-slug>'); process.exit(1); }
  return opts;
}

const opts = parseArgs(process.argv);
const graphqlDir = path.join(opts.dir, 'graphql');

// Must match graphql-replay.mjs's stableStringify/hashKey exactly, or a
// re-hashed alias key won't be the one the proxy looks up at replay time.
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}
function hashKey(keyObj) {
  return crypto.createHash('sha256').update(stableStringify(keyObj)).digest('hex').slice(0, 32);
}

function findFixtureBySlug(slug) {
  const files = fs.readdirSync(graphqlDir).filter((f) => f.endsWith('.json') && !f.endsWith('.orig.json'));
  for (const f of files) {
    const full = path.join(graphqlDir, f);
    const record = JSON.parse(fs.readFileSync(full, 'utf-8'));
    const vars = record.key?.variables || {};
    if (vars.slug === slug) {
      return { file: full, hash: f.replace('.json', ''), record };
    }
  }
  return null;
}

if (opts.cmd === 'instock') {
  const found = findFixtureBySlug(opts.slug);
  if (!found) {
    console.error(`No recorded GraphQL fixture found with variables.slug === "${opts.slug}". Run the record pass first.`);
    process.exit(1);
  }
  const backupPath = found.file.replace(/\.json$/, '.orig.json');
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(found.file, backupPath);
    console.log(`Backed up untouched original: ${backupPath}`);
  } else {
    console.log(`Backup already exists, editing from it (not from any prior edit): ${backupPath}`);
  }

  const original = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  const body = JSON.parse(original.body);
  const variations = body?.data?.product?.variations?.nodes;
  if (!Array.isArray(variations) || variations.length === 0) {
    console.error(`Fixture for "${opts.slug}" has no data.product.variations.nodes to edit — is this a VariableProduct recording?`);
    process.exit(1);
  }
  let edited = 0;
  for (const v of variations) {
    if (v.stockStatus !== 'IN_STOCK') { v.stockStatus = 'IN_STOCK'; edited++; }
  }

  const edited_record = { ...original, body: JSON.stringify(body) };
  fs.writeFileSync(found.file, JSON.stringify(edited_record, null, 2));
  console.log(`instock: edited ${edited}/${variations.length} variation(s) to IN_STOCK in ${found.file}`);
}

if (opts.cmd === 'alias') {
  const found = findFixtureBySlug(opts.slug);
  if (!found) {
    console.error(`No recorded GraphQL fixture found with variables.slug === "${opts.slug}". Run the record pass first.`);
    process.exit(1);
  }
  const backupPath = found.file.replace(/\.json$/, '.orig.json');
  const source = fs.existsSync(backupPath)
    ? JSON.parse(fs.readFileSync(backupPath, 'utf-8'))
    : found.record;

  const aliasKey = { ...source.key, variables: { ...source.key.variables, slug: opts.as } };
  const aliasHash = hashKey(aliasKey);

  // The app's server-side Apollo client is one long-lived InMemoryCache that
  // normalizes entities by __typename + id. If the alias kept the real
  // product's id, the aliased response and the real one would be the SAME
  // cache entity, and whichever was written last (ISR regeneration order)
  // would decide the stock state of BOTH pages. Giving the alias its own id
  // makes it an independent entity. This is the only field changed.
  const aliasBody = JSON.parse(source.body);
  const product = aliasBody?.data?.product;
  if (!product || typeof product.id !== 'string') {
    console.error(`Recorded response for "${opts.slug}" has no data.product.id to make unique.`);
    process.exit(1);
  }
  const originalId = product.id;
  product.id = `${originalId}-alias-${opts.as}`;
  const aliasRecord = { key: aliasKey, status: source.status, headers: source.headers, body: JSON.stringify(aliasBody) };
  const aliasFile = path.join(graphqlDir, `${aliasHash}.json`);
  fs.writeFileSync(aliasFile, JSON.stringify(aliasRecord, null, 2));
  console.log(`alias: stored original (unedited) response for "${opts.slug}" under the request key for "${opts.as}" -> ${aliasFile}`);
  console.log(`alias: data.product.id rewritten "${originalId}" -> "${product.id}" (see comment: keeps Apollo's normalized cache from merging the two products). Everything else is byte-for-byte the original, including data.product.slug ("${opts.slug}"), which products/[slug].tsx does not compare against the URL.`);
}
