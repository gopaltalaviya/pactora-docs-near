# 05 — Build Plan & Roadmap

**Deadline: NEAR Hackathon, 2026-11-14 23:59 UTC.** The submission is the
`human-work` branch of all four repos ([docs/25](25-near-submission.md)).
This file is the plan and its state; [STATUS](STATUS.md) is the record of
what actually happened, with the gate results, and
[docs/28](28-feature-inventory-2026-11.md) checks every promise against the
code.

---

## 1. The strategy in one paragraph

Build the demo backwards. The thing being judged is one unbroken trace — a
user types one sentence, agents hire each other, and every payment settles
on a NEAR node — and a README a machine can run. So the vertical slice that
produces that trace was built first, end to end, on a local `near-sandbox`
node, with a one-command demo (`pnpm demo:local`) that needs no API key.
Everything after that made it correct, then added people as workers and
clients.

**Rules kept throughout:** a mock that agrees with your assumptions proves
nothing, so every milestone gets a live-chain check; and a test written for a
bug is first run against the old code, to see it fail.

---

## 2. The plan and where it stands

The contract and backend (from [docs/24 §1.5](24-near-hackathon.md)):

| Days | Deliverable | State |
|---|---|---|
| 5–7 Nov | Rust contract: jobs (create/accept/submit/approve/dispute/expire/cancel), worker bond, client dispute bond, reputation, per-agent caps (per-task + rolling 24 h); unit + sandbox tests | built; 1.1.0 after the audit ([docs/27](27-audit-2026-11.md)) |
| 8–9 Nov | Backend NEAR layer: signer with function-call keys, indexer, chain reads; API/SDK/MCP on top | built |
| 10–11 Nov | Sputnik DAO arbiter; trust verdict allow/warn/block; prompt-injection attack demo; judge on NEAR AI Cloud | built; the NEAR AI judge is off by default and its live fixtures wait on the owner |
| 12 Nov | Optional Intents payout; Agent Market listing | not built (Intents is mainnet only) |
| 13 Nov | README "do X → see Y", one-command cached demo, tags, diff link, LICENSE | built, except the `hackathon-submission` tag (owner, after the testnet run) |
| 14 Nov | Video, X post, form | owner ([docs/25 §5](25-near-submission.md)) |

People as workers and clients, milestones M0–M10 ([docs/26](26-human-work-integration-plan.md),
STATUS for the commits and gates):

| # | Milestone | State |
|---|---|---|
| M0 | setup | ✅ |
| M1 | sessions (NEP-413 sign-in), the person role, startup guards | ✅ |
| M2 | job pages, `/v1/me`, funding, SKILL.md | ✅ |
| M3 | listings, bids, multi-worker hiring, instant hire, matching | ✅ |
| M4 | evidence photos, drafts and review, chat | ✅ |
| M5 | events, webhooks, notifications, the testnet faucet | ✅ |
| M6 | profiles, the people directory, two-way reviews | ✅ |
| M7 | identity checks, sanctions screening, standing, retention | ✅ (KYC provider simulated until the owner picks a vendor) |
| M8 | admin console and the DAO dispute desk | ✅ |
| M9 | Telegram and email | ✅ Telegram live since 2026-11-13 ([@PactoraJobsBot](https://t.me/PactoraJobsBot)); email waits for a provider |
| M10 | docs and the final gate | ✅ |

**Submitted 2026-11-12.** Since then the contract runs on NEAR testnet
(`pactora.gopalt.testnet`), the site and API are hosted, the repos are public
and tagged `hackathon-submission`, and the video and form are in.

---

## 3. The cut list, as it ended

| Priority | Feature | State |
|---|---|---|
| **P0** | register, discover, hire, deliver, settle, reputation | built, with tests |
| **P0** | orchestrator running the demo unattended | built (`pnpm demo:local`) |
| **P0** | live demo page | built (`app/demo`); not hosted |
| P1 | escrow path | built |
| P1 | on-chain per-task and daily caps | built; bonds count against the caps |
| P2 | dispute + arbiter resolution | built, with a real 2-of-3 Sputnik DAO |
| P2 | agent profile page | built |
| P3 | staking UI | built (`/agents/[id]/manage`) |
| P3 | score-over-time chart | partly built: jobs closed and the rating per week, from the history routes; no 0–100 score per week |
| P3 | four ranking modes | built |

---

## 4. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| No funded testnet account before the deadline | medium | high | everything runs on a local node with one command; the testnet run is the owner's, about 25 NEAR (contracts README "Budget") |
| Testnet instability on demo day | medium | high | the video can be recorded over `pnpm demo:local` |
| Orchestrator non-determinism (LLM) | high | medium | tools + schemas; `AGENT_MODE=cached` replays a recorded run |
| A machine reader cannot run the README | medium | high | no step needs a key or quota; the last line is `Demo passed.` |
| Judges read Pactora as a copy of NEAR Agent Market | medium | high | the positioning paragraph in every README ([09 §5](09-landscape.md#5-near-agent-market)) |
| Scope creep into "agent framework" | high | high | the cut list; Pactora is rails, not a framework |
| One person owns all keys | low | high | deployment is three documented commands; mainnet is refused by every script |

---

## 5. Roadmap: what comes next

The same list is on the home page (the "Roadmap" section). Each item says
what it needs. The contract is frozen at 1.1.0 for judging, so everything
that changes it waits for one batched release, 1.2.0.

### Now: live on NEAR testnet

- One Rust contract (1.1.0): escrow, worker bonds, on-chain spending caps
  and reputation.
- Disputes ruled 2 of 3 by a Sputnik DAO council.
- Three hosted agents on NEAR AI Cloud; the AI judge's signed verdict is
  checked against NEAR AI's attested key, and its hash goes on chain.
- Agent swarms: bidding by rule, pooled buying, subcontracting.
- A soulbound NEP-171 work credential for every settled job
  (`credentials.gopalt.testnet`).
- People: listings, bids, drafts, profiles and two-way reviews.
- Telegram job alerts: [@PactoraJobsBot](https://t.me/PactoraJobsBot) sends
  each job update to a linked chat and answers `/status` and `/jobs`; anything
  that signs is a link to the site (live since 2026-11-13).
- SDK, MCP, x402 and a worker runtime for builders.

### Next: right after judging

| Item | What it needs |
|---|---|
| Email alerts live | Built (`apps/channels`); an email provider and its key |
| Contract 1.2.0: deadline extensions both sides agree to; disputes the worker can open; a hard compliance hold that even `auto_approve` respects; storage refund on `cancel`; more than one payment token | Contract work and its sandbox tests, then a migration of the deployed contract |
| Contract ownership handed to the DAO council; the deployer's key removed | A DAO proposal to take ownership, then deleting the full-access key |
| The full TEE quote checked for the AI judge (Intel TDX and NVIDIA reports), not only its signing key | A quote verifier in the judge adapter; today the response signature is checked against the attested key |
| Milestones (one goal, several escrowed jobs on one timeline); questions before hiring; receipt export (CSV/PDF); push alerts and saved searches | Backend and interface only |
| An external audit, then NEAR mainnet: same code, new configuration | An auditor; a mainnet network entry and parameters (every script refuses mainnet today) |

### Later: where it leads

| Item | Why |
|---|---|
| **Run your account from Telegram**: post, bid, hire and approve in chat, each money step approved in the person's NEAR wallet (a link or a Telegram mini app); the bot never holds a key | Meets people where they already talk, without giving a bot custody |
| Optimistic verification: a challenge window and staked challengers | The MVP checks a delivery's format, not its truth; this is the single most valuable follow-up |
| The work credential as an open reputation standard other NEAR apps read and write | Reputation earned on Pactora becomes portable |
| Sybil resistance: identity attestations and stake-weighted scores | Makes a ring of owners reviewing each other far more expensive |
| Batched settlement (per-epoch netting) | N small agent jobs settle in one call |
| Payouts through NEAR Intents | Workers are paid in the token they want (mainnet only) |
| A capability taxonomy; streaming and subscription pricing | An open network of agents, beyond one-off jobs |

Smaller items, any time: a 0–100 score per week for the history charts;
light mode; translations; a separate landing page for people.
