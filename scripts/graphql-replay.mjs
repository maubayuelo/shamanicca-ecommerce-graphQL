#!/usr/bin/env node
/**
 * graphql-replay.mjs — record/replay proxy for GraphQL + WP/WooCommerce REST,
 * so a capture run never depends on the live WordPress/WooCommerce backend.
 *
 * Usage:
 *   node scripts/graphql-replay.mjs record --upstream https://master.shamanicca.com [--port 4001] [--dir visual/fixtures/phase-6]
 *   node scripts/graphql-replay.mjs replay  [--port 4001] [--dir visual/fixtures/phase-6]
 *
 * One proxy, one port, routing by path:
 *   POST /graphql        -> GraphQL fixtures (visual/fixtures/phase-6/graphql/<hash>.json)
 *   anything else        -> REST fixtures (visual/fixtures/phase-6/rest/<hash>.json) —
 *                           this covers WP REST (getWPPage, api/cms/announcement,
 *                           api/cms/hero) and the WooCommerce REST fallback, since
 *                           in this app they're all the same origin.
 *
 * Record mode forwards every request upstream, stores the response keyed by a
 * hash of the *normalized* request (secrets stripped before hashing AND before
 * storage — see stripSecrets below), and returns the real response.
 *
 * Replay mode never contacts the upstream. An unknown key is a hard failure —
 * HTTP 500 plus a loud console.error naming the exact miss — logged to an
 * in-memory list servable at GET /__misses so capture.mjs can fail the whole
 * run on any miss instead of silently falling through to nothing.
 *
 * Request headers are never stored, in either mode — only method, path,
 * query (secrets stripped) and the upstream response (status, a small
 * whitelist of headers, and the body).
 */
import http from 'node:http';
import https from 'node:https';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = argv.slice(2);
  const mode = args[0];
  if (mode !== 'record' && mode !== 'replay') {
    console.error('Usage: node scripts/graphql-replay.mjs <record|replay> [--upstream <url>] [--port 4001] [--dir visual/fixtures/phase-6]');
    process.exit(1);
  }
  const opts = { mode, port: 4001, dir: path.join(rootDir, 'visual', 'fixtures', 'phase-6'), upstream: null };
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--port') opts.port = Number(args[++i]);
    else if (args[i] === '--dir') opts.dir = path.isAbsolute(args[i + 1]) ? args[++i] : path.resolve(process.cwd(), args[++i]);
    else if (args[i] === '--upstream') opts.upstream = args[++i].replace(/\/$/, '');
  }
  if (mode === 'record' && !opts.upstream) {
    console.error('record mode requires --upstream <url>');
    process.exit(1);
  }
  return opts;
}

const opts = parseArgs(process.argv);
const graphqlDir = path.join(opts.dir, 'graphql');
const restDir = path.join(opts.dir, 'rest');
fs.mkdirSync(graphqlDir, { recursive: true });
fs.mkdirSync(restDir, { recursive: true });

// ---------------------------------------------------------------------------
// Secret stripping — never let these reach a stored key or a stored body.
// ---------------------------------------------------------------------------

const SECRET_PARAM_PATTERN = /^(consumer_key|consumer_secret|.*token.*|.*auth.*|.*secret.*|.*key)$/i;

function stripSecretsFromParams(params) {
  const out = {};
  for (const [k, v] of Object.entries(params)) {
    if (SECRET_PARAM_PATTERN.test(k)) continue;
    out[k] = v;
  }
  return out;
}

function sortedQueryObject(searchParams) {
  const obj = {};
  for (const key of [...searchParams.keys()].sort()) {
    obj[key] = searchParams.getAll(key).sort();
  }
  return obj;
}

// ---------------------------------------------------------------------------
// Key + hash
// ---------------------------------------------------------------------------

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

function hashKey(keyObj) {
  return crypto.createHash('sha256').update(stableStringify(keyObj)).digest('hex').slice(0, 32);
}

function graphqlKey(body) {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = { query: body };
  }
  const { operationName = null, query = null, variables = {} } = parsed;
  return { kind: 'graphql', operationName, query, variables: variables || {} };
}

function restKey(method, urlObj) {
  const query = sortedQueryObject(urlObj.searchParams);
  return { kind: 'rest', method: method.toUpperCase(), pathname: urlObj.pathname, query: stripSecretsFromParams(query) };
}

// ---------------------------------------------------------------------------
// Fixture read/write
// ---------------------------------------------------------------------------

// Only `<32 hex chars>.json` is ever read or written. fixture-tools keeps its
// untouched backups as `<hash>.orig.json`; that name can never match this
// pattern, so a backup can neither be served nor collide with a live fixture.
const FIXTURE_HASH = /^[0-9a-f]{32}$/;

function fixturePath(kind, hash) {
  if (!FIXTURE_HASH.test(hash)) throw new Error(`refusing non-hash fixture name: ${hash}`);
  return path.join(kind === 'graphql' ? graphqlDir : restDir, `${hash}.json`);
}

function readFixture(kind, hash) {
  const p = fixturePath(kind, hash);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function writeFixture(kind, hash, keyObj, status, headers, body) {
  const RESPONSE_HEADER_ALLOWLIST = ['content-type'];
  const keptHeaders = {};
  for (const h of RESPONSE_HEADER_ALLOWLIST) {
    if (headers[h]) keptHeaders[h] = headers[h];
  }
  const record = { key: keyObj, status, headers: keptHeaders, body };
  fs.writeFileSync(fixturePath(kind, hash), JSON.stringify(record, null, 2));
}

// ---------------------------------------------------------------------------
// Upstream forwarding (record mode only)
// ---------------------------------------------------------------------------

function forwardUpstream(method, upstreamUrl, reqHeaders, bodyBuffer) {
  return new Promise((resolve, reject) => {
    const target = new URL(upstreamUrl);
    const client = target.protocol === 'https:' ? https : http;
    const forwardHeaders = { ...reqHeaders };
    delete forwardHeaders.host;
    delete forwardHeaders['content-length'];
    // Force uncompressed responses — this proxy forwards bytes verbatim with
    // Node's raw http/https client (no automatic gzip decompression like
    // fetch() does), so an upstream gzip response would otherwise get
    // stored and replayed as corrupt bytes.
    forwardHeaders['accept-encoding'] = 'identity';
    if (bodyBuffer) forwardHeaders['content-length'] = Buffer.byteLength(bodyBuffer);

    const req = client.request(
      target,
      { method, headers: forwardHeaders },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf-8') }));
      },
    );
    req.on('error', reject);
    if (bodyBuffer) req.write(bodyBuffer);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const misses = [];

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
}

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://localhost:${opts.port}`);

  if (urlObj.pathname === '/__misses' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(misses));
    return;
  }

  if (urlObj.pathname === '/__misses/reset' && req.method === 'POST') {
    misses.length = 0;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{"ok":true}');
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const bodyBuffer = Buffer.concat(chunks);

  const isGraphQL = urlObj.pathname === '/graphql' && req.method === 'POST';
  const kind = isGraphQL ? 'graphql' : 'rest';
  const keyObj = isGraphQL ? graphqlKey(bodyBuffer.toString('utf-8')) : restKey(req.method, urlObj);
  const hash = hashKey(keyObj);

  if (opts.mode === 'replay') {
    const fixture = readFixture(kind, hash);
    if (!fixture) {
      const miss = {
        kind,
        hash,
        key: keyObj,
        at: new Date().toISOString(),
      };
      misses.push(miss);
      console.error(`[graphql-replay] MISS (${kind}) hash=${hash} key=${JSON.stringify(keyObj)}`);
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'REPLAY_MISS', kind, hash, key: keyObj }));
      return;
    }
    res.writeHead(fixture.status, { 'content-type': fixture.headers['content-type'] || 'application/json' });
    res.end(fixture.body);
    return;
  }

  // record mode
  try {
    const upstreamUrl = `${opts.upstream}${urlObj.pathname}${urlObj.search}`;
    const upstreamRes = await forwardUpstream(req.method, upstreamUrl, req.headers, bodyBuffer);
    writeFixture(kind, hash, keyObj, upstreamRes.status, upstreamRes.headers, upstreamRes.body);
    res.writeHead(upstreamRes.status, { 'content-type': upstreamRes.headers['content-type'] || 'application/json' });
    res.end(upstreamRes.body);
  } catch (err) {
    console.error(`[graphql-replay] upstream request failed: ${err.message}`);
    res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'UPSTREAM_FAILED', message: err.message }));
  }
});

server.listen(opts.port, () => {
  console.log(`[graphql-replay] ${opts.mode} mode on :${opts.port}, fixtures at ${opts.dir}${opts.mode === 'record' ? `, upstream ${opts.upstream}` : ''}`);
});
