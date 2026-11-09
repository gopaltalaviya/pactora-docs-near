#!/usr/bin/env node
/**
 * Every environment variable the three code repos name must be documented in
 * docs/08-configuration.md §5. Run from this repo with the other three checked
 * out beside it (the layout docs/06 describes): `pnpm check:env`.
 *
 * Names are collected from:
 *   - each repo's `.env.example`, including commented `# NAME=` lines;
 *   - every `process.env.NAME` / `process.env['NAME']` / `env['NAME']` read in
 *     the backend's apps/{*}/src and packages/{*}/src, the interface's app/, lib/
 *     and next.config.mjs, and the contracts repo's scripts/ (tests and
 *     node_modules excluded);
 *   - `${NAME…}` references in the backend's compose files and VPS overlay.
 *
 * Written 2026-11-01 after docs/08 was found missing twelve variables; extended
 * 2026-11-09 after an audit found names the code reads that no `.env.example`
 * mentions (`RATE_LIMIT_STORE`, `WALLET_LOW_BALANCE_YOCTO`, `NEARDATA_API_KEY`,
 * the compose-only `API_PORT`, the interface's CSP origins, …).
 */
import {existsSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {dirname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docs = readFileSync(join(root, 'docs', '08-configuration.md'), 'utf8');
const repoRoot = join(root, '..');

/** Names that are the runtime's, a CI's or a test harness's, not ours to document. */
const IGNORE = new Set([
  'CI',
  'HOME',
  'PATH',
  'NODE_OPTIONS',
  'GITHUB_WORKSPACE',
  'VITEST',
  'VITEST_POOL_ID',
  'VITEST_WORKER_ID',
  'PLAYWRIGHT_TEST_BASE_URL',
]);

const NAME = /[A-Z][A-Z0-9_]*/;
const ENV_READ =
  /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[['"]([A-Z][A-Z0-9_]*)['"]\])|(?<![A-Za-z0-9_.])env(?:\[['"]([A-Z][A-Z0-9_]*)['"]\]|\.([A-Z][A-Z0-9_]*))/g;
const ENV_EXAMPLE_LINE = /^\s*#?\s*([A-Z][A-Z0-9_]*)=/gm;
const ENV_EXAMPLE_LIST = /^\s*#\s*((?:[A-Z][A-Z0-9_]*)(?:\s*,\s*[A-Z][A-Z0-9_]*)+)\s*$/gm;
const COMPOSE_REF = /\$\{([A-Z][A-Z0-9_]*)/g;

/** @type {Map<string, Set<string>>} name → where it was seen */
const seen = new Map();
const note = (name, where) => {
  if (!NAME.test(name) || IGNORE.has(name)) return;
  if (!seen.has(name)) seen.set(name, new Set());
  seen.get(name).add(where);
};

function* walk(dir, {skip = []} = {}) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.next' || skip.includes(entry)) continue;
    const path = join(dir, entry);
    const st = statSync(path);
    if (st.isDirectory()) yield* walk(path, {skip});
    else if (/\.(ts|tsx|mjs|cjs|js)$/.test(entry) && !/\.(test|spec)\.[cm]?[jt]sx?$/.test(entry)) yield path;
  }
}

/** A service's zod `Env` schema (`apps/<svc>/src/main.ts`): `  NAME: env.…` — a read without `process.env`. */
const ZOD_ENV_KEY = /^\s{2,}([A-Z][A-Z0-9_]{2,}):\s/gm;

function scanSource(file, label) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(ENV_READ)) {
    note(m[1] ?? m[2] ?? m[3] ?? m[4], `${label}:${relative(repoRoot, file)}`);
  }
  if (/[\\/]apps[\\/][^\\/]+[\\/]src[\\/]main\.ts$/.test(file)) {
    for (const m of text.matchAll(ZOD_ENV_KEY)) note(m[1], `${label}:${relative(repoRoot, file)}`);
  }
}

function scanEnvExample(repo) {
  const file = join(repoRoot, repo, '.env.example');
  if (!existsSync(file)) {
    console.error(`✗ ${repo}/.env.example not found — check out the four repos side by side`);
    process.exit(2);
  }
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(ENV_EXAMPLE_LINE)) note(m[1], `${repo}/.env.example`);
  // A commented list of names on one line: "# A, B, C" (the contracts example does this).
  for (const m of text.matchAll(ENV_EXAMPLE_LIST)) {
    for (const name of m[1].split(/\s*,\s*/)) note(name, `${repo}/.env.example`);
  }
}

function scanCompose(repo, files) {
  for (const rel of files) {
    const file = join(repoRoot, repo, rel);
    if (!existsSync(file)) continue;
    for (const m of readFileSync(file, 'utf8').matchAll(COMPOSE_REF)) note(m[1], `${repo}/${rel}`);
  }
}

// ── backend ──────────────────────────────────────────────────────────────
const backend = 'pactora-backend-near';
scanEnvExample(backend);
for (const group of ['apps', 'packages']) {
  const dir = join(repoRoot, backend, group);
  if (!existsSync(dir)) continue;
  for (const pkg of readdirSync(dir)) {
    for (const file of walk(join(dir, pkg, 'src'), {skip: ['test', '__tests__']})) scanSource(file, backend);
  }
}
scanCompose(backend, ['docker-compose.yml', 'docker-compose.full.yml', 'deploy/vps/docker-compose.vps.yml']);

// ── interface ────────────────────────────────────────────────────────────
const iface = 'pactora-interface-near';
scanEnvExample(iface);
for (const dir of ['app', 'lib']) {
  for (const file of walk(join(repoRoot, iface, dir), {skip: ['test', '__tests__']})) scanSource(file, iface);
}
const nextConfig = join(repoRoot, iface, 'next.config.mjs');
if (existsSync(nextConfig)) scanSource(nextConfig, iface);

// ── contracts ────────────────────────────────────────────────────────────
const contracts = 'pactora-contracts-near';
scanEnvExample(contracts);
for (const file of walk(join(repoRoot, contracts, 'scripts'))) scanSource(file, contracts);

// ── compare with docs/08 ─────────────────────────────────────────────────
const missing = [...seen.keys()].filter((name) => !new RegExp(`\\b${name}\\b`).test(docs)).sort();
for (const name of missing) {
  console.error(`✗ ${name} is not in docs/08-configuration.md  (${[...seen.get(name)].join(', ')})`);
}
if (missing.length) {
  console.error(`${missing.length} variable(s) undocumented`);
  process.exit(1);
}
const perRepo = (repo) => [...seen.values()].filter((w) => [...w].some((s) => s.startsWith(repo))).length;
console.log(
  `✓ every one of ${seen.size} variables named in ${backend} (${perRepo(backend)}), ${iface} (${perRepo(iface)}), ${contracts} (${perRepo(contracts)}) is in docs/08`,
);
