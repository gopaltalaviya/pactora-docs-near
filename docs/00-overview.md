# Pactora (formerly AGENTX)

**Proof-of-payment reputation and escrow for ERC-8004 agents, on Monad.**

*Pactora — where AI agents make deals they can't break.* The product was
built and submitted to Monad Metropolis as **AGENTX**; it was renamed on
2026-10-30 ([docs/23](23-launch-and-rebrand-plan.md)); package names
(`@pactora/*`), env vars (`PACTORA_*`) and class names followed on
2026-11-01. Repo names, on-chain tags and stored identifiers still say
`agentx` — those are read by the chain and by stored data, and do not change. Planned domain: pactoragents.com (not live
yet).

ERC-8004 gives agents a verifiable identity and a place to record reputation.
It does not give them money — and because `giveFeedback()` is callable by
anyone, that reputation is free to forge. Pactora is the settlement layer that
makes it cost something: **only a settled on-chain payment can write a review.**

```solidity
// ERC-8004 REQUIRES you to name whose feedback you count.
// getSummary reverts on an empty client list — there is no "overall score".
getSummary(agentId, [PACTORA_ESCROW], "agentx", "settled")   // backed by real money
```

The standard already forces every reader to name their sources. What it does
not give them is **an address worth naming**. Pactora is that address.

> *Agents that can work — and pay each other.*

```
USER  "Find the best opportunity for me."
   │
   ▼
MAIN AGENT ──▶ RESEARCH AGENT    0.02 USDC  (direct pay once its score is ≥ 70; escrow until then)
   │
   └────────▶ EXECUTION AGENT    0.05 USDC  (escrow → verify → release)
   │
   ▼
MONAD    ✓ payments   ✓ escrow   ✓ settlement   ✓ reputation
```

One human sentence in. Every payment after it is one agent paying another.

---

## Working files — read these first

| File | Purpose |
|---|---|
| **[PROGRESS.md](https://github.com/gopaltalaviya/agentx-backend/blob/master/PROGRESS.md)** | **Start every session here.** Current state, next actions, blockers, config, session log |
| [PLAN.md](https://github.com/gopaltalaviya/agentx-backend/blob/master/PLAN.md) | ~119 tasks across 7 milestones, with owners and dependencies |
| [docs/07 — What I Need From You](07-what-i-need-from-you.md) | The checklist of accounts, facts and decisions only you can supply |

## Specification

| Doc | What it covers |
|---|---|
| [01 — Core Idea](01-idea.md) | The problem, the four primitives, MVP scope, why Monad |
| [02 — Flow Charts](02-flowcharts.md) | System map, hire-to-settle sequence, job state machine, discovery, reputation |
| [03 — Technology Stack](03-tech-stack.md) | Every technology and why, chain config, local dev |
| [04 — How It All Works](04-how-it-works.md) | Contract interfaces, wallet architecture, DB schema, API spec, MCP tools, agent workflow, security model |
| [10 — LLM Architecture](10-llm-architecture.md) | Agent-to-agent prompt injection, why schema-valid is not correct, prompt caching, evals, failure taxonomy |
| [05 — Build Plan & Roadmap](05-roadmap.md) | 21-day milestone plan, cut list, risk register, post-hackathon roadmap |
| [06 — Repository Structure](06-repo-structure.md) | The 3-repo split, how ABIs and types cross boundaries, conventions |
| [08 — Configuration Architecture](08-configuration.md) | Single source of truth: chain registry, protocol params, generated deployments, env split, multi-chain data model |
| **[09 — Landscape Analysis](09-landscape.md)** | **Read before writing contract code.** ERC-8004, x402, AP2, Virtuals ACP; what not to build; honest competitive positioning |
| [12 — ERC-8183 Mapping](12-erc8183-mapping.md) | `TaskEscrow` against ERC-8183 function by function; where the spec's prose and reference contract disagree; why conformance needs a new kernel, not an adapter |
| [13 — Deploy](13-deploy.md) | One VPS + Vercel (the live deployment), step by step, and the deployment check |
| [14 — Operations](14-operations.md) | Health/status endpoints, versioning, environments, monitoring and alerts, indexer lifecycle, database, backups, security, incidents |
| [15 — HTTP API](15-api.md) | Every route, auth, errors, rate limits, idempotency, SSE, `/v1/status` — test-checked against the app |
| [16 — Runbooks](16-runbooks.md) | Deploy, rollback, restart, migrations, reindex, RPC, secret rotation, contracts redeploy |
| [17 — Production readiness](17-production-readiness.md) | The verified checklist and the operations readiness report |
| [19 — v3](19-v3.md) | What v3 changed, why, and the live proof — including launch readiness (§9) |
| [20 — Mainnet checklist](20-mainnet-checklist.md) | Every box between testnet and mainnet, ticked by evidence |
| [21 — Launch runbook](21-launch-runbook.md) | The owner's step-by-step mainnet launch: Safes, KMS keys, dry run, deploy, hand-over, launch check |
| [22 — Security audit](22-security-audit.md) | The internal pre-launch audit of contracts and backend, 2026-10-26: every finding, its fix or why it is accepted, and the live proof |
| [23 — Launch and rebrand plan](23-launch-and-rebrand-plan.md) | AGENTX becomes Pactora: the name, what a rebrand changes and what it must not, and the order of everything left before launch |
| [24 — NEAR and Solana hackathons](24-near-and-solana-hackathons.md) | The rules of both events quoted from the organisers, how Pactora fits each track, the competitor on NEAR, and the plan |
| [launch/](launch/README.md) | Drafts of the terms of service, privacy policy and launch announcement — not legal advice; a lawyer reviews them before mainnet |

Start with **01**, then **02** for the shape of the system, then **04** when
you are ready to write code.

## Repositories

Three code repos, deliberately, plus `agentx-docs` for this specification,
the deck and the video. Contracts never enter a hosting provider's build
container. See [docs/06](06-repo-structure.md).

```
agentx-contracts    Foundry only     deployed manually by the key holder
agentx-backend      pnpm monorepo    → one VPS, Docker + Caddy (api, indexer, signer, orchestrator + workers, Postgres)
agentx-interface    Next.js only     → Vercel
agentx-docs         Markdown         specification, deck, video
```

Live: site **https://agentx-interface-iota.vercel.app**, API
**https://api.64-177-41-175.sslip.io**.

---

## What we build vs. what we integrate

| Integrate — already deployed on Monad | Build — nothing else has these |
|---|---|
| ERC-8004 **Identity Registry** `0x8004A169…a432` (mainnet; on testnet Pactora uses a reference deployment, `0xeD34…ef1`) | **`TaskEscrow`** — job state machine, deadlines with permissionless exits, sole writer of settlement-backed feedback |
| ERC-8004 **Reputation Registry** `0x8004BAa1…9b63` (mainnet; testnet reference `0xCdB4…7bd`) | **`AgentAccount`** — spending caps enforced *on-chain*, not on someone's server. Every agent in the demo acts through one: the orchestrator pays through its account (0.1 MockUSDC/task, 1/day, escrow-only), and each of the three workers has one with zero caps that may call only the escrow's `acceptJob` and `submitResult`; payouts land in the account and only the owner can `sweep` them out |
| ERC-8004 Validation Registry *(v3: deployed on Monad, answered by `SettlementValidator` — [docs/19](19-v3.md))* | **`StakeVault`** — the custody ERC-8004 lacks; makes listings cost something |

Two contracts from the original design were **deleted** rather than built.
See [docs/09](09-landscape.md).

## Status

**Now (2026-11-01).** Two versions run on Monad testnet (10143); nothing has
been sent to mainnet (143) ([docs/20](20-mainnet-checklist.md)).

| | |
|---|---|
| v2, as submitted | Live for the judges until the Monad Metropolis results on 2026-11-03 and frozen until then — `TaskEscrow` v2 `0x4feED0…370D`, the hosted backend and site. |
| v3 | On local `v3` branches in all four repos, **not pushed**. Deployed on testnet, redeployed on 2026-10-26 after the internal audit — `TaskEscrow` `0x14b93e92…7dc6`, on the **canonical** ERC-8004 registries; admin, arbiter, pauser and fees held by a 2-of-3 Safe, the deployer holds no role ([docs/19](19-v3.md), `agentx-contracts/deployments/10143.json`). What v3 adds: [docs/19](19-v3.md). |
| Security | Internal pre-launch audit of v3 on 2026-10-26 ([docs/22](22-security-audit.md)): every High and Medium fixed. **No external audit yet**; it is required before mainnet ([docs/21](21-launch-runbook.md) §0). |
| Tests (v3, 2026-11-02) | 414 contracts (+ 6 fork) · 773 backend · 123 interface, and 443 browser runs in five engines — `agentx-backend/PROGRESS.md` keeps the current counts |
| Name | Renamed AGENTX → Pactora on 2026-10-30 ([docs/23](23-launch-and-rebrand-plan.md)) |

**Left, all the owner's** ([docs/21](21-launch-runbook.md),
[docs/23](23-launch-and-rebrand-plan.md)): the external audit, the mainnet
Safes and KMS keys, switching on private vulnerability reporting, merging and
pushing `v3` after 2026-11-03, and the mainnet launch.

### History: status at submission (2026-10-13)

*Kept as written for the submission; the numbers are v2's.*

**Live on Monad testnet, end to end — contracts v2 since 2026-09-30.** Deadline: 2026-10-13, 11:59 PM ET.

| | |
|---|---|
| Contracts | 184 tests, v2 deployed and settling — `TaskEscrow` v2 [`0x4feED0…370D`](https://testnet.monadexplorer.com/address/0x4feED0338761817417Fd1dDdFC8331D16AEB370D) |
| Backend | 591 tests — API, signer, indexer, MCP server, orchestrator, three worker bots, per-skill reputation; metrics, health, graceful shutdown, containers, daily database backup |
| Interface | landing page, live demo, marketplace, agent profiles, register, run history, public status page, in-app docs — 87 unit tests and 72 Playwright tests (smoke, axe accessibility audits on 17 pages, search, video guides, edge and worst cases), run on 5 engines — Chromium, Firefox, WebKit, iPhone, Android (360 runs) |
| Hosted | live since 2026-10-07 — backend on a Vultr VPS behind Caddy, site on Vercel; 862 unit/integration tests across the three code repos |

`pnpm demo` plans, hires, judges and settles real jobs on testnet with a local
model, and replays with no model (`AGENT_MODE=cached`) — about 160 s on v2 with
`AGENT_REPLAY_MAX_MS=2000`, which shortens the replayed model pauses. Since
2026-09-29 the orchestrator pays through an `AgentAccount`, and the account's
own on-chain `spentToday` read 0.13 MockUSDC after a 3/3 run (v1, Sep 29; a v2 run spends 0.15 across four steps). Since
2026-09-30 the three workers act through `AgentAccount`s too (2/2 steps settled
live through worker accounts), and an x402 facilitator lets an agent be paid
per HTTP request (`DEMO_X402=1`, live on testnet). All seven chaos items have
been run and pass; no-accept, a silent worker and a slow lossy RPC were re-run
live with worker accounts on 2026-09-30.

**Outstanding:** none blocking. The backend and site are deployed (2026-10-07);
the four repos are public (2026-10-06); the arbiter and fee recipient default
to the deployer (kept, by decision); the video is recorded and uploaded
(2026-10-06).

### Networks and hackathon

**Networks:** ships on **Monad testnet (10143)**, with **mainnet (143)
supported by the same code**. The network is configuration, never a code
path — see [docs/08](08-configuration.md).

**Hackathon:** Monad Metropolis, submissions due **2026-10-13, 11:59 PM ET**.
Target track: **4 — Trust, Identity & AI Infrastructure** ($30,000), whose
description explicitly names *agent trust* and *agent reputation systems*.

## What this is not

Not a chatbot, not a trading bot, not a DEX, not an NFT marketplace, not
another agent framework. It is the payment and trust rail those things would
run on.
