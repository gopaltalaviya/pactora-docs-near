# 13 — Deploying Pactora: VPS + Vercel (Railway kept as an alternative)

> **Status 2026-11-09.** The Monad VPS (`api.64-177-41-175.sslip.io`) and
> its Vercel site were the AgentX deployment; the VPS was retired on
> 2026-11-06 and **no Pactora-on-NEAR backend is hosted today**. The live
> procedure for hosting the NEAR stack — the server's `.env`, the cron jobs,
> backups, restore and alerts — is `pactora-backend-near/deploy/vps/README.md`;
> [§5](#5-a-single-vps-the-live-deployment) below summarises it. §1–§3b are
> the **Monad baseline** (Railway plan, `check-deployment.mjs`,
> `seed-hosted.mjs`, v2/v3), kept for the shape of a deployment; their
> variable names and scripts do not exist in the NEAR repos.

The whole hosted deployment, step by step. Everything here was rehearsed on
2026-09-30 against the Monad production images, built the way Railway builds
them (one repo, no sibling checkout), with the signer bound the way Railway's
private network needs it — then checked with `scripts/check-deployment.mjs`
(Monad only; the NEAR backend has no such script — its read-only checks are
`GET /health`, `GET /v1/status` and `scripts/probe-api.mjs`). What was not
rehearsed is Railway and Vercel themselves: that needs your accounts.

> **Monad baseline, 2026-10; not the NEAR layout.** On NEAR the chain is
> `near:testnet`, read by the indexer from neardata, and the backend has
> seven images (api, signer, indexer, notifier, channels, three bots) plus
> Postgres and MinIO — `docker-compose.full.yml`.

```
             Vercel                         Railway (one project)
   ┌─────────────────────┐        ┌───────────────────────────────────────────┐
   │ agentx-interface    │ HTTPS  │ api ──(private net, SIGNER_TOKEN)──▶ signer │
   │ NEXT_PUBLIC_API_URL ├───────▶│  │                                   │    │
   └─────────────────────┘        │  └──────────▶ Postgres ◀── indexer ◀─┘    │
                                  │        workers (optional) ──▶ api          │
                                  └───────────────────────────────────────────┘
                                                   │
                                          Monad testnet (10143)
```

Only `api` gets a public domain. The signer holds the keys and is reachable
only over Railway's private network, and only with `SIGNER_TOKEN`.

---

## 0. Before you start

- `pactora-backend-near` builds **from itself alone**. The chain facts every
  image carries (`config/networks.json`, `params.<slug>.json`,
  `deployments/<slug>.json`) are in `chain/`, a committed copy of
  `pactora-contracts-near`. After any redeploy of the contracts:
  `node scripts/sync-chain-facts.mjs` and commit `chain/` — CI fails until you
  do. (**2026-11-09:** `chain/deployments/` holds `sandbox.json` only; a
  testnet deploy has to land there before a testnet image can be built.)
- Generate the shared token once: `openssl rand -hex 24`. Keep it out of chat
  and out of any committed file.
- Decide the model. Railway has no Ollama, so a hosted run needs a hosted
  key (`GEMINI_API_KEY`, `GROQ_API_KEY` or `ANTHROPIC_API_KEY`). **That spends
  your quota** on every run someone starts from the site. Without a key the
  site still browses — marketplace, profiles, run history, registration — and
  `/health` says `orchestrator: false`.

## 1. Railway

> **Monad baseline, 2026-10; not the NEAR procedure.** The tables below use
> the Monad names: `ENABLED_CHAIN_IDS` / `DEFAULT_CHAIN_ID` (`10143`),
> `SIGNER_DEV_PRIVATE_KEYS`, `SIGNER_KEYSTORE_JSON`, `KEEPER_PRIVATE_KEY`,
> `PACTORA_CHAIN_ID=10143`. On NEAR they are `ENABLED_CHAINS` /
> `DEFAULT_CHAIN` (`near:testnet`), `SIGNER_DEV_CREDENTIALS` +
> `SIGNER_KEY_PASSPHRASE`, `KEEPER_ACCOUNT_ID` + `KEEPER_SECRET_KEY`,
> `PACTORA_CHAIN_ID=near:testnet`; the full list with what each is for is
> the `.env` block in `pactora-backend-near/deploy/vps/README.md`. The
> `deploy/railway/*.json` files still exist in the backend, but nothing has
> been deployed to Railway since the trial expired, and the live procedure
> is the VPS one in that README.

Create a project, then add, in this order:

### 1.1 Postgres

**+ New → Database → PostgreSQL.** Nothing to configure.

### 1.2 Shared variable

Project **Settings → Shared Variables**: `SIGNER_TOKEN` = the token from §0.

### 1.3 Services

Each is **+ New → GitHub Repo → `agentx-backend`**, then in the service's
**Settings**: set **Config-as-code file path** to the file named below, and
rename the service to the name given (the variable references below use it).

Railway passes service variables to the Docker build, so `SERVICE` picks which
app the image contains.

#### `signer` — `deploy/railway/signer.json` · no public domain

| Variable | Value |
|---|---|
| `SERVICE` | `@pactora/signer` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `ENABLED_CHAIN_IDS` | `10143` |
| `DEFAULT_CHAIN_ID` | `10143` |
| `SIGNER_TOKEN` | `${{shared.SIGNER_TOKEN}}` |
| `SIGNER_HOST` | `::` — Railway's private network is IPv6 |
| `SIGNER_PORT` | `7070` |
| `PORT` | `7070` — so Railway's health check reaches `/ready` |
| `SIGNER_DEV_PRIVATE_KEYS` | the agents' keys, comma-separated; each agent is matched to its key by its registered wallet address, so distinct agents need distinct keys (testnet only — the signer refuses raw keys on any other chain). Or `SIGNER_KEYSTORE_JSON` + `SIGNER_KEYSTORE_PASSPHRASE` |
| `KEEPER_PRIVATE_KEY` | a gas-only key the signer never signs for — enables the keeper (expired jobs, `expireDispute`) |

#### `api` — `deploy/railway/api.json` · **generate a public domain**

Migrations run before each deploy (`preDeployCommand`), from this image.

| Variable | Value |
|---|---|
| `SERVICE` | `@pactora/api` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `ENABLED_CHAIN_IDS` | `10143` |
| `DEFAULT_CHAIN_ID` | `10143` |
| `HOST` | `::` |
| `PORT` | `8080` — fixed, so the workers' private URL below is stable |
| `SIGNER_URL` | `http://${{signer.RAILWAY_PRIVATE_DOMAIN}}:7070` |
| `SIGNER_TOKEN` | `${{shared.SIGNER_TOKEN}}` |
| `TRUST_PROXY` | `1` — rate limits by the caller, not Railway's proxy |
| `CORS_ORIGINS` | the Vercel URL, exactly, e.g. `https://agentx.vercel.app` (§2 gives it; until then any placeholder — the API refuses to boot in production without one) |
| *model, optional* | `GEMINI_API_KEY` (or Groq / Anthropic), `BRAIN_CHAIN_ORCHESTRATOR=gemini`, `AGENT_MODE=live` |
| `METRICS_TOKEN` | optional — `openssl rand -hex 24`. In production the API serves no `/metrics` without it |

`/ready` answers 503 until the signer is up — that is correct, and why the
signer goes first.

#### `indexer` — `deploy/railway/indexer.json` · no public domain

| Variable | Value |
|---|---|
| `SERVICE` | `@pactora/indexer` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `ENABLED_CHAIN_IDS` | `10143` |
| `DEFAULT_CHAIN_ID` | `10143` |
| `INDEXER_HEALTH_PORT` | `9090` |
| `PORT` | `9090` |

#### Workers — `deploy/railway/worker.json` · optional

The three bots (`@pactora/research-bot`, `@pactora/trading-bot`,
`@pactora/execution-bot`) can run anywhere that reaches the API — a laptop is
fine for the demo. Hosted, each is one service with:

| Variable | Value |
|---|---|
| `SERVICE` | e.g. `@pactora/research-bot` |
| `PACTORA_API_URL` | `http://${{api.RAILWAY_PRIVATE_DOMAIN}}:8080` |
| `PACTORA_API_KEY` | the key `POST /v1/agents` returned when that worker registered (shown once) |
| `PACTORA_CHAIN_ID` | `10143` |
| model | a hosted key and `BRAIN_CHAIN` naming it, `AGENT_MODE=live` |

## 2. Vercel

**Add New → Project → import `pactora-interface-near`** (Monad: `agentx-interface`). Framework: Next.js
(detected). One environment variable, for Production:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | the API's public URL — on the VPS `https://api.<ip-with-dashes>.sslip.io` (§5); the Railway form was `https://<service>.up.railway.app` |
| `NEXT_PUBLIC_SITE_URL` | this site's own URL, e.g. `https://agentx.vercel.app` — without it, the link preview image (Open Graph) points at localhost |

It is read **at build time** — the CSP is built from it — so changing it
needs a redeploy, not just a restart. The build fails on purpose if it is
missing.

Then go back to Railway and set the API's `CORS_ORIGINS` to the Vercel URL.

## 3. Check it

> **Monad baseline, 2026-10.** `scripts/check-deployment.mjs` is Monad-only;
> the NEAR backend has no equivalent (its `scripts/` are check-no-secrets,
> demo, live-ui-stack, local-up, probe-api, sanctions-refresh,
> sync-chain-facts, test-startup). The NEAR check, read-only, is:
> `curl -s $API/health` — `chains[].contract` must be the Pactora account in
> `chain/deployments/<slug>.json` of the commit you deployed, `build.commit`
> that commit; `curl -s $API/ready` 200; `curl -s $API/v1/status` →
> `"status": "operational"` once the indexer has caught up; and
> `node scripts/probe-api.mjs $API` for the hostile-input checks (nothing it
> sends can spend). CORS is checked by loading the site.

```bash
cd agentx-backend
node scripts/check-deployment.mjs https://<api-domain> https://<vercel-domain>
```

Read-only, no key. It checks that the API serves the escrow this repo was
built for, is ready (database *and* signer), does not enumerate jobs or runs,
sends security headers, lets the site in and nobody else through CORS — and
that the site answers, its CSP can reach the API, and unknown runs are real
404s. Each failure says what to change. Rehearsed against the production
images on 2026-09-30: every check passed, and a wrong site origin failed the
CORS check as it should.

The public status summary the site's status page reads —
`curl -s https://<api-domain>/v1/status` — should say `"status": "operational"`
once the indexer has caught up, and `build.commit` should be the commit
you deployed ([docs/14](14-operations.md), [docs/15 §4](15-api.md#4-get-v1status)).
Operating it afterwards: [docs/16 — Runbooks](16-runbooks.md).

Then one real run: on the site's home page, paste the orchestrator agent's
API key, type a goal, **Run**, and watch each step settle on the explorer.
That needs the model from §0, a registered and funded orchestrator, and
workers listening.

## 3b. Hosted live runs

> **Monad baseline, 2026-10; not the NEAR procedure.** `seed-hosted.mjs`,
> `../agentx-contracts/.env`, `SIGNER_DEV_PRIVATE_KEYS`,
> `SESSION_MANAGER_PRIVATE_KEY`, `AgentAccount` session keys, MON funding
> and the v2/v3 split are Monad history; none exists on NEAR, where there is
> no v2→v3 and no session manager. On NEAR an agent is registered through
> the site or `pnpm demo` (`scripts/demo.mjs`, `DEMO_NETWORK=testnet`): the
> signer creates the wallet key (kept encrypted in Postgres under
> `SIGNER_KEY_PASSPHRASE`), the owner's account creates the wallet and calls
> `register_agent`. The hosted bots still take `PACTORA_API_KEY` as
> `RESEARCH_BOT_API_KEY`, `TRADING_BOT_API_KEY`, `EXECUTION_BOT_API_KEY` in
> the server's `.env` (`docker-compose.full.yml`, profile `hosted`); the
> model-chain and `RUNS_PER_DAY` notes below still apply.

Browsing needs only §1–§3. For a judge to press **Run** on the hosted site,
four more things must be true — each one was a reason a hosted run would
fail, and each is now handled:

| Need | Why | What does it |
|---|---|---|
| Agents on **fresh keys** | the demo's keys are fixed and public in `scripts/demo.mjs` | `scripts/seed-hosted.mjs` |
| Session keys **renewed daily** | `AgentAccount` caps a grant at 24 h — a hosted orchestrator stopped hiring after a day. v3: the owner names a **session manager** that may only extend a grant (spent and budget kept), so the server never holds the owner key (audit F1, docs/22) | the signer's renewer, `SESSION_MANAGER_PRIVATE_KEY` |
| Workers **listening** | a hire needs a worker to accept it | three worker services, the `hosted` compose profile |
| A **run cap** | the orchestrator key goes to judges; every run spends your model quota | `RUNS_PER_DAY` on the API (429 `RATE_LIMITED` past it) |

### Seed the agents (once, after the API is up)

```bash
cd agentx-backend
set -a; . ../agentx-contracts/.env; set +a
node scripts/seed-hosted.mjs https://<api-domain>
```

It writes `artifacts/hosted-agents.json` (gitignored) — keys, API keys, and an
`env` block with exactly what each service needs. FUNDER pays gas — 5 MON to the
orchestrator's session key, 1.5 MON to each worker key, 1 MON to the owner and
1 MON to the session manager, about 11.5 MON in all (unset `FUNDER_PRIVATE_KEY` to have the deployer pay).
A hosted run measured 0.21 MON: 0.14 for the orchestrator, 0.034 per hired
worker. `--top-up` refills them; `--reclaim` sends what is left back when the
agents are retired. Nothing secret is printed.

### Variables, on top of §1

| Service | Variable | Value |
|---|---|---|
| `signer` | `SIGNER_DEV_PRIVATE_KEYS` | `env.signer.SIGNER_DEV_PRIVATE_KEYS` from the seed file |
| `signer` | `SESSION_MANAGER_PRIVATE_KEY` | `env.signer.SESSION_MANAGER_PRIVATE_KEY` (v2 seed files call it `SESSION_OWNER_PRIVATE_KEY`; keep one, the signer refuses both) |
| `signer` | `KEEPER_PRIVATE_KEY` | FUNDER's key (gas only) |
| `api` | `AGENT_MODE` · `BRAIN_CHAIN_ORCHESTRATOR` · `GEMINI_API_KEY` · `GROQ_API_KEY` | `live` · `gemini:gemini-flash-lite-latest,gemini:gemini-3.5-flash-lite,groq,gemini:gemini-3.6-flash,gemini` · your keys |
| `api` | `RUNS_PER_DAY` | `20` (the live deployment: 20 hosted runs per day per key) |
| `indexer` | `INDEXER_START_AT_HEAD` | `1` — a new database needs none of the chain's history; without it the indexer backfills ~2 h before it is current |
| each worker | `SERVICE` · `PACTORA_API_URL` · `PACTORA_API_KEY` · `PACTORA_CHAIN_ID` | `@pactora/research-bot` (etc.) · `http://${{api.RAILWAY_PRIVATE_DOMAIN}}:8080` · `env.workers.<capability>.PACTORA_API_KEY` · `10143` |
| each worker | `AGENT_MODE` · `BRAIN_CHAIN` · `GEMINI_API_KEY` · `GROQ_API_KEY` | `live` · `gemini:gemini-flash-lite-latest,gemini:gemini-3.5-flash-lite,groq,gemini:gemini-3.6-flash,gemini` · your keys |

**A free-tier Gemini key allows 20 requests per model per day** (2026-10-07,
`GenerateRequestsPerDayPerProjectPerModel-FreeTier`); a 3-agent run makes
~12–15. For a public demo enable billing on the key, or add another provider.
`gemini-flash-latest` was dropped: it hung 60 s with no answer. **Groq** (free
key, `openai/gpt-oss-120b`) is in the chain as a second provider with its own
quota (2026-10-08); a run on Groq alone planned, hired and judged live.

The chain lists several Gemini models because one can be overloaded while
others on the same key answer (2026-10-05: `3.8-flash` and `3.7` refused with
503 "high demand", `3.6`, `3.5` and `flash-latest` answered). Order it by what
answers on the day; the chain moves on after two quick retries.

The orchestrator's API key (`env.orchestratorApiKeyForJudges`) goes in the
submission form only — never in a repo, never on the site.

Rehearsed end to end on this machine with the production images and the
`hosted` profile ([docs/17 §20](17-production-readiness.md)):

```bash
docker compose -f docker-compose.full.yml --profile hosted up -d
```

## 4. What costs money

> **Monad figures, 2026-10.** On NEAR, gas is paid in testnet NEAR from the
> agents' wallets and the keeper account (the contracts README budgets ~25
> testnet NEAR for a full deploy + verify pass); the VPS row describes the
> retired Monad server.

| | |
|---|---|
| VPS (live) | one Vultr server, 2 vCPU / 4 GB, running every backend service, the hosted workers and Postgres |
| Railway | not used (trial expired); would be 4 small services + Postgres, 7 with the hosted workers |
| Vercel | hobby tier is enough |
| Testnet MON | every hire, accept, submit and settle pays gas from the agents' wallets; ~0.5 MON per full demo run |
| Model | every hosted run calls the model — the one cost that is real money |

## 5. A single VPS (the live deployment)

**Status 2026-11-09:** this is the recipe the Monad server ran until it was
retired on 2026-11-06; the NEAR stack has been brought up this way locally
(2026-11-08, `ENABLED_CHAINS=near:sandbox`, all seven images, every
component `operational`) but **not yet on a server**. The source of truth
is `pactora-backend-near/deploy/vps/README.md`.

The site is on Vercel; the backend runs on one Ubuntu server (Vultr,
2 vCPU / 4 GB — 1 GB was too little: the status probes timed out under swap).
The files are in `pactora-backend-near/deploy/vps/`:

| File | What it does |
|---|---|
| `bootstrap-ubuntu.sh` | ufw (22, 80, 443 only), Docker, 2 GB swap, automatic security updates |
| `docker-compose.vps.yml` | on top of `docker-compose.full.yml`: Postgres and the API publish **no** port; Caddy alone listens on 80/443 |
| `Caddyfile` | HTTPS for the API, Let's Encrypt, SSE passed through unbuffered, `/metrics` answers 404 at the edge |
| `backup.sh`, `backup-lib.sh` | daily: the database and the evidence bucket, encrypted and HMAC'd, checked, copied off the host (below) |
| `restore-test.sh` | monthly: verifies the newest backup's HMAC, restores it into a scratch database, compares it with the live schema |
| `alerts.sh` | every 5 minutes: readiness, status, signer gas, indexer lag, keeper backlog, failed webhooks, sanctions-list age, backup age |

The API's name is free: `api.<ip-with-dashes>.sslip.io` resolves to the server,
so Caddy can obtain a real certificate without a domain.

```bash
# on this machine: images are built here and loaded there — the server builds nothing.
# The build needs the required variables set to placeholders (the compose file refuses without them).
SIGNER_TOKEN=placeholder-placeholder-placeholder-00 SIGNER_KEY_PASSPHRASE=placeholder-placeholder-placeholder-00 \
  OBJECT_STORE_SECRET_ACCESS_KEY=placeholder MINIO_KMS_SECRET_KEY=placeholder WEBHOOK_SECRET_KEY=placeholder \
  docker compose -f docker-compose.full.yml --profile hosted build
# Corrected 2026-11-09: the evidence store is a pinned MinIO image (docker-compose.full.yml, `minio` and `minio-setup`); save it too.
docker save $(docker images --format '{{.Repository}}' | grep agentx-full) postgres:16-alpine caddy:2-alpine \
  cgr.dev/chainguard/minio@sha256:869ca3178831d9f521ea02258a0f0d4fbc1e9f84302e707514e1f861b860865d | gzip > images.tar.gz
# on the server, in ~/agentx with .env, docker-compose.full.yml, docker-compose.vps.yml, Caddyfile and the deploy/vps scripts:
gunzip -c images.tar.gz | docker load
docker compose -f docker-compose.full.yml -f docker-compose.vps.yml --profile hosted up -d --no-build
```

**The server's `.env`** (never committed). **Corrected 2026-11-09:** the
earlier summary — `SIGNER_TOKEN`, `API_HOST`, `CORS_ORIGINS` and the §3b
variables — is short of what `docker-compose.full.yml` now refuses to start
without. Required: `SIGNER_TOKEN`, `SIGNER_KEY_PASSPHRASE` (encrypts the
agents' wallet keys in Postgres — lose it and those keys are lost),
`API_HOST`, `CORS_ORIGINS`, `COMPLIANCE_REVIEWERS` (two NEAR accounts; the
api refuses to start in production without them), `ENABLED_CHAINS` /
`DEFAULT_CHAIN` (`near:testnet`), `OBJECT_STORE_SECRET_ACCESS_KEY` and
`MINIO_KMS_SECRET_KEY` (the evidence MinIO's password and encryption key —
keep the latter with the backup passphrase, or no stored evidence can be
read), `WEBHOOK_SECRET_KEY` (shared by api and notifier). Recommended:
`KEEPER_ACCOUNT_ID` + `KEEPER_SECRET_KEY` (a gas-only testnet account).
Optional: `FAUCET_ACCOUNT_ID` + `FAUCET_SECRET_KEY`, `RPC_URL_TESTNET`,
`NEARDATA_API_KEY`, the model keys and the three `*_BOT_API_KEY`s. The
annotated block, with how to generate each value, is the top of
`pactora-backend-near/deploy/vps/README.md` — read that, not this, when
writing the file.

Then on Vercel set `NEXT_PUBLIC_API_URL=https://api.<ip>.sslip.io` and
**redeploy** (it is read at build time), and run §3. SSH is key-only
(`PasswordAuthentication no`). A move between servers is `pg_dump -Fc` from the
old database into a fresh one before the services start; the indexer keeps its
cursor and catches up.

*Monad record, 2026-10-07:* 16/16 deployment checks, status `operational`
throughout, and three runs from the site with the example goal settled 2/2 each
(88–91 s). The paragraph below is the same Monad deployment (`AgentAccount`,
MockUSDC caps); the NEAR stack has no hosted run record yet.

The judges' hosted orchestrator pays through its `AgentAccount` with on-chain
caps of 0.1 MockUSDC per task and 5 MockUSDC per day, and the API allows 20
hosted runs per day per key. The hosted model chain is Gemini (flash-lite
models first, free tier) with a Groq fallback (`openai/gpt-oss-120b`) when
Gemini's quota is exhausted; the site shows a clear notice when the model is
rate-limited.

### Backups

**Corrected 2026-11-09** (the plain `pg_dump -Fc` described here before was
the Monad script). `deploy/vps/backup.sh` (in `pactora-backend-near`) runs
from cron daily at 03:00 UTC and writes to `~/agentx/backups/`:
`pactora-db-<stamp>.dump.enc` (`pg_dump -Fc`) and
`pactora-evidence-<stamp>.tar.enc` (the MinIO bucket), each AES-256
(`openssl enc -pbkdf2`, passphrase file `~/.pactora-backup-pass` — keep a
copy off the server) with an HMAC-SHA256 beside it (`<file>.hmac`,
`backup-lib.sh`). Each run verifies the HMAC, decrypts the dump back and
`pg_restore --list`s it (no tables = failed run), copies all four files to
`BACKUP_REMOTE` over scp (warns when unset), and keeps 7 days.
`restore-test.sh` runs monthly. **Restore** = bring up `postgres` alone,
`verify_hmac` the file, `openssl enc -d` it into `pg_restore --no-owner
--exit-on-error`, then the evidence archive into MinIO, then `up -d`; the
exact commands are in `deploy/vps/README.md` ("Restore into a fresh
database") and [docs/16 R2](16-runbooks.md#r2-database-down). Checked
locally on 2026-11-08 (backup → wipe → restore, 51 tables, 7 evidence
objects; every failure path failed the run); the 2026-10-08 rehearsal was
the Monad script. Not yet run on a server.
