#!/usr/bin/env node
/**
 * Every variable in a sibling repo's `.env.example` must be documented in
 * docs/08-configuration.md. Run from this repo with the other three checked
 * out beside it (the layout docs/06 describes): `pnpm check:env`.
 *
 * Written 2026-11-01 after docs/08 was found missing twelve variables that
 * the v3 work added to the `.env.example` files.
 */
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const docs = readFileSync(join(root, 'docs', '08-configuration.md'), 'utf8');
const repos = ['pactora-contracts-near', 'pactora-backend-near', 'pactora-interface-near'];

let missing = 0;
for (const repo of repos) {
  const file = join(root, '..', repo, '.env.example');
  if (!existsSync(file)) {
    console.error(`✗ ${repo}/.env.example not found — check out the four repos side by side`);
    process.exit(2);
  }
  const names = [...readFileSync(file, 'utf8').matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]);
  for (const name of new Set(names)) {
    if (!new RegExp(`\\b${name}\\b`).test(docs)) {
      console.error(`✗ ${repo}: ${name} is not in docs/08-configuration.md`);
      missing += 1;
    }
  }
}
if (missing) {
  console.error(`${missing} variable(s) undocumented`);
  process.exit(1);
}
console.log(`✓ every .env.example variable in ${repos.join(', ')} is in docs/08`);
