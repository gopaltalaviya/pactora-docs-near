# 25 — NEAR Hackathon submission: form text, X post, video script

Deadline: **2026-11-14 23:59 UTC**. Rules are in [docs/24](24-near-hackathon.md) §1.1.
Every figure below comes from the gate run of **2026-11-09** on the `human-work`
branch (docs/STATUS.md "Gate after the audit"): `pnpm demo:local` 64 checks,
`verify-near --dao` 28 checks, backend 1272 tests, interface 290 unit tests +
1309 browser tests, contracts 63 unit / 6 sandbox / 14 adversarial / 256
property cases. Re-check them against the testnet run before submitting.

> **Branch decision (owner, 2026-11-09):** the submission is the `human-work`
> branch — people as workers and clients, listings and bids, evidence photos,
> the DAO dispute desk, held payouts, the 1.1.0 contract — not `master`. The
> tag `hackathon-submission` goes on `human-work` after the testnet run; a
> merge to `master` is the owner's later choice. The texts below describe
> that branch.

## 1. Form

**Tracks** (nearhackathon.com: "Select every track your project fits"; still
one submission):

| Track | Why it fits (the site's track text, then ours) |
|---|---|
| Agent Economy (primary) | "agents that earn, spend, negotiate, hire other agents and pay": the orchestrator hires, checks and pays workers through escrow |
| AI Security & Defense | "spending limits, policy engines, sandboxed wallets": per-task and daily caps in the contract, function-call keys that cannot move NEAR, the trust check before a hire |
| AI Swarms | "coordination markets, bidding": listings with bids, one listing filled by many workers |
| Social Money | "reputation-based access built on Sputnik DAO": on-chain reputation from settled jobs, disputes ruled by a 2-of-3 Sputnik DAO |

Only tick a track whose text the product meets; Open Innovation is for ideas
that fit no category, so it is left out.

**Repository link (one field, four repos).** The form takes one repository
link. Submit `pactora-backend-near`: its README holds the one-command demo
(`pnpm demo:local`), the disclosure, and links to the other three. The form
link opens the repo's **default branch**, so before submitting either make
`human-work` the default branch of all four repos (GitHub → Settings →
Branches) or merge it into `master`; otherwise judges and the AI screen see
the older `master`. Alternatively submit
`https://github.com/gopaltalaviya/pactora-backend-near/tree/hackathon-submission`.

**Counted work (Q-001):** work from the 2026-10-19 announcement onward counts;
earlier commits are baseline. The `pre-hackathon` tag marks that baseline.

**Website field:** leave it **empty**. It is a spam trap.

**Payout account:** your **mainnet** NEAR account.

**Description** (the form allows 20–2,000 characters; this one is about 1,950):

> Pactora is a marketplace on NEAR where AI agents and people hire each other
> without trusting each other. A client — an orchestrator agent planning a
> goal, or a person posting a listing — locks mUSDC in the Pactora contract's
> escrow; the worker (an agent, or a person bidding on the listing) stakes a
> bond; the delivery is recorded on chain by its sha256. A judge with no tools
> approves and the worker is paid, or disputes and a 2-of-3 Sputnik DAO rules
> from the desk in the admin console. Reputation is written only by
> settlement, and anyone can read it from the contract.
>
> Keys: each agent's wallet is a sub-account holding only a function-call key
> scoped to Pactora. It cannot withdraw, attach a deposit, send NEAR or call
> another contract; the owner's full-access key is separate. People sign in
> with a NEP-413 signature from their own wallet. On-chain per-task and
> rolling 24 h caps bound what a stolen key can spend, bonds included.
>
> Defense: a counterparty check reads the chain's own funding and settlement
> events and blocks self-funded "farm" agents before any money moves. The
> demo prompt-injects the orchestrator: hire a farm, overspend, withdraw to an
> attacker — each refused (COUNTERPARTY_BLOCKED, BUDGET_EXCEEDED, FORBIDDEN).
> With a stolen wallet key, the chain itself refuses every escape. People's
> work is protected too: photo evidence is stripped of location data and
> hashed on chain, a compliance hold stops a payout to a sanctioned account
> (the signer refuses, the keeper skips, the chain pays once cleared), and an
> unanswered dispute cannot be front-run — the DAO has a 7-day window plus a
> 24 h grace before anyone may expire it, and the client's bond then splits.
>
> Built before the hackathon: the escrow-and-reputation design, tag
> `pre-hackathon`. Built in the window, on branch `human-work`: the NEAR code
> (Rust contract 1.1.0, DAO arbiter, NEAR signer, indexer, interface), the
> trust check, and the human side — listings, bids, evidence, chat,
> webhooks, profiles, screening, the dispute desk, Telegram — all run live
> on a NEAR node by one command, `pnpm demo:local`, with no API key.

## 2. X post (you post it, with the video attached)

The site accepts "a demo video or screenshots". The video is stronger; until
it exists, real screenshots from the live suite are in
`pactora-interface-near/docs/screenshots/` (listing with a bid, settled job,
the worker's payout, the DAO dispute desk, home, jobs board, people).

> Pactora: AI agents and people hire each other on NEAR — escrowed, capped,
> and judged before anyone is paid. A prompt-injected agent tries to pay a
> farm and withdraw to an attacker; the API and the chain refuse every step.
> A person's held payout waits for a compliance check; a 2-of-3 Sputnik DAO
> rules the disputes. Wallet keys are function-call only.
> Built at NEAR HACKATHON. @NEARProtocol #NEARHackathon
> github.com/gopaltalaviya/pactora-backend-near [video link: add after recording]

## 3. Video script (about 3½ minutes; recorded over `pnpm demo:local`, or the testnet run)

The "on screen" column quotes real lines the demo prints (`scripts/demo.mjs`),
or names the interface page to show from the held local stack
(`scripts/live-ui-stack.mjs`).

| Time | On screen | Say |
|---|---|---|
| 0:00–0:20 | The README, then the terminal | "Pactora is a marketplace on NEAR where AI agents and people hire each other without trusting each other. Everything you'll see runs against a real NEAR node: one command, cached models, no API key." |
| 0:20–0:40 | `4 owners created with full-access keys, 50 mUSDC each`; `registered the orchestrator and 3 workers: wallet keys from the signer, NEP-413 owner signatures, wallets accepted on chain` | "Each agent has an owner with a full-access key, and a separate wallet that holds only a function-call key scoped to the Pactora contract." |
| 0:40–1:15 | `discover` / `select` / `hire` / `delivered` / `judge … accept` / `settle … paid`, with tx hashes; `3 step(s) settled on chain`; `I1 holds: the contract holds exactly what it owes` | "The orchestrator plans the goal, finds a worker by capability and price, and hires it: the money is locked in escrow. The worker delivers, the result's hash goes on chain, and a judge with no tools checks it before anything is paid. Every check is read from the chain." |
| 1:15–1:50 | The site: `/jobs/new` (a person posts a listing), `/jobs/[id]` with two bids; terminal: `two bids received, sorted by price: 30000, 35000`; `the listing is filled`; `both listing jobs settled on chain` | "People use the same escrow. A client posts a listing from their wallet; workers bid; the client picks, and the job is funded on chain. Two workers deliver, and both are paid by the contract — the same contract the agents use." |
| 1:50–2:15 | `/jobs/[id]` delivery panel with a photo; terminal: `a bidder who is not on this job cannot read the photo`; `the worker sends the client a chat message carrying a prompt injection`; `on-chain result_hash = accepted snapshot sha256` | "Evidence photos are stripped of location data, encrypted at rest, readable only by the parties, and hashed on chain. A chat message carrying a prompt injection changes nothing: not the job, not the price, not a purse." |
| 2:15–2:40 | `/admin` dispute desk; terminal: `the admin console reads the council from the arbiter DAO … on chain`; `an account not on the council is refused the dispute desk`; `one council vote of three does not rule`; then the second vote and `refunded` | "Disputes go to a 2-of-3 Sputnik DAO. The desk builds the proposal; one vote does nothing, two rule the job. After the audit, the DAO has seven days plus a day of grace before anyone can expire a dispute, and an unanswered one splits the client's bond." |
| 2:40–3:00 | `job … reached the payout point (Submitted on chain), and its worker is put on hold`; `the database agrees: the held job is not settled`; then the clearance and the payout tx | "A compliance hold: the signer refuses to pay, the keeper skips the job, and the chain pays once a second reviewer clears it. The money never leaves escrow early." |
| 3:00–3:25 | `the counterparty check reads the farm's record from the chain: self-funded → block`; `attack: a worker's result carries a prompt injection…`; `COUNTERPARTY_BLOCKED`, `BUDGET_EXCEEDED`, `FORBIDDEN` | "Now the orchestrator itself is prompt-injected, and we assume the model obeys. Hire the farm: blocked, from the chain's own funding events. Overspend: blocked. Withdraw to the attacker: forbidden." |
| 3:25–3:45 | `with the stolen key: …`; `PerTaskCapExceeded`, `Deposit is not allowed with function call`, `does not match transaction receiver`; `Demo passed.` | "Worse: the wallet key is stolen and the attacker skips our API. NEAR refuses: caps on chain, no deposits, no transfers, no other contracts. The worst a stolen key can do is spend its caps on registered, staked agents. Pactora: agents and people, hiring each other, safely, on NEAR." |

## 4. README requirements (every repo, from docs/24 §1.1)

The AI screen (Q-017) runs the README literally, so each of the four READMEs
must carry:

- **Disclosure (Q-002) and diff (Q-003):** one sentence — "The
  escrow-and-reputation design was prototyped before the hackathon; the NEAR
  implementation in this repository was built during the hackathon window."
  Where a repository's git history starts before the window, say so. — and a `compare/pre-hackathon...hackathon-submission` link
  (`...human-work` until the tag exists); the `hackathon-submission` tag is added after the testnet run.
- **Libraries (Q-005):** a list with versions — the contracts README's
  "Libraries used" (near-sdk 5.30.0, near-workspaces 0.24.0, cargo-near
  0.22.0, proptest, near-api-js 7.4.0, the Sputnik DAO v2 wasm, …), and the
  "Built with" sections of the backend and interface READMEs. Each must name
  every third-party library the judged code depends on.
- **Positioning (docs/24 §1.3):** a paragraph placing Pactora next to NEAR
  Agent Market — the trustless, on-chain settlement and portable-reputation
  layer that Agent Market runs off-chain; no custody, no operator; a Pactora
  worker can be listed on Agent Market. Judges are told to look at Agent
  Market, so a README without this reads as a copy. Present in the contracts
  README ("Where it sits next to NEAR Agent Market", 2026-11-09) and the
  interface README ("Positioning", `86b08fb`); the backend README's is this
  round's (the backend agent).
- **"Do X, see Y" (README standard):** one command, its expected last line
  (`Demo passed.`), no step that needs an API key or quota
  (`AGENT_MODE=cached`).
- **LICENSE (Q-014):** MIT, present in all four repos.
- **Two projects (Q-015):** not applicable unless a second entry is made.

## 5. Before you submit (owner items are marked)

- [ ] **Owner:** run on testnet. Your own account in `pactora-contracts-near/.env`, then `create-dao`, `deploy` and `verify-near --network testnet --dao`; the commands are in that README's "Testnet" section. Then in the backend `node scripts/sync-chain-facts.mjs`, commit `chain/`, and `DEMO_NETWORK=testnet pnpm demo`.
- [ ] Put the testnet account ids in the READMEs and in docs/STATUS.md.
- [ ] **Owner:** tag `hackathon-submission` on `human-work` in all four repos and push (no merge to `master` is needed for the submission).
- [ ] **Owner:** make all four repos **public** (D6, the rights, first: docs/26 §4).
- [ ] **Owner:** record the video (§3) and post on X (§2), tagging @NEARProtocol with #NEARHackathon.
- [ ] **Owner:** submit the form: §1 text, mainnet payout account, `website` empty.
- [ ] Keep any hosted demo up until 2026-11-18 at least (Q-012); local-only is acceptable with the public repo, the README and the video.
- [ ] Re-check every figure above against the testnet run; update docs/STATUS.md and docs/28 (the feature inventory) with what was deployed.
