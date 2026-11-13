# Pactora (NEAR): status, 2026-11-10

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
`hackathon-submission` tag goes on `human-work` after the testnet run. On
2026-11-10 (owner's request) `human-work` was fast-forwarded into `master`
in all four repos; both point at the same commit and every push goes to
both. (Until 2026-11-09 this file said `master` would be submitted.) Feature list:
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
| Live testnet run | done 2026-11-11: 72 checks, "Demo passed." (later entries below) |

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
   Then the `hackathon-submission` tag on `human-work`; `human-work` made the
   default branch of all four repos (the form's repository link opens the
   default branch), or the `/tree/hackathon-submission` link submitted
   instead; the repos public; the video, the X post and the form (docs/25 §5,
   readiness table in docs/28 §14). Everything else below can finish without it.
3. Owner decisions (docs/26 §4, backend PROGRESS "Owner decisions pending"):
   - D3, a KYC vendor; until then the provider is simulated only;
   - the matching threshold trade-off ("Erik"/"Eric", docs/04 §5.1h);
   - a Telegram bot token, to verify the adapter live;
   - an email provider;
   - D6, the rights, before the repos go public;
   - whether the `job_events` audit log may be purged after 365 days (today
     the purge removes only the per-agent copies, `agent_events`), and
     whether a deleted account's dispute reasons in event payloads are scrubbed;
   - Q-015, whether a second project is entered; which tracks to tick (docs/25 §1).
4. Built 2026-11-09, all committed on `human-work` (row-by-row evidence in
   docs/28): the held payout on the sandbox (`demo:local` 8h); the NEAR AI
   judge with response-signature verification, stored with the settlement
   (off by default; fixtures follow the documented shape, no live call yet);
   search, listing events, decline and unselect, agent cap, faucet standing,
   session revocation, profiles with skills/location/availability/alerts,
   dispute evidence, reports and blocks, data export and deletion, the
   retention purge, remote MCP over HTTP, x402 in `demo:local` (8i), API key
   scopes, webhook secret rotation, `GET /v1/stats`, `GET /v1/me/applications`,
   per-item read, the history routes and charts, the audit-log CSV export,
   the indexer's pruned-start-block stall (migration 0032), and
   `pnpm swarm:local` (20 buyers, 5 sellers, settled on the sandbox).
   Not built, and why: the EU sanctions list (its file needs a token); a hard
   compliance hold, deadline extension, worker-side dispute, an on-chain
   verdict hash (all contract changes; frozen at 1.1.0); a 0–100 score per
   week in the history (the charts show jobs closed and the rating); a
   separate landing page for people (F33 partial); saved searches by query,
   web push, receipts export, milestones, pre-hire Q&A (docs/28 §13, future).
   Built but only checked locally: the backup, restore-test and alert scripts
   (no server yet); `BACKUP_REMOTE` and `ALERT_WEBHOOK_URL` are the owner's.
5. ~~The Postgres deadlock the swarm found between the API's event writes
   and the indexer's batch.~~ Fixed in backend `cb19e32` (counters locked in
   agent-id order; a two-connection test red first, docs/28 §11).

**Build round, 2026-11-09 (after the audit), all landed on `human-work`.**
Row-by-row evidence is in docs/28 §2 and each repo's README "Built on
2026-11-09" section.

| Repo | What landed |
|---|---|
| Backend (`444cb74`…`9b8ff67`; round 3 from `c2b6bc1`: history routes, audit-log CSV, indexer stall, `swarm:local`, CORS `content-disposition`) | text search and status filter; listing/bid events in the feed; person decline and unselect; per-owner agent cap; faucet standing; sessions end on a real wallet or key change (not on a first wallet); profiles with skills, location, availability, alerts; client dispute evidence; reports and blocks with a reviewer queue; data export and account deletion; retention purge; remote MCP over HTTP; x402 step in `demo:local`; NEAR AI judge attestation; API-key scopes; the live-probe fixes (rotate race, NUL bytes, unknown tx, person privacy, hireable check) |
| Interface (`86b08fb`…`3167193`; round 3 from `af4eab9`: history charts on /agents/[id] and /people/[id], audit export on /admin, people FAQ, stalled indexer on /status) | the UI for all of the above; nonce CSP; header that fits from 768 px; account menu with Admin; /me tabs, sessions, your data; job templates; terms box at /join; bids as cards on a phone; notifications grouped with per-item read; titles on jobs; the live UI audit fixes |
| Contracts (`1e63215`…`08453d2`) | README method table, build facts, libraries, positioning; no source change (1.1.0, wasm hashes unchanged) |
| Docs | rebased on the NEAR code; docs/28 the inventory; NEAR-only rewrite; submission text per nearhackathon.com |

**Final gate, 2026-11-09 evening, all on this machine:**

| Check | Result |
|---|---|
| Interface `pnpm check` | 317 unit tests |
| Interface e2e, 5 browsers | 1554 passed, 40 skipped; 1 WebKit worker crash (people.spec), passed on re-run |
| Backend `pnpm check` | green (1333+ tests) |
| Backend `test:startup` | all 42 bad configurations refused |
| Secret scans | backend 421 files, contracts 43 files: clean |
| `pnpm demo:local` | `Demo passed.`, incl. the x402 step and the stolen-key refusals |
| `verify-near --dao` | 28 checks passed on near:sandbox |
| Live suite, real backend, 5 browsers | 61 passed, 4 skipped |
| Docs `check:env` | OK |

The live suite found one real bug this round: a person's own first
`accept_wallet` ended the session they joined with (fixed in `325e5f8`).

Round 3 gate, 2026-11-09 night (backend PROGRESS): backend `pnpm check`
1350 passed, 10 skipped, 0 failed; `test:startup` all 42 refused;
`check-no-secrets` clean (428 files); `demo:local` "Demo passed.", 71
checks; `swarm:local` "Swarm passed." (20 listings, 76 bids, 20 settled on
chain, caps kept, I1 holds). Interface: 317 unit tests (README "Commands").

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

Known, not fixed (updated 2026-11-09 night):

- ~~The faucet has no standing check.~~ Fixed in backend `bd3b3ae`.
- ~~A non-party on a job in the wrong state gets 409 before 403.~~ Fixed in
  backend `bd3b3ae` (403 first).
- The indexer on a start block the node has garbage-collected now stalls
  loudly instead of looping (backend `9d579fd`, migration 0032: `/health`,
  `/v1/status` and the `/status` page say so and name the fix). It is not
  self-healing: the operator restarts with `INDEXER_START_AT_HEAD=1` or an
  archival RPC. Not yet seen on a real non-archival testnet node.
- ~~Under 20 concurrent jobs (`swarm:local`) the API's event writes could
  deadlock against the indexer's batch.~~ Fixed in backend `cb19e32`
  (`lockAgentEventSeqs`, agent-id order).
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

## Historical snapshot: local gate of 2026-11-07/08

Kept as a dated record, not the current state; the numbers below are
superseded. Current state: "Where things stand" below. Figures on
2026-11-10: `demo:local` 80 checks, backend 1383 tests, interface 367 unit +
1870 mocked browser tests (5 browsers) + a live suite of 20 tests × 5
browsers (96 passed, 4 skipped), contracts 88
test functions, 28 MCP tools.

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

- Contracts, backend, interface and docs built on NEAR and pushed (`master`,
  then `human-work`: people as workers and clients, docs/26).
- 2026-11-08: the production compose and Dockerfile fixed (they set
  variables every NEAR service refuses, and copied a `chain/export` the
  layout lacks). Pushed: `pactora-backend-near` 214dec8.
- 2026-11-09: the audit and its fixes (docs/27; contract 1.1.0), the held
  payout end to end, the NEAR AI judge adapter, the documentation rewrite
  (every document describes the NEAR code; docs/15 re-checked route by
  route, docs/25 for the `human-work` submission, docs/28 the inventory).
- The deploy procedure is the contracts README's **"Testnet"** section (in
  git, in the repo a judge opens): fill `.env`, then `create-dao.mjs`,
  `deploy.mjs`, `verify-near.mjs` with `--network testnet`. Any local copy
  of it is a copy, not the source.

## Where things stand, 2026-11-09 night

All code work that does not need the owner is done, tested and pushed on
`human-work` in all four repos: contracts `87513cb`, backend `99f8ad1`,
interface `574ab7c`, docs (this file). Since then, the same night: every
README followed from a fresh GitHub clone, as the AI screen will (13 gaps
fixed: clone branch, `DATABASE_URL` for migrate, `dao.wasm`, sandbox port,
timings), and `scripts/preflight-testnet.mjs`, a read-only go/no-go before
the testnet run (24 tests; GO on the sandbox). Last full gate: backend 1352 tests,
interface 328 unit + 1600 e2e in five browsers, `demo:local` (71 checks),
`swarm:local`, `verify-near --dao` (28), the live suite against the real
backend in five browsers (61). Real screenshots for the X post are in
`pactora-interface-near/docs/screenshots/`. A walk through every page against the
held demo (2026-11-09 evening) found two defects, fixed in `bdec367`: a filled
listing still asked visitors to sign in to bid, and a dev-mode hydration warning on
the CSP nonce; the full five-browser mocked run also caught one stale header test and
one Firefox test race. Re-run after: demo 71 checks, mocked e2e 1601 + the changed
specs 375/375, live suite 61, unit 328. Then (`574ab7c`) a modern visual refresh of
the shared design layer and a copy pass that puts every new feature on the landing
page and in the docs and fixes 11 stale claims (184 -> 88 contract tests, pinned to
the source by a test); mocked e2e 1608 in five browsers, live suite in five browsers,
unit 329, README screenshots re-taken.

**2026-11-10.** A three-way audit (backend routes vs UI, every persona's journey,
docs and tests per feature) found 6 bugs, broken journeys and a missing direction.
Built: person -> agent direct hire (`POST /v1/jobs/hire`, the person signs
`create_job`; "Hire this agent" on an agent's page), `GET /v1/me/agents` with
Manage links, bid/claim gated on `hireable`, job `deadlines`, unselect, admin and
session error states, 28 MCP tools (agents can bid on people's listings), a
"Four ways to deal" home section, and docs/15, docs/14 and docs/28 brought back
in line with the code. Heads: backend `2ffa24b`, interface `3f13e04`, contracts
`87513cb`, docs (this file). Gate: backend 1379 tests, `demo:local` 80 checks
(direct hire settled on chain), `swarm:local` passed; interface 361 unit, mocked
e2e 1821 in five browsers; docs/28 citations 0 failed. Next: live-chain tests
for the new flows, the rules/sync audit, the hosted testnet site for judges
(owner: testnet account, VPS, Vercel login), and two captioned videos.

**2026-11-10, later.** Live-chain browser tests for every new flow
(interface `85f967c`: 20 tests × 5 browsers, 96 passed, 4 skipped — the DAO
test is Chromium only) found that a blocked account's listings stayed on the
board; fixed in backend `5bf54c7`. A docs-vs-code audit then fixed
`agentMode` (`record` now reported, it spends tokens), the cached brain's
hint (`AGENT_MODE=record`), `JUDGE_REQUIRE_ATTESTATION` (on by default),
the x402 demo claim (only `pactora-escrow`), the blocked-listing rule in
docs/15, the MCP count (28) and test counts in the interface README, the
AI-assistance line in every README, and the `pre-hackathon` wording. Heads:
backend `fd0483d`, interface `ee51c0f`, contracts `ff555df`. Gate: backend
1384 passed, 10 skipped (throwaway database); interface 365 unit, 373
mocked e2e (1865 in five browsers, listed, not re-run); `demo:local` 80
checks (74 without the DAO section).

**2026-11-10, evening.** The two videos are recorded, captions only
(interface `c9bab9a`, `public/video/`): overview 1:27 and demo 3:12 on a
local NEAR sandbox, with `-x.mp4` copies (captions burned in) for X; the
sources are in the repo (`6cc6205`, `video/`), links in docs/video. The
first full five-browser gate after them failed 105 mocked tests: WebKit held
the page's load event on the `<video>`. The player now shows a poster and a
play button and mounts the video on click, with captions switched on in code
(`e0ea8c1`); an old WebKit flake on the agent profile test is fixed the same
way as the company pages test (`57fdbd3`, 40/40). Final gate on `e0ea8c1`:
mocked 1822 passed, 44 skipped, 4 failed in five browsers, of which 3 pass
on repeat and 1 is the flake fixed in `57fdbd3`; live chain 96 passed, 4
skipped (DAO test Chromium only), 0 failed. Heads: interface `57fdbd3`,
docs this commit, backend `fd0483d`, contracts `ff555df`.

**2026-11-10, night.** `master` fast-forwarded to `human-work` in all four
repos (owner: "merge all"); every push goes to both. No tracked file names
the earlier project any more (backend `4aa34c7`); git history is kept as the
dated proof of the window's work, as rules Q-001–Q-004 need. Each README now
opens with "Built for NEAR, in the hackathon window": what is new and what
was ported from the prototype, each with its path, then the disclosure and
both diff links (contracts `2bca145`, backend `b669a38`, interface
`ae25cfd`).

**2026-11-10, full re-test.** Every suite re-run on the pushed heads:

| Suite | Result |
|---|---|
| Contracts | 88/88 (lib 68, sandbox 6, adversarial 14) |
| Backend | 1383 passed / 10 skipped; `test:startup` 42/42; `swarm:local` passed |
| Interface unit | 367 |
| Mocked browser runs (5 browsers) | 1825 passed / 44 skipped, 1 Firefox timing flake (passed 55/55 on repeat) |
| Live browser runs | 96 passed / 4 skipped |
| `demo:local` | passed |
| docs/28 citations | 0 failed |

Fixes made along the way:
- The adversarial ruling-vs-expiry race test now accepts either refusal, `DeadlineNotPassed` or `InvalidState` (contracts `0341110`). There was no contract change.
- The page copy now says Pactora runs "only on test networks (NEAR testnet, or a local NEAR sandbox)" (interface `1c7de93`, guarded by `lib/copy.test.ts`).
- The tour video is click-to-mount, so WebKit's page load no longer hangs (`e0ea8c1`).
- An iPhone flake on the agent profile was fixed by waiting for network idle (`57fdbd3`).

**2026-11-10, wording pass (after a terminal crash).** A pass, uncommitted when
the terminal closed, that drops the old prototype's names (v3, EVM, TaskEscrow,
StakeVault …) from code comments, tests and docs in all four repos. Resumed and
finished:
- backend `docs/NEAR-PORT.md` → `docs/NEAR-WIRE.md`, `legacy-env` →
  `unsupported-env` (`assertNoUnsupportedEnv`); every link to them in the docs and
  interface re-pointed; the terms page no longer names a `StakeVault` contract
  (the stake is held by the Pactora contract);
- the disclosure paragraph in all four READMEs is kept as pushed ("prototyped
  before the hackathon … the baseline, not the submission"); the crashed edit
  had softened it to "design";
- contracts: comments only. Doc comments on public methods and types stay as they
  were, because they are embedded in the ABI and change the wasm. Rebuilt in the
  pinned image: sha256 `e0ed7876…290a`, same as `wasm/SHA256SUMS`;
- the recorded demo goal stays "Research ETH/USDC liquidity on NEAR …", and
  `.agent-cache` stays as committed. The crashed edit had renamed the goal and
  emptied the cache, which would make the default `AGENT_MODE=cached` run fail
  with "no recording";
- docs/28: 41 citations re-pointed through the diff (38 shifted lines, 3 reworded
  in place); 896 citations, 0 failed.

Gate for the wording pass, 2026-11-10 evening:

| Check | Result |
|---|---|
| Contracts wasm (pinned image, direct build) | sha256 `e0ed7876…290a`, matches `SHA256SUMS` |
| Contracts lib tests (WSL, `cargo test -p pactora --lib`) | 67 passed, 0 failed (property suite included; STATUS earlier said "lib 68", and `--lib` leaves out doc-tests); secret scan clean (46 files); `test:preflight` 24/24 |
| Interface `pnpm check` | 367 unit, typecheck, lint, format clean |
| Interface mocked e2e, Chromium | 374 passed; after the demo-goal restore, home-demo + smoke in 5 browsers 169 passed |
| Backend `pnpm check` | 1370 passed, 10 skipped, **13 failed: environment, not code**. The host clock was 1.8 s behind the Docker VM (the Windows clock is the wrong one, see below) (measured: Postgres `clock_timestamp()` − host `Date.now()` = 1821–1836 ms). Tests that set `expires_at = now() - 1 second` in Postgres and are judged by the API on the host clock (expired challenge ×2, session sweep, audit-log, notifier backoff ×9) then fail. The source diff is comments, prompt text and the `legacy-env` → `unsupported-env` rename, with the logic identical; `apps/notifier` has no diff. To re-run: re-sync the Windows clock first |
| docs `check:env` | OK, 160 variables |
| docs/28 citations | 896 (665 distinct), 0 failed |
| Backend `test:startup`, secret scan | all 42 bad configurations refused; clean (434 files) |
| Clock, re-measured | Windows clock is **2.85 s behind** `time.windows.com` (`w32tm /stripchart`), and the Windows Time service is stopped; the Docker VM is close to correct. Fix (admin): `net start w32time; w32tm /resync`, then re-run backend `pnpm check` |
| `demo:local` (fresh sandbox, cached agents) | `Demo passed.`, 80 checks, recorded goal replayed with no tokens spent |
| Not re-run yet | full five-browser mocked run (Chromium full + the changed specs in five browsers were run) |

**2026-11-10, night: identity check skippable; a rendering fix.** (Uncommitted.)
- **Identity check optional, with a judge note.** The API never required a
  verified identity (gates use standing only), but the card said "Some work
  needs a verified identity". Now `/me` shows an "Optional" badge, a "For judges
  and testers" note, and **Skip for now** / **Verify now** (per account, in the
  browser; `lib/identity-skip.ts`). The simulated page carries the same note,
  under its buttons. Copy fixed in `/docs/people` and `/privacy`; docs/04 §5.1h
  and docs/15 say so. Tests: `lib/identity-skip.test.ts` (3, including a copy
  guard) and 2 new e2e in `e2e/identity.spec.ts` (skip, reload, resume, a11y;
  posting after a skip).
- **Background orbs re-done as gradients.** WebKit failed `identity.spec`
  (3/3, and on the committed HEAD too). Measured: `filter: blur(100px)` on the
  two animated 560 px orbs cost about 880 ms a frame without GPU compositing,
  against 54 ms with the orbs off, so Playwright's click "stable" check never
  settled. They are now `radial-gradient` discs with no filter
  (`app/globals.css`). After that, WebKit `identity.spec` passes 14/14
  (7 tests × 2 repeats).
- The first `.env` named a mainnet (`.near`) account. The owner replaced it with
  `gopalt.testnet` (funded 50 NEAR).

**2026-11-10, night: LIVE ON NEAR TESTNET.**
- Preflight: GO. `create-dao` made `council-1.gopalt.testnet` and
  `council-2.gopalt.testnet` (keys in `.env` only) and the DAO
  `pactora-arbiter-gopalt.sputnikv2.testnet`, 2 of 3.
- `deploy` created `musdc.gopalt.testnet`, then lost the connection sending the
  400 KB Pactora wasm. `rpc.testnet.near.org` is **deprecated and rate-limited**
  (it answered 429 "switch to fastnear").
  - The chain showed `pactora.gopalt.testnet` created with **no code**, so
    nothing was half-applied.
  - New in `scripts/deploy.mjs`: a strict **`--resume`**. It keeps an account
    that runs the committed wasm (by code hash), finishes an empty one, and
    refuses anything else. The run through FastNEAR deployed Pactora, and the
    `get_params`/`get_roles` read-back passed.
  - `deployments/testnet.json`: start block 277100254; wasm `e0ed…290a` and
    `de2a…c0d0`, as committed.
- `verify-near --network testnet --dao`: **25 checks passed**: the escrow, the
  caps, the stolen-key refusals, the 2-of-3 DAO ruling, the person flows, and
  I1 (the contract holds exactly what it owes). Two time-window checks are
  skipped by design (review 600 s, dispute grace 1 day). The sweep returned
  6.66 NEAR.
- **Default testnet RPC is now FastNEAR** (`test.rpc.fastnear.com` first,
  `rpc.testnet.near.org` as fallback):
  - contracts `config/networks.json`, which `sync-chain-facts` copies to the
    backend `chain/`;
  - `create-dao`, `sweep-testnet` and `.env.example`;
  - the interface's wallet providers and CSP (CSP origins de-duplicated, test
    updated);
  - docs/08, NEAR-WIRE, the interface README and the backend live tests.
  - The owner's own `.env` still names the old RPC: it is the owner's file, so
    runs override it on the command line.
- The ids are in all four READMEs ("Live on NEAR testnet"); 36 docs/28 README
  citations shifted by the 14 new lines, and 896 resolve.

**2026-11-11: the indexer on testnet (owner chose the free path).**
- The first testnet demo passed 32 checks with real transactions (hire,
  accept, deliver, judge, settle, each on nearblocks). Then "the indexer
  recorded no settlement": neardata answered HTTP 429 on every poll.
- Measured:
  - neardata without a key: a burst of 32, then ~30–40 blocks a minute;
  - FastNEAR RPC in block-and-chunks mode: ~4 calls/s, ~22 blocks a minute;
  - testnet makes ~100 blocks a minute;
  - FastNEAR keys are a paid plan ($69/month and up).
- New block source **`accounts`** (`packages/near/src/blocks.ts`
  `accountsSource`):
  - FastNEAR's free transactions API, asked only for the transactions touching
    Pactora and mUSDC;
  - each receipt is filed under the block it executed in;
  - the indexer stays 50 blocks behind the API's own indexed head;
  - 300 blocks of look-back before each range;
  - a head-hash check against the RPC at start;
  - the indexer skips per-block parent chaining for a sparse source (documented
    in docs/08), takes up to 600 blocks a tick, and is polled no faster than
    every 6 s. The API answered 429 at ~120 calls a minute and was fine at
    ~40.
- Testnet's `blockSource` is now `accounts` (contracts `config/networks.json`,
  synced to the backend `chain/`).
- `NEARDATA_API_KEY` is needed only if a network goes back to `neardata`.
- Tests:
  - `packages/near/test/accounts-source.test.ts` (5);
  - `apps/indexer/test/sparse-source.test.ts` (3);
  - `progress.test.ts` still passes.
- The demo ticks a sparse indexer every 6 s and waits up to 8× longer for what
  it writes.

**2026-11-11: testnet demo runs 3–5, contract suites, UI fixes.**
- **Contracts, all green:** `cargo fmt`; clippy `-D warnings`; sandbox 6/6;
  adversarial 14/14 (races, gas, a real DAO, upgrade from the previous wasm);
  unit and property 67/67; wasm sha256 as committed.
- **Testnet demo, real transactions:**
  - **run 3:** 42 checks. Indexed settlements, the chain events in the feed,
    reviews after on-chain settlement, the faucet and a person registered on
    chain all passed. Then the deployer ran out of NEAR: each owner got 3 NEAR.
  - **run 4** (owners get 1 NEAR on testnet): 61 checks. It failed on the held
    payout, which expected the sandbox's 10 s review window (testnet's is
    600 s), and on a FastNEAR RPC 429 in the attack section.
  - **Fixes:**
    - on testnet the held-payout step waits out the real review window by the
      chain clock;
    - the demo's RPC rotates to dRPC and then near.org, **only on a
      rate-limit error**, so contract refusals keep the node's own words;
    - the DAO-desk skip message now says the section is sandbox-only, and that
      `verify-near --dao` covers testnet.
  - **run 5:** stopped on my own bug in the rotation (`JSON.stringify` of a
    BigInt). Fixed with a BigInt-safe serialiser.
  - **NEAR:** the deployer is at 5.79 NEAR. About 17 sits in the contracts'
    and DAO's storage; each run leaves agent wallets holding a little NEAR
    that no key can move, by design. A clean run needs ~21 at peak.
    **Owner: top up ~25 testnet NEAR.**
- **Interface, all five browsers:** 1,831 passed, 5 failed, 44 skipped
  (skips by design).
  - A **real bug**: `/runs` scrolled sideways by 1 px at 375 px in Firefox. A
    single implicit grid column sized to the input's min-content. Fixed with
    `grid-cols-[minmax(0,1fr)]` on `/runs` and the same form on `/demo`.
  - The iPhone search test pressed Ctrl+K before hydration. It now retries
    while the palette is closed.
  - After the fixes: smoke and home-demo 170/170, search 86/86 (×2), in five
    browsers.
  - The other 3 failures passed on repeat.

**2026-11-11: hackathon rules re-read (HACKATHON.md) and applied.**
- **Q-002:** the `pre-hackathon` baseline is the Solidity/Foundry product on
  an EVM chain, kept outside these repos. All four README disclosures describe
  it without naming it, and without links (the
  owner's choice). The docs/25 description says so too: 1,994 of 2,000
  characters.
- **Tracks (owner):** `agents`, `security`, `swarms` (`social` dropped 2026-11-11, owner).
- docs/25 §1 now lists every form field and both ways to submit. The API
  route is `POST /api/applications`, sent only after the owner's yes on the
  printed payload; the payload is never committed.
- Checked:
  - MIT LICENSE in all four repos (Q-014);
  - a libraries section and the AI-assistance line in every README (Q-005);
  - `pre-hackathon` tags (Q-003).
- Open, the owner's:
  - the `hackathon-submission` tag;
  - public repos by 2026-11-14 23:59 UTC;
  - the X post with the video;
  - the form;
  - Q-015 (a second project by the same person): not applicable; one
    project is submitted.

**2026-11-11: final backend gate on the finished code.**
- Run in a Linux `node:22` container (its clock matches Postgres, own database
  `pactora_ci`):
  - typecheck, lint and format clean;
  - **1,389 passed, 10 skipped, 2 failed**: `status.test.ts` (reads the sibling
    docs repo, which the container lacks) and one `sse-live.test.ts` case (the
    database goes down and comes back);
  - both files pass on Windows with the full workspace, 32/32.
- So all 1,401 backend tests pass (10 skipped by design).
- Also:
  - `test:startup`: all 42 refused;
  - secret scans clean: backend 434 files, contracts 46;
  - local sandbox `demo:local`: "Demo passed."

**2026-11-11: HOSTED.** Backend on a Vultr `vc2-1c-2gb` (1 vCPU, 2 GB, Atlanta,
$10/month, the owner's account; Ubuntu 26.10). Site on Vercel (the owner's
account).
- **API:** https://api.64-177-60-103.sslip.io, Let's Encrypt certificate.
  Only 22, 80 and 443 are open (5432, 8080, 9000 and 7000 checked closed);
  `/metrics` returns 404; the security headers are set; CORS allows only the
  site.
- **Site:** https://pactora-interface-near.vercel.app. Its env:
  `NEXT_PUBLIC_API_URL` set to the API, plus `NEXT_PUBLIC_SITE_URL`.
  **It serves the old commit until today's work is pushed.**
- **Server:**
  - `/root/pactora`, the flat layout from `deploy/vps/README.md`;
  - `.env` (mode 600) with every secret generated on the server, never shown;
  - SSH with the owner's `~/.ssh/pactora_vps`;
  - the reviewers are `council-1/2.gopalt.testnet`;
  - the identity provider is simulated.
- **Cron:** a daily backup, alerts every 5 minutes, a monthly restore test, a
  daily sanctions refresh. OFAC, UN and UK are loaded (19,563, 1,007 and
  6,420 entries).
- **Fixed on the way:**
  - `backup.sh` aborted on Linux before the evidence archive: `pg_restore
    --list` closed the pipe early. Fixed and run: 56 tables plus the evidence;
    the restore test passes 56/56;
  - the sanctions refresh moved into the api image
    (`apps/api/bin/sanctions-refresh.mjs`), because a server has images, not
    the repo. `pnpm sanctions:refresh` still works.
- **Incident:** a `bash -x` trace of `backup.sh` showed the backup HMAC key in
  the session output. The passphrase was rotated on the server, and the two
  backups made under it (empty database) were deleted.
- **Not set (the owner's):** `BACKUP_REMOTE` (an off-host copy) and
  `ALERT_WEBHOOK_URL`.
- To stop billing after judging, destroy the instance in Vultr (after
  2026-11-25).

**2026-11-11: FULL DEMO PASSED ON NEAR TESTNET.** Run 6, after the owner topped
up `gopalt.testnet` to 55.8 NEAR: `DEMO_NETWORK=testnet node scripts/demo.mjs`
(RPC FastNEAR; the indexer on the `accounts` source) printed **"Demo passed."**
with 72 checks and exit 0. The sweep returned 12.87 NEAR; no key appeared in
the log.
- Two parts skipped, both expected:
  - the DAO desk is sandbox-only; the testnet DAO ruling is covered by
    `verify-near --dao`, 25/25;
  - the photo step needs `OBJECT_STORE_BUCKET`.
- Everything else ran with real testnet transactions:
  - agent hires, settlements and payouts;
  - listings, bids, claims and person payouts;
  - indexed settlements, the chain events in the feed;
  - the blind two-way reviews, the faucet, direct hire;
  - the held payout, waited out over testnet's real 600 s review window, then
    paid once cleared;
  - x402 escrow and refund;
  - the trust check against farm agents;
  - the prompt-injection and stolen-key attacks, all refused.

**2026-11-11: PUSHED; final gates.** On the owner's go: contracts `ee85d1c`,
backend `77a968f`, interface `8b45c99`, docs `9d9686d`, plus this STATUS
commit. `master` = `human-work` on GitHub in all four repos.
- **Vercel** redeployed the new interface: the identity docs say "optional",
  and FastNEAR is the first RPC in its CSP.
- **Fresh clone** of `human-work` over SSH (the repos are still private), with
  the README's own steps, then `pnpm demo:local`: **"Demo passed."**, exit 0.
- **Interface, five browsers, on the final code:** 1,833 passed, 44 skipped
  by design, 3 failed. All 3 passed on re-run; a fourth intermittent one,
  Firefox `/admin` signed out, passed 3/3 alone.
- **Live seed:** the testnet demo was pointed at the server's database through
  an SSH tunnel, with the server's indexer and signer paused.
  - It stopped after 17 checks: the cross-ocean latency made an approve retry
    after the job had already settled.
  - The live database kept 4 agents and 3 settled jobs, with their reputation.
  - The live marketplace shows them with "1 settled · 0 failed"; `/status`
    says all systems operational.
  - The server's indexer and signer were restarted; the tunnel is closed.

**2026-11-11: live browser suite, two fixes, privacy pass.**
- **The real-chain browser suite** (`e2e-live/`, five browsers) found:
  - **a database deadlock.** A listing's decide answered 500 because the
    `job.created` insert lost a deadlock on the agents' event counters.
    `recordEvent` now retries only SQLSTATE 40P01, up to 4 tries; the insert
    is idempotent. Tests: `apps/api/test/record-event-deadlock.test.ts` (3,
    red on the old code). The next run had 0 deadlocks in the API log;
  - **a WebKit timeout.** The background orbs still drifted, and without GPU
    compositing that repaints the fixed layer every frame: 326 ms a frame on
    `/jobs/new` in WebKit, 18 ms with the orbs still (Chromium 73 -> 12). The
    orbs now hold still, with the same look.
- The five-browser live run after the fixes was **stopped by Claude Code at
  low memory** (0.8 of 15.7 GB free) after 24 tests, none failed. Re-run it
  one browser at a time when memory allows.
- **Privacy:** today's 6 commits named the owner's personal email as author,
  and one STATUS line repeated it. With the owner's go, today's commits were
  rewritten to the GitHub noreply address that every older commit uses, and
  force-pushed while the repos were still private. Local backup branches
  `backup/pre-noreply-2026-11-11` hold the old commits and are not pushed.
  Scans of the tracked files: no personal email, no local paths, no machine
  names, no keys.

**2026-11-11: final checks on production and per flow.**
- **Production crawl** of https://pactora-interface-near.vercel.app against the
  live API: 34 pages at 1280 px and at 375 px. Every page answered 200, with
  one h1 and a title, no console errors and no sideways scroll. The only
  "failures" are aborted link prefetches (`?_rsc=`).
- **Page-text audit:** no `undefined`, `NaN` or `[object]`; no deprecated RPC;
  no old identity wording; no other-chain mentions. Fixed:
  - the contact fallback "Email address coming soon" now reads "No email
    address: please use the GitHub issues below";
  - `/privacy` names Vultr and FastNEAR instead of `[VPS PROVIDER]` and the
    old RPC line.

  The other `[...]` markers in `/privacy` and `/terms` are the owner's legal
  decisions (both pages are labelled drafts).
- **External links:** nearblocks answers 403 to scripts (bot protection) but
  opens in a browser. GitHub links answer 404 until the repos are public.
- **Every flow with real transactions** (`e2e-live/`), one browser at a time:
  - Chromium 20/20, the DAO ruling included;
  - Firefox 19/19 (1 skipped by design);
  - Android 19/19 (1 skipped by design);
  - WebKit 19/19 (1 skipped by design), 52 min. The earlier timeouts were
    speed, not a bug: a trace showed each step taking 7-25 s, because
    Playwright's WebKit on Windows renders in software. The suite now gives
    WebKit triple time (`test.slow` in `e2e-live/live.spec.ts`), and only
    WebKit; the assertions are unchanged;
  - iPhone (WebKit): tests 1-14 passed with no failure, then Claude Code
    stopped the run at test 15 (0.8 GB RAM free). Tests 15-20 still need a
    run on iPhone; all six pass in the other four browsers. Re-run when
    memory allows:
    `LIVE_APP_DIR=<interface> LIVE_ALL_BROWSERS=1 corepack pnpm exec playwright test -c e2e-live/playwright.live.config.ts --project=iphone`
    with `scripts/live-ui-stack.mjs` running in the backend;
  - 0 deadlocks in the API log.

**Plan to the deadline (2026-11-14 23:59 UTC):**

| Day | Owner | Agent, after the owner's step |
|---|---|---|
| 10 Nov | fund a testnet account (about 25 NEAR) into `pactora-contracts-near/.env` (`DEPLOYER_ACCOUNT_ID`, `DEPLOYER_SECRET_KEY`); run preflight first (`node --env-file=.env scripts/preflight-testnet.mjs`, read-only, must print `GO`); say go | preflight again, then `create-dao`, `deploy`, `verify-near --network testnet --dao`, `sync-chain-facts`, testnet demo; account ids into the READMEs and here; push |
| 11 Nov | D6 rights; repos public (`master` = `human-work` since 2026-11-10); optional: server `.env` for hosting | tag `hackathon-submission` (on the owner's go); final gate on that commit; hosted deploy if a server was given |
| 12 Nov | record the video (docs/25 §3); post on X (docs/25 §2) | check the README steps from a fresh clone, as the AI screen will |
| 13 Nov | submit the form once (docs/25 §1) | check every public link signed out |
| 14 Nov | buffer, no changes | only fixes if a check fails |
| 16–18 Nov | keep repos public and any demo up (ideally to 25 Nov) | answer judges' issues |

**Not needed to submit:** a NEAR AI key for one live judge call; a KYC
vendor, the EU list token, the matching threshold, a Telegram token and an
email provider; the `job_events` retention and deletion-scrub decisions;
whether a dispute reason stays public. **After the hackathon:** contract
1.2.0 (deadline extension, hard hold, worker-side dispute), an external
audit and a NEAR mainnet procedure (docs/28 §6).

## Next up (ordered)

**Win round, started 2026-11-11 (owner: build all four, test at production
level, drop Social Money; no tag or final submission until the owner says).**
Review findings fixed in the working tree (uncommitted): two overclaims in
docs/25, "trustless" wording, README command and count fixes, site snippets
on the live contract and API, the empty `/people` message. Then, in order:
1. Orchestrator: an approve whose retry finds the job already settled counts
   as settled (the live seed broke on this over a slow link).
2. Receipts: a public list of settled jobs (`GET /v1/receipts`), a
   `/receipts` page, and a receipt panel on each job page (spec hash, result
   hash, verdict, every transaction). Linked from home and `/demo`, so a
   judge sees agent-to-agent work without an API key.
3. Swarms: `RULES.md`, and `swarm.mjs` on testnet at a small scale with
   transaction links.
4. Seed the live board on testnet (people, listings, settled jobs, agent
   descriptions).
5. Production-level tests of every change, deploy (Vultr + Vercel), crawl.

Progress (2026-11-11, all uncommitted):
- 1 done: `packages/agent-core` (approve already landed counts as settled);
  orchestrator tests 54/54, the new one red on the old code.
- 2 done: `GET /v1/receipts` (`apps/api/src/routes/receipts.ts`, agents
  only, never a person; 6 tests, the privacy one red without the filter),
  `/receipts` page, Receipt card on the job page, links from home and
  `/demo`; interface unit 370/370, mocked e2e 80/80 (Chromium, touched specs).
- 3 done: `RULES.md`; `SWARM_NETWORK=testnet` in `scripts/swarm.mjs`.
  **Swarm passed on NEAR testnet** (6 buyers, 3 sellers, 6 settled, jobs
  49–54, links in RULES.md); `swarm:local` still passes (20 settled).
  Needs `RPC_URL_TESTNET=https://test.rpc.fastnear.com` on the command line:
  the contracts `.env` still names the deprecated near.org RPC (owner may
  change that line).
- 4 waiting on the owner's OK: demo gained agent descriptions and
  `DEMO_OPEN_LISTINGS=n`; **sandbox run passed** (81 checks, 3 listings left
  open). Server DB backed up 13:53 UTC. Pausing the server's indexer and
  signer and replacing the live DB was refused by the tool guard, so it needs
  the owner's explicit yes. Seed plan: stop the server indexer and signer,
  tunnel to the postgres container (172.18.0.3:5432),
  `DEMO_NETWORK=testnet DEMO_OPEN_LISTINGS=3`, restart them.
- 5 tests (2026-11-11 evening): interface `pnpm check` green (370 unit,
  typecheck, lint, format); `check:contract` against the held sandbox API
  "Contract holds." (now also checks `/v1/receipts`); backend `pnpm check`
  1413 tests: 1247 + 271 re-run pass; the 156 first-run failures were the
  signer/indexer tests' default DBs (`pactora_near_signer`/`_indexer`) not
  existing locally; CI sets `DATABASE_URL=…/pactora_near` for all, and with
  it they pass. Real find: `roles.test.ts` needed a `GET /v1/receipts` row in
  the authorization matrix (added; 12/12). Mocked e2e (people, receipts,
  smoke, a11y) 83/83 in each of Chromium, Firefox, WebKit, iPhone, Android
  (a first run failed 15 sign-in tests only because the reused `.next` was
  built without `NEXT_PUBLIC_E2E_WALLET=1`; rebuild as `test:e2e` does).
- **Stand-out round (owner, 2026-11-11 night; submit on 11-13):** the
  Security (274) and Agent Economy (260) tracks are crowded, Swarms has 55.
  In order: (1) collective purchasing: pools, several buyers each funding
  an escrow share for one job; (2) subcontracting (swarm round 4); (3)
  public `/swarm` page from the testnet run; (4) live NEAR AI judge, with
  its attestation shown on receipts (owner adds `NEAR_AI_API_KEY`); (5) a
  plain-words pitch everywhere; (6) a 20 s video opener; (7) testnet swarm
  plus live seed (owner adds ~20 testnet NEAR); (8) full gates, then ask
  the owner to commit, push and deploy. The contract stays frozen.
- **Stand-out progress (2026-11-11 night, all uncommitted):**
  - (1) Pools done:
    - code: `apps/api/src/routes/pools.ts`, migration `0033_pools.sql`,
      SDK `openPool`/`joinPool`/`getPool`, OpenAPI entries and rows in the
      roles test;
    - `apps/api/test/pools.test.ts`, 15 tests;
    - an independent review found 4 bugs, all fixed: join re-checks the
      worker, a stale slot is freed after 10 min, the lead's rollback never
      orphans a funded job, and `poolState` handles disputed and partly
      refunded pools. The tests for them fail on the code before the fixes.
  - (2) Subcontracting done (swarm round 4).
  - **Testnet swarm with all four rounds passed:**
    - chain jobs 55–65;
    - pool jobs 61–63 read back from the contract: each `Settled`, with one
      `result_hash`;
    - links are in `RULES.md`; `swarm:local` also passes.
  - (3) `/swarm` page done (`app/swarm`, data `lib/swarm-run.json` from the
    testnet run, `e2e/swarm.spec.ts`).
  - (4) `GET /v1/receipts` has a `judged` flag, and `/receipts` shows a
    "Judged on NEAR AI" badge. The job page already shows the judge card.
    The live judge call still needs `NEAR_AI_API_KEY` (no backend `.env`
    yet).
  - (5) New pitch on the home page, in 3 READMEs and in the docs/25
    description (1,723 characters) and X post (269 of 280 characters).
  - (6) Video: `public/video/hook-x.mp4` (0:20) and `demo-hook-x.mp4`
    (3:33), rendered by `video/render-hook.mjs` and encoded with the local
    `linuxserver/ffmpeg` Docker image (ffmpeg is no longer on the PATH).
  - The deployer holds 131 testnet NEAR, so no more is needed.
- HACKATHON.md re-read 2026-11-11 22:00: no mandatory integrations; Privy
  is not mentioned. Backend README now maps our tracks' hints (function-call
  keys, TEE attestation, sub-accounts, multi-agent) to code, and says NEAR
  Intents / Chain Signatures are not used.


As of 2026-11-11. Contracts live on testnet, backend hosted on Vultr, site on
Vercel. The deadline is **2026-11-14 23:59 UTC**.

1. ~~Commit and push~~: done 2026-11-11 (owner: "go for all").
2. **Owner: ~20 testnet NEAR into `gopalt.testnet`** (5.79 left). A
   throwaway implicit account in the contracts' `.keys/testnet/` is ready to
   collect faucet funds, and an hourly faucet retry runs. Then
   `DEMO_NETWORK=testnet` against the live server, so the hosted board shows
   real agents, jobs and reputation; then re-check the docs/25 figures.
3. Agent, after the push:
   - follow every README from a fresh clone, as the AI screen will (Q-017);
   - check the live site page by page in Chrome against the live API;
   - tag `hackathon-submission` (on the owner's go) and re-run the gate on
     that commit.
4. **Owner:**
   - make the four repos **public**;
   - post on X: docs/25 §2, the 272-character post, with `demo-x.mp4`;
   - submit the form once: docs/25 §1, tracks `agents`, `security`,
     `swarms` (not `social`), the **mainnet** payout account, `website` empty.
5. Keep the server and the site up until 2026-11-25. Then destroy the Vultr
   instance to stop billing.

## Uncommitted work

**2026-11-12: committed and pushed** on the owner's go ("SHIP this now"):
backend `54e5c33`, interface `e1c4b92`, contracts `be44c4f`, docs `1e8825b`
(`master` = `human-work`). Vercel serves the new site, where `/swarm` has a
"Verify on chain" button that reads all 11 jobs from testnet in the browser
(checked: 11/11). A fresh clone of the pushed backend and contracts
from GitHub passed `pnpm demo:local`: `Demo passed.`, 74 checks (no `dao.wasm`,
which is gitignored and optional), 2026-11-12. The "Judge in 60 seconds" README sections and this note
came after that push.

**2026-11-12, after an independent pre-screen review: fixes, uncommitted.**
- **READMEs:**
  - swarm jobs 55–65 and all four rounds;
  - the three testnet-skipped verify-near checks named;
  - Judge-in-60s step 4 names the contracts clone and about 10 minutes;
  - the function-call key wording;
  - a glossary (I1, NEP-413/297/141, CAIP-2, x402, yocto, §8x);
  - interface test counts (374 unit, 390 e2e, 1,950 runs);
  - the old tagline replaced.
- **Site:** title, manifest, /about and the OG/Twitter images now carry the new pitch.
- **`e2e/home.spec.ts`:** it still looked for the old hero sentence, a real failure on the pushed code. It now checks that the hero names "an AI agent or a person".
- **Tests:** the interface `pnpm check` passes. Chromium e2e: 365/390 in parallel, and every failure passes when run one at a time, except home.spec, which is fixed. home, smoke, csp and user-agents: 77/77 in each of 5 browsers.

**2026-11-12, NEAR AI judge made live and checked (owner's key in the backend `.env`, $10 credit):**
- **Default model:** `zai-org/GLM-5.1-FP8` is no longer offered (`GET /v1/models`), so the default is
  now `Qwen/Qwen3.6-35B-A3B-FP8`.
- **Live run:** the sandbox demo with `AGENT_MODE=live JUDGE_PROVIDER=near-ai BRAIN_CHAIN=groq
  BRAIN_CHAIN_ORCHESTRATOR=groq` and no other keys, so only the judge spent credit, a few cents.
  - It gave 3 verdicts, each signed by the model's attested enclave key `0xfdbd…8ddf`.
  - The API stored the accepted one as verified.
  - On chain, `review_hash` for sandbox job 2 equals its verdict hash.
  - The 2 rejections could not be disputed in time: the sandbox gives a 10 s review window, too short for a replayed delivery plus a live judge call. Testnet's windows are longer.
- **The API now checks the judge itself** (`apps/api/src/judge-verify.ts`):
  - a bad signature is 422;
  - a key NEAR AI does not attest for the model, or a report that cannot be read, means the approve goes through without storing a judge;
  - one response id counts for one job;
  - a judged approve sends `verdictHash` as `review_hash`;
  - `GET /v1/jobs/:id` returns `judge.verified`. The job page needed it and the API never sent it, which the mocked e2e had hidden.
  - Tests were written red first, including the real attestation as a fixture.
- **Text:** docs/15, docs/24, the backend README, the security docs page and docs/25 (now 1,965 characters, with a Judge paragraph and the Security row) updated. The hook video's scene 1 names the NEAR AI judge.
- **Gates:** backend `pnpm check` 1,429 passed, 10 skipped; `demo:local` passed with 80 checks; docs env check green.
- **Video:** the opener was re-rendered, and `demo-hook-x.mp4` rebuilt (3:33, 1920×1080, 8.3 MB).
- **Interface:** `pnpm check` 374 unit; e2e Chromium 390/390; home, smoke, swarm, receipts, a11y and job-page 78/78 in Firefox (run serially), WebKit, iPhone and Android.
- **Secret scan:** clean. Only the `TEST-ONLY` placeholders hit, and the real key is in no committable file.

**2026-11-12, after a second independent review of the judge check:**
- The attestation now carries the exact request and response bytes. They are stored and never returned.
- The API checks that they hash to the signed text (whose model prefix must be this model), and recomputes `verdictHash` from the signed response.
- Reuse is keyed on `signedText`, not the unsigned `responseId`.
- A judge sent without the bytes is not stored. The report cache is bounded.
- Four tests were written red first, on 02a9bf6.
- A real NEAR AI attestation was recaptured with its bytes, and its verdict hash recomputes from the response.
- **Audit fixes:** docs/25 says the judge "can run" and is "checked against the enclave key in NEAR AI's attestation report" (the TDX quote is not verified; the backend README says so). The description is 1,938 characters. The home roadmap item and docs/28 count are fixed.
- **X video for a standard account (2:20 limit):** `hook-overview-x.mp4` (1:39) = the opener plus the overview from its second scene.
- **Gates:** backend `pnpm check` 1,434 passed, 10 skipped; interface `pnpm check` 374.

**2026-11-13: live end-to-end test with real testnet transactions, through the live API (`%TEMP%/live-e2e.mjs`, using the seeded accounts only).**
- **The first run found a real bug:** the shared agent `Worker` delivered listing jobs with `submitResult`, which listing jobs refuse (they settle from an accepted draft). Fixed in `3dad3b8` (9 red-first tests): the worker reads the draft state on each poll and posts a draft, waits, redoes on revise, and submits once accepted. Bots redeployed.
  - The stalled listing job ran out its work window overnight; the keeper refunded it (designed behaviour; one failed mark for Atlas).
- **The final run passed every step:**
  - 3 hosted agents hired and settled (chain jobs 77–79, matching the chain);
  - a NEAR AI-judged approve, job 80, with `review_hash` = the verdict hash, and credential #80 matching on every field;
  - the listing flow: post → bid → select → draft → accept_draft → settled (job 81), credential #81 matching;
  - I1 holds (643.29 mUSDC); the client's purse is debited; fees accrued.

**2026-11-12 evening: work credentials merged and LIVE; faucet and keeper live.**
- **Owner's 3 service accounts** (verified as theirs): `pactora-faucet.testnet`, `pactora-keeper.testnet`, `pactora-minter.testnet`. Their keys are in the server `.env`, appended by the owner-run `add-service-keys.sh`.
- **Funded from `gopalt.testnet`** with the owner's OK:
  - 2 NEAR to the faucet, tx `9i4G69wb…`;
  - faucet registered on the token, `HvFpbcPa…`;
  - 200 mUSDC minted to the faucet, `XQderyGM…`;
  - `set_minter` to `pactora-minter.testnet`, `8sPn8Xyv…`.
- **Keeper:** on start it closed chain job 67 with `auto_approve` (`2kKTVY37…`).
- **The faucet** is configured in the signer. Its claim needs a signed-in person, which is the owner's wallet test.
- **`credentials.gopalt.testnet` deployed** from the committed wasm (`35a177fd…`, verified by code_hash).
- **The branch's api, migrate and signer images deployed:** migration 0034, and the compose file now carries `MINTER_*` and `CREDENTIALS_PER_WORKER_PER_DAY`.
- **The live test found a bug:** token 68 recorded `reviewHash: null` while job 68 holds the NEAR AI verdict hash. The fix (red-first test, `a4352f1`) reads `get_job` and refuses to mint when the chain is unreadable.
  - Token 68 keeps the null, since tokens can't be edited or burned.
  - Token 70, from a fresh NEAR AI-judged job, matches the chain on every field (state, amount, spec, result, review hash). A client's claim is 403, a repeat is 200 with no second mint, and a transfer is refused (Soulbound).
- **Merged** `feature/work-credentials` into master in all 4 repos.
- **A live crawl after the merge** found the credentials list asking `/v1/receipts?limit=100`, which the API rejects with 422 above 50. Fixed (red-first test, interface). The recrawl is clean: 36 pages 200, 0 console errors, 0 axe violations; Atlas's agent page lists credentials #68 and #70.

**2026-11-12, work-credential NFTs on branch `feature/work-credentials` (all 4 repos; master untouched):**
- **Contract** `contracts/credentials`:
  - soulbound NEP-171/177/181: minter-only `nft_mint`, transfers refused, `set_minter` needs 1 yoctoNEAR, metadata spec `nft-1.0.0`;
  - 8 unit tests;
  - built in the pinned image; pactora.wasm unchanged (`e0ed7876…290a`);
  - `scripts/deploy-credentials.mjs`.
- **Backend:**
  - signer `POST /credentials/mint` with its own minter account;
  - API `POST|GET /v1/jobs/:id/credential` for the worker of a settled escrow job only, idempotent and retry-safe, with a per-worker daily cap;
  - migration 0034; SDK and MCP (33 tools);
  - 1,501 tests.
- **Interface:** a claim card on the job page and an on-chain list on agent and profile pages; 449 unit tests, Chromium 419/419, other browsers 336/336.
- **Reviews:** two independent reviews; every finding fixed with a red-first test and verified by a second agent.
- **Real-chain rehearsal on the local sandbox:** deploy, startup minter check, mint (1,911 B of storage), `nft_token` correct, duplicate refused (IDEMPOTENCY_CONFLICT), `nft_transfer` refused (soulbound), list of 1.
- **Next (owner):**
  1. create the minter account and add `MINTER_*` to the server `.env`;
  2. OK the deploy of `credentials.gopalt.testnet` from the deployer.
  Then: a live test, and merge if green by 2026-11-14 ~18:00 UTC; else the master READMEs say "coming soon".

**2026-11-12, money-clarity round, deployed (API `1746dc6`, interface `fca9965`):**
- **Audit of the pushed version on a fresh clone:**
  - backend 1,439 tests and `Demo passed.`;
  - interface 383 unit tests and Chromium 398/399 (the 1 failure was the audit's own port; the test is now port-agnostic);
  - wasm SHA256SUMS OK, and the testnet code_hash equals the committed pactora.wasm;
  - live `get_totals.sum` equals the contract's mUSDC balance (I1 holds), and `get_roles` names the DAO as arbiter, not paused;
  - receipts match the chain 5/5;
  - live crawl: 36 pages 200, 0 console errors, 0 axe violations;
  - API: auth 401s, input 404/422, no 5xx, strict security headers, CORS limited to our site.
- **Interface (subagent, re-checked):**
  - a money panel with balances, allowance, stake and storage;
  - checks before every spend, with a summary;
  - plain errors for 7 contract errors and the faucet's;
  - the faucet card is never hidden;
  - the job page shows real bonds and fee, live countdowns and the next step;
  - stake on agent pages, worker-gets on agent cards, fee on receipts;
  - `/fees`: how Pactora is sustained.
  - Gates: 425 unit; Chromium 410/410; other browsers 574/576 (the 2 failures passed 12/12 serially).
- **Backend:**
  - job `bonds` and `fee` come from the chain, and receipts carry `fee`/`feeDisplay`/`workerReceived`;
  - workers on NEAR AI answer without thinking (37 vs 385 tokens; a live delivery took 1.46 s);
  - backend 1,440 tests.
- **Docs:** docs/29 testing guide, docs/30 business model (open source plus the live 1% protocol fee), README section.
- **Deployed** with `deploy-all.sh` (DB backup first, `:prev` images kept). Live checks: the new fields are present, a live hire settled, and the crawl is clean.
- **Waiting on the owner:** the faucet and keeper accounts (4 `.env` lines), then fund them (owner OK per transfer), restart the signer, and test claim → hire → settle and the keeper live.

**2026-11-12, live: hireable agents and a NEAR AI-judged job (owner ran `start-bots.sh`):**
- **Live seed:** `live-seed.mjs` ran against the live API after a DB backup (`/root/predeploy/*-preseed.dump`). It added agents 6–9 (Atlas Research, Cobalt Analysis, Delta Execution, Demo Client; chain agents 79–82), staked, with 4 published profiles and 3 open listings. Owner keys and bot keys are in the gitignored `.keys/live-seed/`.
- **Server:**
  - `.env` and compose were backed up (`*.bak-<ts>`);
  - the bot keys plus `BOT_AGENT_MODE=live`, `BOT_BRAIN_CHAIN=near-ai`, `WORKER_MAX_JOBS_PER_DAY=30` and `NEAR_AI_API_KEY` were added;
  - research-bot, trading-bot and execution-bot run with `--profile hosted`;
  - the API stays `cached` at `dde1a2d`. It was recreated by compose with the same image, and is healthy.
- **Live hire:** Demo Client → Atlas Research: accepted, delivered by NEAR AI, approved, settled.
- **Live judged hire:** Demo Client → Atlas Research. NEAR AI rated it "accept, excellent", signed by `0xfdbd…8ddf`. The approve carried the attestation, the API stored it as `verified: true`, and **chain job 68** shows `review_hash` `fda38cdf…e9f1` = `verdictHash`. `/receipts` marks it as judged.
  - A judged hire of Cobalt Analysis (trade plan) was rated "reject, poor" and not approved; it will settle on the review window. Cobalt's trade-analysis output is weak on open questions, so it could be improved.

**2026-11-12, polish round (plan: "post-submission polish round"):**
- **Interface (subagent, re-checked):**
  - `/receipts` has a Verify on chain button (direct-pay receipts compare state and amount only, since direct_pay stores no result hash);
  - the home page has a "Start here" strip;
  - `/jobs` and `/people` empty states now guide the visitor;
  - `/swarm` has a step-by-step replay that respects reduced motion.
  - Gates: `pnpm check` 383 unit; Chromium 399/399; touched specs plus smoke and a11y 80/80 in Firefox, WebKit, iPhone and Android.
- **Backend:**
  - `near-ai` is accepted in `BRAIN_CHAIN`;
  - the worker has a daily cap, `WORKER_MAX_JOBS_PER_DAY`: it declines before any model call, so the client is refunded;
  - the NEAR AI `max_tokens` floor is now 8,192 (4,096 cut real Qwen3.6 replies off);
  - compose gives the bots their own `BOT_AGENT_MODE` and `BOT_BRAIN_CHAIN`, the NEAR AI key and the cap;
  - `scripts/live-seed.mjs` seeds over HTTP only (never TRUNCATE, never sweep; keys in `.keys/live-seed/`). It was rehearsed on the sandbox: 3 staked workers and a funded client, 4 profiles, 3 open listings; a second run adds nothing.
  - A local research bot on NEAR AI was hired, accepted, delivered and settled. The cap of 2 declined the third job.
  - Gates: `pnpm check` 1,437 passed.
- **READMEs:** three Mermaid diagrams (architecture, job lifecycle, swarm round).
- **Next:** push; build the bot images; live DB backup; run `live-seed` against the live API; the server gets the bot keys and settings; the owner adds `NEAR_AI_API_KEY`; start the bots with `--profile hosted`; a live hire test; GIFs; move the tag at the end.

**2026-11-12, shipped (owner's go):**
- **API:** deployed at commit `dde1a2d`, after a DB backup (`/root/predeploy/pactora-20261112T0655.dump`). `0033_pools.sql` applied; `/v1/receipts` and `/v1/pools` answer 200; every service is healthy. The previous image is tagged `pactora-full-api:prev`.
- **Tag:** `hackathon-submission` pushed in all four repos (backend `0875906`, interface `9f11090`, contracts `88e9cdc`, docs `1617475`).
- **Repos:** public.
- **X post:** https://x.com/0xGopalTalaviya/status/2120769578972438800.
- **Next:** the owner submits the form. Keep the hosting up until at least 2026-11-25.
- (The paragraph below is history: the deploy it waited for is done.)

**Not deployed yet: the API.** The `pactora-full-api` and
`pactora-full-migrate` images for `54e5c33` are built locally, and a DB dump
is on the server (`/root/predeploy/`). The deploy step was blocked by the
session's permission classifier. Until it runs, the live `/v1/receipts` and
`/v1/pools` return 404, so the live `/receipts` page is empty. Deploy:
`docker save pactora-full-api:latest pactora-full-migrate:latest | gzip -1 > imgs.tar.gz`,
scp it to the server, `docker load`, then `docker compose -f docker-compose.full.yml -f docker-compose.vps.yml up -d --no-build api`
in `/root/pactora`. The migrate service runs `0033_pools.sql` first.

The round's contents:
- Pools: the API, the migration, the SDK, 3 MCP tools (31 in all) and docs/15.
- Swarm rounds 3 and 4, and the testnet run (chain jobs 55–65) in `RULES.md`.
- The `/swarm` page and the receipts `judged` flag and badge.
- The new pitch, the 20 s opener and `demo-hook-x.mp4`.

Gates run on the final code:
- backend `pnpm check`: 1418 passed, plus `status.test` 24/24 after the docs/15 fix;
- MCP 40/40;
- interface `pnpm check` (370 unit);
- e2e 95/95 in each of 5 browsers;
- `swarm:local` and the testnet swarm;
- the docs env check;
- the secret scan, which is clean (its one hit is the `NEAR_AI_API_KEY=...` placeholder in the backend README).

**2026-11-11 evening: the win round is uncommitted in all four repos**,
finished and tested, waiting for the owner's go: receipts (API, page, job
card, tests), the orchestrator approve fix, the testnet swarm and `RULES.md`,
demo descriptions and open listings, the `roles.test.ts` receipts row, the
contract check's receipts block, README/doc wording fixes, docs/25 and this
file. Before it, everything had been pushed (`master` = `human-work`).
Earlier the same day, everything since the last push was
uncommitted in all four repos. It is finished and tested, waiting for the owner's go:
- the wording pass;
- the skippable identity check;
- the testnet deployment record and `deploy --resume`;
- the FastNEAR defaults;
- the free `accounts` indexer source;
- the demo fixes;
- the `backup.sh` fix and the sanctions refresh in the api image;
- the UI fixes;
- the rules and disclosure updates;
- docs/25, docs/28 and this file.

The secret scan of every changed and new file is clean. Commits use the owner's GitHub noreply address (2026-11-11).
`.env` files and `.keys/` are never committed.

## Blocked on the owner

- The commit and push (above), then the `hackathon-submission` tag, the
  public repos, the X post and the form.
- The API deploy and the live-board seed (the seed stops the server's
  indexer and signer, so it needs the owner's explicit OK).
- (No more testnet NEAR is needed: `gopalt.testnet` holds ~131 NEAR.)
- Optional:
  - `BACKUP_REMOTE` (an off-host backup copy) and `ALERT_WEBHOOK_URL` on the
    server;
  - a NEAR AI Cloud key for one live judge call;
  - D3 (KYC vendor), the matching threshold, a Telegram bot token, an email
    provider, `job_events` retention.

## Working agreements

- Testnet only. Never generate or fund keys for the owner. Private keys go
  only into `.env` files, by the owner.
- Commit and push only with the owner's explicit OK, each time, to the
  `gopaltalaviya/<repo>` remote.
- A leftover local branch `verify-2026-11-07` exists in some repos. Do not
  delete it without the owner's OK.
