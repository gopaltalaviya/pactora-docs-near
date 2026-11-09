# 14 — Operations

How Pactora runs in production: what each service exposes about its health,
how versions and environments work, what is monitored and what should alert,
how the indexer and database behave when things go wrong, and what to do in
an incident. Step-by-step procedures are in [16 — Runbooks](16-runbooks.md);
the feature-by-feature evidence is [28 — Feature inventory](28-feature-inventory-2026-11.md).
Deploying for the first time is [13 — Deploy](13-deploy.md); every variable is
in [08 §5](08-configuration.md#5-environment-variables--secrets-and-wiring-only);
the HTTP API is [15 — API](15-api.md).

Checked against `pactora-backend-near` on 2026-11-09. **No Pactora backend
is hosted today**; the hosting recipe is
`pactora-backend-near/deploy/vps/README.md`
([13 §1](13-deploy.md#1-the-server) summarises it). Where a section says
"the VPS", it means that recipe.

**Not applicable to Pactora**, so not covered: Redis or any cache/queue (none —
see `docker-compose.yml`), WebSockets (live updates are SSE), a subgraph (the
indexer is our own), trading, markets or price charts.

---

## 1. Architecture and data flow

```
NEAR testnet ──final blocks (neardata)──▶ indexer ──▶ Postgres ◀── api ──HTTPS/SSE──▶ interface (Vercel) ──▶ browser
      ▲                                                  ▲  ▲       │  └── MinIO (evidence)
      └──────── signed txs ─── signer ───────────────────┘  │  ◀─token─┘     workers / orchestrator ──▶ api
                     └─ keeper (exits that fell due)        └── notifier (webhooks), channels (Telegram/email)
```

The stack in `docker-compose.full.yml`:

| Service | Code | Role | Listens | Public? |
|---|---|---|---|---|
| api | `apps/api` | REST + SSE, runs the orchestrator in-process | `PORT` 8080 | **yes** — the only public service (behind Caddy on the VPS) |
| signer | `apps/signer` | holds the agents' wallet keys (encrypted in Postgres under `SIGNER_KEY_PASSPHRASE`), policy-checks and signs; keeper sweeps due exits; watches wallet balances | `SIGNER_PORT` 7070 | **never** — compose network + `SIGNER_TOKEN` |
| indexer | `apps/indexer` | reads final blocks (neardata on testnet, RPC polling on the sandbox), decodes the `Pactora` and token contracts' events → `job_events`, `token_transfers`, projections | `INDEXER_HEALTH_PORT` 9090 | no |
| notifier | `apps/notifier` | delivers webhooks (`webhook_deliveries`), shares `WEBHOOK_SECRET_KEY` with the api | `NOTIFIER_HEALTH_PORT` 9091 | no |
| channels | `apps/channels` | Telegram and email outbox; off unless `TELEGRAM_BOT_TOKEN` is set | `CHANNELS_HEALTH_PORT` 9092 | no |
| workers | `apps/agents/*` | research/trading/execution bots, poll the API (`--profile hosted`) | — | no |
| mcp | `apps/mcp` | stdio MCP server for an LLM client | stdio | not deployed |
| Postgres 16 | `packages/db` | all state; migrations in `packages/db/migrations` | 5432 in the compose network; host `5443` in the base file, **none** with the VPS overlay | no |
| MinIO (pinned `cgr.dev/chainguard/minio`) | `minio`, `minio-setup` | evidence bucket `pactora-evidence`, SSE with `MINIO_KMS_SECRET_KEY` | 9000 in the compose network only | no |

A hire: client → `POST /v1/jobs` → API writes the job, asks the signer →
signer checks caps, takes a per-agent advisory lock, picks the nonce, signs,
broadcasts → API answers with `txHash` and publishes `job.created` on SSE →
the indexer, reading final blocks, sees `job_created`, links the row to its
on-chain id by `specHash` + both parties, and projects state, payments and
reputation (its event rows reach SSE streams live, through a Postgres NOTIFY
every API instance listens for) → the interface reads them from the API.

### Where each workload belongs

| Workload | Fits | Does not fit | Why |
|---|---|---|---|
| api | a long-running container host | Vercel functions | SSE streams stay open for minutes; an in-process run lasts longer than any function timeout |
| signer | a container on the **private network only** | anything with a public URL; serverless | it holds keys; `bindHost` refuses a non-loopback bind without `SIGNER_TOKEN` |
| indexer | one container, one replica | serverless / cron | a long-running poller with backoff; two replicas would do the same work twice (safe, since writes are idempotent, but wasteful) |
| Postgres | a container with a volume | a container without a volume | state; backups are a cron job ([§8](#8-backup-and-disaster-recovery)) |
| interface | Vercel | — | static + SSR Next.js; `NEXT_PUBLIC_API_URL` is baked in at build |
| A VM — **the chosen host** | all backend services via `docker-compose.full.yml` + `deploy/vps/docker-compose.vps.yml` | — | cheaper, and you own TLS (Caddy), restarts (`restart: unless-stopped`), backups (daily cron, [§8](#8-backup-and-disaster-recovery)) and patching (automatic security updates) |

## 2. Health, readiness and status

Every field is classified: **public** (safe on the internet), **authenticated**
(needs a token), **internal** (reachable only on the private network).

| Endpoint | Service | Returns | Class |
|---|---|---|---|
| `GET /health` | api | `ok`, `chains[{chainId,name,testnet,contract}]` (**corrected 2026-11-09**: the field is `contract`, the Pactora account id, not `escrow`; `chainId` is `near:testnet`), `defaultChainId`, `subscribers` (open SSE subscriptions), `orchestrator`, `build` | public |
| `GET /ready` | api | 200/503, `checks.database.ok`, `checks.signer.ok` — **no error text** (a driver error can name internal hosts) | public |
| `GET /v1/status` | api | overall status, components, per-chain RPC + indexer lag, build — [15 §4](15-api.md#4-get-v1status) | public |
| `GET /metrics` | api | Prometheus text | authenticated (`METRICS_TOKEN`); **not served** in production without one |
| `GET /health` | signer | `ok`, `chainId`, `keys` (the key source's kind — `dev-credentials-testnet-only`, `db-keystore`, joined with `+` when both; never a key), `wallets` (the balance watch's last snapshot: `checkedAt`, per-account readings, `anyLow`), `build` — **corrected 2026-11-09** (said `raw`/`keystore`; `apps/signer/src/app.ts`) | internal |
| `GET /ready` | signer | `checks.database`, `checks.rpc`, with error text | internal |
| `GET /metrics` | signer | Prometheus | internal (+ `METRICS_TOKEN` if set) |
| `GET /health` | indexer | `ok`, `build` | internal |
| `GET /ready` | indexer | `checks.database`, `checks.chain-<id>`: failing when no successful tick within `INDEXER_MAX_BACKOFF_MS + 5×INDEXER_POLL_MS` (70 s by default) | internal |
| `GET /metrics` | indexer | Prometheus | internal |

Compose health checks (`docker-compose.full.yml`): every service has a
`healthcheck` and `restart: unless-stopped`.

`/v1/status` is the endpoint for a public status page and for an external
uptime monitor. It is cached 5 s, bounded at 2 s per check, always answers
200; with the signer stopped it reports `signer: "down"`,
`status: "degraded"`.

## 3. Versioning

One scheme, one source per kind of version:

| What | Version | Where it is recorded | Rule |
|---|---|---|---|
| **A running backend** | the **git commit** | `/app/build-info.json` in the image → `build.commit` on every `/health` and `/v1/status` | The commit is the release identity. Nothing else needs to be bumped to deploy |
| HTTP API | `/v1` path prefix | `apps/api/src/routes/*` | Additive changes (new fields, routes, optional params) stay in `/v1`. Removing or changing the meaning of a field is a new prefix served alongside the old |
| Database schema | ordered migration files | `packages/db/migrations`, ledger table `_migrations` | Forward-only; never rename or edit an applied file ([§7](#7-database-and-migrations)) |
| Contracts | deployment | `deployments/<slug>.json` (`testnet.json`, `sandbox.json`) → account ids, `startBlock`; copied to `chain/` | A redeploy is new account ids and a new `startBlock`; `chain/` must be re-synced (CI fails otherwise) |
| Packages | `package.json` `version` | `0.0.1` in every backend package; `0.1.0` interface and contracts | Private and unpublished, so they carry no meaning today. `build.version` reports them for completeness |

How the commit gets into the image: the Dockerfile's runtime stage takes
`ARG GIT_SHA` (falling back to a build platform's `RAILWAY_GIT_COMMIT_SHA`
build argument when given), and writes it with the build time. CI passes `github.sha` and asserts it. A local
`docker build` without `--build-arg GIT_SHA=$(git rev-parse HEAD)` reports
`"commit": "unknown"` — honest, not wrong. Outside an image, `GIT_SHA` in the
environment is used if it is a hex commit. Anything that is not a hex commit,
a semver or an ISO time is reported as unknown, never echoed.

Proposed release tags when there is something to release to someone:
`backend-v0.x.y` on the commit that was deployed. Not created — no tags exist
and nothing consumes them yet (owner decision).

## 4. Environments and configuration

**Corrected 2026-11-09** against `docker-compose.yml`, `docker-compose.full.yml`
and `ci.yml`:

| Environment | Chain | Database | How it runs | Config |
|---|---|---|---|---|
| **local dev** | `near:sandbox` (local node, `--profile sandbox`) or `near:testnet` | docker compose Postgres on `127.0.0.1:5443`, database `pactora_near`, user `pactora` (shared; the test suite TRUNCATEs it); MinIO on `127.0.0.1:9110` | `pnpm dev`, `pnpm demo`, scripts | `.env` (from `.env.example`) + `pactora-contracts-near` checkout |
| **local production images** | `near:testnet` by default; `near:sandbox` with `RPC_URL_SANDBOX` | its own Postgres (the compose file's local credentials), own volume — **also published on host `:5443`**, so the dev stack and the full stack cannot run at the same time on one machine (a code issue in `docker-compose.full.yml`, not fixed; the VPS overlay removes the port) | `docker-compose.full.yml` | shell env; chain facts from `chain/` |
| **CI** | none (unit + integration against Postgres; `test:startup` points every service at a closed port) | service container `:5443`, `pactora_near` | `.github/workflows/ci.yml` | `pactora-contracts-near` and `pactora-docs-near` checked out beside |
| **testnet hosted** | `near:testnet` | Postgres container on the VPS, own volume, daily encrypted backup | one VPS (Docker Compose, Caddy) + Vercel — the recipe in `deploy/vps/README.md`; **not hosted today** | the server's `.env` (never committed); chain facts from `chain/` in the image |
| **mainnet** (future) | `near:mainnet` | separate | not built | no `near:mainnet` in `networks.json` and no `deployments/mainnet.json`, so `ENABLED_CHAINS=near:mainnet` refuses to boot (`✗ Pactora config invalid`). The signer refuses raw keys off testnet (AWS KMS, [docs/08 §5](08-configuration.md)); the mainnet procedure is future work ([docs/28](28-feature-inventory-2026-11.md)). Testnet only; mainnet needs the owner's explicit per-action confirmation |

**Which copy of a fact is authoritative** — the rule from docs/08:

| Fact | Authoritative | Copies, and what keeps them honest |
|---|---|---|
| Network facts (CAIP-2 id, RPC, block source, explorer) | `pactora-contracts-near/config/networks.json` | `pactora-backend-near/chain/config/` — byte copy, `sync-chain-facts.mjs --check` in CI. The interface reads them at runtime from `GET /v1/network` |
| Protocol parameters | `pactora-contracts-near/config/params.<slug>.json` | `chain/config/`, same check; on chain, `get_params` on the Pactora account (no drift script; compare by eye) |
| Contract account ids | `pactora-contracts-near/deployments/<slug>.json` (generated by `scripts/deploy.mjs`) | `chain/deployments/` (same check); served by `/health` (`chains[].contract`) and `/v1/network`. Compare by eye; there is no deployment-check script |
| RPC override | `RPC_URL_<SLUG>` env (`RPC_URL_TESTNET`, `RPC_URL_SANDBOX`), per service (api, signer, indexer; one value in the compose `x-chain` block) | must be set on each service that reads chain state; never served (`/v1/network` publishes the public URLs only). The indexer's block source is `networks.json`'s `blockSource` (neardata); `NEARDATA_API_KEY` raises its rate limit |
| API URL | `NEXT_PUBLIC_API_URL` on Vercel (build time) | `CORS_ORIGINS` on the API must name the site; `PACTORA_API_URL` for workers |
| Secrets | `.env` (locally, and the server's `.env` on the VPS) | none — `.env.example` has names only |

Deliberate duplicates in the interface, both security allowlists with an env
override rather than config drift: the CSP's RPC origins
(`next.config.mjs`, `NEXT_PUBLIC_RPC_ORIGINS`) and the explorer host allowlist
for links (`lib/links.ts`, `NEXT_PUBLIC_EXPLORER_HOSTS`). Test fixtures and the
mock API (`e2e/mock-api.mjs`) hard-code testnet addresses on purpose. Nothing
was consolidated: every copy is either checked or intentional.

The variable list in docs/08 §5 is kept complete by `pnpm check:env` in
`pactora-docs-near`.

## 5. Monitoring and alerting

### What exists

- **Logs:** pino, JSON to stdout, one `service` field per process, with
  redaction of `authorization`, `x-payment`, `cookie`, and any `apiKey`,
  `privateKey`, `password`, `passphrase`, `token` field
  (`packages/service/src/http.ts`). The API logs every request; the signer and
  indexer log events and failures. On the VPS, Docker keeps stdout as the
  container log (`docker compose logs <service>`).
- **Request ids:** an incoming `x-request-id` is honoured, else a UUID; the API
  returns it as `x-trace-id` and in every problem body, and forwards it to the
  signer.
- **Metrics** (`prom-client`, one registry per service, label `service`):

| Metric | Service | Labels |
|---|---|---|
| Node defaults (`process_cpu_*`, `process_resident_memory_bytes`, `nodejs_eventloop_lag_*`, `nodejs_heap_*`, `nodejs_gc_duration_seconds`, …) | all | — |
| `http_request_duration_seconds` (histogram) | api, signer, indexer health port | `method`, `route` (template), `status` |
| `signer_signed_total` | signer | `replayed` |
| `signer_refusals_total` | signer | `code` |
| `keeper_exits_total` | signer (keeper) | `exit`, `outcome` |
| `indexer_ticks_total` | indexer | `chain`, `outcome` |
| `indexer_last_success_seconds` | indexer | `chain` |
| `indexer_head_block`, `indexer_indexed_block`, `indexer_lag_blocks` | indexer | `chain` |
| `signer_wallet_balance` (gauge, NEAR) | signer (added with the wallet watch; `apps/signer/src/main.ts`) | `address`, `role` |
| `keeper_backlog_age_seconds` (gauge; 0 = none) | signer (keeper, `apps/signer/src/keeper.ts`) | — |
| `webhook_deliveries_total` | notifier | `outcome` |
| `channel_messages_total` | channels | `outcome` |

(The four rows above were added 2026-11-09 from the code; the names were
grep'd from `metrics.counter(` / `metrics.gauge(` calls.)

- **Escalating logs:** the indexer logs `warn` per failed tick and `error`
  ("indexer is failing") from the fifth consecutive failure.

### What is missing

No error tracking (Sentry or similar), no dashboards, no metrics scraper.
Since 2026-11-08 (branch `human-work`), `deploy/vps/alerts.sh` runs from
cron every 5 minutes and posts to a Slack or Discord webhook
(`ALERT_WEBHOOK_URL`) when the set of problems changes: `/ready`,
`/v1/status`, the signer gas floor, indexer lag (cursor age), the keeper
backlog (open escrow jobs past a deadline, held accounts excluded), failed
webhook deliveries, sanctions-list age, backup age. `--dry-run` prints the
checks. "Changes" ignores the numbers in a message (a lag growing from 900 s
to 1200 s is the same fault), and a post the webhook did not take is tried
again next run rather than lost. Caddy answers 404 to `/metrics` at the edge.
Checked locally against the dev stack and the production images behind
Caddy, with a full backup → wipe → restore rehearsal (row counts, table
digests and every evidence object's hash matched); not yet run on a server.

### What to wire up, smallest first

1. **An external uptime monitor** (any HTTP checker) on the API's
   `GET /v1/status` every 1–5 min, alerting when `status != "operational"`
   (body match), and on `GET /ready` for HTTP 503. This covers the database,
   signer, RPC and indexer lag with no new infrastructure.
2. **Container health** on the VPS: every service has a compose
   `healthcheck` and `restart: unless-stopped`; `docker compose ps` shows an
   unhealthy one.
3. Later: a Prometheus-compatible scraper (e.g. Grafana Cloud agent) with
   `METRICS_TOKEN`, for the alerts below that need metrics.

### Alerts

| Condition | Source | Severity | Owner | Runbook |
|---|---|---|---|---|
| `/v1/status` → `status: "down"` or unreachable for 2 checks | uptime monitor | SEV1 | owner | [R2](16-runbooks.md#r2-database-down), [R6](16-runbooks.md#r6-recover-a-failed-service) |
| `components.signer == "down"` 5 min | uptime monitor | SEV2 — hires and transitions fail with 503 | owner | [R6](16-runbooks.md#r6-recover-a-failed-service) |
| `components.indexer == "degraded"` 15 min (lag > 150 blocks, `STATUS_MAX_INDEXER_LAG_BLOCKS`), or `"down"` 5 min (stopped) | uptime monitor / `indexer_lag_blocks` | SEV3 (SEV2 if down) — settlements show late | owner | [R3](16-runbooks.md#r3-indexer-stopped-or-behind) |
| indexer `/ready` 503, or log "indexer halted: block does not follow the cursor" | container health / logs | SEV2 — projection frozen | owner | [R4](16-runbooks.md#r4-indexer-halted-or-showing-wrong-data) |
| `components.rpc == "down"` 10 min | uptime monitor | SEV2 | owner | [R5](16-runbooks.md#r5-rpc-down-or-rate-limited) |
| `rate(signer_refusals_total{code="INTERNAL"}[10m]) > 0` | metrics | SEV3 | owner | [R6](16-runbooks.md#r6-recover-a-failed-service) |
| `rate(http_request_duration_seconds_count{status=~"5.."}[5m])` > 1% of requests | metrics | SEV3 | owner | read logs by `traceId` |
| `keeper_exits_total{outcome="failed"}` increasing, or `keeper_backlog_age_seconds` growing | metrics; `alerts.sh` check 5 (jobs past a deadline) | SEV3 — expired jobs not exited; check the keeper account's NEAR balance | owner | [R9](16-runbooks.md#r9-rotate-secrets-and-keys) |
| Agent / keeper wallet NEAR low | **monitored** (corrected 2026-11-09, was "not monitored"): the signer's wallet watch → `signer_wallet_balance` per account, `/v1/status` `gas.state: "low"` (below `WALLET_LOW_BALANCE_YOCTO`; status is then `degraded` even with every component up), `alerts.sh` check 3 | SEV3 | owner | fund from the deployer account |

The owner is the project owner for every row: there is one person on call.

## 6. Indexer lifecycle

Checked 2026-11-09 against `apps/indexer/src/`.

- **Source:** **final blocks only**, in order, from the network's
  `blockSource` (neardata on testnet, RPC polling on the sandbox), at most
  50 blocks per tick (`MAX_BLOCKS_PER_TICK`), one tick per
  `INDEXER_POLL_MS` (2 s).
- **No reorgs, no confirmation depth:** final blocks do not reorg, so there
  is no rewind. Every block must name the previous one as its parent; one
  that does not halts the worker at that block (`ChainLinkError`, logged
  `indexer halted: block does not follow the cursor`) — a wrong source or a
  bug, not a reorg.
- **Cursor:** `indexer_cursor (chain_id text 'near:testnet', contract
  'Pactora')` → `last_block`, `last_block_hash`, `updated_at`, written in the
  same transaction as the batch. `INDEXER_START_AT_HEAD=1` seeds a **first**
  cursor at the final head (an existing cursor is never moved); without it a
  first start begins at the deployment's `startBlock`.
- **Idempotent replay:** keys are `job_events (chain_id, receipt_id,
  log_index)`, `token_transfers` likewise, `payments (chain_id, tx_hash,
  job_id)`; an event's effects (state, `payments`, reputation) run only if
  its insert happened, so replaying a range is a no-op. `job_events` is
  append-only (a trigger refuses UPDATE and DELETE).
- **Forward-only state:** an event never moves a job backwards
  (`AT_OR_BEFORE` in `indexer.ts`); the API's optimistic writes are
  corrected forward only.
- **RPC failure:** a failing tick never kills the process; retries back off
  exponentially with ±20 % jitter up to `INDEXER_MAX_BACKOFF_MS` (60 s), and
  one success resets it.
- **Chain → UI:** chain events → `job_events` / `jobs` / `payments` /
  `agent_stats` → API reads → interface. Since migration
  `0009_events_notify.sql`, an `AFTER INSERT` trigger on `job_events` and
  `run_events` sends `pg_notify` on the events channel (`EVENTS_CHANNEL` in
  `apps/api/src/live.ts`) with `{kind, topic, id}`; every API instance
  LISTENs, loads the row and publishes it on its SSE bus, so the indexer's
  events reach open streams live — as §1 says. Ids only, never the payload;
  a notify inside the indexer's transaction is held until commit.
- **Scope:** the Pactora contract's NEP-297 events and the payment token's
  NEP-141 `ft_transfer` events (`events.ts`). An event for a job the API did
  not create is logged and skipped.

Backfill, reindex and repair procedures: [16 R3–R4](16-runbooks.md#r3-indexer-stopped-or-behind).

## 7. Database and migrations

- **Technology:** PostgreSQL 16, drizzle ORM (`packages/db/src/schema.ts`),
  `postgres.js` driver. Money is `NUMERIC(38,0)` base units.
- **Migrations:** plain SQL files applied in filename order by
  `packages/db/bin/migrate.mjs`, each in its own transaction, recorded in
  `_migrations`, serialised by a Postgres advisory lock. `DATABASE_URL` is
  required (no fallback). On the VPS they run as the one-shot `migrate`
  service, and the signer and indexer start only after it completes
  successfully (the API waits for the signer); if a migration fails, nothing
  starts, and the failed file's transaction has rolled back.
- **Downtime review of the first migrations:**

| File | Change | Lock / risk at today's size |
|---|---|---|
| `0000_gifted_shaman` | initial tables, FKs, indexes | new objects |
| `0001_constraints` | composite FKs, CHECKs, append-only trigger on `job_events` | validating ALTERs take ACCESS EXCLUSIVE on `jobs`; empty at the time |
| `0001_sudden_morlocks` | `runs`, `run_events` | new tables |
| `0002_chubby_rawhide_kid` | nullable `jobs.idempotency_key` + unique index | metadata-only column; the index build blocks writes to `jobs` |
| `0003_fine_scarlet_spider` | `x402_redemptions` | new table |
| `0004_sweet_tusk` | nullable `api_keys.key_id` + unique index | as 0002 |
| `0005_numerous_falcon` | `public_id uuid DEFAULT gen_random_uuid() NOT NULL` on `jobs` and `runs` + unique indexes | a **volatile default rewrites the table** under ACCESS EXCLUSIVE — seconds at thousands of rows; would need a batched backfill at millions |

  The table reviews the first seven files. `packages/db/migrations/` now holds **35** `.sql` files,
  numbered `0000` through **`0022_sanctions_uk_source.sql`** (generated and
  hand-written files share numbers on purpose — `README.md` there). `0011_near_network_keys.sql` types every `chain_id` as text
  (`near:<network>`, CHECKed) and `0012_near_receipt_ids.sql` re-keys
  `job_events` on `receipt_id`; `0009_events_notify.sql` adds the live-event
  triggers (§6). The later files have **not** had the downtime review above;
  the additive rule has been kept by inspection, not re-verified.

  All of them are **additive**: the previous release's code runs against
  today's schema, which is what makes a code rollback safe. Future migrations
  should keep that property (add nullable, backfill, then constrain; never
  drop or rename in the same release that stops using a column). Because the
  runner wraps each file in a transaction, `CREATE INDEX CONCURRENTLY` cannot
  be used as written — a large-table index needs its own non-transactional
  step.
- **Rollback reality:** there are **no down migrations** (the runner has
  none, drizzle generates none). Rolling back means: redeploy the previous
  code (safe while migrations are additive) and, if a migration itself must be
  undone, write a new forward migration that reverses it — or restore a backup
  ([§8](#8-backup-and-disaster-recovery)).
- **Integrity** is enforced in the database, not only in code: chain-scoped
  composite FKs, `no_self_dealing`, `amount_positive`, `fee_within_amount`,
  `score_in_range`, kebab-case capabilities, unique idempotency keys, and the
  append-only trigger (tested in `packages/db/test/constraints.test.ts`).
- **Retention:** nothing is ever deleted. `job_events`, `run_events` and
  `signer_txs` grow without bound. Fine for a hackathon; a retention policy is
  an owner decision.

## 8. Backup and disaster recovery

- **Daily backups.** `deploy/vps/backup.sh` in
  `pactora-backend-near` runs from cron at 03:00 UTC and writes
  `pactora-db-<stamp>.dump.enc` (`pg_dump -Fc`) and
  `pactora-evidence-<stamp>.tar.enc` (the MinIO bucket via `mc mirror`),
  each **AES-256** (`openssl enc -aes-256-cbc -pbkdf2`, passphrase file
  `~/.pactora-backup-pass`, chmod 600, a copy kept off the server) with an
  **HMAC-SHA256** beside it (`<file>.hmac`, keyed from the passphrase under
  its own label, `backup-lib.sh`). Each run verifies the HMAC, decrypts the
  dump back and `pg_restore --list`s it (no tables = failed run), lists the
  archive, copies all four files to `BACKUP_REMOTE` over scp (warns when
  unset — a backup on the same disk dies with the disk) and keeps 7 days.
  The local dev database is a volume the tests truncate and is not backed up.
- **Restore** = `up -d --wait postgres`, `verify_hmac` the dump (stop if it
  fails), `openssl enc -d … | pg_restore --no-owner --exit-on-error`, then
  the evidence archive back into MinIO with `mc cp --enc-s3`, then `up -d`;
  the indexer keeps its cursor and catches up. The exact commands:
  `deploy/vps/README.md` ("Restore into a fresh database") and
  [16 R2](16-runbooks.md#r2-database-down). **Checked locally 2026-11-08**
  (backup → wipe → restore against the production images: 51 tables and 7
  evidence objects restored; wrong passphrase, truncated dump, truncated
  archive, empty directory, missing passphrase file and schema drift each
  failed the run).
- **`restore-test.sh`** (monthly cron) verifies the newest dump's HMAC
  before decrypting anything, restores it into a scratch database, fails if
  the table count differs from the live one or the dump is over 48 h old,
  counts the off-chain rows (agents, API keys, jobs, runs, evidence records,
  profiles, signer keys) and the evidence objects, then drops the scratch.
- **Not yet run on a server.** When it is, `BACKUP_REMOTE` must be set: with
  it unset the backups live on the same host, and losing the VPS loses them.
- **What can be rebuilt without a backup:** everything the indexer projects
  (job states, `payments`, `agent_stats`) can be re-derived from the chain for
  jobs whose rows exist. **What cannot:** agents' off-chain registrations
  (capabilities, prices, endpoints), API key hashes, job specs and results,
  run traces, the signer's nonce ledger. Losing the database means agents must
  re-register and receive new API keys.
- **Keys.** The agents' wallet keys **are in the database** (`signer_keys`,
  encrypted under `SIGNER_KEY_PASSPHRASE` from the server's `.env`), so the
  backup holds them and the passphrase is what must be kept off the server
  with the backup passphrase and `MINIO_KMS_SECRET_KEY`. Testnet dev
  credentials (`SIGNER_DEV_CREDENTIALS`) and the keeper's
  `KEEPER_ACCOUNT_ID` / `KEEPER_SECRET_KEY` are in `.env` only. Losing the
  passphrase loses every stored wallet key.
- **Targets (proposed, owner decision):** RPO 24 h (daily backup), RTO 1 h
  (restore + redeploy). The restore was rehearsed locally on 2026-11-08; a
  full timed recovery on a server has not been.

## 9. Security and access

- The signer is the crown jewel: private network only, `SIGNER_TOKEN`
  (≥ 32 chars, constant-time compare), loopback-only without it, raw keys
  refused off testnet, per-agent spend caps checked before signing (and
  enforced again on chain by the Pactora contract's per-task and daily
  caps; an agent wallet's function-call key is scoped to that contract and
  cannot withdraw).
- API: per-IP rate limit before auth; API keys stored as SHA-256 only; public
  UUIDs for jobs and runs; CORS required in production; helmet headers;
  endpoint URLs must be public https in production (SSRF guard).
- **Fixed:** public `/ready` echoed dependency errors (which can
  name internal hosts); `/metrics` was open on the public API unless a token
  was set.
- **Open findings:** no API-key rotation or revocation endpoint (SQL only,
  R9); `POST /v1/agents` is unauthenticated and unthrottled beyond the IP limit
  (spam registrations are possible); the API returns "the signer did not
  answer: <message>" to callers, where the message is Node's own fetch error
  (no host in it today, but not guaranteed); the rate limit is per process.
- **Access:** GitHub (`CODEOWNERS`: owner reviews every path), the VPS
  (key-only SSH) and Vercel accounts, and `.env` on the owner's machine and on
  the server. One person holds all of
  it — a bus-factor of one, and an owner decision.

## 10. Dependencies, CI/CD and release

- **Dependencies:** pnpm 9.12.0 (pinned), Node ≥ 22.12 (`.nvmrc` 22),
  lockfile frozen in CI and the image. Dependabot: weekly npm (minor/patch
  grouped), GitHub Actions and Docker base image. `pnpm audit --prod
  --audit-level high` in CI.
- **CI** (`.github/workflows/ci.yml`, on push to `master` and every PR):
  - *static* — `pnpm typecheck` (sources and tests), `pnpm lint`,
    `pnpm format:check`, `check-no-secrets.mjs`, gitleaks over the full
    history, `pnpm audit --prod --audit-level high`;
  - *test* — checks out `pactora-contracts-near` beside it (public, so
    `github.token` is enough) and `pactora-docs-near` (for the API-doc test),
    `sync-chain-facts.mjs --check`, build, migrate, `vitest run --coverage`
    against a Postgres service on `:5443` (`pactora_near`) with coverage
    floors enforced by `vitest.config.ts`, then **`pnpm test:startup`**
    (`scripts/test-startup.mjs`: each built service, given a bad
    configuration, must refuse to start and say why; reaches no network) —
    repo names and the startup step corrected 2026-11-09;
  - *images* — builds api, signer, indexer from this repo alone, with the
    commit baked in, and asserts they run as non-root.
  The interface has its own CI (typecheck, lint, format, unit, audit, build,
  Playwright smoke against a mock API). The contracts repo has its own.
- **Pre-commit hook** (`.githooks/pre-commit`): secret scan, prettier and
  eslint on staged files.
- **CD:** the site: Vercel builds and deploys on every push to the
  interface's `master`. The backend: none — images are built locally, loaded
  onto the VPS and started with `docker compose … up -d --no-build`
  ([13 §1](13-deploy.md#1-the-server)).
- **Release process:** merge to `master` with CI green → build and load the
  images, `up -d` on the VPS (migrations first, then signer, indexer, api) →
  `curl $API/health` (`chains[].contract` = `chain/deployments/<slug>.json`,
  `build.commit` = the merged commit), `curl $API/ready` 200, `/v1/status`
  operational, `node scripts/probe-api.mjs $API`. Details:
  [16 R1](16-runbooks.md#r1-deploy-and-verify).

## 11. Incident management

### Severities

| Sev | Meaning | Example | Response |
|---|---|---|---|
| SEV1 | Nothing works, or money/keys at risk | database down; signer key suspected leaked; wrong escrow served | now; stop the demo; rotate if keys |
| SEV2 | A core flow is broken | signer down (no hires); indexer halted; RPC down | within the hour |
| SEV3 | Degraded, workaround exists | indexer lagging; one worker down; keeper out of gas | same day |
| SEV4 | Cosmetic / no user impact | a log line, a doc | backlog |

### Process

1. **Declare** — note the time and the severity; one person owns it.
2. **Stabilise** — the runbook for the symptom ([16](16-runbooks.md)); roll
   back before debugging if a deploy caused it (R7).
3. **Communicate** — a maintenance/incident notice where users are (the
   submission page, the repo README) if it lasts beyond minutes.
4. **Verify** — `/v1/status` operational, `/health` serving the expected
   contract and commit, `probe-api.mjs` clean (R1's validation).
5. **Review** — a postmortem for SEV1/SEV2 within two days, committed to
   `docs/incidents/YYYY-MM-DD-<slug>.md`.

### Templates

**Incident report**

```
# Incident YYYY-MM-DD — <one line>
Severity: SEV_  ·  Status: investigating | mitigated | resolved
Started: <UTC>  ·  Detected: <UTC, how>  ·  Resolved: <UTC>
Impact: <who could not do what, for how long>
Current state: <one paragraph>
Next update: <UTC>
```

**Postmortem**

```
# Postmortem — <incident title>
Summary: <what happened, impact, duration>
Timeline (UTC): <detected → mitigated → resolved, one line each>
Root cause: <the actual cause, not the trigger>
What went well / what did not:
Action items: | action | owner | due | issue |
Blameless: describes systems and decisions, not people.
```

**Maintenance notice**

```
Pactora maintenance — <date>, <start>–<end> UTC
What: <e.g. database migration / redeploy>
Impact: <e.g. hires unavailable for ~2 min; browsing unaffected>
Status: <link to /v1/status or the site>
```
