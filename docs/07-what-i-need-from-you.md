# 07 — What I Need From You

Grouped by status. Updated 2026-10-08 against the code and
[PROGRESS.md](https://github.com/gopaltalaviya/agentx-backend/blob/master/PROGRESS.md). **Nothing here blocks development any more.**
The demo runs end to end on Monad testnet, and it is hosted: the backend on a
Vultr VPS behind Caddy (`https://api.64-177-41-175.sslip.io`) and the site on
Vercel (`https://agentx-interface-iota.vercel.app`), both live since
2026-10-07. The repos are public. What is left: verified source and two
address decisions.

Mark items done in [PROGRESS.md](https://github.com/gopaltalaviya/agentx-backend/blob/master/PROGRESS.md) as you complete them.

---

## A. Still needed — before submission (deadline 2026-10-13, 11:59 PM ET)

### A1. Explorer API key — for verified contract source

The contracts are deployed on testnet but **not verified**, so a judge who
follows an explorer link sees bytecode. The Foundry config that blocked
verification is fixed. Only the key is missing.

- [ ] Put `EXPLORER_API_KEY=` in **`agentx-contracts/.env`** (not the backend's
      `.env`). `foundry.toml` reads it for both `monad_testnet` and `monad`.
- Then `make verify NETWORK=monad_testnet` in `agentx-contracts` (or deploy
  with `VERIFY=1`).

### A2. Hosting for the backend — done (2026-10-07), on a VPS, not Railway

The backend (API, signer, indexer, hosted orchestrator + 3 workers, Postgres)
runs on one Vultr VPS behind Caddy at `https://api.64-177-41-175.sslip.io`,
with a daily database backup (cron, 03:00 UTC, 7 days kept). Steps:
[docs/13 §5](13-deploy.md). The Railway trial expired and Railway is no longer
used; the checklist below is the original Railway plan, kept for reference.

- [ ] Railway account, new project `agentx`
- [ ] Postgres plugin added
- [ ] `agentx-backend` connected
- [ ] Signer on **private networking only**, with no public domain. Its only
      caller check is a shared secret, `SIGNER_TOKEN`
- [ ] Secrets set by you in Railway: `SIGNER_KEYSTORE_JSON` +
      `SIGNER_KEYSTORE_PASSPHRASE` (decision C1), `DATABASE_URL`, and any
      model key you choose to add (see B1)
- [ ] `SIGNER_TOKEN`: one random value, set in **both** the `api` and the
      `signer` service. Without it the signer binds to `127.0.0.1` and the API
      in another service cannot reach it
- [ ] `KEEPER_PRIVATE_KEY` on the signer, if you want expired escrow jobs
      refunded or auto-approved without anyone stepping in: a **separate**
      testnet wallet holding only gas, never a key the signer signs agents'
      transactions with (the two would race for nonces). The signer refuses a
      raw keeper key on mainnet. Unset, no keeper runs
- [ ] Railway token, if you want me to configure services via CLI (optional —
      you can click through the dashboard instead)

**No Redis plugin.** Redis was removed; nothing in the code uses it. See
[08 §5](08-configuration.md#5-environment-variables--secrets-and-wiring-only).

### A3. Vercel account — done (2026-10-07)

- [x] Vercel account, `agentx-interface` connected (auto-deploys from `master`)
- [x] Root directory set to the repo root (not a subfolder — that is the whole
      point of the split)
- [x] `NEXT_PUBLIC_API_URL` pointed at the hosted API

### A4. Make the repos public — done (2026-10-06)

The rules require *"a demo, a short write-up, and a link to the code"*.
Decision D2 is already **yes**. This is only the act of flipping visibility on:

- [x] `agentx-contracts`
- [x] `agentx-backend`
- [x] `agentx-interface`
- [x] `agentx-docs` (new, 2026-10-06)

Before you flip it: `check-no-secrets` runs in the contracts and backend CI
(not the interface's), but a last look at each repo's history for keys is
worth the five minutes.

### A5. Arbiter and fee-recipient — a decision, then an admin transaction

Both are currently the **`DEPLOYER`** address on the live testnet deployment.
That is fine for the demo, and the submission says so. If you want them
separate, give me the addresses. There are two ways, depending on whether you
redeploy:

| Role | Today | On the live contracts | On a fresh deploy |
|---|---|---|---|
| Arbiter (`ARBITER_ROLE` on `TaskEscrow`) | `DEPLOYER`, granted in the constructor | `grantRole(ARBITER_ROLE, new)`, then `revokeRole(ARBITER_ROLE, DEPLOYER)`, both from `DEPLOYER` | set `ARBITER_ADDRESS` in `agentx-contracts/.env`; `Deploy.s.sol` grants it the role and revokes the deployer's |
| Fee recipient | `DEPLOYER`, set in `configure()` | `setParams(currentConfig, newRecipient)` from `DEPLOYER` (`CONFIGURER_ROLE`) | set `FEE_RECIPIENT` in `agentx-contracts/.env` |

Since 2026-09-29 `Deploy.s.sol` reads `ARBITER_ADDRESS` and `FEE_RECIPIENT`
(empty means the deployer). Before that nothing read them. Filling them in
does not change contracts already deployed; a redeploy also changes every
address (the backend picks them up from `deployments/10143.json`), and the
demo's history on the old contracts stays on the old contracts.

A plain EOA arbiter is acceptable for the MVP as long as the docs say so.
They do ([04 §9.1](04-how-it-works.md#91-trust-assumptions)). Since v2 a dispute
times out (`expireDispute`), so an arbiter who never acts delays the money but
cannot lock it.

---

## B. Optional — improves the demo, blocks nothing

### B1. A hosted model key

**No longer required.** `pnpm demo` has run end to end on Monad testnet with
local Ollama (`llama3` 8B, with `BRAIN_CHAIN=ollama` and
`BRAIN_CHAIN_ORCHESTRATOR=ollama` — the orchestrator reads the second), and a
cached replay (`AGENT_MODE=cached`) reproduces a recorded run with no model at
all. A hosted key would still improve the judgement quality a
judge sees in the video: an 8B model plans 2–3 steps and its prose is plain.

The hosted deployment uses Gemini (flash-lite models first, free tier) with a
Groq fallback (`openai/gpt-oss-120b`) when Gemini's quota is exhausted; the
site shows a clear notice when the model is rate-limited.

Any one of these, in `agentx-backend/.env` (and the server's `.env` on the VPS):

| Variable | Cost | Notes |
|---|---|---|
| `GEMINI_API_KEY` | free tier, no card | aistudio.google.com. Default model `gemini-3.8-flash` since 2026-09-30 (`gemini-2.5-flash` answers 404 to new users); override with `GEMINI_MODEL`. It returned 503 "high demand" on two consecutive live runs that day, so the recorded run stayed on Ollama |
| `GROQ_API_KEY` | free tier, no card | console.groq.com. Default model `openai/gpt-oss-120b`; the hosted fallback when Gemini's quota runs out |
| `ANTHROPIC_API_KEY` | paid | set a **spend limit** on the key; the agents are autonomous |

The provider order is `BRAIN_CHAIN` / `BRAIN_CHAIN_ORCHESTRATOR`. Moving along
it on an outage is automatic. Do not paste any key in chat.

### B2. Facts only you can check

- [ ] Monad testnet faucet per-day limit
- [ ] Is there a canonical USDC on Monad testnet? (If none — the likely
      answer — the demo uses `MockUSDC` and the submission says so in one line.)
- [ ] Is mainnet *required* for judging? `hackathon.monad.xyz` shows
      "MonadChain (ID: 143)". The code runs on either
      (D6: network is config, never a code path), so this is a deploy target,
      not a blocker. If mainnet is required, the canonical USDC address
      (decision D8) and real MON for gas are needed first.
- [ ] From inside the logged-in portal: video length limit and the exact
      required submission fields.

---

## C. Done

| # | Item | Resolution |
|---|---|---|
| — | Three GitHub repos | Created by you; all three pushed |
| — | Monad chain facts | Testnet 10143 / mainnet 143, RPCs, explorers, faucet — verified 2026-09-22, in `agentx-contracts/config/networks.json` |
| A2b / D6 | Testnet or mainnet | Testnet first, both supported by the same code |
| — | Funded wallets | `DEPLOYER`, `FUNDER`, `AGENT_A`, `AGENT_B` created by you; addresses only, in PROGRESS.md. The faucet cannot be scripted (bot detection); `DEPLOYER` funds the others with `cast send` |
| — | Deadline | 2026-10-13, 11:59 PM ET; Track 4 — Trust, Identity & AI Infrastructure |
| — | Testnet deploy | `TaskEscrow`, `StakeVault`, `AgentAccountFactory`, `MockUSDC` and our own ERC-8004 registries (absent on testnet) — addresses in `agentx-contracts/deployments/10143.json` |
| C1 | Key storage | Encrypted Web3 keystore in an env var, passphrase in a second one. AWS KMS not built |
| D1 | Package registry | Git dependency, not GitHub Packages |
| D2 | Contracts public at submission | Yes (the act itself is A4) |
| — | Model key (was B1 / blocker B6) | Not needed — local Ollama |
| A2 / A3 | Hosting | Live 2026-10-07: backend on a Vultr VPS behind Caddy, site on Vercel |
| A4 | Public repos | Four public repos, branch `master`, 2026-10-06 |

---

## D. Things you run

I write the scripts; you run anything that needs your keys or your quota.

| When | Command | You give me back |
|---|---|---|
| ✅ done | `make deploy-testnet` (in `agentx-contracts`) | addresses — now generated into `deployments/10143.json` |
| ✅ done | `pnpm e2e` / `pnpm demo` with `VERIFY_CHAIN_ID=10143` | pass/fail + explorer links. The demo now fails if any step ends `failed` or `timeout` |
| ✅ done | 3 cached rehearsal runs (`AGENT_MODE=cached`) | 155 s, 109 s, 111 s |
| after A1 | `make verify NETWORK=monad_testnet` | pass/fail |
| any time | `make drift NETWORK=monad_testnet` (in `agentx-contracts`) | pass/fail: deployed parameters vs the params file |
| any live-model run | `AGENT_MODE=record pnpm demo` | ask first — it spends quota if a hosted key is set; free on Ollama |
| Oct 9 | chaos: `DEMO_CHAOS=no-accept pnpm demo` and `DEMO_CHAOS=mid-job pnpm demo`, then after the work deadline `node scripts/keeper-sweep.mjs <chainJobId>`; plus the rest of the checklist ([roadmap §8](05-roadmap.md#8-m5--harden-and-rehearse--oct-911)) | which items broke |
| Oct 11 | backup video (from `AGENT_MODE=cached`) | the file |

`make publish` is no longer needed: D1 resolved to a git dependency.

---

## E. Decisions only you can make

| # | Decision | Needed by | Status / my recommendation |
|---|---|---|---|
| D3 | Who pays the protocol fee, worker or client? | now | **Open, but the contract already implements worker-pays**: the fee comes out of `amount`, so the client pays exactly the listed price. Say "keep it" or ask for a change |
| D4 | Project name final? `AGENTX` — check it is not taken | before submission | **Resolved 2026-10-30:** submitted as AGENTX; renamed **Pactora** for the launch ([docs/23](23-launch-and-rebrand-plan.md)) |
| D5 | Domain for the demo? | Oct 6 | Open. Optional — a `*.vercel.app` URL is fine and judges do not care |
| A5 | Separate arbiter / fee-recipient addresses? | before submission | Open. Defaulting to `DEPLOYER` is acceptable if said plainly |

---

## F. Never send me

Stated plainly so there is no ambiguity later:

- ❌ Any private key or seed phrase, including testnet ones. You chose the
  "you run deploys" model — that only works if the key stays with you.
- ❌ Any API key pasted into chat — model keys, the explorer key, a hosting
  token. Put them in `.env` (locally or on the server) yourself.
- ❌ Cloud root credentials of any kind.
- ❌ Anything from a mainnet wallet, under any circumstances.

If I ever ask for one of these, that is a mistake on my part — do not send it.

---

## G. The short version

Hosting (A2, A3) and public repos (A4) are done. If you only do one thing
before the deadline:

1. Add `EXPLORER_API_KEY` to `agentx-contracts/.env`, so the contracts can be
   verified (A1)

And tell me whether the arbiter and fee recipient stay as `DEPLOYER` (A5).
