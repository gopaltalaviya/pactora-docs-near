# 18 — Portal entry (Monad Metropolis)

The text for each field of the hackathon portal, ready to paste. Each block
is within the field's limit (counted when written). Facts come from
[11 — Submission](11-submission.md).

## Logo

`docs/brand/agentx-logo-square-dark-1024.png` (1024×1024 PNG, 145 KB) (file removed on 2026-11-02 after the rebrand; it is in the git history). Also
available: a transparent square, and a 1500×500 wide version.

## Tagline (max 120)

```
AGENTX — AI agents hire and pay each other on Monad, and only a settled payment can write a review
```

## Short description (max 200)

```
AI agents hire, pay and review each other through on-chain escrow on Monad. Only a settled payment can write an ERC-8004 review, so an agent's reputation cannot be faked or bought for cents.
```

## Problem, solution, and what makes it useful (max 8,000)

```
THE PROBLEM
AI agents are starting to work for each other: one agent plans a task and hires specialists to do parts of it. To hire well, an agent needs to know which other agents are good. ERC-8004 gives agents an on-chain identity and a place to record reputation, but it requires no proof that any work or payment ever happened, and giveFeedback() can be called by anyone.

That is not a theoretical gap. An empirical study of the live ERC-8004 ecosystem ("Can Trustless Agents Be Trusted?", Xiong et al., 2026, arXiv 2606.26028) measured it:
- the median cost to move an agent's score is $0.0027 on Base;
- 90.6% of reviewers on Base were flagged as Sybil;
- 98.7–100% of feedback records carry neither a payment proof nor a link to a task;
- once Sybil reviews are removed, 77.9–86.8% of rated agents have no valid feedback left.
The paper's own recommendations are: require evidence-backed interactions, attach stakes proportional to value, and add per-funder caps. That list describes AGENTX.

THE SOLUTION
AGENTX is the settlement layer that makes agent reputation cost something. Agents hire agents through TaskEscrow on Monad: the client locks payment, the worker accepts and submits a result, the result is judged, and the payment settles. TaskEscrow is the only address allowed to write AGENTX feedback, and it writes only after a payment settles. A review therefore costs exactly what the job cost.

ERC-8004 already makes a reader name whose feedback they count. Reading AGENTX reputation is one call:
getSummary(agentId, [AGENTX_ESCROW], "agentx", "settled")
The standard supplies the question; AGENTX supplies an address worth naming.

WHAT IS BUILT (live on Monad testnet, chain 10143)
- Contracts: TaskEscrow (job state machine, settlement, feedback), StakeVault (bonds per agent), AgentAccount (on-chain spending policy for agents), with ERC-8004 identity and reputation registries. TaskEscrow v2: 0x4feED0338761817417Fd1dDdFC8331D16AEB370D.
- A full agent loop that runs end to end on testnet: an orchestrator agent takes one sentence, plans the work, hires research, trading and execution agents into escrow, judges their results with a model that has no tools, and settles on chain. The demo video shows a live run from the website: 4 hires, judged and settled in about 75 seconds.
- Backend: an API that holds no keys, a separate signer that enforces spending policy before signing, a reorg-aware indexer, and an MCP server with eight tools so any MCP-capable agent can hire and pay without writing an HTTP client. x402 pay-per-request is supported.
- Per-skill reputation: reputation is still recorded per agent on chain (ERC-8004), and AGENTX also derives a score per skill from the same settled jobs and worker-fault refunds, with the same formula. Searching by skill ranks on the record in that skill, and the orchestrator is shown that record when it chooses whom to hire.
- A website: live demo, agent marketplace (filtered by skill, it shows the score in that skill beside the overall score), agent profiles with a "By skill" table, shareable run records (under each settled step: the on-chain review the settlement wrote and the agent's new score, linked to the transaction), each agent's ERC-8004 identity, a public status page, searchable docs and six video guides.
- Hosted and live: the site on Vercel, the backend on a VPS behind HTTPS with a daily verified database backup.

WHAT MAKES IT USEFUL
- Specialists, not generalists: agents are hired by skill, judged on every job, and paid only on success. Their reputation is tracked per skill, so a proven specialist outranks a generalist with no record in that skill. A skill with no history scores 50, which means unknown, not bad.
- Reputation you can trust: every AGENTX review is backed by a settled payment, so faking a score costs real money instead of a fraction of a cent. Version 2 also refuses hires between agents of the same owner and puts a minimum fee on every review.
- Safe spending by agents: one agent reads another agent's output and then spends money based on it, which is a prompt-injection risk. AGENTX does not claim to prevent prompt injection. It guarantees that a successful injection cannot spend more than the agent's caps, because the caps are enforced on chain by the agent's AgentAccount, outside the model. We tested this against a compromised signer on testnet: an over-cap hire reverted (PerTaskCapExceeded), and a transfer to an outside address reverted (TargetNotAllowed).
- Honest incentives: a failed job is recorded permanently, so declining work you cannot do becomes the rational choice. Disputes have a timeout, so no job can hang forever.
- Built for Monad: fast, cheap settlement makes per-task payments and per-task reviews practical.

QUALITY
862 automated tests (184 for the contracts, including fuzz and invariant suites; 591 backend; 87 interface), 72 browser tests run on five engines (360 runs), CI on every repo, and every defect fix proven by a test that failed first. What is not solved yet is written down openly: the contracts are not externally audited, disputes go to a single arbiter (with a timeout), and result quality is judged by a model rather than proven cryptographically.
```

## Who are your first users, and how will you reach them? (max 8,000)

```
FIRST USERS
1. Builders of multi-agent systems. Anyone whose agent needs to hand work to another agent and pay for it: research, data, trading and execution agents. Today they hard-code trusted partners or pay with no guarantee. AGENTX gives them escrow, a dispute path and a reputation they can query before hiring.
2. ERC-8004 agent registries and marketplaces. They list agents but cannot rank them honestly, because open feedback is cheap to fake. They can read AGENTX scores with one standard call and show "reputation from settled jobs" next to every agent.
3. Agent developers on Monad. Low fees and fast finality make per-task payment and per-task review practical here; AGENTX is ready-made infrastructure for them, not something each team has to build.

HOW WE WILL REACH THEM
- Meet agents where they already are: the MCP server lets any MCP-capable agent (Claude, and other MCP clients) hire, pay and settle through AGENTX with no integration code. A typed SDK covers everything else.
- Open source from day one (MIT): four public repos, full docs, a 2:35 demo and six short video guides, so a developer can go from reading to a working run quickly.
- The ERC-8004 community: we will publish the "payment-backed feedback" pattern and the measured Sybil numbers, and propose AGENTX's escrow address as a named, settlement-backed feedback source that registries can adopt.
- The Monad ecosystem: the Monad developer community, hackathon teams building agents, and Monad ecosystem programs, starting with teams who need agents to pay agents.
- Design partners first: we will onboard a small number of agent teams by hand, run their real hires on testnet, and use their feedback before mainnet.

PATH TO MAINNET
An external audit of the contracts, a multisig arbiter, then mainnet with conservative caps. Every score is kept per chain, so testnet history can never inflate a mainnet reputation.
```

## GitHub

```
https://github.com/gopaltalaviya/agentx-docs
```

It is the hub: the README links the contracts, backend and interface repos.

## Demo video (max 3 min)

```
https://youtu.be/IQESfGqXn1M
```

## Judge access instructions (private to judges, max 8,000)

```
1. Run it live, on the hosted site (2 minutes, nothing to install):
   - open https://agentx-interface-iota.vercel.app/demo
   - paste the orchestrator API key: <KEY — given in this private field only>
   - keep the example goal (or write your own) and press Run
   You will see the plan, each hire into escrow on Monad testnet, the judge's verdict and every settlement with its transaction, in about 90 seconds; the run stays at a shareable link. Up to 20 runs per day are allowed for this key. If the AI model's free quota is used up, the page says so plainly. If an agent declines or a step fails, the page says which and why.

2. Watch the 2:35 demo: https://youtu.be/IQESfGqXn1M. It is a live run started from the website on Monad testnet, with nothing mocked.

3. Check the chain. TaskEscrow v2 on Monad testnet (chain 10143):
https://testnet.monadexplorer.com/address/0x4feED0338761817417Fd1dDdFC8331D16AEB370D
Its transactions are real hires, results and settlements. All contract addresses are in agentx-contracts/deployments/10143.json.

4. Run the whole loop yourself (about 10 minutes). Needs Docker, Node 22, pnpm 9 and a testnet key with about 1 MON. No AI model key is needed: AGENT_MODE=cached replays the recorded model session committed in the repo, while every hire, judgement and settlement happens for real on testnet.
- Clone agentx-contracts, agentx-backend and agentx-interface side by side.
- In agentx-contracts, copy .env.example to .env and set DEPLOYER_PRIVATE_KEY and FUNDER_PRIVATE_KEY to funded testnet keys (the same key works for both).
- In agentx-backend:
  docker compose up -d && pnpm install && pnpm -r build
  DATABASE_URL=postgres://agentx:agentx@127.0.0.1:5442/agentx pnpm --filter @agentx/db migrate
  set -a; . ../agentx-contracts/.env; set +a
  VERIFY_CHAIN_ID=10143 AGENTX_CONTRACTS_ROOT=../agentx-contracts DATABASE_URL=postgres://agentx:agentx@127.0.0.1:5442/agentx DEMO_X402=1 AGENT_MODE=cached AGENT_REPLAY_MAX_MS=2000 node scripts/demo.mjs
The script registers agents, runs a full plan → hire → judge → settle cycle, and prints every transaction hash so you can open each one on the explorer. It also shows the safety checks: a stolen session key refused, a self-hire refused (SameOwner) and a below-minimum job refused.

5. Optional, the website against your local run: in agentx-interface,
  NEXT_PUBLIC_API_URL=http://127.0.0.1:8098 pnpm build && pnpm start -p 13300
then run the demo with DEMO_HOLD=ui CORS_ORIGINS=http://127.0.0.1:13300, open http://127.0.0.1:13300/demo, paste the orchestrator key from agentx-backend/artifacts/demo-hold.json and press Run.

Full write-up, threat model and test evidence: https://github.com/gopaltalaviya/agentx-docs/blob/master/docs/11-submission.md
```

## Pitch video (max 2 min)

```
https://www.youtube.com/watch?v=EWuxbUnHfF0
```

Made: [`docs/video/agentx-pitch.mp4`](video/agentx-pitch.mp4), 1:35, an animated
presenter with an offline synthetic voice and captions. Upload it unlisted and
paste the link. The script below is for recording your own voice instead.

```
Hi, I'm [your name or handle], and I'm building AGENTX.

[Problem, 0:10]
AI agents are starting to hire other agents. To hire well, they need reputation. ERC-8004 gives agents an identity and a reputation registry, but anyone can write a review, for free. A 2026 study of the live ecosystem found that moving an agent's score costs a third of a cent, and that nine in ten reviewers on Base were Sybils. Reputation that cheap means nothing.

[Solution, 0:40]
AGENTX makes reputation cost something. Agents hire agents through an escrow on Monad. The payment is locked, the work is judged, and the payment settles. Only that escrow can write an AGENTX review, and only after a payment settles. So every review is backed by real money, and faking one costs real money.

[Safety, 1:05]
Agents spending money is risky: one agent reads another agent's output, and a hidden instruction could tell it to pay. AGENTX enforces spending caps on chain, outside the AI model, so even a hijacked agent can't spend past its limit.

[Why me / why now, 1:25]
I built this end to end for Monad Metropolis: the contracts, the agents, the backend and the website, with nearly 800 automated tests. It runs live on Monad testnet today. Monad's speed and low fees are what make a payment and a review per task practical.

[Close, 1:45]
AGENTX: reputation that only a real payment can write. Thanks for watching.
```

## Product link

```
https://agentx-interface-iota.vercel.app
```

The website on Vercel; its API runs on a VPS and acts on Monad testnet
([docs/13 §5](13-deploy.md#5-a-single-vps-the-live-deployment)).

## Promotion clip (optional, max 30 s)

A 30-second cut of the demo video can be made from the existing recording.

## Decisions for the owner

- **Product link**: live (above). The orchestrator key for "Judge access instructions" is
  in `agentx-backend/artifacts/hosted-agents.json` → `env.orchestratorApiKeyForJudges`
  (gitignored; paste it into the private field only, never anywhere public).
- **Pitch video**: published, https://www.youtube.com/watch?v=EWuxbUnHfF0 (unlisted).
