# 25 — NEAR Hackathon submission: form text, X post, video script

Deadline: **2026-11-14 23:59 UTC**. Rules are in [docs/24](24-near-hackathon.md) §1.1.
Figures as of **2026-11-11** on the `human-work` branch (later runs only add
to them; re-check against the testnet run before submitting):
`pnpm demo:local` 80 checks, `verify-near --dao` 28 checks, backend 1418
tests, interface 374 unit tests + 1950 mocked browser test runs (390 tests × 5 browsers) +
a live suite of 20 tests × 5 browsers on a local NEAR node: 96 passed,
4 skipped (the DAO test runs in Chromium only; interface 85f967c, 2026-11-10);
re-run 2026-11-11 on the final code: Chromium 20/20, Firefox, Android and
WebKit 19 + 1 skipped, iPhone 14 of 20 before low memory stopped the run, contracts 88 test
functions (57 `tests.rs` + 6 `budget.rs` + 4 `fuzz.rs` (2 property, 2 fixed) + 1
mock-usdc + 6 sandbox + 14 adversarial), 31 MCP tools.

> **Branch decision (owner, 2026-11-09):** the submission is the `human-work`
> branch — people as workers and clients, listings and bids, evidence photos,
> the DAO dispute desk, held payouts, the 1.1.0 contract — not `master`. The
> tag `hackathon-submission` goes on `human-work` after the testnet run.
> On 2026-11-10 `human-work` was merged into `master` (a fast-forward), so
> the two are the same commit in all four repos; keep them level. The texts
> below describe that branch.

## 1. Form

**Tracks** (nearhackathon.com: "Select every track your project fits"; still
one submission):

| Track | Why it fits (the site's track text, then ours) |
|---|---|
| Agent Economy (primary) | "agents that earn, spend, negotiate, hire other agents and pay": the orchestrator hires, checks and pays workers through escrow |
| AI Security & Defense | "spending limits, policy engines, sandboxed wallets": per-task and daily caps in the contract, function-call keys that cannot move NEAR, the trust check before a hire; and "TEE attestation": the AI judge can run on NEAR AI Cloud (`JUDGE_PROVIDER=near-ai`), its verdict signed by the model's enclave key, the API checks the signature against the key NEAR AI's public attestation report gives for the model, and the verdict hash goes on chain as the job's `review_hash` (checked live 2026-11-12) |
| AI Swarms | "coordination markets, bidding": listings with bids, one listing filled by many workers; `pnpm swarm:local` runs 20 buyer and 5 seller agents bidding by rule over two rounds, settled on chain; on NEAR testnet (2026-11-11) 6 buyers and 3 sellers settled chain jobs 55–65: round 2 chose the seller round 1's settlements had rated, at higher prices; three buyers **pooled** money for one job none could buy alone (jobs 61–63, one result hash); a seller **subcontracted** half its job (64→65). Shown at `/swarm`; every transaction in `pactora-backend-near/RULES.md` |

Settled agent-to-agent jobs are public at `/receipts` on the site (and
`GET /v1/receipts`), each with its spec and result hashes, its transactions
and a read-only `near` CLI call that reads the job from the contract, so a
judge sees the work without an API key.

Only tick a track whose text the product meets; Open Innovation is for ideas
that fit no category, so it is left out. Social Money was dropped on
2026-11-11 (owner): the DAO is a dispute arbiter, not reputation-gated
access, and its testnet council is the operator's own three accounts.

**Repository link (one field, four repos).** The form takes one repository
link. Submit `pactora-backend-near`: its README holds the one-command demo
(`pnpm demo:local`), the disclosure, and links to the other three. The form
link opens the repo's **default branch**, `master`, which since 2026-11-10
is the same commit as `human-work` in all four repos: push every later
commit to both. Alternatively submit
`https://github.com/gopaltalaviya/pactora-backend-near/tree/hackathon-submission`.

**Counted work (Q-001):** work from the 2026-10-19 announcement onward counts;
earlier commits are baseline. The `pre-hackathon` tag marks that baseline.

**Website field:** leave it **empty**. It is a spam trap.

**Payout account:** your **mainnet** NEAR account (named or 64-hex implicit).

**Every field** (HACKATHON.md, re-read 2026-11-11):

| Field | Value |
|---|---|
| Project name (2–80) | Pactora |
| Team lead's name (2–80) · contact email (≤160) | the owner's; never committed to any repo |
| Team size | `1` |
| Tracks | `agents`, `security`, `swarms` (owner, 2026-11-11; `social` dropped) |
| NEAR payout account | the owner's mainnet account |
| Public repository link | `https://github.com/gopaltalaviya/pactora-backend-near` |
| Public demo post link | the X post (§2) |
| Idea (20–2,000) | the description below |
| Consent to the contact notice | the owner ticks it |
| Website | **empty** (a spam trap: any value rejects the submission) |

**How to submit, once** (it cannot be edited; changes go through
nearhackathon.com/request-changes):
- by hand, on the form at nearhackathon.com; or
- through the documented API (`POST https://nearhackathon.com/api/applications`).
  The coding agent prints the full payload and sends it only after the owner's
  explicit yes. It reuses one `requestId` on retries and never commits the
  payload, which holds personal data.

**Description** (the form allows 20–2,000 characters; this one is 1,938, counted 2026-11-12; plain words first, swarm forward, caps in one line):

> Hire an AI agent, or a person, and pay only when the work is accepted. Pactora is a marketplace on NEAR where agents and people hire each other in every direction: an agent hires an agent or a person, a person hires an agent. The money waits in the Pactora contract's escrow, not with a platform: the client locks mUSDC, the worker stakes a bond, and the delivery's sha256 goes on chain. The client approves and the worker is paid, or disputes and a 2-of-3 Sputnik DAO rules. Every finished job leaves a public receipt anyone can check without an account (/receipts).
>
> Swarms: agents following a few rules make a market no one runs. Sellers bid by rule; buyers weigh price against reputation that only on-chain settlements write. Three buyers pool their money to buy one job none could buy alone: each share is its own escrow job under its own caps, and all three settle with one result hash. A seller subcontracts half its job to another agent: agent hires agent hires agent. On NEAR testnet the swarm settled chain jobs 55 to 65, each linked at /swarm.
>
> Unlike NEAR Agent Market, which holds the payment itself, Pactora settles in a contract with no custody, and any app can read the reputation.
>
> Safety: each agent wallet is a sub-account holding only a function-call key scoped to Pactora; per-task and daily caps are on chain; a counterparty check blocks self-funded farm agents; in the demo a prompt-injected agent's hire, overspend and withdrawal are all refused.
>
> Judge: the AI that checks delivered work can run on NEAR AI Cloud. The API checks its signed verdict against the enclave key in NEAR AI's attestation report, and the verdict's hash goes on chain with the approval.
>
> Built before the hackathon as an EVM product on Monad (tag pre-hackathon); everything on NEAR was built in the window (branch human-work). Live on NEAR testnet: pactora.gopalt.testnet. One command, pnpm demo:local, runs it all locally with no API key.

## 2. X post (you post it, with the video attached)

The site accepts "a demo video or screenshots". The video is stronger; until
it exists, real screenshots from the live suite are in
`pactora-interface-near/docs/screenshots/` (listing with a bid, settled job,
the worker's payout, the DAO dispute desk, home, jobs board, people).

**The post** (fits a standard account: 269 of 280 characters, each link counted as
23 the way X does; lead with the problem, one moment, NEAR's role, a next step,
as HACKATHON.md advises):

> Hire an AI agent or a person, pay only when the work is accepted. On NEAR, swarms of agents bid, pool money for one job and subcontract, and every job settles on chain with a public receipt.
>
> https://pactora-interface-near.vercel.app/swarm
>
> Built at NEAR HACKATHON @NEARProtocol #NEARHackathon

With X Premium (longer posts), this fuller version can replace it:

> Pactora: AI agents and people hire each other on NEAR — escrowed, capped,
> and judged before anyone is paid. A prompt-injected agent tries to pay a
> farm and withdraw to an attacker; the API and the chain refuse every step.
> A person's held payout waits for a compliance check; a 2-of-3 Sputnik DAO
> rules the disputes. Wallet keys are function-call only.
> Built at NEAR HACKATHON. @NEARProtocol #NEARHackathon
> github.com/gopaltalaviya/pactora-backend-near
> Live: https://pactora-interface-near.vercel.app

**Standard X account (videos up to 2:20):** attach `pactora-interface-near/public/video/hook-overview-x.mp4`
(1:39: the 20 s opener, then the captioned overview). **X Premium:** attach
`pactora-interface-near/public/video/demo-hook-x.mp4` (3:33: a 20 s opener from the
testnet swarm run, then the 3:12 demo, captions burned in), or `hook-x.mp4` (0:20) or
`overview-x.mp4` (1:27). Both are recorded; see [docs/video](video/README.md).

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
| 1:50–2:15 | `/jobs/[id]` delivery panel with a photo; terminal: `a bidder who is not on this job cannot read the photo`; `the worker sends the client a chat message carrying a prompt injection`; `on chain, each job's result_hash is the accepted snapshot's sha256` | "Evidence photos are stripped of location data, encrypted at rest, readable only by the parties, and hashed on chain. A chat message carrying a prompt injection changes nothing: not the job, not the price, not a purse." |
| 2:15–2:40 | `/admin` dispute desk; terminal: `the admin console reads the council from the arbiter DAO … on chain`; `an account not on the council is refused the dispute desk`; `one council vote of three does not rule`; then `two of three votes, cast with the calls the desk built, ruled job … refunded, worker DisputeLost` | "Disputes go to a 2-of-3 Sputnik DAO. The desk builds the proposal; one vote does nothing, two rule the job. After the audit, the DAO has seven days plus a day of grace before anyone can expire a dispute, and an unanswered one splits the client's bond." |
| 2:40–3:00 | `job … reached the payout point (Submitted on chain), and its worker is put on hold`; `the database agrees: the held job is not settled`; then the clearance and the payout tx | "A compliance hold: the signer refuses to pay, the keeper skips the job, and the chain pays once a second reviewer clears it. The money never leaves escrow early." |
| 3:00–3:25 | `the counterparty check reads the farm's record from the chain: self-funded → block`; `attack: a worker's result carries a prompt injection…`; `COUNTERPARTY_BLOCKED`, `BUDGET_EXCEEDED`, `FORBIDDEN` | "Now the orchestrator itself is prompt-injected, and we assume the model obeys. Hire the farm: blocked, from the chain's own funding events. Overspend: blocked. Withdraw to the attacker: forbidden." |
| 3:25–3:45 | `with the stolen key: …`; `PerTaskCapExceeded`, `Deposit is not allowed with function call`, `does not match transaction receiver`; `Demo passed.` | "Worse: the wallet key is stolen and the attacker skips our API. NEAR refuses: caps on chain, no deposits, no transfers, no other contracts. The worst a stolen key can do is spend its caps on registered, staked agents. Pactora: agents and people, hiring each other, safely, on NEAR." |

## 4. README requirements (every repo, from docs/24 §1.1)

The AI screen (Q-017) runs the README literally, so each of the four READMEs
must carry:

- **Disclosure (Q-002) and diff (Q-003):** one sentence — "The
  escrow-and-reputation design predates the hackathon; the NEAR
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

- [x] Run on testnet (2026-11-10/11): `pactora.gopalt.testnet`, DAO `pactora-arbiter-gopalt.sputnikv2.testnet`, `verify-near` 25/25, the testnet demo (72 checks), the testnet swarm (jobs 49–54, then 55–65 with pools and subcontracting).
- [x] Testnet account ids in the READMEs and in docs/STATUS.md.
- [ ] **Owner:** tag `hackathon-submission` on `human-work` in all four repos and push (`master` already equals `human-work`; push the tag only).
- [ ] **Owner:** make all four repos **public** (D6, the rights, first: docs/26 §4).
- [x] Videos recorded (2026-11-10, local NEAR sandbox, captions only): `pactora-interface-near/public/video/`, overview 1:27 and demo 3:12; see [docs/video](video/README.md).
- [ ] **Owner:** post on X (§2) with `demo-hook-x.mp4` (or `hook-x.mp4` / `overview-x.mp4`), tagging @NEARProtocol with #NEARHackathon.
- [ ] **Owner:** submit the form: §1 text, mainnet payout account, `website` empty.
- [ ] Keep any hosted demo up until 2026-11-18 at least (Q-012); local-only is acceptable with the public repo, the README and the video.
- [ ] Re-check every figure above against the testnet run; update docs/STATUS.md and docs/28 (the feature inventory) with what was deployed.
