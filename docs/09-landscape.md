# 09 — Landscape Analysis

What already exists around agent payments and trust, where Pactora sits on
NEAR, and what it should and should not claim. Facts about NEAR Agent Market
and the NEAR stack are quoted in [docs/24](24-near-hackathon.md) §1.3–§1.4
with their sources; the rest is the project's own research, dated where it
matters.

---

## 1. What exists now

| Thing | What it is | Overlaps Pactora? |
|---|---|---|
| **x402** | HTTP 402 payment protocol: the server answers 402, the agent pays, retries with a receipt header. An x402 Foundation exists under the Linux Foundation, where an escrow scheme has been proposed | Partially — pay-per-request, **no escrow, no multi-step jobs**. Pactora speaks it ([§4](#4-x402)) |
| **AP2** (Google) | Intent / Cart / Payment Mandates as verifiable credentials. Proves a *human* authorised a purchase | No — it is authorisation, not settlement |
| **NEAR Agent Market** (market.near.ai) | A marketplace that holds the payment until acceptance, a dispute deposit, a resolver with an operator fallback, a 0–100 reputation, payouts by card rails or USDC | **Yes — the same lifecycle, off-chain and custodial** ([§5](#5-near-agent-market)) |
| **Virtuals ACP** | An on-chain agent marketplace: discover, hire, escrow, evaluate | Yes — the same flow, in a closed marketplace |
| **Skyfire / Nevermined / Coinbase Agentic Wallets** | Agent wallets with spend controls, metering, fiat and crypto rails | Partially — spend control, but **off-chain and custodial** |
| Funded companies (Nava Labs, Catena Labs, Natural) | Agentic payments, escrow before execution, agent finance | The category is real and funded; none is a non-custodial on-chain escrow with on-chain caps |

### The uncomfortable conclusion

"Register an agent, browse a marketplace, hire, escrow, settle, build
reputation" is not new. On NEAR, Agent Market already runs that lifecycle,
and the hackathon's Agent Economy prompt tells builders to look at it. A
project that ships the same flow and says nothing about it reads as a copy.

So Pactora claims a narrower thing, and a checkable one: **the settlement,
spending limits and reputation as contract state, with nobody in custody.**

---

## 2. The gap that is actually open

| Gap | Why it is open | What Pactora does |
|---|---|---|
| **Non-custodial settlement** | A marketplace that holds the money is trusted by both sides; an operator can move funds | Escrow in the `pactora` contract; no owner method can move a protocol balance (`recover_surplus` reaches only tokens above `get_totals().sum`) |
| **Spending an agent cannot exceed** | A key that can pay can usually pay anything; off-chain limits stop at the server that enforces them | Per-task and rolling 24 h caps in the contract, bonds included; a function-call key scoped to the contract that cannot attach a deposit, so it can never withdraw |
| **Reputation that costs something** | A review that costs nothing to write is worth nothing to read; self-funded "farms" rate each other | Records written only by settlement, in the same call that moves the money; same-owner hires refused on chain; self-funded farms blocked at hire time by the counterparty check |
| **Reputation anyone can read** | Scores in an operator's database follow the operator, not the agent | `worker_record`, `client_record`, `verdict_of`: free view calls on the contract |
| **Disputes with no single judge** | A resolver or one arbiter key decides alone | A 2-of-3 Sputnik DAO is the arbiter; a dispute cannot be expired before `dispute_deadline + dispute_grace`, so a late ruling cannot be front-run |

One limit, stated plainly: the score is Laplace-smoothed and volume-damped,
which resists a single lucky job but not a coordinated ring of different
owners that pay each other with their own money. The counterparty check
(trust verdict `self-funded` → block) catches rings funded from the agent's
own side; by its design it does not look at owners funded independently
of each other (inferred from the check, not tested).

---

## 3. The one-liner

> **Pactora — escrow, spend caps and settlement-backed reputation for AI
> agents, on NEAR.** Only a settled payment can write a review, and no key an
> agent holds can take the money out.

Tagline: *Agents that can work — and pay each other.*

### The NEAR pieces it uses

| NEAR feature | Use in Pactora |
|---|---|
| Function-call access keys (one receiver, no deposits) | Each agent wallet signs only `pactora` methods; the caps live in the contract |
| Named accounts and sub-accounts | `bot.<owner>` per agent wallet |
| NEP-141 `ft_transfer_call` | Funding and staking (`{"Fund":…}`, `{"Stake":…}`) |
| NEP-297 events | The indexer's only source of job state |
| NEP-413 signed messages | Owner and person sign-in, registration |
| Sputnik DAO | The arbiter |
| NEAR AI Cloud | Optional judge (`JUDGE_PROVIDER=near-ai`), off by default |

---

## 4. x402

A worker can sell one HTTP call through x402, with the network key
`near:testnet` and two schemes of Pactora's own
(`packages/shared/src/x402.ts`):

- `pactora-directpay` — the client settles first, through the facilitator,
  bounded by `fast_path_max`; no refund if the work fails;
- `pactora-escrow` — settlement is a `create_job`, and a failed call is
  cancelled for a full refund.

The facilitator is `POST /v1/x402/settle`, `/verify` and `/redeem`; the SDK
call is `client.payX402(url, {maxAmount, body})`. A blocked counterparty is
refused here too (`COUNTERPARTY_BLOCKED`). An x402 payment is an ordinary
`direct_pay` or `create_job` underneath — an adapter, not a second payment
system. The schemes are not the canonical x402 `exact` scheme; a client that
speaks only `exact` cannot pay a Pactora worker.

---

## 5. NEAR Agent Market

From [docs/24 §1.3](24-near-hackathon.md) (verified against
docs.market.near.ai): the same lifecycle as Pactora — "the marketplace holds
the payment, and only acceptance releases it", a 5 % fee, a 5 % dispute
deposit, an automated resolver about every 12 hours with an operator
fallback, a 0–100 reputation — **custodial and off-chain**: its docs never
mention on-chain escrow.

**Position:** Pactora is the trustless, on-chain settlement and portable
reputation layer that Agent Market runs off-chain — no custody, no operator
who can move funds or edit a score, reputation any app can read. The two
complement each other: a Pactora worker is an ordinary NEAR account and can
be listed on Agent Market, settling its Agent Market jobs there and its
agent-to-agent jobs on Pactora, with one on-chain reputation that follows
it. (Listing a worker on Agent Market is planned, not done.)

---

## 6. Honest competitive positioning

For the submission write-up. Claim exactly this much and no more:

| Versus | Pactora's actual claim |
|---|---|
| **NEAR Agent Market** | Complementary: the same lifecycle, but escrow, caps, bonds, rulings and reputation are contract state, with no custodian |
| **Virtuals ACP** | Same flow, different bet: ACP is a closed marketplace; Pactora's reputation is contract state any app can read, and spending limits are enforced by the chain |
| **x402** | Complementary. x402 is pay-per-request; Pactora adds escrow and multi-step jobs, and speaks x402 for single calls |
| **AP2** | Orthogonal — human authorisation, not agent-to-agent settlement |
| **Skyfire / Nevermined / Coinbase** | Their spend controls are off-chain and custodial. Pactora's are on-chain and verifiable |

**"Only paid jobs write reputation" is not unique.** Other projects tie
reviews to settled payments too. Lead with the combination: on-chain spending caps with a
key that cannot withdraw, worker and dispute bonds, a DAO arbiter with a
grace period, direct pay and x402, an MCP server, an orchestrator, people as
workers, and a counterparty check that blocks a farm before it is paid.

**Do not claim** to be first, only, or fastest. The landscape is crowded and a
judge will know it. Claim the specific gap — *non-custodial settlement,
on-chain spending limits and settlement-backed reputation on NEAR* — and let
the specificity do the work.
