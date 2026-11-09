# 13 — Deploying Pactora: one VPS + Vercel

**Status 2026-11-09: no Pactora backend is hosted today.** The stack has
been brought up this way locally (2026-11-08, `ENABLED_CHAINS=near:sandbox`,
all seven images, every component `operational`) but not yet on a server.
Hosting is optional for the hackathon: local-only is acceptable (rule
Q-012) with the public repos, the README and the video.

The source of truth for the server is
`pactora-backend-near/deploy/vps/README.md`: the server's `.env` with how to
generate each value, the exact build / save / load commands, the cron jobs,
backups, restore and alerts. This document is the overview around it.

```
             Vercel                         One VPS (Docker Compose, Caddy in front)
   ┌─────────────────────────┐        ┌─────────────────────────────────────────────┐
   │ pactora-interface-near  │ HTTPS  │ api ──(SIGNER_TOKEN)──▶ signer (keys, keeper)│
   │ NEXT_PUBLIC_API_URL     ├───────▶│  │                                          │
   └─────────────────────────┘        │  ├──▶ Postgres ◀── indexer, notifier,       │
                                      │  │                  channels                 │
                                      │  └──▶ MinIO (evidence)                       │
                                      │        bots (profile hosted) ──▶ api         │
                                      └─────────────────────────────────────────────┘
                                                        │
                                           NEAR testnet (near:testnet)
```

Seven images (api, signer, indexer, notifier, channels, three bots) plus
Postgres and MinIO, from `docker-compose.full.yml`. Only Caddy publishes a
port (80/443); the signer holds the keys and answers only with
`SIGNER_TOKEN`. The indexer reads final blocks from neardata (or the RPC).

---

## 0. Before you start

- **The contracts are deployed to testnet first** (contracts README,
  "Testnet": `create-dao`, `deploy`, `verify-near --network testnet --dao`).
- `pactora-backend-near` builds **from itself alone**. The chain facts every
  image carries (`config/networks.json`, `params.<slug>.json`,
  `deployments/<slug>.json`) are in `chain/`, a committed copy of
  `pactora-contracts-near`. After any deploy of the contracts:
  `node scripts/sync-chain-facts.mjs` and commit `chain/` — CI fails until you
  do. (**2026-11-09:** `chain/deployments/` holds `sandbox.json` only; a
  testnet deploy has to land there before a testnet image can be built.)
- Generate the shared secrets once (`openssl rand -hex 24`). Keep them out of
  chat and out of any committed file.
- Decide the model. `AGENT_MODE=cached` needs no key. A hosted live run needs
  a hosted key (`GEMINI_API_KEY`, `GROQ_API_KEY` or `ANTHROPIC_API_KEY`), and
  **that spends your quota** on every run someone starts from the site.
  Without a key the site still browses — marketplace, profiles, run history,
  registration — and `/health` says `orchestrator: false`.

## 1. The server

One Ubuntu server, 2 vCPU / 4 GB (1 GB was too little: the status probes
timed out under swap). The files are in `pactora-backend-near/deploy/vps/`:

| File | What it does |
|---|---|
| `bootstrap-ubuntu.sh` | ufw (22, 80, 443 only), Docker, 2 GB swap, automatic security updates |
| `docker-compose.vps.yml` | on top of `docker-compose.full.yml`: Postgres and the API publish **no** port; Caddy alone listens on 80/443 |
| `Caddyfile` | HTTPS for the API, Let's Encrypt, SSE passed through unbuffered, `/metrics` answers 404 at the edge |
| `backup.sh`, `backup-lib.sh` | daily: the database and the evidence bucket, encrypted and HMAC'd, checked, copied off the host (below) |
| `restore-test.sh` | monthly: verifies the newest backup's HMAC, restores it into a scratch database, compares it with the live schema |
| `alerts.sh` | every 5 minutes: readiness, status, signer gas, indexer lag, keeper backlog, failed webhooks, sanctions-list age, backup age |

The API's name is free: `api.<ip-with-dashes>.sslip.io` resolves to the
server, so Caddy can obtain a real certificate without a domain.

Images are built on your machine and loaded on the server; **the server
builds nothing**. The build needs the required variables set to
placeholders (the compose file refuses without them), and the saved archive
includes the pinned MinIO image. On the server:

```bash
docker compose -f docker-compose.full.yml -f docker-compose.vps.yml --profile hosted up -d --no-build
```

**The server's `.env`** (never committed). Required: `SIGNER_TOKEN`,
`SIGNER_KEY_PASSPHRASE` (encrypts the agents' wallet keys in Postgres — lose
it and those keys are lost), `API_HOST`, `CORS_ORIGINS`,
`COMPLIANCE_REVIEWERS` (two NEAR accounts; the api refuses to start in
production without them), `ENABLED_CHAINS` / `DEFAULT_CHAIN`
(`near:testnet`), `OBJECT_STORE_SECRET_ACCESS_KEY` and
`MINIO_KMS_SECRET_KEY` (the evidence MinIO's password and encryption key —
keep the latter with the backup passphrase, or no stored evidence can be
read), `WEBHOOK_SECRET_KEY` (shared by api and notifier). Recommended:
`KEEPER_ACCOUNT_ID` + `KEEPER_SECRET_KEY` (a gas-only testnet account).
Optional: `FAUCET_ACCOUNT_ID` + `FAUCET_SECRET_KEY`, `RPC_URL_TESTNET`,
`NEARDATA_API_KEY`, the model keys and the three `*_BOT_API_KEY`s (§4).
Every variable is in [docs/08 §5](08-configuration.md).

SSH is key-only (`PasswordAuthentication no`). A move between servers is
`pg_dump -Fc` from the old database into a fresh one before the services
start; the indexer keeps its cursor and catches up.

## 2. Vercel

**Add New → Project → import `pactora-interface-near`.** Framework: Next.js
(detected). Environment variables, for Production:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | the API's public URL, `https://api.<ip-with-dashes>.sslip.io` (§1) |
| `NEXT_PUBLIC_SITE_URL` | this site's own URL — without it, the link preview image (Open Graph) points at localhost |

Both are read **at build time** (the CSP is built from the API URL), so
changing one needs a redeploy, not just a restart. The build fails on purpose if
`NEXT_PUBLIC_API_URL` is missing.

Then set the API's `CORS_ORIGINS` on the server to the Vercel URL.

## 3. Check it

Read-only, no key:

- `curl -s $API/health` — `chains[].contract` must be the Pactora account in
  `chain/deployments/<slug>.json` of the commit you deployed, and
  `build.commit` that commit;
- `curl -s $API/ready` — 200 (database and signer);
- `curl -s $API/v1/status` — `"status": "operational"` once the indexer has
  caught up ([docs/14](14-operations.md), [docs/15 §4](15-api.md#4-get-v1status));
- `node scripts/probe-api.mjs $API` — the hostile-input checks; nothing it
  sends can spend;
- CORS: load the site.

Operating it afterwards: [docs/16 — Runbooks](16-runbooks.md).

## 4. Hosted live runs

An agent is registered through the site or `pnpm demo`
(`scripts/demo.mjs`, `DEMO_NETWORK=testnet`): the signer creates the wallet
key (kept encrypted in Postgres under `SIGNER_KEY_PASSPHRASE`), and the
owner's account creates the wallet and calls `register_agent`. For a visitor
to press **Run** on the hosted site:

| Need | Why | What does it |
|---|---|---|
| Workers **listening** | a hire needs a worker to accept it | the three bots, compose profile `hosted`; each takes its `PACTORA_API_KEY` as `RESEARCH_BOT_API_KEY`, `TRADING_BOT_API_KEY`, `EXECUTION_BOT_API_KEY` in the server's `.env` |
| A **run cap** | every run spends your model quota | `RUNS_PER_DAY` on the API (429 `RATE_LIMITED` past it) |
| A **model** | live runs call it | `AGENT_MODE=live`, `BRAIN_CHAIN` / `BRAIN_CHAIN_ORCHESTRATOR` and the provider keys ([docs/10](10-llm-architecture.md), [docs/08 §5](08-configuration.md)) |
| A fresh indexer start | a new database needs none of the chain's history | `INDEXER_START_AT_HEAD=1` |

A free-tier Gemini key has a small per-model daily request quota; for a
public demo enable billing on the key, or add a second provider (Groq) to
the chain, which moves on after two quick retries. The orchestrator's API
key never goes in a repo or on the site.

## 5. What costs money

| | |
|---|---|
| VPS | one server, 2 vCPU / 4 GB, running every backend service, the bots, Postgres and MinIO |
| Vercel | hobby tier is enough |
| Testnet NEAR | gas for every hire, accept, submit and settle, paid from the agents' wallets and the keeper account; the contracts README budgets ~25 testnet NEAR for a full deploy + verify pass |
| Model | every hosted live run calls the model — the one cost that is real money |

## 6. Backups

`deploy/vps/backup.sh` (in `pactora-backend-near`) runs from cron daily at
03:00 UTC and writes to the backups directory (`BACKUP_DIR`):
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
objects; every failure path failed the run). Not yet run on a server.
