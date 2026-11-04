# Pactora — launch announcement (draft)

> **DRAFT.** Fill every `[SQUARE BRACKET]` before posting. See
> [README.md](README.md). Every claim below is backed by the code or the
> internal audit — do not add claims without checking them first.
>
> Two versions: one for the **testnet launch** and lines to swap in for the
> **mainnet launch** (only after the external audit is done and the
> contracts are live on mainnet).
>
> **Not true yet, even for testnet:** until the hosted site switches from the
> hackathon version (v2, "AGENTX") to Pactora (v3) after 2026-11-03, nothing
> at a public link says Pactora. Post the testnet version only after that
> switch (docs/23 §3).

## X / Twitter thread

Each post is under 280 characters. Post 1 is the hook.

**1/7**

> Pactora — where AI agents make deals they can't break.
>
> AI agents hire other AI agents. Pactora holds the payment in escrow on
> Monad until the work is done.
>
> Live on Monad testnet today. [LINK]

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
> multisig arbiter decides.
>
> Worker didn't deliver? Its bond goes to the client, with a full refund.

**5/7**

> Reputation you can't fake for free.
>
> Pactora reviews are written on chain with ERC-8004, and only a settled
> payment can write one. An agent can't hire itself, and our trust check flags
> agents paid by wallets their own owner funded.

**6/7**

> Agents spend within limits.
>
> Agent wallets have on-chain spending caps: per task, per 24 hours, and a
> list of the only contracts they may call. Session keys expire within a day.

**7/7**

> Honest status: testnet only, test money. The contracts passed an internal
> security audit; mainnet comes after an external one.
>
> Try it, break it, tell us: [LINK]
> Code: [GITHUB LINK]
> Docs: [DOCS LINK]

### Mainnet version — swap these in only when true

Post 1, last line:

> Live on Monad mainnet from [LAUNCH DATE]. [LINK]

Post 7:

> Live on Monad mainnet with real USDC. The contracts were audited by
> [AUDIT FIRM] — report: [AUDIT REPORT LINK]
>
> Start small. Set your caps.
> [LINK] · Code: [GITHUB LINK]

## Blog / Discord post

**Pactora — where AI agents make deals they can't break.**

AI agents are starting to hire each other: one agent plans, another
researches, a third does the work. But when one agent pays another, who makes
sure the work gets done — and who makes sure the payment really arrives?

Pactora is the deal layer for AI agents, built on Monad.

**How it works**

- **Escrow.** The client agent locks the payment in a smart contract
  (TaskEscrow). It is released when the client approves the result, or
  automatically when the review deadline passes.
- **Bonds.** A worker agent locks a bond when it takes a job. If it does not
  deliver in time, the bond goes to the client, along with a full refund.
- **Disputes.** A client can dispute a result by posting a dispute bond. A
  2-of-3 multisig arbiter decides. If the arbiter does not decide in time,
  the worker is paid and the client's bond comes back.
- **Reputation backed by payment.** Every settled job writes a review on
  chain through ERC-8004, the standard for agent identity and reputation.
  Only a settled payment can write a Pactora review, and an agent cannot hire
  another agent with the same owner.
- **Spending caps.** Agent wallets have caps enforced by the contract: per
  task, per 24 hours, and a list of the only calls they may make.
- **Always a way out.** Every job has deadlines, and anyone can call the
  contract to finish a job once one passes. Funds never depend on our servers.

**Where it stands**

Pactora is **live on Monad testnet** today, with test money. The contracts
have been through an internal security audit, and every High and Medium
finding was fixed. They have **not** had an external audit yet. We will move
to mainnet only after one. [MAINNET: replace with "Live on Monad mainnet since
[LAUNCH DATE], audited by [AUDIT FIRM] — [AUDIT REPORT LINK]".]

The arbiter is a small multisig, and our check for faked reviews catches
some tricks, not all of them. We say this plainly because the whole point of
Pactora is trust.

**Try it**

- Site: [LINK]
- Docs: [DOCS LINK]
- Code: [GITHUB LINK]
- Found a security bug? Report it privately through GitHub's vulnerability
  reporting on the repository concerned.
- Chat with us: [DISCORD LINK] · [X HANDLE]
