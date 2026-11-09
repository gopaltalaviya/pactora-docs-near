# 16 — Runbooks

Each runbook: **when**, **preconditions**, **steps**, **validation**,
**rollback**, **expected result**. Background for all of them is
[14 — Operations](14-operations.md). First-time setup is
[13 — Deploy](13-deploy.md).

**Status of these procedures.** Steps that were run for real are marked
✅ *rehearsed* (locally, on the sandbox or the production images; **no
Pactora backend is hosted today**); everything else is derived from the
code and the Vercel documentation and has **not** been run against a hosted
deployment. Treat an unrehearsed runbook as a checklist to verify the first
time.

**The hosted layout is one VPS** running `docker-compose.full.yml` +
`deploy/vps/docker-compose.vps.yml` behind Caddy, with the site on Vercel
([13 §1](13-deploy.md#1-the-server), source of truth
`pactora-backend-near/deploy/vps/README.md`). On the VPS, `$COMPOSE` means
`docker compose -f docker-compose.full.yml -f docker-compose.vps.yml --profile hosted`,
run in the deploy directory on the server. `$PG_USER` and `$PG_DB` are the
database user and name the compose file sets (`POSTGRES_USER`,
`POSTGRES_DB` in `docker-compose.full.yml`).

Conventions: `$API` is the API's public URL (`https://api.<ip-with-dashes>.sslip.io`
on a VPS); `psql "$DATABASE_URL"` means a SQL session on the target database
(on the VPS: `$COMPOSE exec postgres psql -U "$PG_USER" "$PG_DB"`;
locally: `psql postgres://pactora:pactora@127.0.0.1:5443/pactora_near`).
`chain_id` is the CAIP-2 text `near:testnet` (or `near:sandbox`), never a
number. Testnet only — any mainnet action needs the owner's explicit
confirmation, per action.

| # | Runbook |
|---|---|
| R1 | [Deploy and verify](#r1-deploy-and-verify) |
| R2 | [Database down](#r2-database-down) |
| R3 | [Indexer stopped or behind · backfill · reindex](#r3-indexer-stopped-or-behind) |
| R4 | [Indexer halted, or showing wrong data](#r4-indexer-halted-or-showing-wrong-data) |
| R5 | [RPC down or rate-limited · change the RPC](#r5-rpc-down-or-rate-limited) |
| R6 | [Recover a failed service · restart](#r6-recover-a-failed-service) |
| R7 | [Roll back a deploy (backend, frontend)](#r7-roll-back-a-deploy) |
| R8 | [Run migrations by hand](#r8-run-migrations-by-hand) |
| R9 | [Rotate secrets and keys](#r9-rotate-secrets-and-keys) |
| R10 | [Update dependencies](#r10-update-dependencies) |
| R11 | [After a contracts redeploy](#r11-after-a-contracts-redeploy) |
| R12 | [Stop new jobs in an incident (pause)](#r12-stop-new-jobs-in-an-incident-pause) |

---

## R1. Deploy and verify

**When:** shipping backend and/or interface changes.
**Preconditions:** CI green on the commit; `chain/` in sync (CI checks);
any new migration is additive ([14 §7](14-operations.md#7-database-and-migrations)).

**Steps**

1. Merge to `master` with CI green.
2. Build the images locally, load them on the server,
   `$COMPOSE up -d --no-build` ([13 §1](13-deploy.md#1-the-server)). The
   one-shot `migrate` service runs first; the signer and indexer start only
   after it succeeds, and the api after the signer is healthy. A failed
   migration starts nothing.
3. Vercel rebuilds the interface from its `master` on push. If
   `NEXT_PUBLIC_API_URL` changed, this rebuild is required — it is read at
   build time.

**Validation** (the three reads below plus `probe-api.mjs`; not yet
rehearsed on a server)

```bash
curl -s "$API/health"          # chains[].contract = the Pactora account in chain/deployments/<slug>.json; build.commit = the merged commit
curl -s -o /dev/null -w '%{http_code}\n' "$API/ready"   # 200 (database and signer)
curl -s "$API/v1/status"       # status "operational" once the indexer has caught up; gas.state "ok"
node scripts/probe-api.mjs "$API"   # hostile input, security headers, CORS; nothing it sends can spend
```

**Rollback:** R7. **Expected:** every check passes; `build.commit` matches.

## R2. Database down

**Symptom:** `/v1/status` `status: "down"`, `components.database: "down"`;
`/ready` 503 `database.ok: false` on api, signer, indexer; API requests 503
`UPSTREAM_UNAVAILABLE` with `retry-after: 5`.

1. Is the Postgres container running, is the volume full? The API logs `readiness check failed` with the real
   driver error (the public response deliberately omits it).
2. Restart the Postgres service if it crashed. The api, signer and indexer
   reconnect by themselves (pooled `postgres.js`); restart them only if
   `/ready` stays 503 after the database is up.
   On the VPS: `$COMPOSE ps` and `docker compose logs postgres`; check disk
   space with `df -h`.
3. If the data is lost or corrupt: restore the latest daily backup
   ([14 §8](14-operations.md#8-backup-and-disaster-recovery)). `backup.sh`
   writes `pactora-db-<stamp>.dump.enc` + `.hmac` (AES-256, HMAC-SHA256) and
   `pactora-evidence-<stamp>.tar.enc` + `.hmac` into the backups directory at
   03:00 UTC, 7 kept, copied to `BACKUP_REMOTE`. Restore = **verify the
   HMAC, decrypt, `pg_restore`**, then the evidence archive, before the
   services start (✅ *checked locally 2026-11-08*, backup → wipe → restore
   against the production images; not yet on a server):

   ```bash
   docker compose -f docker-compose.full.yml -f docker-compose.vps.yml up -d --wait postgres
   PASSFILE=$HOME/.pactora-backup-pass; . deploy/vps/backup-lib.sh
   verify_hmac backups/pactora-db-YYYYMMDD-HHMMSS.dump.enc || echo "REFUSE: the backup does not match its HMAC"
   openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass file:$HOME/.pactora-backup-pass \
     < backups/pactora-db-YYYYMMDD-HHMMSS.dump.enc \
     | $COMPOSE exec -T postgres pg_restore -U "$PG_USER" -d "$PG_DB" --no-owner --exit-on-error
   # then the evidence bucket (minio, minio-setup, decrypt the .tar.enc, `mc cp --enc-s3`): deploy/vps/README.md
   $COMPOSE up -d --no-build                       # migrate runs first, then the services
   ```

   Full steps, with the evidence restore: `deploy/vps/README.md` in
   `pactora-backend-near` ("Restore into a fresh database"). A failed
   `verify_hmac` means the file was altered or truncated — stop and take an
   older backup. Anything written after the dump (at most a day) is lost;
   see 14 §8 for what can and cannot be rebuilt from the chain.
4. After a restore, the indexer's cursor is as old as the backup: it re-reads
   from there, idempotently, and catches up (R3).

**Validation:** `/ready` 200 everywhere; `/v1/status` operational.
**Expected:** service resumes; hires made during the outage failed with 503
`UPSTREAM_UNAVAILABLE` and are safe to retry under the same `Idempotency-Key`.

## R3. Indexer stopped or behind

**Symptom:** `/v1/status` `components.indexer: "degraded"` (lag > 150
blocks) or `"down"` (behind, and no progress for 120 s — stopped, not
catching up), or `lastIndexedAt` old while `rpc: "up"`; indexer `/ready`
503 ("no successful tick for N s"); jobs stuck in their API-written state.

From `apps/indexer/src/`. Not yet rehearsed against a hosted stack.

**How it works, in short.** One worker per chain in `ENABLED_CHAINS`. Each
tick reads the blocks after the cursor up to the newest **final** block —
at most 50 per tick (`MAX_BLOCKS_PER_TICK`) — from the network's
`blockSource` (`chain/config/networks.json`: neardata
`https://testnet.neardata.xyz` on testnet, RPC polling on the sandbox),
decodes the `Pactora` and token contracts' events, and commits the batch
and the cursor in one transaction. Final blocks do not reorg, so there is
no rewind: every block must name the previous one as its parent, or the
worker halts there (R4). Knobs, all env: `INDEXER_POLL_MS` (2000),
`INDEXER_MAX_BACKOFF_MS` (60000; failures back off exponentially up to
this), `INDEXER_START_AT_HEAD` (a **first** start seeds the cursor at the
final head instead of `startBlock`; an existing cursor is never moved),
`NEARDATA_API_KEY` (a FastNear key — without it neardata's free limit
cannot keep pace with testnet), `RPC_URL_TESTNET`, `INDEXER_HEALTH_PORT`.

**Diagnose**

```sql
SELECT chain_id, contract, last_block, last_block_hash, updated_at, now() - updated_at AS age
FROM indexer_cursor;   -- one row per chain: chain_id 'near:testnet', contract 'Pactora'
```

- Logs say `tick failed, retrying` (warn) / `indexer is failing` (error,
  from the fifth failure in a row) → the error is the cause: neardata or
  RPC (R5), or the database (R2).
- Logs say `indexer halted: block does not follow the cursor`
  (`ChainLinkError`) → a wrong source or a bug, not an outage: R4.
- Ticks succeed but lag is large → it is **backfilling**. 50 blocks per
  tick, one tick per `INDEXER_POLL_MS` (2 s) and ~0.6 s per testnet block
  means it gains about ten times the chain's rate — a day of testnet
  (~140 000 blocks) is roughly 1.5 h. Waiting is correct. If neardata
  answers 429, set `NEARDATA_API_KEY`.
- The cursor `age` grows while there are no new final blocks only on an
  idle sandbox; on testnet a cursor that has not moved in
  `INDEXER_STALE_S` (600 s, `alerts.sh` check 4) is a stopped indexer.

**Restart:** `$COMPOSE restart indexer`. Safe at any moment: the cursor
commits with its batch, and a re-read batch is a no-op (unique keys
`job_events (chain_id, receipt_id, log_index)`, `token_transfers` likewise,
`payments (chain_id, tx_hash, job_id)`).

**Backfill a range** (re-read from block `N`, e.g. after a source served a
height as empty). No script does this on NEAR; by hand:

1. Stop the indexer (`$COMPOSE stop indexer`); a running tick would
   overwrite the cursor. Note the current row (rollback).
2. Get the hash of block `N−1` from the RPC:
   `curl -s -X POST <rpc> -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"block","params":{"block_id":<N-1>}}'`
   → `.result.header.hash`. If `N−1` has no block (NEAR skips heights), use
   the nearest earlier height that has one.
3. ```sql
   UPDATE indexer_cursor SET last_block = <N-1>, last_block_hash = '<hash of the block at or before N-1>', updated_at = now()
   WHERE chain_id = 'near:testnet' AND contract = 'Pactora';
   ```
   A **wrong hash is not self-healing**: the next tick halts
   with `ChainLinkError` (block `N`'s `prev_hash` does not match). Copy it
   exactly. (The code treats an empty string `''` as "no hash yet" and skips
   the parent check for the first batch; use that only if the hash cannot be
   read.)
4. Start the indexer.

**Full reindex from the deployment block:** stop the indexer,
`DELETE FROM indexer_cursor WHERE chain_id = 'near:testnet' AND contract = 'Pactora';`,
start it **without** `INDEXER_START_AT_HEAD`. It resumes at `startBlock`
from `chain/deployments/testnet.json`. Existing events are skipped, missing
ones applied. Time: (head − startBlock) / 50 ticks × 2 s.

What a reindex does **not** do: undo effects already applied (reputation,
payments), recreate jobs the API never wrote, or index any contract but the
two in `chain/deployments/<slug>.json`.

**Validation:** `/v1/status` indexer `up`, `lagBlocks` at most 2
(`FINAL_SLACK`); indexer `/ready` 200; cursor `age` under a minute.
**Rollback:** set the cursor row back to what you noted in step 1.
Replay idempotency has been verified in the indexer's tests and by
`pnpm demo` on the sandbox.

## R4. Indexer halted, or showing wrong data

**Halt symptom:** every tick fails with `indexer halted: block does not
follow the cursor` (`ChainLinkError`, `apps/indexer/src/indexer.ts`). The
indexer reads final blocks only, so there is **no reorg**; this is its one
halt. Block `N`'s `prev_hash` is not the hash the cursor holds, or the
source returned a block at the wrong height.

**Cause:** a **wrong source** — `RPC_URL_TESTNET` or neardata pointing at
another network (the indexer checks `status.chain_id` and compares one final
block between neardata and the RPC at start, so this is rare after boot), a
neardata outage serving stale data — or a bug. Nothing past the cursor is
written.

**Repair:** fix the source, confirm the cursor's `last_block_hash` is the
real hash of that height (R3, "Backfill a range", step 2), and restart. No
applied event can lose its backing, because only final blocks are read.

**"Wrong data" without a halt:** compare the job with the chain
(`near view <pactora account> get_job '{"job_id": <chain_job_id>}'`) and the
API's view (`GET /v1/jobs/:id` events). The indexer only moves states
forward and is authoritative for chain facts; the API writes optimistic
states the indexer later confirms. A job stuck in an API-written state with
no chain event means the transaction never landed — check the signer's
`signer_txs` row for its `tx_hash` and status.

**Validation:** ticks succeed; `/v1/status` indexer `up`; the job matches
`get_job`.

## R5. RPC down or rate-limited

**Symptom:** `/v1/status` `rpc: "down"`; indexer logs `tick failed` with HTTP
errors or 429s; signer `/ready` `rpc.ok: false`; hires fail
`UPSTREAM_UNAVAILABLE`.

Two upstreams can fail: the **RPC** (`RPC_URL_TESTNET`,
default `https://rpc.testnet.near.org`; used by api, signer and indexer) and
the indexer's **block source**, neardata (`https://testnet.neardata.xyz`,
from `chain/config/networks.json`).

1. Confirm which: RPC —
   `curl -s -X POST <rpc> -H 'content-type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"status","params":[]}'`
   (`.result.chain_id` must be `testnet`); neardata —
   `curl -s https://testnet.neardata.xyz/v0/last_block/final | head -c 300`
   (a 429 is the rate limit).
2. RPC down or limiting: set `RPC_URL_TESTNET` to another testnet endpoint
   (a keyed provider is fine — it is never served to clients). In the
   compose files it is one value in the `x-chain` block, so one line in the
   server's `.env` covers api, signer and indexer; `$COMPOSE up -d
   --no-build` recreates the three. The indexer refuses an RPC whose
   `status.chain_id` is not the network the config names, and one whose
   final block disagrees with neardata's at the same height, so a wrong URL
   fails at start rather than indexing the wrong network.
3. neardata limiting (429s in the indexer log): set `NEARDATA_API_KEY` (a
   FastNear key) and recreate the indexer. neardata down: there is no
   second block source configured; the indexer backs off to
   `INDEXER_MAX_BACKOFF_MS` (60 s) and resumes from its cursor when it
   returns — the api and signer are unaffected (they use the RPC).
4. Nothing to replay afterwards: the first successful tick continues from
   the cursor.

**Validation:** `/v1/status` `rpc: "up"`, indexer lag falling, signer
`/ready` `rpc.ok: true`.
**Rollback:** remove `RPC_URL_TESTNET` / `NEARDATA_API_KEY` from `.env` and
`up -d` again. There is no fault-injecting proxy; rehearse against the
sandbox by stopping its node.

## R6. Recover a failed service

**Symptom:** a service crash-loops, or its health check fails (on the VPS:
`$COMPOSE ps` shows it `unhealthy` or restarting; logs with
`docker compose logs <service>`).

1. Read the service's latest logs. Boot failures are explicit and list every
   problem at once:
   - `invalid environment:` — a variable missing or malformed (names each).
   - `✗ Pactora config invalid` — chain facts: e.g. `ENABLED_CHAINS` names a
     chain with no `chain/deployments/<slug>.json` (`ENABLED_CHAINS` takes
     CAIP-2 ids).
   - `set SIGNER_TOKEN …` / `set WEBHOOK_SECRET_KEY …` / `set
     OBJECT_STORE_SECRET_ACCESS_KEY …` / `set MINIO_KMS_SECRET_KEY …` from
     `docker compose` itself — a required `.env` value is missing (the full
     compose refuses to start without them; the list is in
     `deploy/vps/README.md`). `pnpm test:startup` is the test that each
     service refuses a bad configuration.
   - `CORS_ORIGINS is required when NODE_ENV=production` (api).
   - `SIGNER_HOST=… without SIGNER_TOKEN` (signer refuses to expose itself).
   - `unhandled promise rejection` / `uncaught exception` — the process shuts
     down deliberately (exit 1) and Docker restarts it
     (`restart: unless-stopped`).
2. Fix the variable/config and redeploy; or roll back (R7) if a new release
   caused it.
3. **Restart** a healthy-but-stuck service: on the VPS,
   `$COMPOSE restart <service>`.
   Shutdown is graceful: SIGTERM stops accepting, ends SSE streams (clients
   reconnect in 3 s), drains in-flight requests, closes pools, within 10 s.

**Validation:** `/ready` 200; `/v1/status` operational.

## R7. Roll back a deploy

**Backend (VPS):** load the previous commit's images and
`$COMPOSE up -d --no-build`. Safe for the database **because every
migration so far is additive** — the previous code runs on the newer
schema. A migration is never rolled back by redeploying; reversing one
needs a new forward migration or a backup restore
([14 §7](14-operations.md#7-database-and-migrations)).

**Frontend (Vercel):** project → *Deployments* → the previous production
deployment → *Promote to Production* / *Instant Rollback*. If the API URL
changed between the two, the old build still points at the old URL (baked
in at build time).

**Validation:** `/v1/status` `build.commit` shows the previous commit; R1's
checks pass.

## R8. Run migrations by hand

**When:** a pre-deploy migration failed, or a database was restored.

```bash
# From a checkout at the deployed commit, against the target database
DATABASE_URL='<postgres url>' pnpm --filter @pactora/db migrate
# or from any built image of this repo
node node_modules/@pactora/db/bin/migrate.mjs   # (api image; working dir /app)
```

Output: `✓ <file>` per applied file, then `applied N migration(s)` or
`already up to date`. Concurrent runs are serialised by an advisory lock. A
failing file prints `✗ <file>` and its error, exits 1, and leaves that file
unapplied (its transaction rolled back); later files are not attempted.

✅ *rehearsed* locally in every CI run and in `docker-compose.full.yml`
(`migrate` service). **Never** edit or rename an applied file — the ledger
records names.

## R9. Rotate secrets and keys

Every secret lives in the server's `.env` (hosted, on the VPS) or `.env` (local); never in
a commit, a log or chat. After any rotation: redeploy the affected services,
then R1's validation.

| Secret | Where | Rotate by | Impact during rotation |
|---|---|---|---|
| `SIGNER_TOKEN` | the server's `.env` → api + signer | `openssl rand -hex 24`, update `.env`, redeploy **signer then api** | between the two restarts, api → signer calls answer 401 → callers get `UPSTREAM_UNAVAILABLE` (retry-safe) |
| `METRICS_TOKEN` | api (+ signer/indexer if set) | new value, redeploy, update the scraper | scrapes fail until updated |
| `KEEPER_SECRET_KEY` (for `KEEPER_ACCOUNT_ID`) | signer | add a new full-access key to the keeper account (`near account add-key`), put it in `.env`, redeploy, then delete the old key from the account; keep the account **funded with NEAR** | none; if unfunded, `keeper_exits_total{outcome="failed"}` rises and `signer_wallet_balance{role="keeper"}` is low |
| `SIGNER_KEY_PASSPHRASE` (encrypts the agents' wallet keys in Postgres) | signer | **no rotation tooling** — the stored keys would have to be re-encrypted. Owner decision; keep the current value with the backup passphrase | — |
| Agent wallet keys (`signer_keys`, created by the signer; `SIGNER_DEV_CREDENTIALS` for the testnet dev accounts) | signer / database | a wallet's function-call key is scoped to the Pactora contract; a new key is a new `accept_wallet` by the agent's owner. No tooling exists — owner decision | the agent cannot sign until its wallet is re-accepted |
| Model keys (`GEMINI_API_KEY` …) | api, workers | rotate at the provider, update, redeploy | runs fail until updated |
| `DATABASE_URL` password | Postgres service | on the VPS it is set in `docker-compose.full.yml`, and Postgres publishes no port (reachable only on the compose network); change it there and recreate the services | brief connection errors |
| Agent API keys (`ax_…`) | database | see below | the old key stops at once |

**Revoke an agent API key** (no endpoint exists):

```sql
UPDATE api_keys SET revoked_at = now() WHERE key_id = '<16-hex id from ax_<id>_…>';
```

**Issue a replacement key** for agent `<agentId>` (no endpoint exists). On a
checkout with `pnpm -r build` done, generate a key and its hash locally — the
key is printed once, give it to the agent's owner and do not paste it
anywhere else:

```bash
node -e "import('./apps/api/dist/auth.js').then(({generateApiKey,hashApiKey})=>{const k=generateApiKey();console.log(k.key);console.log(k.keyId, hashApiKey(k.key))})"
```

```sql
INSERT INTO api_keys (agent_id, key_id, key_hash, scopes)
VALUES (<agentId>, '<keyId>', '<sha256$…>', '{client,worker}');
```

(The generator produces the expected shapes; the SQL insert has not been
exercised against a hosted database.)

**Suspected key leak (SEV1):** revoke/rotate first, then investigate. For a
signing key: move its funds with a transaction from the same key before the
attacker does; the per-agent caps bound what a stolen API key can spend, not
what a stolen private key can.

## R10. Update dependencies

1. Dependabot opens weekly grouped PRs (npm minor/patch, Actions, Docker).
   CI must pass: types, lint, format, secrets, audit, tests with coverage
   floors, image builds.
2. By hand: `pnpm update --recursive` (or a named package), `pnpm install`,
   then `pnpm check` (typecheck + lint + format + tests) and
   `docker compose -f docker-compose.full.yml up --build` for the images.
3. Majors (Fastify, drizzle, near-api-js / `@pactora/near`, zod) one at a
   time, each with a live check: `pnpm demo` on the sandbox (or
   `DEMO_NETWORK=testnet pnpm demo`) for anything touching the chain path.

**Rollback:** revert the commit; the lockfile pins the old versions.

## R11. After a contracts redeploy

A fresh deploy (`scripts/deploy.mjs` in `pactora-contracts-near`) gives new
contract account ids, a new `startBlock` and job ids that start again. (An
**upgrade in place** — the contracts README, "Upgrading a deployed
contract" — keeps the account ids and the cursor; only step 1 applies if
`deployments/<slug>.json` changed.)

1. `node scripts/sync-chain-facts.mjs` (with `PACTORA_CONTRACTS_ROOT` at the
   contracts checkout) and commit `chain/`; CI fails until you do.
2. **Reset the indexer cursor** to the new deployment:
   `DELETE FROM indexer_cursor WHERE chain_id = 'near:testnet' AND contract = 'Pactora';`
   with the indexer stopped (`chain_id` is text). The
   cursor is keyed by chain and the fixed name `Pactora`, not by account id:
   left alone, an indexer that had already passed the new `startBlock` would
   skip the new contract's first events.
3. **Use a fresh database, or clear the old deployment's jobs.** On-chain job
   ids restart and `jobs` is unique on `(chain_id, chain_job_id)`: a new job
   whose id matches an old row's cannot be linked, and the indexer's tick
   would fail on the conflict. (Derived from the schema; not observed,
   because every redeploy so far used a truncated dev database.) Agents'
   wallet keys are scoped to the old contract account, so agents re-register
   too.
4. Redeploy api, signer, indexer; R1 validation — `/health`
   `chains[].contract` must be the new Pactora account from `chain/`.

---

## R12. Stop new jobs in an incident (pause)

From `pactora-contracts-near`, `contracts/pactora/src/lib.rs`. The pause is
covered by the contract's unit tests
(`pause_stops_new_hires_but_never_an_exit`) and has **not** been drilled live.

**When**: something is wrong with the contracts, the signer or the judge, and
no new money should go into escrow while you look.

**Preconditions**: the Pactora contract's **`pauser`** account or its
**`owner`** (`near view <pactora account> get_roles` shows both, and
`paused`). On testnet `scripts/deploy.mjs` sets both to the deployer
account; `set_pauser` (owner only) can hand the pauser role to an on-call
account.

**Steps**:

```bash
near call <pactora account> pause '{}' --accountId <pauser or owner> --networkId testnet
```

**Validation**: `near view <pactora account> get_roles` → `"paused": true`;
a new hire's transaction fails with the contract error `Paused` (the API
has no special case for it — the hire shows as a failed transaction);
`/v1/status` and the API keep answering. Jobs already
in escrow can still be accepted, delivered, approved, disputed, refunded
and expired — a pause never traps funds, and the keeper's exits still go
through.

**Rollback / resume**: only the **owner** can `unpause()`, and it takes one
yoctoNEAR attached (a wallet confirmation) — by design, a pauser account
cannot undo its own stop:

```bash
near call <pactora account> unpause '{}' --accountId <owner> --depositYocto 1 --networkId testnet
```

**Expected result**: no new jobs until resumed; nothing else changes.
Testnet only: pausing a mainnet contract would need the owner's explicit
confirmation like any other mainnet action.
