# Pactora (NEAR): status, 2026-11-08

Single resume point for the four `pactora-*-near` repos. Re-verify every
claim against the code before relying on it. Deadline: **14 Nov 2026 23:59 UTC**.

## How to resume

Toolchain: `corepack pnpm` (9.12.0; the global shim is 8.15.6), Docker
Desktop, WSL Ubuntu for the contract tests. Run commands per repo are in
`agentx/README.md`; the deploy runbook is `agentx/DEPLOY.md` §2.

```bash
# backend (dev Postgres :5443 + NEAR sandbox :3030)
cd pactora-backend-near && docker compose up -d && corepack pnpm db:migrate && corepack pnpm check
# interface
cd pactora-interface-near && corepack pnpm dev -p 3001
```

Contract tests run in WSL only, with
`CARGO_TARGET_DIR=$HOME/.cache/pactora-target`. The sandbox tests use the
committed wasm via `PACTORA_WASM` / `MOCK_USDC_WASM`.

## Branch `human-work` (people as workers and clients)

`master` is what gets submitted on 14 Nov and is untouched by this branch.
`human-work` exists in all four repos and is pushed (private remote). Feature
list: [docs/26](26-human-work-integration-plan.md) (F1–F33). The milestone
plan M0–M10 is the owner's local plan file (the M-list below is its
summary). No contract change on this branch: the wasm hash stays
`wasm/SHA256SUMS`.

| Milestone | Backend | Interface | Docs |
|---|---|---|---|
| M0 setup | ✅ | ✅ | ✅ |
| M1 sessions, person role, startup guards | ✅ `373cd25` | ✅ `881608a` | ✅ `9ed7fb9` |
| M2 job pages, `/v1/me`, funding, SKILL.md | ✅ `8a8c8b2` | ✅ M4 commit (`/jobs`, `/jobs/[id]`, `/me`) | ✅ `6f21de0` |
| M3 listings, bids, multi-worker, instant, matching | ✅ `8a8c8b2` | ✅ M4 commit (`/jobs/new`, listing page, bids) | ✅ `6f21de0` |
| M4 evidence, drafts and review, chat | ✅ M4 commit | ✅ M4 commit (delivery panels on `/jobs/[id]`) | ✅ M4 commit (docs/04 §5.1e, 08, 15) |
| M5 events, webhooks, notifications, faucet | ✅ M5 commit (migration 0018, `apps/notifier`) | ✅ M5 commit (bell, `/notifications`, faucet on `/me`) | ✅ M5 commit (docs/04 §5.1f, 08, 15) |
| M6 profiles, directory, two-way reviews | ✅ M6 commit (migration 0019; CORS now allows PUT) | ✅ M6 commit (`/people`, `/people/[id]`, editor on `/me`, review card on jobs) | ✅ M6 commit (docs/04 §5.1g, 15) |
| M7 identity checks, sanctions screening, standing, retention | ✅ M7 commit (`packages/compliance`, migration 0020, keeper/signer holds, `sanctions:refresh`) | ✅ M7 commit (identity card on `/me`, `/kyc/simulated`, privacy page) | ✅ M7 commit (docs/04 §5.1h, 08, 15) |
| M8 admin console and DAO dispute desk | ✅ M8 commit (`/v1/admin/*`, council read live from the arbiter DAO) | ✅ M8 commit (`/admin`: desk, moderation, compliance) | ✅ M8 commit (docs/04 §5.1i, 15) |
| M9–M10 | ❌ | ❌ | ❌ |

M4 gate, run 2026-11-08 on this machine:

| Check | Result |
|---|---|
| Backend `pnpm check` | 1032 passed, 10 skipped |
| Backend `test:startup` | 19 guards, 10/10 runs clean (harness fixed: read output on `close`, 4 at a time, one retry on a native Node crash 0xC0000005) |
| `pnpm demo:local` (sandbox + MinIO) | `Demo passed.`, 42 checks; §8b: GPS stripped from a stored photo and its sha256 matches; a non-party is refused the photo; chat injection changes no job, price or purse; a stale-hash acceptance is refused; on-chain `result_hash` = accepted snapshot sha256 for both jobs; I1 holds |
| Interface `pnpm check` | 258 unit tests, lint and format clean |
| Interface e2e, 5 browsers, `--workers=2` | 820 passed, 2 skipped, 3 failed, then fixed or explained: a phone-width test aimed at the hidden header link (fixed, re-run green on iPhone and Android); one Firefox `edge.spec` timing flake under load (5/5 green alone) |
| Docs `check:env` | OK |
| Secret scan | clean |
| Contracts | untouched; wasm hash unchanged |
| Live testnet run | not possible yet: no funded testnet account (owner) |

M5 gate, run 2026-11-08:

| Check | Result |
|---|---|
| Backend `pnpm check` | 1118 passed, 10 skipped |
| Backend `test:startup` | 29 bad configurations refused (notifier and faucet cases added), 4/4 runs clean |
| `pnpm demo:local` | `Demo passed.`, 50 checks; 8c: the orchestrator's feed 1…46 with no gap, chain events in it; a webhook to a local receiver got all 22 events after its creation, every signature verified, a forged one refused; 8d: a new account claimed 5 mUSDC on chain (registered first), a second claim refused, the faucet is not the token owner |
| Interface `pnpm check` | 262 unit tests |
| Interface e2e, 5 browsers | 850 passed, 2 skipped; 3 failed then explained: 2 phone-width assertions in the new spec aimed at the hidden header link (fixed, 30/30 green), 1 Android `jobs.spec` timeout under load (3/3 green alone) |
| Deploy | `docker-compose.full.yml` gains the notifier and requires `WEBHOOK_SECRET_KEY`; `deploy/vps/README.md` lists it and the `OBJECT_STORE_SECRET_ACCESS_KEY` M4 already required but the README missed |

M6 gate, run 2026-11-08:

| Check | Result |
|---|---|
| Backend `pnpm check` | 1128 passed, 10 skipped |
| Backend `test:startup` | all 29 bad configurations refused |
| `pnpm demo:local` | `Demo passed.`, 53 checks; 8e: the client's review of the worker is blind (not on the profile, words withheld from the worker); after both, 5/5 and 4/5 show, author named from a published profile, no unchosen account shown; the directory finds the worker |
| Interface `pnpm check` | 268 unit tests |
| Interface e2e, 5 browsers | 882 passed, 2 skipped, 11 failed, then fixed or explained: 10 in the new profiles spec (2 ambiguous locators; and **a real bug: the API's CORS did not allow PUT**, so a browser could not save a profile; fixed, and a backend test now preflights every method the API serves, red on the old code); 1 WebKit smoke flake (5/5 alone). profiles spec 40/40 after |

M7 gate, run 2026-11-08:

| Check | Result |
|---|---|
| Backend `pnpm check` | 1164 passed, 10 skipped |
| Backend `test:startup` | all 32 bad configurations refused (screening off in production, one reviewer, provider without secret added) |
| Real lists (live) | OFAC SDN.CSV 19,563 entries + ALT.CSV 20,232 aliases, UN 733 + 274, parsed in full; **no NEAR address on any list** (16 assets, none NEAR); `pnpm sanctions:refresh` against the publishers: both stored, second run skipped both as unchanged |
| Known gap | at the plan's 0.92/word a one-letter change in a 4-letter word is missed ("Erik"/"Eric" 0.88); pinned by a test; the owner decides |
| `pnpm demo:local` | `Demo passed.`, 53 checks, after the keeper and signer gained the standing filters |
| Interface `pnpm check` | 271 unit tests |
| Interface e2e, 5 browsers | 918 passed, 2 skipped, 0 failed; privacy-page smoke tests 10/10 after the page gained the retention facts |
| Not done | a vendor KYC adapter (no vendor chosen, docs/26 D3); UK/EU lists; a held payout run end to end on the sandbox (the signer's refusal and the keeper's filter are tested against the fake RPC and the real database) |

M8 gate, run 2026-11-08:

| Check | Result |
|---|---|
| Backend `pnpm check` | 1173 passed, 10 skipped |
| Backend `test:startup` | all 32 bad configurations refused |
| `pnpm demo:local` | `Demo passed.`, 59 checks; 8g against a **real Sputnik DAO** on the sandbox: the console reads the council from the DAO, refuses an outsider and a stale evidence hash; the desk's `add_proposal` lands on the DAO; one vote does not rule, two (the desk's `act_proposal` calls) rule the job: refunded, worker DisputeLost |
| Interface `pnpm check` | 271 unit tests |
| Interface e2e, 5 browsers | 933 passed, 2 skipped, 5 failed (one admin test in each browser): its alert locator also matched Next's empty route announcer, fixed; then the admin axe scan failed ~1 in 8 on iPhone, sampling a button mid-transition because reduced motion was turned on after the click (the site's CSS does honour it), fixed: admin spec 20/20, the scan 30/30 repeated |

Resume after a crash: `git status` in all four repos, then Docker Desktop, then
`docker compose up -d` (Postgres :5443, MinIO :9110), then
`DATABASE_URL=postgres://pactora:pactora@127.0.0.1:5443/pactora_near pnpm db:migrate`.
There is no backend `.env`; set `DATABASE_URL` inline.

## Current state: local gate, all run on 2026-11-07/08

| Check | Result |
|---|---|
| Contract unit tests | 54 + 1 pass |
| Contract sandbox tests (near-workspaces) | 6/6 |
| Wasm sha256 vs committed | match (pactora `--no-wasmopt`, mock-usdc with wasm-opt) |
| Secret scan | clean |
| Backend `check` | 873 passed, 10 skipped |
| Backend demo (sandbox) | passed |
| `verify-near` | 18/18, 20/20 with `--dao` |
| Interface `check` | 151 |
| Interface e2e, 5 browsers (`--workers=2`) | 443 passed |
| Docs `check:env` | OK |
| Production Docker stack (`docker-compose.full.yml`) | 7 images build and run as uid 1000; `operational` against the sandbox; the indexer read the chain; `POST /v1/agents/wallet-key` stored the key encrypted; the VPS overlay publishes only 80/443 |

## Done

- Contracts, backend, interface and docs ported to NEAR and pushed (`master`).
- 2026-11-08: the production compose and Dockerfile fixed for NEAR (they
  still set the EVM variables, which every NEAR service refuses, and copied a
  `chain/export` the NEAR layout lacks). Pushed: `pactora-backend-near` 214dec8.
- The deploy runbook is `agentx/DEPLOY.md` §2 (outside git: copy it to the
  other PC). Its steps, in short: fill `.env`, then `create-dao.mjs`,
  `deploy.mjs`, `verify-near.mjs` with `--network testnet`.

## Next up (ordered)

1. Owner deploys the contracts to NEAR testnet (`agentx/DEPLOY.md` §2.1–2.2).
2. `verify-near` against testnet; `sync-chain-facts` copies
   `deployments/testnet.json` into the backend's `chain/`; commit that.
3. Backend demo on testnet (§2.3).
4. Host: backend on Vultr (`pactora-backend-near/deploy/vps/README.md`),
   interface on Vercel with `NEXT_PUBLIC_API_URL=https://$API_HOST` (§2.4).
5. Update the docs and READMEs with the deployed accounts; submit (docs/25).

## Uncommitted work

On `master`: none. On `human-work`, see the branch table above. 2026-11-08: the Docker/VPS fix is pushed (`pactora-backend-near`
214dec8), this file too (942dd88). `.env` files are never committed: fill
`pactora-contracts-near/.env` on the PC you deploy from.

## Blocked on the owner

- A NEAR testnet account with about 25 NEAR: `DEPLOYER_ACCOUNT_ID` /
  `DEPLOYER_SECRET_KEY` in `pactora-contracts-near/.env`. An empty `.env` is
  in place and gitignored.
- For Vultr: the server's `.env` (`SIGNER_TOKEN`, `SIGNER_KEY_PASSPHRASE`,
  `API_HOST`, `CORS_ORIGINS`, optional keeper account), on the server only.
- Optional: a NEAR AI Cloud judge key. Not implemented in the code.

## Working agreements

- Testnet only. Never generate or fund keys for the owner. Private keys go
  only into `.env` files, by the owner.
- Commit and push only with the owner's explicit OK, each time, to the
  `gopaltalaviya/<repo>` remote.
- A leftover local branch `verify-2026-11-07` exists in some repos. Do not
  delete it without the owner's OK.
