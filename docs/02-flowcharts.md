# 02 — Flow Charts

Every diagram here is also given as Mermaid so it renders on GitHub.

---

## 1. System map

```
                        ┌─────────────────────────────┐
                        │           USER              │
                        │   "Find me an opportunity"  │
                        └──────────────┬──────────────┘
                                       │ 1 instruction
                                       ▼
                        ┌─────────────────────────────┐
                        │        MAIN AGENT           │
                        │      (orchestrator)         │
                        │  plan → discover → hire     │
                        └──────────────┬──────────────┘
                                       │ MCP / REST
                                       ▼
        ┌──────────────────────────────────────────────────────────┐
        │                   PACTORA BACKEND                        │
        │   api · signer (+ keeper) · indexer · notifier · mcp     │
        └───────┬──────────────────────────────────┬───────────────┘
                │                                  │
     off-chain  │                                  │ on-chain
                ▼                                  ▼
        ┌───────────────┐              ┌──────────────────────────────────┐
        │  PostgreSQL   │              │             NEAR                 │
        │  agents       │              │  pactora   registry · purses ·   │
        │  jobs         │◀── indexer ──│            caps · stake ·        │
        │  job_events   │  (NEP-297,   │            escrow · reputation   │
        │  payments     │  final       │  mUSDC     NEP-141 (testnet)     │
        │  runs         │  blocks)     │  Sputnik DAO   arbiter, 2 of 3   │
        └───────────────┘              └──────────────────────────────────┘
                ▲
                │ worker protocol (workers poll GET /v1/jobs?role=worker)
      ┌─────────┴──────────┬────────────────────┐
      ▼                    ▼                    ▼
┌───────────┐       ┌───────────┐        ┌───────────┐
│ Research  │       │  Trading  │        │ Execution │
│   Agent   │       │   Agent   │        │   Agent   │
└───────────┘       └───────────┘        └───────────┘
```

Each agent's wallet is a NEAR account holding one **function-call key
scoped to the `pactora` contract**, kept encrypted by the signer. The signer
signs only the agent methods it allows, on `pactora`
(`pactora-backend-near/docs/NEAR-PORT.md` §6). The owner's full-access key
never reaches the backend.

There is no push channel to agent workers. They poll
`GET /v1/jobs?role=worker`, and every chain write they make goes through the
API and the signer. The signer accepts requests only with the shared
`SIGNER_TOKEN`; without one configured it listens on loopback only.

The signer process also runs the **keeper** when `KEEPER_ACCOUNT_ID` and its
key are set: on its own account, it sends the contract's permissionless
exits once their deadlines pass (see §3).

```mermaid
flowchart TD
    U[User] -->|one instruction| M[Main Agent / orchestrator]
    M -->|MCP tools| B[Pactora Backend]
    B --> DB[(PostgreSQL)]
    B --> SG[Signer service]
    SG -->|function-call keys| CH[NEAR]
    SG -.->|keeper, own account: expire / auto_approve| CH
    CH --> IDX[Indexer] --> DB
    W1[Research Agent] -->|poll jobs, accept, deliver| B
    W2[Trading Agent] -->|poll jobs, accept, deliver| B
    W3[Execution Agent] -->|poll jobs, accept, deliver| B
    subgraph NEAR contracts
      P[pactora: registry, purses, caps, stake, escrow, reputation]
      T[mUSDC NEP-141]
      D[Sputnik DAO arbiter]
    end
    CH --- P
    CH --- T
    CH --- D
    T -->|ft_transfer_call Fund / Stake| P
    D -->|resolve_dispute, 2 of 3 votes| P
```

---

## 2. The hire-to-settle flow (happy path, escrow)

```
CLIENT AGENT          BACKEND            NEAR             WORKER AGENT
     │                   │                 │                    │
     │ 1 discover(cap)   │                 │                    │
     ├──────────────────▶│                 │                    │
     │◀──────────────────┤ ranked list     │                    │
     │   candidates      │                 │                    │
     │                   │                 │                    │
     │ 2 hire(agent,     │                 │                    │
     │      spec, max)   │ trust check     │                    │
     ├──────────────────▶│ (allow/warn/    │                    │
     │                   │  block)         │                    │
     │                   │ 3 create_job    │                    │
     │                   ├────────────────▶│ purse → escrow,    │
     │                   │                 │ caps checked       │
     │                   │◀────────────────┤ job_created        │
     │◀──────────────────┤ jobId, txHash   │                    │
     │                   │                 │                    │
     │                   │ 4 poll GET      │                    │
     │                   │   /v1/jobs      │                    │
     │                   │◀────────────────┼────────────────────┤
     │                   │ 5 POST accept   │                    │
     │                   │◀────────────────┼────────────────────┤
     │                   │ accept_job      │ (signed with the   │
     │                   ├────────────────▶│  worker's key;     │
     │                   │                 │  bond locked)      │
     │                   │                 │       6 do work    │
     │                   │ 7 POST result   │                    │
     │                   │◀────────────────┼────────────────────┤
     │                   │ schema check,   │                    │
     │                   │ submit_result(  │                    │
     │                   │  sha256(output))│                    │
     │                   ├────────────────▶│                    │
     │◀──────────────────┤ result ready    │                    │
     │                   │                 │                    │
     │ 8 schema check +  │                 │                    │
     │   LLM judge       │                 │                    │
     │                   │                 │                    │
     │ 9 approve(jobId)  │                 │                    │
     ├──────────────────▶│ approve         │                    │
     │                   ├────────────────▶│ - credit worker    │
     │                   │                 │ - fee to fees_owed │
     │                   │                 │ - bond released    │
     │                   │                 │ - records + review │
     │                   │◀────────────────┤ job_settled        │
     │◀──────────────────┤ txHash          │                    │
```

Workers never talk to the chain directly. Every write, the worker's included,
is an API call that the signer turns into a transaction signed with **that
agent's** function-call key; the contract checks the caller against the
agent's accepted wallet (`only_wallet_of`). The indexer reads final blocks
behind it and corrects the job's state from the contract's NEP-297 events.

```mermaid
sequenceDiagram
    participant C as Client Agent
    participant B as Backend
    participant N as NEAR (pactora)
    participant W as Worker Agent
    C->>B: discover(capability, maxPrice, minScore, rank)
    B-->>C: ranked candidates
    C->>B: hire(agentId, spec, maxPrice)
    B->>B: counterparty check (block = 403 COUNTERPARTY_BLOCKED)
    B->>N: create_job via signer - purse to escrow, caps checked
    B-->>C: jobId + txHash
    N-->>B: job_created via indexer
    W->>B: poll GET /v1/jobs?role=worker
    W->>B: POST /v1/jobs/{id}/accept
    B->>N: accept_job(job_id) signed with the worker's key - bond locked
    W->>W: perform work
    W->>B: POST /v1/jobs/{id}/result
    B->>N: submit_result(job_id, sha256(output))
    C->>B: await result
    C->>C: schema check + LLM judge
    C->>B: approve(jobId)
    B->>N: approve(job_id)
    N-->>N: credit worker, fee owed, bond released, records + reviews
    N-->>B: job_settled via indexer
    B-->>C: txHash
```

---

## 3. Job state machine

This is the contract's authoritative lifecycle (`JobState` in
`pactora-contracts-near/contracts/pactora/src/types.rs`). Nothing off-chain
may contradict it.

```
                        create_job
                             │
                             ▼
                      ┌─────────────┐  cancel (client, any time before accept)
                      │   CREATED   │────────────────────────┐
                      └──────┬──────┘                        │
                accept_job   │   expire_unaccepted           │
                             │   (anyone, after accept_deadline)
                             ▼                               │
                      ┌─────────────┐  expire_undelivered    │
                      │  ACCEPTED   │  (anyone, after        │
                      └──────┬──────┘   work_deadline)──────▶│
              submit_result  │                               │
                             ▼                               ▼
                      ┌─────────────┐                 ┌────────────┐
                      │  SUBMITTED  │                 │  REFUNDED  │
                      └──┬───────┬──┘                 └────────────┘
     approve / auto_approve │    │ dispute (client,          ▲
                          ▼      ▼  inside review window)    │
                  ┌──────────┐  ┌──────────┐ arbiter rules   │
                  │ SETTLED  │◀─│ DISPUTED │─────────────────┘
                  └──────────┘  └──────────┘  for client
                        arbiter rules for worker, or
                        expire_dispute (anyone, after
                        dispute_deadline + dispute_grace)
```

| State | Money is | Who can move it | Next |
|---|---|---|---|
| `Created` | in escrow | worker (accept), client (cancel), anyone (expire after `accept_deadline`) | Accepted / Refunded |
| `Accepted` | in escrow, worker bond locked | worker (submit), anyone (expire after `work_deadline`) | Submitted / Refunded |
| `Submitted` | in escrow | client (approve, dispute inside the review window), anyone (`auto_approve` after `review_deadline`) | Settled / Disputed |
| `Disputed` | in escrow, plus the client's dispute bond | arbiter (`resolve_dispute`, until expiry runs), anyone (`expire_dispute` after `dispute_deadline + dispute_grace`) | Settled / Refunded |
| `Settled` | credited to the worker's purse | — | terminal |
| `Refunded` | credited back to the client's purse | — | terminal |

**Liveness rule:** every open state has a deadline and a permissionless
exit, so neither party going offline can hold funds forever. On testnet the
dispute timeout is 7 days (the arbiter DAO's proposal period) and the grace
24 h more. An expired dispute pays the worker the job and half the client's
dispute bond for the wait; the other half returns to the client. Pause
stops `create_job` and `direct_pay` only; every exit stays open.

An exit happens only when somebody sends the transaction; the contract does
not act on its own. Pactora's **keeper** (`apps/signer/src/keeper.ts`) is that
somebody. It runs inside the signer when `KEEPER_ACCOUNT_ID` is set, on its
own account (never an agent's, so the two cannot race for nonces). Every
`KEEPER_INTERVAL_MS` (default 15 s) it takes the jobs the database still
thinks are open, reads each one's state and deadlines **from the chain**
(`get_job`), and sends whichever exit is due. Without the keeper, expired
jobs wait for someone else to send the exit.

Only some endings count against the worker. `expire_undelivered` (accepted,
then did not deliver: bond seized) and a dispute the worker loses write a 0
review. `cancel` and `expire_unaccepted` write nothing: nobody accepted, so
nobody failed.

```mermaid
stateDiagram-v2
    [*] --> Created: create_job
    Created --> Accepted: accept_job
    Created --> Refunded: cancel / expire_unaccepted
    Accepted --> Submitted: submit_result
    Accepted --> Refunded: expire_undelivered
    Submitted --> Settled: approve / auto_approve
    Submitted --> Disputed: dispute
    Disputed --> Settled: arbiter rules for worker / expire_dispute
    Disputed --> Refunded: arbiter rules for client
    Settled --> [*]
    Refunded --> [*]
```

---

## 4. Fast path vs escrow path

```
                hire(price, path = "auto")
                         │
              ┌──────────┴───────────┐
       price ≤ fast_path_max         price > fast_path_max
       AND worker score              OR worker score
         ≥ fastPathMinScore            < fastPathMinScore
              │                          │
              ▼                          ▼
   ┌────────────────────┐      ┌────────────────────┐
   │   DIRECT PAY       │      │      ESCROW        │
   │ 1 tx, direct_pay   │      │ 4 tx: create,      │
   │ settled at once;   │      │ accept, submit,    │
   │ result delivered   │      │ approve; pay after │
   │ off-chain after    │      │ result             │
   └─────────┬──────────┘      └─────────┬──────────┘
             │                           │
             ▼                           ▼
   review 100 written            review written at
   in the payment call           settlement (or 0 on a
                                 counted refund)
```

The caller can also force `path: "direct"` or `"escrow"`. The contract
refuses a direct payment above `fast_path_max` (`AmountTooLargeForFastPath`;
0.03 mUSDC on testnet).

A direct-pay job is `settled` the moment it is created, and carries
`hasResult: false` until the worker delivers. The delivery is recorded
off-chain against the payment that already happened. There is nothing to
dispute: a bad fast-path result is reported as `unrecoverable`, because that
is the cost of skipping escrow.

Rationale: below the threshold, the cost of protecting a payment exceeds the
payment. Above it, protection is worth the extra transactions. The threshold
is a contract parameter (`config/params.<network>.json` in the contracts
repo), not a constant buried in code.

**The score cut-off.** The fast path pays before any work is done, so `auto`
also requires a proven worker: score ≥ `fastPathMinScore` (70 on testnet),
read from the catalogue's `agent_stats`. An agent with no history scores 50
and always goes through escrow on `auto`. The rule is the API's
(`apps/api/src/routes/jobs.ts`), not the contract's: `direct_pay` does not
check the score, so an explicit `path: "direct"` is still the client's call.
A hire from a listing always uses escrow.

---

## 5. Discovery and ranking

```
  request: capability="market-research", maxPrice=0.05, minScore=80
                              │
                              ▼
              filter: network ∧ active ∧ capability ∈ tags
                      ∧ price ≤ maxPrice
                      ∧ score ≥ minScore
                              │
                              ▼
              rank (balanced):  0.45 · score/100
                              + 0.25 · priceScore   (cheapest 1, dearest 0)
                              + 0.20 · successRate  (0.5 if no history)
                              + 0.10 · recency      (1 today → 0 at 30 days)
                              │
                              ▼
                     top-N candidates
```

The weights are not free parameters. Discovery takes a named `rank` mode:
`balanced` (above), `quality`, `cheapest` or `fastest`
(`apps/api/src/ranking.ts`). An orchestrator that values quality over cost
can say so instead of always taking the cheapest bid. `GET /v1/rank-modes`
lists them. The demo orchestrator uses `balanced` and lets its model choose
among the candidates.

**Stake is checked by the chain.** Whatever discovery lists, `create_job`
and `direct_pay` refuse a worker that is not hireable (`NotHireable`: no
accepted wallet, frozen, or unlocked stake below `min_stake`), and a worker
with the same owner as the client (`SameOwner`).

---

## 6. Reputation update

The contract writes reputation itself, in the same call that moves the
money.

```
   approve · auto_approve · ruling for worker · direct_pay
        → worker_record.completed + 1, worker review 100
   expire_undelivered → worker_record.failed + 1, bond seized, review 0
   ruling for client  → worker_record.disputes_lost + 1, review 0
   expire_dispute     → worker_record.unresolved + 1, no review
   cancel · expire_unaccepted → nothing

   client side (client_record): paid on approve and direct_pay (review 100),
   silent on auto_approve (review 50), disputes_upheld (review 100) and
   disputes_rejected (review 0) on a ruling


   Reading it — free view calls, anyone:

   worker_record(agent_id)  client_record(agent_id)  verdict_of(job_id)
```

`verdict_of` is 100 for a delivered job settled without a dispute, 0 for a
dispute upheld, and null when the ending is not attributable. Every hash the
contract stores (`spec_hash`, `result_hash`, review and reason hashes) is
sha256, 64 lowercase hex; `specHash = sha256(canonicalJson(spec) + ':' +
publicId)`, scoped to the job so two identical specs never share a
commitment.

The score shown in Pactora is computed by the indexer from the contract's
own `job_settled` and `job_refunded` events
(`apps/indexer/src/indexer.ts`, formula in `packages/db/src/reputation.ts`).
It is Laplace-smoothed so a 1-for-1 agent is not "100":

```
   raw = 100 · (completed + 1) / (completed + failed + 2)

   damped by volume so a brand-new agent cannot outrank a proven one:

   confidence = min(1, (completed + failed) / confidenceFloor)
   score      = 50 + (raw - 50) · confidence
```

`confidenceFloor` is a per-network parameter (25 on testnet). Only a refund
whose reason is `undelivered` or `dispute` counts as a failure, matching what
the contract records against the worker; `cancelled` and `unaccepted`
refunds do not.

An agent cannot rate itself through Pactora: a review needs a settled job,
and the contract refuses a job whose client and worker are the same agent
(`SelfDealing`) or have the same owner (`SameOwner`). A farm of agents with
different owners funded from one source is caught off-chain by the
counterparty check, which reads the token's transfer events and blocks a
self-funded worker at hire time.

---

## 7. The demo, as a single trace

```
USER: "Research ETH/USDC liquidity on NEAR and tell me whether to open a position."
MAIN: discover()                         → capabilities on offer
MAIN: plan = [market-research, trade-analysis (, trade-execution)]
MAIN: budget → ceiling per step = min(dailyRemaining / steps, maxSingleSpend)
MAIN → discover(market-research)         → research worker (0.02)
MAIN → hire                              → tx  create_job 0.02 mUSDC (score 50 < 70, so escrow)
research worker → accept, result         → tx  accept_job, submit_result
MAIN: schema check + LLM judge           → accept → approve → tx  settled + reviews
MAIN → discover(trade-analysis)          → trading worker (0.05)
MAIN → hire                              → tx  create_job 0.05 mUSDC
trading worker → accept                  → tx  accept_job
trading worker → result                  → tx  submit_result(sha256(output))
MAIN: schema check + LLM judge           → accept → approve → tx  settled + reviews
MAIN → USER: synthesised answer + per-step receipts and transaction hashes
```

This is the first part of `pnpm demo:local` (`scripts/demo.mjs` in
`pactora-backend-near`). The demo registers fresh agents each run, so every
worker starts at the unproven score of 50, below `fastPathMinScore`. A
worker the judge rejects is disputed on the escrow path.

A worker that goes silent is retried once, with a different agent. An offer
not accepted within 45 s is cancelled (an immediate on-chain refund) and the
step is re-hired; an accepted job that never delivers is abandoned at the
step timeout and re-hired, and the keeper refunds the abandoned job at its
work deadline. The trace shows a `retrying` event.

Total human input: one sentence. Everything after it is agents paying agents.
