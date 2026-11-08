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
  `chain/export` the NEAR layout lacks). See uncommitted work below.

## Next up (ordered)

1. Owner deploys the contracts to NEAR testnet (`agentx/DEPLOY.md` §2.1–2.2).
2. `verify-near` against testnet; `sync-chain-facts` copies
   `deployments/testnet.json` into the backend's `chain/`; commit that.
3. Backend demo on testnet (§2.3).
4. Host: backend on Vultr (`pactora-backend-near/deploy/vps/README.md`),
   interface on Vercel with `NEXT_PUBLIC_API_URL=https://$API_HOST` (§2.4).
5. Update the docs and READMEs with the deployed accounts; submit (docs/25).

## Uncommitted work

- `pactora-backend-near`: `Dockerfile`, `docker-compose.full.yml`,
  `deploy/vps/docker-compose.vps.yml`, `deploy/vps/README.md`, `PROGRESS.md`.
  This is finished and verified (the Docker stack check above), not work in
  progress. It waits on the owner's OK to commit and push.
- This file (`pactora-docs-near/docs/STATUS.md`), new.

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
