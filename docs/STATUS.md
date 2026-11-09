# Pactora (NEAR): status, 2026-11-09

Single resume point for the four `pactora-*-near` repos. Re-verify every
claim against the code before relying on it. Deadline: **14 Nov 2026 23:59 UTC**.

## How to resume

Toolchain: `corepack pnpm` (9.12.0; the global shim is 8.15.6), Docker
Desktop, WSL Ubuntu for the contract tests. Run commands are in each repo's
README ("Run it" in the backend, "Build and test" in the contracts, "Running
it" in the interface); the testnet deploy procedure is the contracts README's
**"Testnet"** section, and the hosting recipe is
`pactora-backend-near/deploy/vps/README.md` (its server `.env` block is the
authoritative list). Rules, submission and gaps: docs/24, docs/25, docs/28.

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

**Branch decision (owner, 2026-11-09): `human-work` is the submission.** It
exists in all four repos and is pushed (private remote); the
`hackathon-submission` tag goes on `human-work` after the testnet run; a
merge to `master` is the owner's later choice, not a submission step. (Until
2026-11-09 this file said `master` would be submitted.) Feature list:
[docs/26](26-human-work-integration-plan.md) (F1–F33); the inventory of
every promise against the code is [docs/28](28-feature-inventory-2026-11.md). The milestone
plan M0–M10 is the owner's local plan file (the M-list below is its
summary). The contract changed once on this branch, to 1.1.0 at `25df5c3`
after the audit of 2026-11-09 ([docs/27](27-audit-2026-11.md)); the new
hashes are in `wasm/SHA256SUMS`, and `migrate` carries a 1.0.0 deployment over.

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
| M9 Telegram and email | ✅ M9 commit (`apps/channels`, migration 0021, linking routes) | ✅ M9 commit (channels card on `/me`) | ✅ M9 commit (docs/04 §5.1j, 08, 15) |
| M10 docs and the final gate | ✅ (no change needed) | ✅ M10 commit (`/docs/people`) | ✅ M10 commit (docs/26 status table, STATUS) |
| Follow-up: F20, F28, F29, UK list | ✅ follow-up commit (ops scripts, migration 0022, `parseUk`, keeper recovery test) | ✅ follow-up commit (first funding on `/register`, list text) | ✅ follow-up commit (docs/04, 14, 26, STATUS) |

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

**Final gate (M10), run 2026-11-08, all in one sequence on this machine:**

| Check | Result |
|---|---|
| Interface `pnpm check` | 271 unit tests, typecheck, lint, format |
| Interface e2e, 5 browsers, `--workers=2` | 953 passed, 2 skipped, 0 failed |
| Backend `pnpm check` | 1190 passed, 10 skipped |
| Backend `test:startup` | all 36 bad configurations refused |
| Secret scans | backend 374 files, contracts 40 files: clean |
| `pnpm demo:local` (fresh sandbox, MinIO, real Sputnik DAO) | `Demo passed.`, 59 checks |
| Contracts `verify-near --network sandbox --dao` | 25 checks passed (contracts unchanged on this branch; wasm hash as committed) |
| Docs `check:env` | OK |

**What is left, in order:**

1. ~~The owner's go to push `human-work` to the private remote.~~ Pushed
   2026-11-09 on the owner's word, all four repos.
2. **Owner:** the testnet deploy from `human-work` (contracts README
   "Testnet": `create-dao`, `deploy`, `verify-near --network testnet --dao`),
   then `sync-chain-facts` in the backend and `DEMO_NETWORK=testnet pnpm demo`.
   Then the `hackathon-submission` tag on `human-work`, the video, the X post
   and the form (docs/25 §5). Everything else below can finish without it.
3. Owner decisions (docs/26 §4):
   - D3, a KYC vendor; until then the provider is simulated only;
   - the matching threshold trade-off ("Erik"/"Eric", docs/04 §5.1h);
   - a Telegram bot token, to verify the adapter live;
   - an email provider;
   - D6, the rights, before the repos go public.
4. Built 2026-11-09: the held payout end to end on the sandbox (`demo:local`
   step 8h, 64 checks) and a NEAR AI Cloud judge (`JUDGE_PROVIDER=near-ai`,
   off by default, docs/08; its fixtures follow the documented shape and
   are not from a live call until the owner OKs one).
   Not built: the EU sanctions list (its file needs a token). Built but only
   checked locally: the backup, restore-test and alert scripts (no server
   yet); their off-host target (`BACKUP_REMOTE`) and alert webhook
   (`ALERT_WEBHOOK_URL`) are the owner's to choose.

**Build round, 2026-11-09 (after the audit).** Four agents in parallel, one
per repo; the owner's list and what has landed on `human-work` at the time
this file was written (re-check `git log` in each repo; docs/28 §2 has the
row-by-row evidence):

| Item | State |
|---|---|
| Backend: text search `q` on listings and jobs, `status` filter on jobs (migration 0023, `search.test.ts`) | landed, `444cb74`; documented in docs/15 |
| Backend: listing and application events in the per-agent feed, exactly once (migration 0024, `agent-events.ts`, `listing-events.test.ts`) | landed, `7e82c3f` |
| Backend: person decline, per-owner agent cap, faucet standing check, session revoke on key change, profile skills/location/availability toggle, client dispute evidence, reports/block + admin queue, GDPR export `GET /v1/me/export` and scrub `DELETE /v1/me`, retention purge job, remote MCP over HTTP, x402 step in `demo:local`, NEAR AI judge attestation (signature verification) | in progress, this round; not in the tree yet. Each new route needs a row in docs/15 (the backend test enforces it) |
| Interface: README pages table and positioning, `.env.example` names, bond-split and 25-tools copy, error codes | landed, `86b08fb` |
| Interface: CSP nonce (`middleware.ts`, `lib/csp.mjs`), job templates, new browser specs (account, csp, home, join, layout, register, templates) | in progress (uncommitted in the tree) |
| Interface: the UI for the backend items above, docs pages fixes | in progress, this round |
| Contracts: README method table (56 methods + `ft_on_transfer`), build/CI facts, libraries (Q-005), Agent Market positioning; SECURITY counts | landed, `1e63215` |
| Docs: this round's rebase (docs/06, 08, 13, 14, 15, 16, 18, 20, 21, 25, 26, 27, README, `check:env`), docs/28 the inventory | landed with this file |

**Follow-up after M10, 2026-11-08:**

- F20: `/register` offers a first funding. After `register_agent`, the wallet
  signs a Fund (`ft_transfer_call`, `{"Fund":{"agent_id":<id>}}`) for the id
  the chain returned. A bad amount is refused before the wallet is asked
  (`e2e/connect.spec.ts`).
- F29: a keeper test where the first send expires and the backlog stays
  aged, and the next sweep clears it to 0. Mutation-checked: it fails when
  the reset to 0 is broken.
- F28: `deploy/vps/backup.sh`, `restore-test.sh` and `alerts.sh`, plus a
  404 for `/metrics` in the Caddyfile. Each was run against the dev
  Postgres and MinIO, a real API and indexer, a real Caddy (`caddy:2-alpine`)
  and a local webhook receiver. Every failure path was run and failed the
  run (deploy/vps/README.md lists them). Two script bugs were found that way
  and fixed: a failed run left a `.part` file, and a wrong passphrase read as
  "0 objects" instead of failing.
- UK Sanctions List: the real FCDO XML was inspected first, then parsed. All
  6,420 designations parse in 85 ms. Migration 0022 allows `source = 'uk'`
  (its test was red on the old schema). A live refresh stored all three
  lists, and a UK designation was found by the API's screen.

Gate, run 2026-11-08 after the follow-up, all in one sequence:

| Check | Result |
|---|---|
| Interface `pnpm check` | 271 unit tests, typecheck, lint, format |
| Interface e2e, 5 browsers, `--workers=2` | 963 passed, 2 skipped, 0 failed |
| Backend `pnpm check` | 1194 passed, 10 skipped |
| Backend `test:startup` | all 36 bad configurations refused |
| Secret scans | backend 377 files (new scripts included), contracts 40 files: clean |
| `pnpm demo:local` | `Demo passed.`, 59 checks |
| Contracts `verify-near --network sandbox --dao` | 25 checks passed |
| Docs `check:env` | OK |

**Deep testing, 2026-11-08 (after the follow-up).** Four test runs, each
with its own database, ports or containers. Every defect below was first
reproduced, then fixed with a test that failed on the old code.

- **Production stack** (`docker-compose.full.yml` + the VPS overlay, behind
  Caddy): only 80/443 published; `/metrics` and its variants 404 at the
  edge; security headers and CORS as configured. The backup, restore-test
  and alert scripts were run at their server defaults. A full rehearsal
  (back up, `down -v`, restore by the README, start again) matched all 51
  tables, the table digests and every evidence object's hash. The restored
  signer keys still decrypt.
- **Authorization matrix** (`apps/api/test/roles.test.ts`): every served
  route against 19 user types (visitor, bad credentials, agents, people as
  client and worker, non-party, held, blocked, reviewer, council, stale
  admin sign-ins, signed in with no person agent), plus cross-tenant checks.
  Kept in the suite, and it fails when a new route has no row. Fourteen
  guard mutations were each caught.
- **Every browser**:
  - all 5 Playwright projects;
  - a new every-page check (`e2e/user-agents.spec.ts`): console errors,
    failed requests, overflow, one h1, a title, axe;
  - repeated runs of the people and roles specs: 1257/1260. The 3 failures
    are two Firefox clicks under full load that did not reproduce alone,
    and one machine crash;
  - migrations on an empty Postgres: all 35 apply, the schema is identical
    to dev;
  - mutation tests on `parseUk`: every mutant is killed except one that the
    real data cannot tell apart.
- **Localhost against the real backend** (`e2e-live/`, outside
  `pnpm test:e2e`): the real API, signer, indexer and notifier on the
  sandbox (`scripts/live-ui-stack.mjs`). Sign-ins are real NEP-413
  signatures, and every transaction is signed with the account's own key
  and awaited on chain. Covered in all 5 browsers:
  - an agent operator;
  - a worker and a client end to end, paid on chain;
  - held and blocked accounts;
  - two reviewers clearing a real screening hit;
  - a non-party;
  - a visitor.
  The council's 2-of-3 DAO ruling runs in Chromium only, because it changes
  the global arbiter. Result: 61 passed, 4 skipped by design, 0 failed.

Defects found and fixed:

1. The production api did not start: compose never passed
   `COMPLIANCE_REVIEWERS`. Thirteen more settings could not be set on a
   server for the same reason: metrics tokens, Telegram linking, the
   identity provider and its secret, the gas floor, the rate-limit store.
   All are passed now, and `packages/shared/test/compose-env.test.ts` fails
   on any setting a service reads that compose does not pass.
2. `alerts.sh` posted the same fault every run (the numbers in the message
   changed), and lost an alert whose post failed. `backup.sh` failed on an
   empty bucket. Two backups in the same minute overwrote each other. The
   restore test did not count `signer_keys`. The overlay's Caddyfile path
   broke when run from the repo. The README restore steps raced Postgres,
   could not run as written (there is no `mc` on the host), and restored
   evidence unencrypted.
3. Authorization:
   - the council could read the chat, drafts and photos of jobs nobody had
     disputed;
   - compliance reviewers skipped the 1-hour sign-in rule;
   - a person with no person agent could not open any listing;
   - agent keys got 403 instead of 401 on people-only routes;
   - held and blocked accounts could still post listings, hire, fund jobs
     and select workers (the plan says standing gates posting);
   - a council member who was a party could draft a ruling on their own
     dispute. They now recuse; the DAO itself cannot tell who is a party.
4. A person's Accept never confirmed when the indexer recorded it first
   (an empty update threw a 500).
5. Interface:
   - `/register` reported a first funding that failed on chain as done;
   - a job action's error disappeared when the job reloaded;
   - after a confirm that failed with a 5xx or no answer, nothing offered
     "Check again", only a re-sign that the chain refuses;
   - the notifications bell asked for a feed admins without a person
     record cannot have, on every page;
   - the accessibility scan's job id was one the mock does not serve.

Gate after the deep testing, 2026-11-08:

| Check | Result |
|---|---|
| Interface `pnpm check` | 271 unit tests (person-action now 10), typecheck, lint, format |
| Interface e2e, 5 browsers | 1192 passed, 2 skipped. One WebKit worker crashed (0xC0000005, the machine); that test passed 5/5 alone |
| Backend `pnpm check` | 1211 passed, 10 skipped. Two notifier timing tests failed under load; 5/5 runs alone pass (11/11), and the notifier is unchanged |
| Backend `test:startup` | all 36 bad configurations refused |
| `pnpm demo:local` | `Demo passed.`, 59 checks |
| `verify-near --network sandbox --dao` | 25 checks |
| Live browser suite (`e2e-live/`, real backend) | 61 passed, 4 skipped by design, 0 failed |
| Secret scans, docs `check:env` | clean, OK |

Known, not fixed:

- The faucet has no standing check (test tokens only).
- A non-party on a job in the wrong state gets 409 before 403 (the state
  is public anyway).
- The indexer loops on a start block the node has garbage-collected. A
  fresh sandbox needs `INDEXER_START_AT_HEAD=1`, and testnet needs a check
  on a non-archival RPC.
- ~~Anyone can create wallet keys for accounts that do not exist on chain,
  which turns `/v1/status` degraded (the gas reading).~~ Fixed 2026-11-09
  (backend security audit, M1): the signer watches only wallets an agent row
  names, keys whose account never appears are swept after a day, the route
  is limited per client, and the key derivation no longer blocks the signer.

**Audit, 2026-11-09.** Five independent reviewers (contracts three ways:
code review, property tests, on-chain attacks; backend; interface), then one
fix pass per repo, every fix test-first. The full report, with each
finding's red evidence and what held, is [docs/27](27-audit-2026-11.md).

| Area | Found | Fixed | Documented |
|---|---|---|---|
| Contracts (now 1.1.0, `25df5c3`) | 1 medium, 5 low, 11 info | the medium, 4 low, 5 info | 1 low, 6 info |
| Backend (`aa8dfa3`) | 1 high, 2 medium, 5 low, 5 info | all but 2 info | 2 info |
| Interface (`bfc522a`) | 3 high, 8 medium, 8 low, 4 info | all high and medium, 7 low | 1 low, 4 info |

The headline items: a late DAO ruling could be front-run by the worker's
`expire_dispute` (a grace period and a 7-day testnet dispute timeout now);
a retried hire could be signed twice when the RPC lost the first answer
(the signer now asks the chain before calling a send failed); the browser
signed whatever the API prepared (an allow-list per action now); typed API
keys stayed in a page variable (gone). Nothing found could take or trap
escrowed money on the contract. The owner also chose a rule change: an
unanswered dispute now splits the client's bond, half to the worker.

New in the suites, so it stays found: the property suite
(`contracts/pactora/src/fuzz.rs`, 256 cases per run, CI included), 14 on-chain attack
tests (`tests/adversarial.rs`, run in CI against the previous wasm too),
`e2e/audit.spec.ts` (one test per interface finding, 25 red on the old
build), and the signer's uncertain-fate tests.

Gate after the audit, run 2026-11-09:

| Check | Result |
|---|---|
| Contracts (WSL / Docker) | unit 63, sandbox 6/6, adversarial 14/14, fuzz 256 cases, fmt and clippy clean; wasm rebuilt in the pinned image, `SHA256SUMS` updated |
| Interface `pnpm check` | 290 unit tests |
| Interface e2e, 5 browsers | 1309 passed, 0 failed, 16 skipped by design (the desktop header tests on the two phones) |
| Backend `pnpm check` | 1272 passed, 10 skipped |
| Backend `test:startup` | all 40 bad configurations refused |
| Secret scans | clean: 394 backend files, 43 contracts files |
| `pnpm demo:local` on the 1.1.0 wasm | `Demo passed.`, 64 checks (step 8h: a held worker's payout refused by the signer and skipped by the keeper, paid on chain once cleared) |
| Contracts `verify-near --network sandbox --dao` | 28 checks passed |
| Live browser suite (`e2e-live/`, real api, signer, indexer, notifier on the sandbox), 5 browsers | 61 passed, 0 failed, 4 skipped by design |
| Docs `check:env` | OK |

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
| Not done | a vendor KYC adapter (no vendor chosen, docs/26 D3); UK/EU lists; a held payout run end to end on the sandbox (the signer's refusal and the keeper's filter are tested against the fake RPC and the real database; built 2026-11-09 as `demo:local` step 8h) |

M8 gate, run 2026-11-08:

| Check | Result |
|---|---|
| Backend `pnpm check` | 1173 passed, 10 skipped |
| Backend `test:startup` | all 32 bad configurations refused |
| `pnpm demo:local` | `Demo passed.`, 59 checks; 8g against a **real Sputnik DAO** on the sandbox: the console reads the council from the DAO, refuses an outsider and a stale evidence hash; the desk's `add_proposal` lands on the DAO; one vote does not rule, two (the desk's `act_proposal` calls) rule the job: refunded, worker DisputeLost |
| Interface `pnpm check` | 271 unit tests |
| Interface e2e, 5 browsers | 933 passed, 2 skipped, 5 failed (one admin test in each browser): its alert locator also matched Next's empty route announcer, fixed; then the admin axe scan failed ~1 in 8 on iPhone, sampling a button mid-transition because reduced motion was turned on after the click (the site's CSS does honour it), fixed: admin spec 20/20, the scan 30/30 repeated |

M9 gate, run 2026-11-08:

| Check | Result |
|---|---|
| Backend `pnpm check` | 1190 passed, 10 skipped |
| Backend `test:startup` | all 36 bad configurations refused (channels: no database, malformed bot token, fake email in production; api: bad bot username) |
| Bug found and fixed | email verification counted a wrong code inside the transaction and then threw, which rolled the count back: a 6-digit code could be guessed without limit; now counted, committed, then refused (test red before, green after) |
| Interface e2e, 5 browsers | 953 passed, 2 skipped, 0 failed |
| Docs `check:env` | OK |
| Not verified live | the Telegram adapter (needs the owner's bot token; tested against a fake fetch); email has only a fake provider |
| demo:local | not re-run for M9: nothing in it touches the chain or the existing flows; it runs again in the M10 final gate |

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

- Contracts, backend, interface and docs ported to NEAR and pushed (`master`,
  then `human-work`: people as workers and clients, docs/26).
- 2026-11-08: the production compose and Dockerfile fixed for NEAR (they
  still set the EVM variables, which every NEAR service refuses, and copied a
  `chain/export` the NEAR layout lacks). Pushed: `pactora-backend-near` 214dec8.
- 2026-11-09: the audit and its fixes (docs/27; contract 1.1.0), the held
  payout end to end, the NEAR AI judge adapter, the documentation rebase
  (docs/08 on the NEAR code, docs/06 as the NEAR tree, Monad procedures
  under banners in 04/13/14/16/18/20/21, docs/15 re-checked route by route,
  docs/25 for the `human-work` submission, docs/28 the inventory).
- The deploy procedure is the contracts README's **"Testnet"** section (in
  git, in the repo a judge opens): fill `.env`, then `create-dao.mjs`,
  `deploy.mjs`, `verify-near.mjs` with `--network testnet`. The owner's
  local `agentx/DEPLOY.md` is a copy, not the source.

## Next up (ordered)

1. **Owner:** deploy the contracts to NEAR testnet from `human-work`
   (contracts README "Testnet").
2. `verify-near --network testnet --dao`; `node scripts/sync-chain-facts.mjs`
   copies `deployments/testnet.json` into the backend's `chain/`; commit that.
3. `DEMO_NETWORK=testnet pnpm demo` in the backend.
4. Optional: host — backend on a VPS (`pactora-backend-near/deploy/vps/README.md`),
   interface on Vercel with `NEXT_PUBLIC_API_URL=https://$API_HOST`. Local-only
   is acceptable (Q-012) with the public repo, README and video.
5. Put the deployed account ids in the READMEs and here; **owner:** tag
   `hackathon-submission` on `human-work`, make the repos public, record the
   video, post, submit (docs/25 §5).

## Uncommitted work

On `master`: none. On `human-work`, see the branch table above. 2026-11-08: the Docker/VPS fix is pushed (`pactora-backend-near`
214dec8), this file too (942dd88). `.env` files are never committed: fill
`pactora-contracts-near/.env` on the PC you deploy from.

## Blocked on the owner

- A NEAR testnet account with about 25 NEAR: `DEPLOYER_ACCOUNT_ID` /
  `DEPLOYER_SECRET_KEY` in `pactora-contracts-near/.env`. An empty `.env` is
  in place and gitignored.
- For Vultr: the server's `.env` (`SIGNER_TOKEN`, `SIGNER_KEY_PASSPHRASE`,
  `API_HOST`, `CORS_ORIGINS`, `MINIO_KMS_SECRET_KEY`, `BACKUP_REMOTE`,
  `ALERT_WEBHOOK_URL`, optional keeper account), on the server only.
- Optional: a NEAR AI Cloud judge key (`NEAR_AI_API_KEY`). The adapter is
  built and off by default (`JUDGE_PROVIDER=near-ai`, docs/08); the key is
  needed only for one live call that captures real fixtures.

## Working agreements

- Testnet only. Never generate or fund keys for the owner. Private keys go
  only into `.env` files, by the owner.
- Commit and push only with the owner's explicit OK, each time, to the
  `gopaltalaviya/<repo>` remote.
- A leftover local branch `verify-2026-11-07` exists in some repos. Do not
  delete it without the owner's OK.
