# 08 — Configuration Architecture

**Decision (2026-11-05):** ship on **NEAR testnet** (`near:testnet`)
with a local sandbox (`near:sandbox`) for the one-command demo. A mainnet
entry would be configuration, not a code path — but none is written, and the
standing rule is testnet only.

This document is the single-source-of-truth design. It exists because
"support two networks" is where projects quietly grow a second copy of every
constant.

Every section below states the NEAR facts, checked against the code. Paths
are `pactora-backend-near` unless a repo is named.

---

## 1. The rule

> **Every fact is declared in exactly one place. Everything else derives from
> it.**

A fact typed twice is a fact that will disagree with itself. The whole design
below is the mechanical application of that one rule.

Four config domains, four owners, no overlap:

| Domain | Single source | Format | Who writes it |
|---|---|---|---|
| **Network facts** | `config/networks.json` (in `pactora-contracts-near`) | JSON, keyed by CAIP-2 id | human, rarely |
| **Protocol parameters** | `config/params.<slug>.json` | JSON: `onchain` + `offchain` | human, per network |
| **Deployed accounts** | `deployments/<slug>.json` | JSON | **generated** by `scripts/deploy.mjs` |
| **Secrets & runtime** | environment variables | env | ops, per environment |

And the rule that keeps them apart:

> **Secrets go in env. Everything else goes in versioned config.**

An RPC URL is not a secret. A chain id is not a secret. A contract account is
not a secret. Putting them in env vars is how you end up with a staging
deployment pointing at mainnet.

The backend reads the contracts checkout directly (`PACTORA_CONTRACTS_ROOT`,
default the sibling `pactora-contracts-near`). A hosted image cannot be handed
a sibling checkout, so `scripts/sync-chain-facts.mjs` copies `config/` and
`deployments/` into the backend's committed `chain/`; CI runs it with
`--check` and fails when the copy has drifted.

---

## 2. Network registry — `config/networks.json`

Lives in `pactora-contracts-near`. Keyed by **CAIP-2 id** (`near:<network>`,
the convention NEAR x402 code uses; ChainAgnostic has no NEAR profile yet, so
it is a convention, not a registered standard). `slug` names the params and
deployments files, because `:` is not allowed in Windows paths.
`nearNetworkId` is what the RPC's `status.chain_id` must answer: **every
service checks it at start** and refuses an RPC that serves another network.

```json
{
  "near:testnet": {
    "chainId": "near:testnet",
    "slug": "testnet",
    "nearNetworkId": "testnet",
    "name": "NEAR Testnet",
    "shortName": "near-testnet",
    "testnet": true,
    "nativeCurrency": {"name": "NEAR", "symbol": "NEAR", "decimals": 24},
    "rpcUrls": ["https://rpc.testnet.near.org"],
    "blockSource": {"kind": "neardata", "url": "https://testnet.neardata.xyz"},
    "blockExplorerUrls": ["https://testnet.nearblocks.io"],
    "faucetUrls": [],
    "paymentToken": {"symbol": "mUSDC", "decimals": 6, "accountId": null, "deployWithProtocol": true}
  },
  "near:sandbox": {
    "chainId": "near:sandbox",
    "slug": "sandbox",
    "nearNetworkId": "sandbox",
    "name": "NEAR Sandbox (local)",
    "shortName": "near-sandbox",
    "testnet": true,
    "nativeCurrency": {"name": "NEAR", "symbol": "NEAR", "decimals": 24},
    "rpcUrls": ["http://127.0.0.1:3030"],
    "blockSource": {"kind": "rpc"},
    "blockExplorerUrls": [],
    "faucetUrls": [],
    "paymentToken": {"symbol": "mUSDC", "decimals": 6, "accountId": null, "deployWithProtocol": true}
  }
}
```

The fields doing real work:

- **`blockSource`** — where the indexer reads final blocks: `neardata`
  (FastNear's block API; testnet, and a mainnet would use it too) or `rpc`
  polling (the local sandbox, which neardata does not serve).
- **`paymentToken.deployWithProtocol`** — both networks deploy the mock USDC
  (`contracts/mock-usdc`) and the deploy writes its account into the
  deployment file; the loader resolves `paymentToken.accountId` from there.
  A network with `testnet: false` and no `accountId` is **refused** by the
  loader: a real network needs a real token named here first.
- **`testnet`** — gates every raw key: `SIGNER_DEV_CREDENTIALS`,
  `KEEPER_SECRET_KEY` and the faucet refuse to load where it is `false`
  (`apps/signer/src/keysource.ts`); the simulated identity provider refuses
  too (`apps/api/src/main.ts`).

There is no `confirmations` field: the indexer reads **final** blocks only,
so a NEAR block in the database is never reorganised away. The agent
registry and reputation are inside the Pactora contract, so the network entry
names no other contract.

---

## 3. Protocol parameters — `config/params.<slug>.json`

Two halves, read by different programs:

- **`onchain`** is the contract's `Params` struct, snake_case, exactly as
  `new(params)` takes it and `get_params` returns it. `scripts/deploy.mjs`
  passes it byte for byte and then **reads `get_params` back and fails the
  deploy if it differs** — that is the drift check, built into the deploy.
- **`offchain`** is read only by the backend (`@pactora/config`): the windows
  it asks the contract for on each job, the fast-path score, the confidence
  floor.

```jsonc
// config/params.testnet.json — 18 on-chain parameters
{
  "onchain": {
    "protocol_fee_bps": 100,          // 1 %
    "min_fee": "100",                 // 0.0001 mUSDC — every review costs something
    "min_job_amount": "10000",        // 0.01 mUSDC — no dust jobs
    "max_job_amount": "10000000",     // 10 mUSDC
    "fast_path_max": "30000",         // 0.03 mUSDC
    "review_window": 600,             // 10 min to dispute, then auto_approve
    "max_accept_window": 3000,        // the most a client may ask for (10× the offchain default)
    "max_work_window": 18000,
    "dispute_timeout": 604800,        // 7 days: the arbiter DAO's proposal period
    "dispute_grace": 86400,           // 1.1.0: 24 h more before anyone may expire an unruled dispute
    "bond_bps": 2000,                 // worker bond: 20 % of the job, at least min_bond
    "min_bond": "10000",
    "dispute_bond_bps": 1000,         // client dispute bond: 10 %, at least min_dispute_bond
    "min_dispute_bond": "10000",
    "min_stake": "10000000",          // 10 mUSDC
    "withdraw_delay": 604800,         // 7 days between request_unstake and complete_unstake
    "default_per_task_cap": "100000", // 0.10 mUSDC: a new agent's on-chain spend cap
    "default_daily_cap": "1000000"    // 1.00 mUSDC per rolling 24 h
  },
  "offchain": {
    "acceptWindowSeconds": 300,       // what the backend asks for; ≤ max_accept_window
    "workWindowSeconds": 1800,        // ≤ max_work_window
    "fastPathMinScore": 70,
    "confidenceFloor": 25
  }
}
```

`params.sandbox.json` is the same except `review_window`, `dispute_timeout`,
`dispute_grace` and `withdraw_delay`, which are **10 s** so `pnpm demo:local`
and `verify-near` can run every exit path (auto-approve, expire a dispute,
complete an unstake) in seconds.

The loader (`packages/config/src/index.ts`) validates both halves with zod
(`onchain` is `.strict()`: an unknown or missing key is a boot failure, so
the file cannot drift from the contract's struct unnoticed) and enforces one
cross-rule: each off-chain window must be **≤ the contract's `max_*_window`**,
or the service refuses to start. The parameter table in
[04](04-how-it-works.md) is documentation of these files, not a second copy.

```
config/params.<slug>.json
   │
   ├─▶ scripts/deploy.mjs      onchain → new(params); get_params read back, must match
   ├─▶ @pactora/config          zod-validated, frozen → api (fast-path rule, windows,
   │                           default caps, dispute grace), signer, indexer, keeper
   └─▶ pactora-interface-near   via GET /v1/network: the site shows the real thresholds
```

Any later change to the live parameters is `set_params` on the contract (owner
only, see the contracts README method table), **and** the same edit to this
file, or the next boot's loader and the chain disagree.

---

## 4. Deployments — `deployments/<slug>.json`

**Generated. Never hand-edited.** `scripts/deploy.mjs` writes it after the
contracts are deployed, initialised and checked.

```json
{
  "chainId": "near:testnet",
  "deployedAt": "2026-11-…T…Z",
  "startBlock": 123456789,
  "commit": "<DEPLOY_COMMIT, if set>",
  "contracts": {
    "Pactora":      "pactora.<deployer>.testnet",
    "PaymentToken": "musdc.<deployer>.testnet",
    "Arbiter":      "<the 2-of-3 Sputnik DAO>.sputnikv2.testnet"
  },
  "wasm": {
    "pactora":  "<sha256 of the deployed pactora.wasm>",
    "mockUsdc": "<sha256 of the deployed mock_usdc.wasm>"
  }
}
```

- `contracts` must name exactly `Pactora`, `PaymentToken` and `Arbiter`
  (NEAR account ids); the loader refuses anything else.
- `startBlock` is why the indexer never scans from genesis. On a testnet
  that is not archival the block may already be garbage-collected by the
  time a fresh database starts: `INDEXER_START_AT_HEAD=1` for a first start.
- `wasm` records the sha256 of what was deployed (testnet only). The deploy
  script refuses a `wasm/*.wasm` that does not match `wasm/SHA256SUMS`
  unless `PACTORA_WASM` / `MOCK_USDC_WASM` name a build of your own.
- `commit` answers "which source is deployed?" six days later at 2am.
- The loader refuses a file whose `chainId` is not the network it was read
  for: the wrong file for a network is a boot failure, not a wrong contract.

`deployments/sandbox.json` is **fixed and committed**: the deploy script
creates exactly `pactora.test.near`, `musdc.test.near` and
`arbiter.test.near` under the sandbox root, `startBlock` 0, and checks that
a run reproduced the file. On the sandbox the arbiter is a plain account
until `verify-near --dao` or the demo deploys a real Sputnik DAO and calls
`set_arbiter`. There is no `deployments/testnet.json` yet: **the testnet
deploy is the owner's step** (the contracts README, "Testnet").

Account ids differ per network and per deploy (NEAR has no CREATE2): nothing
in the code hardcodes one — they come from this file, looked up by chain id.

---

## 5. Environment variables — secrets and wiring only

Every name a service reads is here; `pnpm check:env` in this repo fails when
a `.env.example`, a `process.env` read in the three code repos, or a
compose/VPS file names one this section does not. If something is not here,
it belongs in versioned config.

Three startup rules apply to every service:

- **Stale names are refused.** A variable name from an earlier build of the
  services, or a network variable keyed by a number instead of a slug
  (`RPC_URL_<number>`), set — even empty — stops the boot with the
  replacement named (`packages/shared/src/legacy-env.ts`).
- **The RPC must be the network named.** Each service reads `status.chain_id`
  from every enabled chain's RPC and refuses a mismatch or no answer.
- **Validate everything, print every problem, exit non-zero.** A service that
  boots with broken config and fails on the first user request is strictly
  worse than one that refuses to boot.

### 5.1 `pactora-backend-near`: the complete list

```bash
# ── which networks this process serves ───────────────────────────────────
ENABLED_CHAINS=near:testnet         # CAIP-2 ids, comma-separated; "near:testnet,near:sandbox" serves both
DEFAULT_CHAIN=near:testnet          # the chain a request without one is served on; must be in ENABLED_CHAINS
PACTORA_CONTRACTS_ROOT=../pactora-contracts-near   # the contracts checkout (or the image's chain/ copy)
RPC_URL_TESTNET=                    # optional override per network SLUG; absent → networks.json rpcUrls[0]
RPC_URL_SANDBOX=                    # (compose: http://host.docker.internal:3030)

# ── datastores ───────────────────────────────────────────────────────────
DATABASE_URL=postgres://pactora:pactora@127.0.0.1:5443/pactora_near   # dev compose; 127.0.0.1, never localhost

# ── secrets (never in .env.example, never in a log) ──────────────────────
SIGNER_TOKEN=                       # ≥ 32 chars, checked at boot by BOTH api and signer; unset → signer binds loopback only
SIGNER_KEY_PASSPHRASE=              # ≥ 32 chars, checked at boot; encrypts the wallet keys POST /keys generates (Postgres)
SIGNER_DEV_CREDENTIALS=             # testnet/sandbox only: near-cli credential JSON (object or array); refused elsewhere
SIGNER_KMS_KEYS=                    # {"<wallet account>": "<KMS key id, alias or ARN>"} — keyed by wallet account only
KEEPER_ACCOUNT_ID=                  # the keeper's OWN gas-only account; unset → no keeper
KEEPER_SECRET_KEY=                  # ed25519:… testnet only; or
KEEPER_KMS_KEY_ID=                  # the keeper's KMS key (any chain); one of the two, never both
FAUCET_ACCOUNT_ID=                  # signer: the test-token faucet's account (testnet/sandbox only)
FAUCET_SECRET_KEY=                  # ed25519:… a FULL-ACCESS key (ft_transfer attaches a deposit)
AWS_REGION=                         # KMS; credentials from the SDK's default chain (role, profile) or:
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
WEBHOOK_SECRET_KEY=                 # 32 random bytes (64 hex or 44 base64); SAME value in api and notifier
KYC_WEBHOOK_SECRET=                 # ≥ 32 chars; required with IDENTITY_PROVIDER≠none
OBJECT_STORE_ACCESS_KEY_ID=         # both or neither; neither → the AWS SDK's default chain
OBJECT_STORE_SECRET_ACCESS_KEY=
MINIO_KMS_SECRET_KEY=               # docker-compose.full.yml ONLY: "pactora:<32 random bytes, base64>", required
TELEGRAM_BOT_TOKEN=                 # channels only; redacted from every log
NEAR_AI_API_KEY=                    # required with JUDGE_PROVIDER=near-ai; never logged
ANTHROPIC_API_KEY=                  # model providers — none set → every run replays a recording
GEMINI_API_KEY=
GROQ_API_KEY=
NEARDATA_API_KEY=                   # indexer: a FastNear key for neardata (testnet); optional, raises the rate limit
METRICS_TOKEN=                      # bearer for /metrics; the api serves none in production without it

# ── api ──────────────────────────────────────────────────────────────────
NODE_ENV=development                # production → CORS_ORIGINS required, bucket required with uploads on,
                                    #   screening on, no private webhooks, /metrics only behind METRICS_TOKEN
PORT=8080
HOST=0.0.0.0                        # bind address
CORS_ORIGINS=                       # comma-separated browser origins; unset → any (dev only)
TRUST_PROXY=0                       # proxy hops in front (1 behind Caddy); true trusts every hop (avoid)
RATE_LIMIT_PER_MINUTE=600           # per client IP; sign-in routes 40/min, wallet-key 10/min, keys 20/min (docs/15)
RATE_LIMIT_STORE=memory             # memory | postgres — postgres shares one window across API replicas
SSE_MAX_STREAMS=1000                # open live streams per kind, per process; then 503 + retry-after
SSE_MAX_STREAMS_PER_CLIENT=20       # of those, per client address (needs TRUST_PROXY behind a proxy)
RUNS_PER_DAY=0                      # runs one orchestrator may start per rolling 24 h → 429; 0 = no cap
MAX_AGENTS_PER_OWNER=               # agents one owner account may register; past it POST /v1/agents → 409 LIMIT_REACHED (this round, docs/26 F25)
SIGNER_URL=http://127.0.0.1:7070
SIGNER_TIMEOUT_MS=60000             # how long the api waits for the signer (a sign waits for finality)
PACTORA_SELF_URL=                   # the API's own address for in-process runs; default http://127.0.0.1:$PORT
PACTORA_SIGN_RECIPIENT=pactora      # the NEP-413 `recipient` every owner signature is checked against
STATUS_MAX_INDEXER_LAG_BLOCKS=150   # /v1/status: indexer "degraded" beyond this
EVIDENCE_UPLOADS=on                 # on | off
OBJECT_STORE_BUCKET=                # the private evidence bucket; checked at boot
OBJECT_STORE_ENDPOINT=              # unset → AWS S3; local MinIO http://127.0.0.1:9110
OBJECT_STORE_REGION=us-east-1
OBJECT_STORE_FORCE_PATH_STYLE=0     # 1 for MinIO
OBJECT_STORE_SSE=AES256             # AES256 | aws:kms | none
WEBHOOK_ALLOW_PRIVATE=0             # 1: webhooks may target http/private addresses; refused in production
FAUCET_AMOUNT=5000000               # per claim, base units (5 mUSDC); must be ≤ FAUCET_DAILY_CAP
FAUCET_PER_IP_PER_DAY=5
FAUCET_DAILY_CAP=500000000
SANCTIONS_SCREENING=on              # off is development only; refused in production
IDENTITY_PROVIDER=none              # none | simulated (test chains only)
KYC_PAGE_BASE=http://localhost:3000
COMPLIANCE_REVIEWERS=               # NEAR accounts, comma-separated; parsed ONCE at boot; production needs ≥ 2
TELEGRAM_BOT_USERNAME=              # the bot's @username (ends in "bot"); unset → Telegram linking 503
EMAIL_CHANNEL=0                     # 1 when apps/channels has an email provider
JUDGE_PROVIDER=chain                # chain | near-ai
NEAR_AI_MODEL=                      # default zai-org/GLM-5.1-FP8
NEAR_AI_BASE_URL=                   # default https://cloud-api.near.ai/v1 (https required)

# ── signer ───────────────────────────────────────────────────────────────
SIGNER_PORT=7070
SIGNER_HOST=                        # bind address; anything but loopback needs SIGNER_TOKEN
KEEPER_INTERVAL_MS=15000            # how often the keeper sweeps for due exits
FAUCET_MAX_PER_SEND=10000000        # the most one faucet send may carry, whatever the api asks
WALLET_LOW_BALANCE_YOCTO=100000000000000000000000   # 0.1 NEAR: below this a wallet is "low" (/health, /v1/status gas, alerts)
WALLET_CHECK_INTERVAL_MS=60000      # how often the wallet balances are read
SIGNER_KEY_UNCLAIMED_GRACE_MS=86400000   # a generated key whose account never appears on chain is swept after this
LOCK_POOL_MAX=10                    # pool for per-agent nonce advisory locks

# ── indexer ──────────────────────────────────────────────────────────────
INDEXER_POLL_MS=2000
INDEXER_MAX_BACKOFF_MS=60000
INDEXER_HEALTH_PORT=                # serve /health /ready /metrics; unset → none (compose: 9090)
INDEXER_START_AT_HEAD=0             # 1: a FIRST start begins at the chain head; an existing cursor is never moved

# ── notifier ─────────────────────────────────────────────────────────────
NOTIFIER_CONCURRENCY=8              # webhooks sent to at once
NOTIFIER_TIMEOUT_MS=10000
NOTIFIER_IDLE_MS=1000
NOTIFIER_HEALTH_PORT=               # compose: 9091

# ── channels ─────────────────────────────────────────────────────────────
EMAIL_PROVIDER=none                 # none | fake (in memory; refused in production)
CHANNELS_SITE_URL=http://localhost:3000   # where links in messages point (compose default https://pactoragents.com)
CHANNELS_HEALTH_PORT=               # compose: 9092
CHANNELS_INTERVAL_MS=2000

# ── every service ────────────────────────────────────────────────────────
LOG_LEVEL=info
DB_POOL_MAX=                        # defaults: api 5, signer 5, indexer 3, notifier 3, channels 3
GIT_SHA=                            # baked into images; else read at runtime if a hex commit
BUILD_TIME=                         # ISO-8601; images record their own
# GIT_COMMIT_SHA            # a build platform's commit variable; used when GIT_SHA is not given

# ── acting AS an agent (apps/agents, apps/mcp, packages/agent-core) ──────
PACTORA_API_URL=http://127.0.0.1:8080
PACTORA_API_KEY=                    # the ax_… key POST /v1/agents returned
PACTORA_CHAIN_ID=near:testnet       # CAIP-2
PACTORA_AGENT_ID=                   # the worker's own id; required with X402_PORT
AGENT_MODE=cached                   # cached | record | live — cached spends nothing
AGENT_CACHE_DIR=.agent-cache
AGENT_REPLAY_MAX_MS=                # cached: cap each replayed call's recorded delay (unset 8000; 0 instant)
BRAIN_CHAIN=gemini,groq,ollama,claude
BRAIN_CHAIN_ORCHESTRATOR=claude,gemini,groq,ollama   # an entry may name a model: gemini:gemini-3.6-flash
CLAUDE_MODEL=                       # default claude-opus-5
CLAUDE_WORKER_MODEL=                # default claude-haiku-4-5
GEMINI_MODEL=                       # default gemini-3.8-flash
GROQ_MODEL=                         # default openai/gpt-oss-120b
OLLAMA_HOST=                        # default http://127.0.0.1:11434
OLLAMA_MODEL=                       # default qwen2.5:7b
WORKER_POLL_MS=1000
X402_PORT=                          # serve an x402 pay-per-request endpoint on this port
X402_HOST=127.0.0.1
X402_PUBLIC_URL=                    # the URL clients are quoted; default http://127.0.0.1:<X402_PORT>
X402_SCHEMES=pactora-directpay      # comma list; add pactora-escrow for the refundable scheme (network: near:<id>)
```

### 5.2 What each backend variable means, and what refuses to start

| Variable | What it is |
|---|---|
| `ENABLED_CHAINS` | CAIP-2 ids this process serves, a list: `near:testnet,near:sandbox` serves both. `pnpm demo:local` needs none of this file: it runs on `near:sandbox`. Each id must be in `networks.json`, and each needs its `params.<slug>.json` and `deployments/<slug>.json`, or the boot fails naming the file |
| `DEFAULT_CHAIN` | the chain a request without one is served on; default the first enabled chain; must be enabled |
| `RPC_URL_<SLUG>` | optional RPC override, named by the network's **slug** (`RPC_URL_TESTNET`, `RPC_URL_SANDBOX`) so a mainnet client cannot be pointed at a testnet RPC by editing the wrong line; absent → `config/networks.json`. An empty value **is used as the URL** (the loader reads `??`): leave the line out rather than empty |
| `SIGNER_TOKEN` | shared secret between api and signer, **at least 32 characters** — both check it at boot. With it the signer listens on every interface and refuses any request without it; without it the signer binds `127.0.0.1` only and refuses a non-loopback `SIGNER_HOST` |
| `SIGNER_KEY_PASSPHRASE` | **at least 32 characters**, checked at boot. When set, keys generated by `POST /keys` are stored encrypted in the database (`signer_keys`); without it the signer cannot create a wallet key. Keep it, or those keys are lost |
| `SIGNER_DEV_CREDENTIALS` | imported agent-wallet function-call keys: a near-cli credential object or an array of them (`{"account_id":"bot.<you>.testnet","private_key":"ed25519:…"}`). Testnet/sandbox only, the signer refuses it anywhere else; the other source is `SIGNER_KMS_KEYS`, and **only one may be set** |
| `SIGNER_KMS_KEYS` | AWS KMS keys that never leave KMS: `{"<wallet account>": "<key id, alias or ARN>"}`, **keyed by wallet account only** (not by agent id). Key spec **`ECC_NIST_EDWARDS25519`**, signing algorithm `ED25519_SHA_512` with `MessageType: RAW` (`apps/signer/src/kms.ts`); a key of another spec is refused when its public key is read. This is how the signer signs off testnet, where every raw key is refused. Setup for a NEAR mainnet is not written ([docs/28](28-feature-inventory-2026-11.md) lists it as future work) |
| `KEEPER_ACCOUNT_ID` · `KEEPER_SECRET_KEY` · `KEEPER_KMS_KEY_ID` | the keeper's own account, holding only gas — never a wallet the signer signs for, or the two race for nonces. The raw key (`ed25519:…`) is testnet only; elsewhere `KEEPER_KMS_KEY_ID`; both set → refused; a key without the account id → refused. No `KEEPER_ACCOUNT_ID` → no keeper runs, and expired jobs wait for someone else to call the exit |
| `FAUCET_ACCOUNT_ID` · `FAUCET_SECRET_KEY` | signer (docs/26 F23): the test-token faucet's account and its `ed25519:` **full-access** key (`ft_transfer` and `storage_deposit` attach a deposit, which a function-call key cannot). Testnet and sandbox only: on another chain a configured faucet **refuses to start**, and so does one whose account is the payment token's owner (that key could mint without limit; the signer reads the token's owner at boot). Fund it with a limited float of the token and a little NEAR. None: no faucet, `POST /v1/faucet` answers 503 |
| `FAUCET_MAX_PER_SEND` | signer: the most one faucet send may carry, in base units (default 10 000 000), whatever the api asks |
| `FAUCET_AMOUNT` · `FAUCET_PER_IP_PER_DAY` · `FAUCET_DAILY_CAP` | api: base units per claim (default 5 000 000), claims per client IP per UTC day (5), and base units for everyone per UTC day (500 000 000). The rule (`routes/faucet.ts`): **one claim per account per UTC day**, at most `FAUCET_PER_IP_PER_DAY` per client IP, and the day's total under the cap; all three under one advisory lock, so two claims in the same instant cannot both pass. `FAUCET_AMOUNT` above the cap is refused at start |
| `WALLET_LOW_BALANCE_YOCTO` · `WALLET_CHECK_INTERVAL_MS` | signer: below this many yoctoNEAR an account the signer sends from is "low" (default `100000000000000000000000`, 0.1 NEAR, about ten 100 Tgas calls); read every 60 000 ms in the background, so `/health` never waits on the RPC. Reported as the `signer_wallet_balance` gauge, on the signer's `/health` (`wallets`), on `/v1/status` (`gas.state`, degrades the status) and by `alerts.sh`. Only wallets an agent row names are watched, plus the keeper and faucet accounts |
| `SIGNER_KEY_UNCLAIMED_GRACE_MS` | signer (docs/27 B2): how old a generated key may be before the hourly sweep deletes it when its account is not on chain and no agent row names it; default one day. The sweep keeps everything when the RPC fails and removes at most 50 rows a pass |
| `PACTORA_SIGN_RECIPIENT` | api: the NEP-413 `recipient` every owner signature (registration, key re-issue, person sign-in) must carry; default `pactora` (`apps/api/src/challenges.ts`). Returned by the challenge routes so a wallet signs the same string; a deployment that changes it changes it for every client at once |
| `RATE_LIMIT_PER_MINUTE` · `RATE_LIMIT_STORE` | api: the per-client-IP limit (600; stricter per-route limits in docs/15), and where the counters live: `memory` (default; per process, so N replicas allow N× the limit) or `postgres` (one atomic upsert per request in `rate_limits`, shared by every replica; the limiter skips, never fails closed, on a store error) |
| `SSE_MAX_STREAMS` · `SSE_MAX_STREAMS_PER_CLIENT` | api: open live-event streams per kind per process (1000; then 503 with `retry-after`), and of those how many one client address may hold (20; set `TRUST_PROXY` behind a proxy or every client is the proxy) |
| `RUNS_PER_DAY` | api: runs one orchestrator may start per rolling 24 h; then 429 `RATE_LIMITED`. 0 = no cap |
| `MAX_AGENTS_PER_OWNER` | api (built this round, 2026-11-09, docs/26 F25): how many agents one owner account may register on a chain; a registration past it is refused with 409 `LIMIT_REACHED` (`apps/api/test/decline-and-guards.test.ts`). The reference product's limit is 100; read the api's `main.ts` for the default once the change has landed |
| `SIGNER_TIMEOUT_MS` | api: how long a sign request may take; default **60 000** — a sign waits for NEAR finality, a few seconds, so not short. The `.env.example` sets 30 000 |
| `STATUS_MAX_INDEXER_LAG_BLOCKS` | api: `/v1/status` reports the indexer `degraded` when it trails the chain head by more than this (150) |
| `NEARDATA_API_KEY` | indexer: a FastNear key for the neardata block API (testnet, and a mainnet). Optional; without it the free rate limit cannot keep pace with testnet for long |
| `INDEXER_START_AT_HEAD` | indexer: `1` makes a **first** start seed the cursor at the newest final block instead of `startBlock`; an existing cursor is never moved. Needed on a fresh sandbox and on a testnet RPC that has garbage-collected the deploy block |
| `INDEXER_POLL_MS` · `INDEXER_MAX_BACKOFF_MS` · `INDEXER_HEALTH_PORT` | indexer: the tick cadence (2000), the backoff ceiling when the source fails (60 000; `/ready` fails when no tick succeeded within the ceiling plus five polls), and an optional port for `/health` `/ready` `/metrics` |
| `EVIDENCE_UPLOADS` | branch `human-work` (docs/26 F6): `on` (default) or `off`. With `on` and `NODE_ENV=production` the api **refuses to start** without `OBJECT_STORE_BUCKET`; with `off`, or no bucket outside production, photo uploads and downloads answer 503 `UPSTREAM_UNAVAILABLE` |
| `OBJECT_STORE_BUCKET` | the private S3-compatible bucket evidence photos are stored in. The api checks it at boot and refuses to start when it does not answer; outside production it creates a missing bucket (the local MinIO), in production never |
| `OBJECT_STORE_ENDPOINT` · `OBJECT_STORE_REGION` · `OBJECT_STORE_FORCE_PATH_STYLE` · `OBJECT_STORE_SSE` | an S3-compatible endpoint (unset → AWS S3; locally the compose MinIO `http://127.0.0.1:9110`, dev credentials `pactora` / `pactora-dev-only` in `docker-compose.yml` only), the region (`us-east-1`), `1` for MinIO and most S3-compatible stores (bucket in the path), and the server-side encryption on every object: `AES256` (default; SSE-S3), `aws:kms`, or `none` only for a store that cannot encrypt |
| `OBJECT_STORE_ACCESS_KEY_ID` · `OBJECT_STORE_SECRET_ACCESS_KEY` | both or neither (the api refuses one alone); neither → the AWS SDK's default chain (an instance role). `docker-compose.full.yml` requires the secret and uses it as its MinIO's root password |
| `MINIO_KMS_SECRET_KEY` | **`docker-compose.full.yml` only** (docs/27 B7, audit L4): the evidence MinIO's server-side-encryption master key, `pactora:<32 random bytes, base64>`, **required by the operator** — compose refuses to start without it. It lives in the server's `.env`, never in the data volume, so a disk snapshot alone does not open the evidence photos; keep it with the backup passphrase, or no stored evidence can be read. The **dev** `docker-compose.yml` is different: it generates a key into its volume on first start (`pactora-dev:…`), so `AES256` works locally with nothing in a tracked file |
| `WEBHOOK_SECRET_KEY` | branch `human-work` (docs/26 F9): 32 random bytes (64 hex or 44 base64; `openssl rand -hex 32`) that seal each webhook's signing secret (AES-256-GCM, bound to the hook's row). The **same** value in the api and the notifier. Unset: the api answers 503 to `POST /v1/webhooks`, and the notifier refuses to start. What is checked at start is the **length and format** (exactly 32 bytes; `packages/service/src/secretbox.ts`) — nothing can judge randomness, so generate it, never type it |
| `WEBHOOK_ALLOW_PRIVATE` | `1` lets webhooks target `http://` and private or loopback addresses, for local development only; both the api and the notifier **refuse to start** with it under `NODE_ENV=production`. Default `0` |
| `NOTIFIER_CONCURRENCY` · `NOTIFIER_TIMEOUT_MS` · `NOTIFIER_IDLE_MS` · `NOTIFIER_HEALTH_PORT` | notifier: webhooks sent to at once (default 8, one delivery each), the per-try timeout (10 000), the pause when nothing is due (1000), and an optional port for `/health` `/ready` `/metrics` |
| `SANCTIONS_SCREENING` | branch `human-work` (docs/26 F14): `on` (default) screens a person's legal name against the active OFAC, UN and UK lists before any identity session; `off` for development only, **refused at start** under `NODE_ENV=production`. Lists are loaded by `pnpm sanctions:refresh` (daily; guarded, see docs/15) |
| `IDENTITY_PROVIDER` | `none` (default) or `simulated`: a provider that checks no document, allowed only when every enabled chain is a test chain (refused at start otherwise) and labelled `simulated` everywhere. No vendor adapter until a vendor is chosen (docs/26 D3) |
| `KYC_WEBHOOK_SECRET` · `KYC_PAGE_BASE` | 32+ characters; verifies the identity provider's webhooks (HMAC over timestamp and raw body), required with a provider. The page base is where the simulated provider's page lives (the interface's URL); default `http://localhost:3000` |
| `COMPLIANCE_REVIEWERS` | NEAR accounts allowed to decide screening cases, comma-separated. **Parsed once at boot** (`apps/api/src/main.ts`): adding a reviewer is a restart. Production with screening on **refuses to start** with fewer than two: a strong match is cleared only by two different reviewers |
| `OFAC_SDN_URL` · `OFAC_ALT_URL` · `UN_LIST_URL` · `UK_LIST_URL` | `scripts/sanctions-refresh.mjs` only: override where the lists are fetched (unset: the publishers' own URLs) |
| `TELEGRAM_BOT_TOKEN` | branch `human-work` (docs/26 F11): `apps/channels` only, the bot's token from @BotFather (`<digits>:<30+ chars>`, checked). It is part of every Bot API URL, so it is redacted from every error and log. Unset: no Telegram. The adapter is written from the published Bot API and is **unverified** until run with a real token |
| `TELEGRAM_BOT_USERNAME` | api: the bot's @username (ends in `bot`), shown to a person linking a chat; unset → Telegram linking answers 503 |
| `EMAIL_PROVIDER` · `EMAIL_CHANNEL` | channels: `none` (default) or `fake` (kept in memory; **refused in production**); no real email provider is chosen yet. api: `EMAIL_CHANNEL=1` lets people link an email |
| `CHANNELS_SITE_URL` · `CHANNELS_HEALTH_PORT` · `CHANNELS_INTERVAL_MS` | channels: where links in messages point (default `http://localhost:3000`; `docker-compose.full.yml` defaults it to `https://pactoragents.com`), an optional `/health` port, and how often notifications and the outbox are processed (2000) |
| `JUDGE_PROVIDER` | api and the orchestrator (2026-11-09): `chain` (default: the orchestrator's own brain judges, as before) or `near-ai`, a judge on NEAR AI Cloud. Under `AGENT_MODE=cached` (the default) no judge is built and nothing reaches the network |
| `NEAR_AI_API_KEY` | required with `JUDGE_PROVIDER=near-ai`, in every mode; the api **refuses to start** without it. Never logged: it sits in a private field and any echo of it in an error is replaced with `[redacted]` |
| `NEAR_AI_MODEL` · `NEAR_AI_BASE_URL` | optional: the model (default `zai-org/GLM-5.1-FP8`) and the OpenAI-compatible base URL (default `https://cloud-api.near.ai/v1`, must be https). The recorded test fixtures follow the documented shape and are **not captured from a live call** until the owner OKs one |
| `JUDGE_REQUIRE_ATTESTATION` | api (`packages/shared/src/judge-env.ts`): with `JUDGE_PROVIDER=near-ai`, refuse a NEAR AI verdict whose response signature is missing or does not verify. On unless set to `0`/`false` (only for development against a provider without the signature endpoint); any other value than `0`, `1`, `true`, `false` is refused at start |
| `SESSION_KEY_SWEEP_MS` · `LISTING_EXPIRY_SWEEP_MS` | api background sweeps, in ms; `0` turns each off. How often accounts with live sessions have their full-access keys re-read (default 300000, 5 min), and how often open listings past their deadline are announced as expired (default 60000) |
| `RETENTION_EVIDENCE_DAYS` · `RETENTION_CHAT_DAYS` · `RETENTION_DRAFTS_DAYS` · `RETENTION_JOB_EVENTS_DAYS` · `RETENTION_AGENT_EVENTS_READ_DAYS` | api, retention purge (docs/26 F27, `apps/api/src/retention.ts`), in days (defaults): evidence bytes leave the object store 180 days after the job settled or was refunded (the sha256 stays); chat words become `[purged]` after 180; draft contents after 90 (hashes kept); a finished job's per-agent event copies after 365 (the append-only `job_events` log stays); agent events a person has read after 90. Jobs, payments, ratings, the compliance audit and anything on chain are never touched |
| `RETENTION_DRY_RUN` · `RETENTION_INTERVAL_MS` | api: `1` makes the retention sweep only count and log what it would purge; how often it runs (default 3600000, 1 h; `0` = never) |
| `MCP_HTTP_PORT` · `MCP_HTTP_HOST` · `MCP_ALLOWED_ORIGINS` · `MCP_RATE_LIMIT_PER_MINUTE` | `apps/mcp`, remote mode: with `MCP_HTTP_PORT` set (1–65535, else it exits) the MCP server serves the same tools over streamable HTTP, the caller's agent API key as the bearer, instead of stdio. Bind host (default `127.0.0.1`), the comma-separated browser origins allowed, and the per-minute request limit (default 60, a positive integer) |
| `AGENT_MODE` · `AGENT_CACHE_DIR` · `AGENT_REPLAY_MAX_MS` | `cached` (default) replays a recording and spends nothing; `record` calls providers and saves; `live` calls providers. The cache directory (default `.agent-cache`), and in cached mode a cap on each replayed call's recorded delay (unset 8000 ms; 0 instant) |
| `BRAIN_CHAIN` · `BRAIN_CHAIN_ORCHESTRATOR` | provider order for workers and for the orchestrator; a rate limit or outage moves along the chain, and `cached` is always appended as the final backstop. An entry may name a model (`gemini:gemini-3.6-flash`) |
| `CLAUDE_MODEL` · `CLAUDE_WORKER_MODEL` · `GEMINI_MODEL` · `GROQ_MODEL` · `OLLAMA_HOST` · `OLLAMA_MODEL` | model overrides; the defaults are in code (`packages/agent-core/src/providers/*`): `claude-opus-5`, `claude-haiku-4-5`, `gemini-3.8-flash`, `openai/gpt-oss-120b`, `http://127.0.0.1:11434`, `qwen2.5:7b` |
| `PACTORA_API_URL` · `PACTORA_API_KEY` · `PACTORA_CHAIN_ID` · `PACTORA_AGENT_ID` | what a worker bot, the orchestrator or the MCP server needs to act **as** an agent: the API, its `ax_…` key, the CAIP-2 chain, and (with `X402_PORT`) its own agent id |
| `X402_PORT` · `X402_HOST` · `X402_PUBLIC_URL` · `X402_SCHEMES` | a worker's x402 pay-per-request endpoint: the port (unset → none), bind host, the URL clients are quoted, and the schemes offered — `pactora-directpay` (default) and `pactora-escrow`. The `network` in every payment requirement is the CAIP-2 id (`near:testnet`); a payment on another chain is refused |
| `DB_POOL_MAX` · `LOCK_POOL_MAX` | connection pool sizes: api 5, signer 5, indexer 3, notifier 3, channels 3; the signer's second pool for per-agent nonce advisory locks (10) |
| `GIT_SHA` · `BUILD_TIME` · `GIT_COMMIT_SHA` | build metadata on `/health` and `/v1/status`: baked into images at build, else read at runtime if a hex commit; the build platform's commit variable is used when `GIT_SHA` is not given |

### 5.3 `docker-compose.full.yml`, the VPS overlay and the ops scripts

These names are read by compose or by `deploy/vps/*.sh`, not by a service.
The server's `.env` block is in the backend's `deploy/vps/README.md`.

| Variable | What it is |
|---|---|
| `API_PORT` | `docker-compose.full.yml`: the host port the api is published on (default 8080). The VPS overlay removes the publication: only Caddy listens |
| `API_HOST` | the VPS overlay and `alerts.sh`: the api's public hostname Caddy serves (`api.<ip-with-dashes>.sslip.io`); **required** by the overlay |
| `CADDYFILE` | the VPS overlay: path to the Caddyfile (default `./Caddyfile`, right in the flat server layout; from the repo `./deploy/vps/Caddyfile`) |
| `RESEARCH_BOT_API_KEY` · `TRADING_BOT_API_KEY` · `EXECUTION_BOT_API_KEY` | `--profile hosted`: the `ax_…` keys of the three hosted worker bots, passed to each as its `PACTORA_API_KEY` |
| `BACKUP_REMOTE` · `BACKUP_DIR` · `BACKUP_PASSFILE` · `KEEP_DAYS` | `backup.sh` / `restore-test.sh`: the off-host `scp` target (unset, each run warns), the local backup folder, the passphrase file (`~/.pactora-backup-pass`), and how many days to keep locally (7) |
| `ALERT_WEBHOOK_URL` · `ALERT_STATE_FILE` · `INDEXER_STALE_S` · `KEEPER_BACKLOG_S` · `WEBHOOK_WINDOW_H` · `SANCTIONS_MAX_AGE_H` | `alerts.sh`: where to post (Slack or Discord; unset, alerts are only logged), the file that remembers the last set of problems (it posts only on change), and the thresholds for indexer staleness, keeper backlog age, the failed-webhook window and the sanctions-list age |
| `PG_CONTAINER` · `PG_DB` · `PG_USER` · `MINIO_CONTAINER` · `BUCKET` · `COMPOSE` · `PYTHON` | the scripts' names for the compose containers, database, bucket and tools; the defaults match `docker-compose.full.yml` |

The full compose also hard-codes what a deployment must not change: the
in-network `DATABASE_URL`, `SIGNER_URL=http://signer:7070`,
`OBJECT_STORE_ENDPOINT=http://minio:9000`, path-style on, the health ports
9090/9091/9092, and it **requires** `SIGNER_TOKEN`, `SIGNER_KEY_PASSPHRASE`,
`WEBHOOK_SECRET_KEY`, `OBJECT_STORE_SECRET_ACCESS_KEY` and
`MINIO_KMS_SECRET_KEY` (`${VAR:?…}`). It publishes Postgres on host port
**5443, the same port as the dev compose**, so the two cannot run together.

### 5.4 `pactora-contracts-near`

Read by `scripts/*.mjs` (load with `node --env-file=.env scripts/<script>.mjs`).

| Variable | What it is |
|---|---|
| `RPC_URL_TESTNET` | optional; `rpc.testnet.near.org` and `test.rpc.fastnear.com` both answer chain id `testnet`. Every script checks `status.chain_id` and stops on another network |
| `DEPLOYER_ACCOUNT_ID` · `DEPLOYER_SECRET_KEY` | the funded `.testnet` account that deploys and owns the contracts, and its full-access key (`ed25519:…`). Set only in `.env`, never in the tracked example. `create-dao`, `deploy`, `verify-near` and `sweep-testnet` refuse an account that does not end in `.testnet` |
| `ARBITER_ACCOUNT_ID` | the 2-of-3 Sputnik DAO that rules disputes. `create-dao.mjs --network testnet` creates it (council: the deployer plus two) and **appends it to `.env`**; `deploy.mjs --network testnet` refuses to run without it |
| `COUNCIL_1_ACCOUNT_ID` · `COUNCIL_1_SECRET_KEY` · `COUNCIL_2_ACCOUNT_ID` · `COUNCIL_2_SECRET_KEY` | the other two council members. Set two testnet accounts of your own before `create-dao`, or leave them out: it creates `council-1/council-2.<deployer>` and writes their ids and keys into `.env` |
| `PACTORA_WASM` · `MOCK_USDC_WASM` | override the committed, hash-checked `wasm/*.wasm` with a build of your own. An override **skips the `SHA256SUMS` check**; CI sets both to its own reproducible build |
| `OLD_PACTORA_WASM` | CI and the sandbox tests: the previous release (`wasm/previous/pactora.wasm`), for the upgrade test that runs `migrate` over 1.0.0 state |
| `SANDBOX_RPC` · `SANDBOX_KEY_FILE` | sandbox only: the local node's RPC (default `http://127.0.0.1:3030`) and its `validator_key.json` (the root `test.near`, which the deploy, `verify-near` and `sweep-check` act as) |
| `SPUTNIK_DAO_WASM` | the Sputnik DAO v2 code for the sandbox (`create-dao.mjs --fetch-wasm <file>` downloads it from testnet's factory); `verify-near --dao` on the sandbox needs it |
| `DEPLOY_COMMIT` | testnet deploy: recorded as `commit` in `deployments/testnet.json` |
| `PROPTEST_CASES` · `FUZZ_STATS` · `FUZZ_VERBOSE` | the property suite (`contracts/pactora/src/fuzz.rs`): the number of cases (default **256**; CI sets none), and two switches that print statistics or every step |

### 5.5 `pactora-interface-near`

Every `NEXT_PUBLIC_*` value is compiled into the browser bundle, so none can
be secret; each has a fallback, so the site builds and runs with none set —
except one:

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_API_URL` | the API the site calls. **A production `next build` fails without it** (`next.config.mjs`): it used to fall back to `http://127.0.0.1:8080`, which built cleanly and shipped a site talking to the visitor's own laptop. Development falls back to that URL; the value must be `http(s)` |
| `NEXT_PUBLIC_SITE_URL` | this site's own origin, for absolute links (`metadataBase`, sitemap, robots, Open Graph); default `http://localhost:3000`, never a hard-coded domain |
| `NEXT_PUBLIC_CONTACT_EMAIL` · `NEXT_PUBLIC_X_HANDLE` · `NEXT_PUBLIC_OPERATOR_NAME` | the public contact email (unset → "coming soon"), the project's X handle (unset → the link is hidden), and who operates the service, named on About, Terms and Privacy (unset → a visible placeholder) |
| `NEXT_PUBLIC_RPC_ORIGINS` · `NEXT_PUBLIC_WALLET_ORIGINS` | `lib/csp.mjs`: the `connect-src` origins the Content-Security-Policy allows besides the API — the NEAR RPC (default `https://rpc.testnet.near.org`) and the hosts the testnet wallets' code talks to (manifest, Intear, Meteor, FastNear; read from the wallet manifest on 2026-11-05). Space- or comma-separated; each **replaces** its default list. NEAR Connect runs wallet code in an iframe that inherits the policy, so a wallet that needs another host fails visibly until it is listed |
| `NEXT_PUBLIC_EXPLORER_HOSTS` | `lib/links.ts`: extra explorer hosts `safeHref` admits besides `testnet.nearblocks.io` and `nearblocks.io` (comma-separated); any other outbound link renders nothing |
| `NEXT_PUBLIC_REGISTER_STORAGE_DEPOSIT_YOCTO` · `NEXT_PUBLIC_REGISTER_AGENT_FUNDING_YOCTO` · `NEXT_PUBLIC_REGISTER_KEY_ALLOWANCE_YOCTO` | `lib/wallet.ts`: what `/register` asks the owner's wallet for — the contract storage deposit (default 0.1 NEAR), the new agent account's gas money (0.5 NEAR) and the function-call key's gas allowance (0.25 NEAR), in yoctoNEAR; an invalid value falls back to the default |
| `NEXT_PUBLIC_E2E_WALLET` | `1` only in the browser-test build (`pnpm test:e2e`): a scripted wallet replaces the real connector, which opens third-party iframes a test cannot drive. A production build never sets it, and the branch is dead code there |

Its tools read their own: `E2E_PORT`, `MOCK_API_PORT`, `E2E_ALL_BROWSERS`
(`playwright.config.ts`), `PACTORA_DOCS_DIR` (the route-table test, also the
backend's), `SITE_URL`, `RUN_ID`, `AGENT_ID`, `PACTORA_RUN_ID` (the
screenshot and contract-check scripts).

### 5.6 Tools, not services

Scripts read their own variables and are documented where they are used:
backend `scripts/demo.mjs` (`DEMO_NETWORK`, `DEMO_ATTACK`, `DEMO_HOLD`,
`DEMO_API_PORT`, `DEMO_SIGNER_PORT`), `scripts/live-ui-stack.mjs` (`LIVE_*`),
`scripts/probe-api.mjs` (`PROBE_*`), `scripts/video/*` (`FFMPEG`, `SITE`),
and the api's route-table test (`PACTORA_DOCS_DIR`).

### History of this section

> **Rebased 2026-11-09** on the NEAR code. The KMS key spec was corrected to
> `ECC_NIST_EDWARDS25519`. Added, because the code reads them and nothing
> documented them: `RATE_LIMIT_STORE`, `PACTORA_SIGN_RECIPIENT`,
> `WALLET_LOW_BALANCE_YOCTO`, `WALLET_CHECK_INTERVAL_MS`, `NEARDATA_API_KEY`,
> the compose/VPS names (§5.3), the contracts scripts' names (§5.4) and eight
> interface names (§5.5). `pnpm check:env` collects names from `.env.example`
> lines including commented `# NAME=` ones, from every `process.env` read in
> the three repos' source, and from the compose files, and fails on any name
> missing here.

> The x402 scheme ids are `pactora-directpay` / `pactora-escrow`
> (`packages/shared/src/x402.ts`); they are stored with every payment.

Three properties worth noting:

0. **There is no Redis.** Rate limiting is per-process unless
   `RATE_LIMIT_STORE=postgres`; idempotency is unaffected either way — it is
   a `UNIQUE` constraint in Postgres, not an in-memory set.
1. **`ENABLED_CHAINS` is a list, not a switch.** One backend serves several
   networks at once; which ones is a config value, not a second deployment.
2. **`RPC_URL_<SLUG>` is an override, not a requirement.** Absent, the
   registry default is used. The naming embeds the network so it is
   impossible to point one network's client at another's RPC by editing the
   wrong line.
3. **No contract account is ever an env var.** They come from
   `deployments/<slug>.json`. This is the single most frequent source of
   "works locally, points at the wrong contract in production".

---

## 6. `@pactora/config` — the one import

```ts
import {loadConfig} from '@pactora/config';

const config = loadConfig();              // validates, freezes, throws on bad input

config.defaultChainId;                    // 'near:testnet'
const chain = config.chain();             // the default chain, or config.chain('near:sandbox')
chain.nearNetworkId;                      // 'testnet' — what the RPC must answer
chain.rpcUrl;                             // RPC_URL_TESTNET ?? networks.json rpcUrls[0]
chain.blockSource;                        // {kind: 'neardata', url} | {kind: 'rpc'}
chain.contracts.Pactora;                  // 'pactora.test.near'
chain.contracts.PaymentToken;             // resolved from the deployment when deployWithProtocol
chain.params.fastPathMax;                 // 30000n — money is bigint, never a number
chain.params.disputeGraceSeconds;         // 86400
chain.onchainParams;                      // the snake_case struct, as get_params returns it
chain.explorerTx('8q…');                  // https://testnet.nearblocks.io/txns/8q…
chain.formatToken(20000n);                // '0.02 mUSDC'
chain.parseToken('0.02');                 // 20000n; more than 6 decimals is an error
```

Assembled from `networks.json` + `params.<slug>.json` + `deployments/<slug>.json`,
validated with zod, and **frozen**. Mutating config at runtime is how two
services end up disagreeing.

### Fail fast, and say why

```
✗ Pactora config invalid

  • ENABLED_CHAINS: "near:mainnet" is not a supported chain (near:testnet, near:sandbox)
  • near:testnet: deployments/testnet.json not found → deploy with pactora-contracts-near
    scripts/deploy.mjs, or drop near:testnet from ENABLED_CHAINS
  • near:sandbox: offchain.workWindowSeconds=20000 exceeds the contract's maximum 18000
```

Every problem is reported at once; a stale variable name
(`packages/shared/src/legacy-env.ts`) is reported before anything else is
read.

### Helpers that stop bugs, not just save typing

| Helper | Prevents |
|---|---|
| `formatToken` / `parseToken` | 6-vs-24 decimal mistakes (mUSDC has 6, NEAR has 24) |
| `explorerTx` / `explorerAddress` | hand-built URLs that 404 on one network |
| `chain(chainId)` | a request served on a chain the process does not have |
| `nearNetworkId` at every boot | a service signing or indexing another network's chain |

---

## 7. Contracts side — `scripts/deploy.mjs`

The contracts repo is Rust (`cargo near build`,
reproducible, in a pinned image; the committed `wasm/*.wasm` carry their
sha256 in `wasm/SHA256SUMS` so a judge needs no Rust toolchain) and three
Node scripts:

```bash
node --env-file=.env scripts/create-dao.mjs --network testnet   # the 2-of-3 Sputnik DAO → ARBITER_ACCOUNT_ID in .env
node --env-file=.env scripts/deploy.mjs     --network testnet   # mock USDC + Pactora: new(params), get_params checked, deployments/testnet.json written
node --env-file=.env scripts/verify-near.mjs --network testnet --dao   # 28 live checks against the deployment
```

The deploy script is network-agnostic: `--network <slug>` picks the
`networks.json` entry, `params.<slug>.json` and the deployer (the `.env`
account on testnet; the sandbox's `validator_key.json` root on the sandbox).
It refuses a deployer that is not a `.testnet` account, a missing arbiter, a
wasm that does not match `SHA256SUMS`, and a `get_params` that differs from
the file. There is no mainnet path in the script: a NEAR mainnet deploy would
be a new `networks.json` entry, a `params.mainnet.json` and the owner's
explicit, per-action confirmation (standing rule).

---

## 8. Multi-chain data model

Supporting more than one network changes the database. The original schema in
[04 §4](04-how-it-works.md#4-database-schema) assumed one chain and is
**corrected there**; the reasoning is here.

Agent `#42` exists on testnet *and* on the sandbox, and they are different
agents with different reputations. So:

```sql
-- chain_id on every chain-derived table: TEXT, the CAIP-2 id ('near:testnet')
chain_id TEXT NOT NULL

-- uniqueness is per-chain, never global (packages/db/src/schema.ts)
CREATE UNIQUE INDEX agents_chain_agent_uk  ON agents (chain_id, chain_agent_id);
CREATE UNIQUE INDEX agents_chain_wallet_uk ON agents (chain_id, wallet_address);  -- the wallet account id
CREATE UNIQUE INDEX jobs_chain_job_uk      ON jobs   (chain_id, chain_job_id);

-- the indexer runs one cursor per (chain, contract)
PRIMARY KEY (chain_id, contract)
```

Rules that follow, and each one is a bug you would otherwise ship:

| Rule | Why |
|---|---|
| Reputation is **per chain** | Testnet history must never inflate another network's score. Free testnet tokens would make reputation purchasable. |
| A job's client and worker must be **on the same chain** | DB CHECK plus an API guard (409 `CHAIN_MISMATCH`) |
| Discovery **always filters by `chain_id`** | Otherwise the marketplace silently mixes networks |
| The API takes `?chainId=`, defaulting to `DEFAULT_CHAIN` | Explicit beats implicit at the boundary |
| Every response **echoes `chainId`** | A client should never have to guess which network a result came from |
| The UI shows a network badge, always | A testnet transaction that looks like mainnet is a support ticket |

---

## 9. Reusable packages

The split that makes the above possible rather than aspirational
(`pactora-backend-near/packages/`):

```
@pactora/shared       JobSpec / JobResult / error codes / CAIP-2 ChainId / x402 types / legacy-env  (zod, single source)
@pactora/config       networks + params + deployments, validated & frozen (reads the contracts checkout)
@pactora/near         the NEAR client: RPC, final blocks (neardata or RPC), keys, NEP-413
@pactora/db           drizzle schema and migrations (0001…0022)
@pactora/service      env parsing, health/metrics/shutdown, secretbox, webhook signatures, net guard
@pactora/storage      the S3-compatible evidence store
@pactora/compliance   sanctions lists (OFAC, UN, UK) and name matching
@pactora/agent-core   brains, cached/record/live modes, the worker loop, x402 server
@pactora/sdk          typed API client used by agents and the site
```

There is no `@pactora/contracts` package on NEAR: there are no ABIs to
generate. The contract's method names and argument shapes are typed in
`@pactora/near` and checked live by the sandbox demo.

| Rule | Consequence |
|---|---|
| Types are **derived from zod schemas**, never hand-written alongside them | Validation and types cannot disagree |
| `onchain` params are a `.strict()` schema | A parameter the contract gains or loses is a boot failure, not a silent default |
| Error codes are an **enum in `@pactora/shared`** | API, agents and UI branch on the same constants |
| No package imports from an app | Apps compose packages; packages never know about apps |

---

## 10. Standards this follows

Nothing invented. Every choice below is the documented default somewhere.

| Concern | Standard |
|---|---|
| Config vs secrets separation | [12-Factor App §3](https://12factor.net/config) |
| Network identifier | CAIP-2 `near:<network>` (a convention; ChainAgnostic has no NEAR profile) |
| Contract framework | near-sdk-rs 5.30, near-contract-standards (NEP-141 token, NEP-145 storage), NEP-297 events, NEP-413 off-chain signatures |
| Reproducible builds | `cargo near build` in the pinned image; sha256 committed in `wasm/SHA256SUMS` and recorded in the deployment |
| Signing off testnet | AWS KMS `ECC_NIST_EDWARDS25519`, `ED25519_SHA_512`, `MessageType: RAW` |
| Runtime validation | zod schemas, validated at process start |
| Versioning | Semver; the contract carries `version()` and `STATE_VERSION` (1.1.0) |
| Commits | Conventional Commits |
| Errors over HTTP | RFC 7807 problem details |
| Money | integer base units, `NUMERIC(38,0)` / bigint, never floats |

---

## 11. Checklist: adding a network

The test of whether this design actually works. Adding a network should be
configuration and a deploy — no application code.

1. Add its entry to `config/networks.json` (CAIP-2 id, slug, `nearNetworkId`,
   RPC, `blockSource`, explorer, token)
2. Add `config/params.<slug>.json` (`onchain` + `offchain`)
3. `node --env-file=.env scripts/deploy.mjs --network <slug>` → writes
   `deployments/<slug>.json` (the script would first need the new slug's
   deployer rule; today it knows `sandbox` and `.testnet` accounts)
4. In the backend, `node scripts/sync-chain-facts.mjs` copies the files into
   `chain/` for the images; CI's `--check` keeps them equal
5. Add the id to `ENABLED_CHAINS`; add `RPC_URL_<SLUG>` only if the default
   RPC is not wanted
6. Add the id to `CHAIN_IDS` in `packages/shared/src/job.ts` — the one place
   the code lists the supported chains, so a typo in `ENABLED_CHAINS` is
   refused rather than served

Step 6 is application code, and it is deliberate: an unknown chain id must be
a boot failure. If a step 7 appears that touches `apps/`, something above has
leaked and should be fixed rather than worked around. A **mainnet** entry
also needs the owner's explicit confirmation and the KMS setup; neither is
written.
