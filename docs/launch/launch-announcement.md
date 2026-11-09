# Pactora — launch announcement (draft)

> **DRAFT.** Fill every `[SQUARE BRACKET]` before posting. See
> [README.md](README.md). Every claim below is backed by the code or the
> internal audit ([docs/27](../27-audit-2026-11.md)) — do not add claims
> without checking them first.
>
> Two versions: one for the **testnet launch** and lines to swap in for the
> **mainnet launch** (only after the external audit is done and the
> contract is live on NEAR mainnet).
>
> **Not true yet, even for testnet:** the contract is not deployed to NEAR
> testnet and no hosted site is up (docs/STATUS.md, "Blocked on the owner").
> Post the testnet version only after the testnet deploy and the hosted
> site exist.

## X / Twitter thread

Each post is under 280 characters. Post 1 is the hook.

**1/7**

> Pactora — where AI agents make deals they can't break.
>
> AI agents hire other AI agents. Pactora holds the payment in escrow in a
> NEAR contract until the work is done.
>
> Live on NEAR testnet today. [LINK]

**2/7**

> How a deal works:
>
> 1. An agent offers a job and locks the payment in escrow
> 2. The worker agent locks a bond and delivers
> 3. The client approves, and the worker is paid
>
> Say nothing? The payment releases at the deadline. No one can sit on it.

**3/7**

> Every deal has a way out on chain.
>
> Every job has deadlines. When one passes, anyone can call the contract to
> refund or release. Funds never depend on our servers staying up.

**4/7**

> Disagree with the result? The client posts a dispute bond and a 2-of-3
> Sputnik DAO rules.
>
> Worker didn't deliver? Its bond goes to the client, with a full refund.

**5/7**

> Reputation you can't fake for free.
>
> Pactora's records live in the contract, and only a settled payment can
> write one. An agent can't hire one with the same owner, and our trust check
> blocks agents paid by wallets their own owner funded.

**6/7**

> Agents spend within limits.
>
> Each agent signs with a NEAR function-call key scoped to the Pactora
> contract: it spends only within per-task and 24-hour caps the contract
> enforces, and it can never withdraw.

**7/7**

> Honest status: testnet only, test money. The contract passed an internal
> review; mainnet comes after an external audit.
>
> Try it, break it, tell us: [LINK]
> Code: [GITHUB LINK]
> Docs: [DOCS LINK]

### Mainnet version — swap these in only when true

Post 1, last line:

> Live on NEAR mainnet from [LAUNCH DATE]. [LINK]

Post 7:

> Live on NEAR mainnet with real USDC. The contract was audited by
> [AUDIT FIRM] — report: [AUDIT REPORT LINK]
>
> Start small. Set your caps.
> [LINK] · Code: [GITHUB LINK]

## Blog / Discord post

**Pactora — where AI agents make deals they can't break.**

AI agents are starting to hire each other: one agent plans, another
researches, a third does the work. But when one agent pays another, who makes
sure the work gets done — and who makes sure the payment really arrives?

Pactora is the deal layer for AI agents, built on NEAR.

**How it works**

- **Escrow.** The client agent locks the payment in the Pactora contract. It
  is released when the client approves the result, or automatically when the
  review deadline passes.
- **Bonds.** A worker agent locks a bond when it takes a job. If it does not
  deliver in time, the bond goes to the client, along with a full refund.
- **Disputes.** A client can dispute a result by posting a dispute bond. A
  2-of-3 Sputnik DAO rules. If it does not rule within the dispute timeout
  plus a grace period, the worker is paid and the client's bond is split:
  half to the worker for the wait, half back to the client.
- **Reputation backed by payment.** Every settled job updates the worker's
  and the client's record in the contract, state any app can read. Only a
  settled payment can write one, and an agent cannot hire another agent with
  the same owner.
- **Spending caps.** Each agent signs with a function-call key scoped to the
  contract. The contract enforces per-task and rolling 24-hour caps, and a
  function-call key cannot attach the deposit every withdrawal needs, so a
  leaked agent key cannot take money out.
- **Always a way out.** Every job has deadlines, and anyone can call the
  contract to finish a job once one passes. Funds never depend on our servers.

**Where it stands**

Pactora is **live on NEAR testnet** today, with test money. The contract has
been through an internal review: no critical or high findings, and the one
medium and four of the five lows were fixed. It has **not** had an external
audit yet. We will move to mainnet only after one. [MAINNET: replace with
"Live on NEAR mainnet since [LAUNCH DATE], audited by [AUDIT FIRM] —
[AUDIT REPORT LINK]".]

The arbiter is a small DAO, the contract owner can still replace it until
ownership is handed to the DAO, and our check for faked reviews catches some
tricks, not all of them. We say this plainly because the whole point of
Pactora is trust.

**Try it**

- Site: [LINK]
- Docs: [DOCS LINK]
- Code: [GITHUB LINK]
- Found a security bug? Report it privately through GitHub's vulnerability
  reporting on the repository concerned.
- Chat with us: [DISCORD LINK] · [X HANDLE]
