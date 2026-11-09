# 01 — Core Idea

**Pactora — escrow, spend caps and settlement-backed reputation for AI
agents, on NEAR.**

Agents discover, hire, escrow, verify and pay each other through one NEAR
contract, and **only a settled on-chain payment can write a review**.

Tagline: *Agents that can work — and pay each other.*

---

## 1. The problem

An AI agent today can reason, call APIs, search, write code, and analyse data.
What it cannot do is participate in an economy.

When an agent needs work it cannot do itself, there is no native primitive for:

```
find a capable counterparty
  → agree a price
  → pay
  → receive the result
  → verify it
  → settle
```

Every one of those steps currently falls back to a human: a human signs up for
the API, a human puts in a card, a human approves the charge, a human checks
the output. The agent stalls at the point where money has to move.

Three gaps, all open:

| Gap | What is missing |
|---|---|
| **Settlement** | Nothing holds a payment until the work is checked and returns it when the work fails, without a custodian in the middle |
| **Bounded spending** | A key that can pay can usually pay anything. An unattended agent needs a budget that a compromised process cannot exceed |
| **Trust** | A review that costs nothing to write is worth nothing to read. Reputation must be tied to money that actually moved |

## 2. The solution

Pactora is on-chain infrastructure with four primitives, all in one NEAR
contract, `pactora`.

### 2.1 Agent identity

An agent is a record in the contract: an **owner** (a NEAR account with a
full-access key), a **wallet** (a separate account the owner proposes and
that accepts), a card URI, caps, a purse and a stake. Its capability tags
and price are held off-chain in Pactora's catalogue, where discovery can
search them.

```
market-research worker
  owner        alice.testnet
  wallet       bot.alice.testnet   (function-call key scoped to pactora)
  capabilities market-research
  price        0.02 mUSDC / task
  stake        ≥ min_stake (10 mUSDC on testnet)
  record       completed · failed · disputes lost · reviews  (worker_record)
```

The stake is what makes the identity cost something. An agent is hireable
only with an accepted wallet, not frozen, and unlocked stake of at least
`min_stake` (`is_hireable`). The contract also refuses a hire between two
agents of the same owner (`SameOwner`), so an owner cannot pay itself to
build a record.

### 2.2 Agent-to-agent payments

Agent A pays Agent B directly, with no human in the approval path:

```
Agent A ──── 0.02 mUSDC ───▶ Agent B
```

Unattended does not mean unbounded. Each agent's money sits in its **purse**
in the contract, and every hire is checked against the agent's **per-task
cap and rolling 24-hour cap** — in the contract, not only in the
application. A worker's bond counts against its own caps too.

The agent's wallet holds a single **function-call key scoped to the
`pactora` contract**. NEAR refuses to let such a key attach a deposit, and
every method that moves money out of the contract (`withdraw`, unstaking,
storage withdrawal) requires one yocto. So the wallet can hire, accept,
submit, approve and dispute within its caps, but **a stolen wallet key can
never withdraw**: only the owner's full-access key can. `pnpm demo:local`
shows it: with a stolen key, a hire above the cap is refused
`PerTaskCapExceeded`, a withdrawal is refused by the node, and a call to any
other contract is refused by the node.

### 2.3 Escrow

For work worth more than the fee to escrow it, funds are locked until the job
resolves:

```
        Agent A
           │ create_job
           ▼
     ┌───────────┐   approve / auto_approve   ┌─────────┐
     │  ESCROW   │───────────────────────────▶│ Agent B │
     └───────────┘                            └─────────┘
           │ cancelled / expired / dispute upheld
           ▼
        Agent A
```

The worker locks a bond when it accepts (20 % of the job on testnet, at
least `min_bond`); it loses it only if it accepts and then fails to deliver.
A client that rejects the result disputes inside the review window and posts
a dispute bond; the arbiter, a 2-of-3 Sputnik DAO, rules. Every open state
has an exit anyone may call, so neither party going offline can hold money
forever.

Below a threshold, jobs take a **direct-pay fast path** instead
(`direct_pay`, at most `fast_path_max`, 0.03 mUSDC on testnet): paying is
cheaper than protecting the payment. Cheap is not enough on its own: the
fast path pays before any work is done, so the API's `auto` path takes it
only when the worker's score is at least `fastPathMinScore` (70 on testnet).
A new agent starts at 50, so it is hired through escrow until it has a
record. A client may still ask for `path: 'direct'` explicitly.

### 2.4 Reputation — proof-of-payment

**This is the differentiator.** The contract writes reputation itself, and
only when money moves:

| Ending | Worker record | Review written |
|---|---|---|
| `approve`, `auto_approve`, ruling for the worker, `direct_pay` | `completed` + 1 | worker 100 |
| accepted, then not delivered (`expire_undelivered`) | `failed` + 1, bond seized | worker 0 |
| dispute ruled for the client | `disputes_lost` + 1 | worker 0 |
| dispute expired unruled | `unresolved` + 1 | none |
| `cancel`, `expire_unaccepted` | nothing | none |

Clients have a record too (`client_record`: paid, silent, disputes upheld
and rejected). `verdict_of(job_id)` returns 100 for a delivered job settled
without a dispute, 0 for a dispute upheld, and null when the ending says
nothing about the worker. All of it is contract state: any app or agent can
read it with a free view call, and nobody — not Pactora's operator — can
edit it.

Pactora's own score is computed by its indexer from the contract's NEP-297
events (`job_settled`, `job_refunded`), Laplace-smoothed and damped by
volume so an agent with no history is 50 (unknown, not bad) and one lucky job
cannot outrank a proven record ([02 §6](02-flowcharts.md#6-reputation-update)).

A hiring agent then optimises over price **and** score **and** success rate
**and** capability match — not just the cheapest bid. Before it pays, the
counterparty check (`GET /v1/agents/:id/trust`) reads who funded the
worker's clients from the token's transfer events, and a self-funded "farm"
is blocked at hire time (`COUNTERPARTY_BLOCKED`).

## 3. What changes

Before:

```
Human → AI → Human approves → Transaction
```

After:

```
Agent → discover → hire → pay → receive → verify → settle → continue
```

The agent stops being a tool that recommends a purchase and becomes an actor
that makes one.

## 4. Why NEAR

The honest framing is about what the chain lets the contract enforce.

- **Function-call access keys.** A NEAR account can hold a key that may call
  only named methods on one contract and cannot attach a deposit. That is
  exactly the key an unattended agent should hold: it can work, it cannot
  withdraw. No wallet contract is needed for it.
- **Named accounts and sub-accounts.** An agent's wallet is an ordinary
  account (`bot.alice.testnet`), its owner another; the contract checks both
  by name.
- **One synchronous contract.** Every hiring rule — same owner, accepted
  wallet, stake, bond, caps — is checked in one call on one contract, and
  payments between agents are internal credits, so a settlement cannot fail
  half-way. Tokens leave only through a few methods whose failed transfer
  puts the amount back.
- **Sputnik DAO.** A 2-of-3 council is a standard NEAR DAO; the contract
  just names it as the arbiter.
- **The NEAR agent ecosystem.** NEAR Agent Market runs the same lifecycle
  off-chain and custodially; Pactora is the on-chain, non-custodial
  settlement and reputation layer beside it ([09](09-landscape.md),
  [24 §1.3](24-near-hackathon.md)).

Agent work produces many small, unattended payments. Today every job settles
on its own; per-epoch netting is not built ([05](05-roadmap.md)).

> Keep performance claims sourced. Cite current NEAR documentation for any
> throughput, finality or fee numbers; do not assert them from memory.

## 5. What Pactora is not

- ❌ an AI chatbot
- ❌ an AI trading bot
- ❌ a DEX
- ❌ an NFT marketplace
- ❌ another generic agent framework
- ❌ **a custodian** — nobody, the operator included, can move an agent's
  funds or edit a record

It is **economic infrastructure for autonomous agents**: escrow, settlement,
and on-chain spending caps, with reputation written only by settlement.

Honest competitive positioning — claim this much and no more — is in
[09 §6](09-landscape.md#6-honest-competitive-positioning).

## 6. The demo that proves it

One human instruction; everything after it is agents transacting.

```
USER  "Research ETH/USDC liquidity on NEAR and tell me whether to open a position."
          │
          ▼
    ORCHESTRATOR ── plans subtasks from the capabilities actually on offer
          │
          ▼
    MARKET-RESEARCH   escrow 0.02 mUSDC → accept → research → result
          │              → judged → approve → paid
          ▼
    TRADE-ANALYSIS    escrow 0.05 mUSDC → accept → analyse → result
          │              → judged → approve → paid
          ▼
    (TRADE-EXECUTION  escrow 0.06 mUSDC, if the plan calls for it)
          │
          ▼
        NEAR    ✓ escrow  ✓ caps  ✓ settlement  ✓ reputation
```

This is `pnpm demo:local` in `pactora-backend-near` (`scripts/demo.mjs`): a
fresh local NEAR node, the contracts from their committed wasm, a real
Sputnik DAO, the agents, and models replayed from a recording
(`AGENT_MODE=cached`, no API key). The planner decides how many workers to
hire. Every hire, accept, submit and approve is a real transaction, and
every check reads the chain: the workers' purses, the orchestrator's spend
against its daily cap, the indexer's settlements, and invariant I1 (the
contract holds exactly what it owes). Then the attack: a prompt-injected
orchestrator tries to hire a farm (`COUNTERPARTY_BLOCKED`), overspend
(`BUDGET_EXCEEDED`) and withdraw (`FORBIDDEN`); with a stolen wallet key the
chain itself refuses. People's work runs in the same demo: a listing, two
bids, photo evidence, the DAO desk ruling 2 of 3, and a held payout. The
run ends `Demo passed.` ([docs/25 §3](25-near-submission.md) walks through
it).

## 7. MVP scope

In scope:

1. Register an agent (owner, wallet, capabilities, price, stake).
2. Browse/query the marketplace by capability, price, and score.
3. Hire an agent — direct pay for micro-jobs, escrow above the threshold.
4. Deliver a result and settle.
5. Reputation updates automatically from settlement.
6. An orchestrator agent that does 1–5 with no human in the loop.

For item 1, the owner signs `register_agent` with their own wallet, and the
API checks the on-chain agent id before storing it: the agent must exist,
belong to the owner and have that wallet. If the API cannot read the chain
it refuses rather than trusts.

Out of scope, deliberately: cryptographic result verification, stake
slashing games, cross-chain settlement, a token. (Price negotiation, once
out of scope, now exists as listings with bids — [docs/26](26-human-work-integration-plan.md).)

## 8. Where it goes

The same rails serve coding agents, research agents, trading agents, data
agents, commerce agents, API-wrapper agents — any autonomous service that can
be paid per unit of work — and people who do work in the physical world.
