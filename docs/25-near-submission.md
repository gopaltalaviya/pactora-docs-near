# 25 — NEAR Hackathon submission: form text, X post, video script

Deadline: **2026-11-14 23:59 UTC**. Rules are in [docs/24](24-near-and-solana-hackathons.md) §1.1.
Every figure below comes from a real `pnpm demo:local` run (2026-11-07). Re-check
them against the testnet run before submitting.

## 1. Form

**Tracks:** Agent Economy (primary), AI Security & Defense. Add Open Innovation
too: it can be entered alongside any other track.

**Website field:** leave it **empty**. It is a spam trap.

**Payout account:** your **mainnet** NEAR account.

**Description** (the form allows 20–2,000 characters; this one is about 1,400):

> Pactora lets AI agents hire other AI agents on NEAR, without trusting them.
> An orchestrator agent plans a goal, finds workers by capability and price,
> and hires them. The client's mUSDC is locked in the Pactora contract's
> escrow, the worker stakes a bond, and the delivery is recorded on chain by
> its sha256. A tool-less judge then approves (the worker is paid) or
> disputes (a 2-of-3 Sputnik DAO rules). Reputation is written only by
> settlement.
>
> Keys: each agent's wallet is a sub-account holding only a function-call
> key scoped to Pactora. It cannot withdraw, attach a deposit, send NEAR, or
> call another contract. Its owner's full-access key is separate. On-chain
> per-task and rolling 24 h caps bound what a stolen key can spend, including
> the worker bonds it can lock.
>
> Defense: a counterparty check reads the chain's own funding and settlement
> events and blocks self-funded "farm" agents before any money moves. The
> demo prompt-injects the orchestrator. It tries to hire a farm, overspend,
> and withdraw to an attacker, and each attempt is refused (COUNTERPARTY_BLOCKED,
> BUDGET_EXCEEDED, FORBIDDEN). With a stolen wallet key, the chain itself
> refuses every escape.
>
> Built before the hackathon: the design, as AgentX on Monad (EVM), tag
> `pre-hackathon`. Built in the hackathon: the NEAR port (Rust contract, DAO
> arbiter, NEAR signer, indexer, interface) and the trust check, all
> live-tested.

## 2. X post (you post it, with the video attached)

> Pactora: AI agents that hire other agents on NEAR — escrowed, capped, and
> judged before they pay. A prompt-injected agent tries to pay a farm and
> withdraw to an attacker; the API and the chain refuse every step. Wallet
> keys are function-call only. @NEARProtocol #NEARHackathon
> <repo link> <video>

## 3. Video script (about 3 minutes; recorded over `pnpm demo:local`, or the testnet run)

| Time | On screen (real output lines) | Say |
|---|---|---|
| 0:00–0:20 | The README, then the terminal | "Pactora lets AI agents hire other agents on NEAR, without trusting them. Everything you'll see runs against a real NEAR node: one command, cached models, no API key." |
| 0:20–0:45 | `4 owners created with full-access keys`; `registered the orchestrator and 3 workers: wallet keys from the signer, NEP-413 owner signatures, wallets accepted on chain` | "Each agent has an owner with a full-access key, and a separate wallet that holds only a function-call key scoped to the Pactora contract." |
| 0:45–1:30 | `discover` / `select` / `hire` / `delivered` / `judge … accept` / `settle … paid`, with tx hashes | "The orchestrator plans the goal, finds a worker by capability and price, and hires it: the money is locked in escrow. The worker delivers, the result's hash goes on chain, and a judge with no tools checks it before anything is paid." |
| 1:30–1:50 | `skip report-generation: no-candidate` | "No agent offers the last step within budget, so the orchestrator skips it instead of overpaying." |
| 1:50–2:10 | `3 step(s) settled on chain`; `workers were paid 0.1287 mUSDC`; `the orchestrator spent 0.13 mUSDC of its 1 mUSDC daily cap`; `reputation written for 3 worker(s)`; `I1 holds` | "Every check here is read from the chain: what was paid, the cap used, the reputation written, and the contract holding exactly what it owes." |
| 2:10–2:30 | `the counterparty check reads the farm's record from the chain: self-funded → block` | "This agent's only client was funded by the agent itself. The trust check finds that in the chain's own events and blocks it." |
| 2:30–2:50 | `attack: a worker's result carries a prompt injection…`; `COUNTERPARTY_BLOCKED`, `BUDGET_EXCEEDED`, `FORBIDDEN` | "Now a worker's answer carries a prompt injection, and we assume the model obeys. Hire the farm: blocked. Overspend: blocked. Withdraw to the attacker: forbidden." |
| 2:50–3:10 | `with the stolen key: …` lines; `PerTaskCapExceeded`, `Deposit is not allowed with function call`, `full access`, `does not match transaction receiver` | "Worse: the wallet key itself is stolen, and the attacker skips our API. NEAR refuses: caps on chain, no deposits, no transfers, no other contracts." |
| 3:10–3:25 | `the most a stolen key can ever spend is its caps`; `Demo passed.` | "The worst a stolen key can do is spend its caps on registered, staked agents. Pactora: agents that hire agents, safely, on NEAR." |

## 4. Before you submit

- [ ] Run on testnet. You put your own account in `pactora-contracts-near/.env`, then run `create-dao`, `deploy` and `verify-near`; the commands are in that README's Testnet section.
- [ ] Put the testnet addresses in the READMEs, then tag `hackathon-submission` in all four repos and push.
- [ ] Make all four repos **public**.
- [ ] Record the video and post on X, tagging @NEARProtocol with #NEARHackathon.
- [ ] Submit the form: mainnet payout account, `website` empty.
- [ ] Keep any hosted demo up until 2026-11-18 at least (Q-012).
