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

The contract and port (from [docs/24 §1.5](24-near-hackathon.md)):

| Days | Deliverable | State |
|---|---|---|
| 5–7 Nov | Rust contract: jobs (create/accept/submit/approve/dispute/expire/cancel), worker bond, client dispute bond, reputation, per-agent caps (per-task + rolling 24 h); unit + sandbox tests | built; 1.1.0 after the audit ([docs/27](27-audit-2026-11.md)) |
| 8–9 Nov | Backend chain adapter: signer with function-call keys, indexer, chain reads; API/SDK/MCP on top | built |
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
| M9 | Telegram and email | ✅ (adapters built; a bot token and an email provider are the owner's) |
| M10 | docs and the final gate | ✅ |

**Left before submission** (owner): the testnet deploy (contracts README
"Testnet"), then `sync-chain-facts` and `DEMO_NETWORK=testnet pnpm demo`;
the tag, public repos, video, X post and form.

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
| P3 | score-over-time chart | not built; the data is in `job_events` |
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

## 5. Beyond the hackathon

From [docs/28 §13](28-feature-inventory-2026-11.md), ranked by value to a
marketplace user. The contract is frozen at 1.1.0 for the submission, so the
items that need a contract change wait for one batched release (1.2.0).

**Needs a contract release (1.2.0):**

- **Deadline extension**: both parties agree to push `work_deadline`, so a
  late worker can ask for time instead of losing its bond.
- **Worker-side dispute**: today only the client can `dispute`.
- **Hard compliance hold**: a held party cannot be paid even by
  `auto_approve` (today's hold is enforced by the signer and keeper, and is
  bypassable by calling the contract directly).
- **Reputation decay** on chain (the records are lifetime sums today); an
  off-chain time-weighted view is cheaper and can come first.
- Storage refund on `cancel`; more than one payment token.

**Backend and interface only:**

- milestones (one goal → several escrowed jobs on one timeline);
- pre-hire questions on a listing;
- receipts export (CSV/PDF per job);
- web push and email digests; saved searches and listing alerts;
- the score-over-time chart; light mode; i18n;
- a compliance audit-log export.

**Further out:**

| Theme | What |
|---|---|
| Trust | optimistic verification with a challenge window and staked challengers — the MVP verifies schema conformance, not truth; ownership of the contract handed to the DAO and the deployer's key removed |
| Scale | per-epoch netting so N subtasks settle in one call |
| Open network | capability taxonomy, streaming and subscription pricing (permissionless onboarding and the public SDK exist) |
| Payouts | NEAR Intents at payout, so workers can be paid in other tokens (mainnet only) |
| Mainnet | a mainnet network entry and parameters, an external audit, then a deploy through the same scripts (none of this is written yet) |

The single most valuable follow-up is **verification**. Everything in this
design rests on it, and the MVP verifies schema conformance rather than
truth. Solving that honestly — optimistic, staked, challengeable — is what
turns a hackathon project into infrastructure.
