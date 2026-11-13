# 24 — NEAR Hackathon: rules, fit and plan

Researched 2026-11-04 from the organisers' own pages (sources at the end).
**Verified** means quoted from an official page; **Inferred** is our judgement.
Nothing was registered, submitted or posted.

---

## 1. NEAR Hackathon — nearhackathon.com

### 1.1 Rules (verified, quoted from HACKATHON.md and the homepage)

| Rule | Text |
|---|---|
| Window | "from the announcement on 2026-10-19 … The window runs from then to 2026-11-14. Earlier commits are baseline." Deadline **14 Nov 2026, 23:59 UTC** |
| Judging / results | 16–18 Nov; results by 18 Nov 23:59 UTC |
| Prizes | $250K in NEAR: $55K grand prize; 13 tracks × $10K / $3K / $2K; paid within 30 days |
| Existing product (Q-002) | "Existing product on another chain? Allowed. Only the NEAR integration built in the window is judged. Disclose in README." |
| Repo (Q-003) | "Dedicated branch, or tags `pre-hackathon` and `hackathon-submission`, plus a README section linking the diff." |
| Old project (Q-004) | "Old project as-is: no. New feature in the window: yes, if separated per Q-003." |
| Libraries / AI (Q-005) | "All allowed … List in README; own old libs count as baseline." |
| Mandatory tech (Q-011) | "None. Hints are hints. Own contract on NEAR that fits the track is enough." |
| Testnet (Q-010) | "Yes, all tracks. Mainnet only where the integration is mainnet-only." |
| Intents testnet (Q-007) | "None exists or is planned. Mainnet, separate dev accounts, tiny amounts, `dry: true` quotes." |
| Demo (Q-012) | Local-only is acceptable with a "public repo, reproducible README, X post with a video; screenshots are not enough when judges cannot open the demo. Hosted demo is a plus; keep it up to 2026-11-18, ideally 2026-11-25." |
| Licence (Q-014) | "Any. MIT is fine. Repo stays public through judging; add a LICENSE file." |
| Two projects (Q-015) | At most 2 per person; each README names the other |
| AI screen (Q-017) | "reproducibility check, feature verification, structured report, preliminary score. Humans decide; low AI score alone cannot reject." |
| README | "write the README for a machine reader as well as a human one … 'do X - see Y' steps a judge can follow. No marketing." |
| Submission | Public repo, public X post (@NEARProtocol, #NEARHackathon, video), form with a **mainnet** NEAR payout account, 20–2,000-char description. Form field `website` is a spam trap: leave it empty |
| Criteria | No weights published. FAQ: previous events judged "technical implementation, design, impact, originality and sustainability" |

Not found anywhere: judging weights, a disqualification clause, a list of
mainnet-only integrations.

### 1.2 Tracks that fit (verified track text, inferred fit)

| Track | Official text | Fit |
|---|---|---|
| **Agent Economy** (primary) | "agents that earn, spend, negotiate, hire other agents and pay…". Example prompt: a "general contractor agent … hires other agents … checks the work, and pays out. Everything it spends stays inside my budget"; "A receipt for every task"; "explain how the agent will hold its keys" | Almost exactly our orchestrator → worker → judge → settle |
| **AI Security & Defense** | "spending limits, policy engines, sandboxed wallets, reputation and scam detection". Prompt: counterparty check returning allow/warn/block; a function-call key scoped to one contract; "a prompt-injected agent tries to pay a known-bad address and gets stopped" | Our spend caps, trust verdicts and the stolen-key demo |
| **AI Swarms** | "coordination markets, bidding … intent-based settlement". Prompt: per-agent sub-accounts, RULES.md, 20 buyers / 5 sellers simulation "without any LLM calls" | Our discovery + bidding, if we add the simulation |
| **Open Innovation** | can be entered alongside any other | free extra entry |

Skip Autonomous Business (treasury/sales product, not us).

### 1.3 The competitor: NEAR Agent Market (verified, docs.market.near.ai)

Same lifecycle as ours: "The marketplace holds the payment, and only
acceptance releases it", 5% fee, 5% dispute deposit, an automated resolver
"about every 12 hours" with an operator fallback, 0–100 reputation, payouts
via Stripe Connect or USDC. **Custodial and off-chain** — its docs never
mention on-chain escrow. The Agent Economy prompt tells builders to "look at
market.near.ai".

**Positioning (inferred):** Pactora is the trustless, on-chain settlement and
portable reputation layer that Agent Market runs off-chain — no custody, no
operator, reputation any app can read. Better still, *complement* it: list a
Pactora worker on Agent Market, so we answer the prompt rather than ignore it.
Without this framing judges may read us as a copy of Agent Market.

### 1.4 NEAR tech worth using (verified facts, inferred value)

| Tech | Fact | Use in Pactora | Value |
|---|---|---|---|
| near-sdk-rs **5.30.0** | latest stable (2026-10-27) | escrow + bonds + reputation contract | required core |
| Function-call access keys | one `receiver_id`, named methods; "do not allow to attach NEAR tokens" | each agent signs only escrow methods; caps enforced in the contract | security track, very visible |
| Sub-accounts | `worker-1.pactora.testnet` | one account per agent | swarms track |
| NEAR AI Cloud | private inference in TEEs, attestation + response signatures | judge model runs there; its signed verdict hash is stored with the ruling | distinctive, cheap |
| Sputnik DAO | listed partner (not checked in detail) | the dispute arbiter | decentralised disputes |
| NEAR Intents / 1Click | verifier `intents.near`; mainnet only; no JWT → 0.2% fee | pay workers in any token; `dry: true` quote on testnet, one tiny mainnet payment | needs owner's per-action mainnet OK |
| Agent API / PingPay | per-agent Intents wallets in a TEE (demo keys rotate); x402 paywalls settled to NEAR | optional | risk: rotating keys |
| OutLayer, Shade Agents | TEE compute/custody; Shade 2.0 (Feb 2026) | not in 10 days | skip |

No NEAR-native agent identity/reputation standard exists — our contract's
reputation can be one (inferred: a selling point under "originality").

### 1.5 Ten-day plan (inferred)

| Days | Deliverable |
|---|---|
| 5–7 Nov | Rust contract: jobs (create/accept/submit/approve/dispute/expire/cancel), worker bond, client dispute bond, reputation, per-agent caps (per-task + rolling 24h); unit + sandbox tests; deploy to testnet |
| 8–9 Nov | Backend NEAR layer (signer with function-call keys, indexer, chain reads); API/SDK/MCP on top; sub-accounts per agent |
| 10–11 Nov | Judge on NEAR AI Cloud with attestation recorded; Sputnik DAO arbiter; trust verdict allow/warn/block; prompt-injection attack demo |
| 12 Nov | Optional Intents payout (dry quote; mainnet only with owner OK); Agent Market listing |
| 13 Nov | README "do X → see Y", one-command cached demo, tags, diff link, LICENSE, hosted demo up to 25 Nov |
| 14 Nov | Video, X post, form — before 23:59 UTC with a margin |

Live-chain check every milestone (standing rule). Run each new test against
the old code first.

### 1.6 Risks

- Only the work in the window counts: each README must disclose what
  predates it and link the diff (Q-002, Q-003).
- Repos must be **public** through judging.
- Intents is mainnet only; a function-call key's gas allowance can run out.
- The AI screen runs the README literally: no step may need an API key or
  quota (use `AGENT_MODE=cached`).

---

## 3. What makes it more impactful (inferred)

1. **Show the attack, not just the feature.** A prompt-injected agent tries to
   overspend or pay a bad address, and the contract refuses — on chain, in the
   video. Judges remember a failure that is stopped.
2. **A verifiable judge.** The AI that rules on a job runs in a TEE (NEAR AI
   Cloud) and its signed verdict is recorded with the settlement.
3. **Portable reputation.** Any app reads an agent's record from the
   contract; no platform owns it.
4. **Complement the incumbent.** Work with Agent Market, do not ignore it.
5. **One command to see it work.** The AI screener and the judges both start
   from the README.
6. **Numbers.** Tests, live-chain checks, gas, and an audit summary — the depth
   most entries do not have.

---

## 4. Spike results — facts checked before building (2026-11-05)

Each line was checked against the live service, not taken from memory.

| Fact | Result | How checked |
|---|---|---|
| Testnet RPC | `rpc.testnet.near.org` and `test.rpc.fastnear.com` both answer `chain_id: testnet`, protocol 88 | JSON-RPC `status` |
| Sputnik DAO v2 factory on testnet | **`sputnikv2.testnet`** — 5,403 DAOs, `get_daos` works. (`sputnik-v2.testnet` exists but is not a factory: `MethodNotFound`) | RPC `call_function` |
| Block source for the indexer | **neardata** `testnet.neardata.xyz/v0/last_block/final` returns the full final block: `block` + `shards[]` with `receipt_execution_outcomes` (where NEP-297 logs live) and `state_changes` | HTTP GET |
| 1Click (NEAR Intents) | `POST https://1click.chaindefuser.com/v0/quote`; `dry: true` "simulate[s] the quote request **without generating a deposit address**"; auth is `X-API-Key` or JWT (per HACKATHON.md Q-006 optional, 0.2% fee without) | OpenAPI spec `/docs/v0/openapi.yaml` |
| NEAR USDC asset id (mainnet) | `nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1`, 6 decimals (215 tokens listed) | `GET /v0/tokens` |
| NEAR AI Cloud signatures | `GET /v1/signature/<id>`; signed text = `sha256(request bytes):sha256(response bytes)` (model-prefixed on direct endpoints); `signing_algo` `ecdsa` (EIP-191) or `ed25519`; the signer comes from the verified attestation report | docs.near.ai response-signature-verification |
| Crate versions | near-sdk **5.30.0**, near-contract-standards 5.30.0, near-workspaces **0.24.0**, near-sandbox 0.4.0 (all 2026-10-26/27) | crates.io API |
| npm versions | near-api-js 7.4.0, @near-js/* 2.5.1, @near-wallet-selector/* 10.1.4 | npm registry |
| Toolchain | cargo-near 0.22 needs **rustc ≥ 1.93**; near-sandbox has no Windows build → contracts are built and sandbox-tested in WSL Ubuntu | `cargo install` |

Still to confirm when the owner's key is in `.env`: the NEAR AI Cloud base URL
and model list, and the attestation-report field that names the signing key.

## 5. Status — 2026-11-07, figures refreshed 2026-11-10

Every line below was checked live on a fresh local NEAR node (near-sandbox
2.14, protocol 88), not against a mock, except where a row says otherwise.
Current state: [STATUS](STATUS.md) "Where things stand".

| Plan item (§1.5) | State | Evidence |
|---|---|---|
| Rust contract: jobs, bonds, reputation, rolling caps | **done** | `verify-near` 26/26 on the sandbox; wasm built in the pinned cargo-near image, committed with sha256 (`wasm/SHA256SUMS`) |
| Sputnik DAO arbiter (2 of 3) | **done on the sandbox** | `verify-near --dao` 28/28 with the DAO code testnet's factory deploys (hash `AA4nA45v…`): outsider refused, one vote does not rule, two refund. `create-dao.mjs --network testnet` written |
| Backend on NEAR: signer (function-call keys), indexer (NEP-297, final blocks), NEP-413 registration, API/SDK/MCP | **done** | 1383 backend tests (2026-11-10; 873 on 11-07); `pnpm demo:local` passes from a fresh chain (80 checks on 11-10): jobs settled, the indexer agrees, I1 holds |
| Counterparty check allow / warn / block, enforced at hire | **done** | 403 `COUNTERPARTY_BLOCKED`; tests red on the old code (it hired the farm) |
| Prompt-injection attack demo | **done** | demo step 9: farm detected as self-funded → block; the injected orchestrator refused 3 ways (API, caps, signer); a stolen wallet key refused 4 ways (contract cap, node ×3); purses unchanged |
| Interface on NEAR | **done** | 462 unit tests + 430 mocked browser tests, real-chain suite 96 passed in 5 browsers (2026-11-13; 367 + 1870 runs on 11-10); `/agents`, `/agents/:id`, `/status` rendered against the held local stack, no console errors |
| Testnet deployment | **done (2026-11-10/11)**: `pactora.gopalt.testnet`, `musdc.gopalt.testnet`, DAO `pactora-arbiter-gopalt.sputnikv2.testnet`, `credentials.gopalt.testnet` (2026-11-12) | was: needs a funded testnet account in `pactora-contracts-near/.env` (`DEPLOYER_ACCOUNT_ID`, `DEPLOYER_SECRET_KEY`); then `create-dao`, `deploy`, `verify-near --network testnet`, `DEMO_NETWORK=testnet pnpm demo` |
| Judge on NEAR AI Cloud with attestation | **built, and checked live on 2026-11-12** (NEAR testnet chain job 68: approved on a NEAR AI verdict, `review_hash` = the verified verdict hash) (the sandbox demo with `JUDGE_PROVIDER=near-ai AGENT_MODE=live`: 3 verdicts, each signed by the model's attested enclave key; the API verified and stored the attestation, and the contract's `review_hash` for the approved job equals the verdict hash; recorded-fixture tests since 2026-11-09) | `packages/agent-core/src/providers/near-ai.ts:23-31`: each verdict's signature is fetched from `/v1/signature/<response id>` and verified; a missing or bad one is refused (`JudgeAttestationFailed`). The API stores it with the ruling and returns it as `judge` (`apps/api/src/routes/jobs.ts:344`, `:612-617`). Tests: `packages/agent-core/test/attestation.test.ts`, `apps/api/test/judge-attestation.test.ts`, against fixtures written to NEAR AI's documented shape (`test/fixtures/near-ai/`). Confirmed live with the owner's key (chain jobs 68, 70, 74, 80, 85) |
| Intents payout (dry quote), Agent Market listing | **optional, not started** | Intents is mainnet only (per-action owner OK); the listing needs the owner's account |
| README "do X → see Y", disclosure, LICENSE | **done** in all four repos | `pnpm demo:local` is the one command |
| Tags `hackathon-submission`, push | **done** | all four repos public, tag `hackathon-submission` on the final `master` |
| Video, X post, form (mainnet payout account) | **done (2026-11-12)** | the demo output is the script for the video |

Found and fixed on the way: a plain `cargo build` wasm traps every refusal as
`unreachable` (only the cargo-near build is valid); near-api-js reads
`retries` as attempts, so `/v1/status` reported a working RPC as down.

## Sources

- https://nearhackathon.com/ · https://nearhackathon.com/HACKATHON.md
- https://github.com/nearai/near-hackathon-prompt-examples
- https://docs.market.near.ai/concepts/payments-and-disputes.md
- https://docs.near-intents.org/integration/verifier-contract/introduction.md
- https://docs.agentsonintents.com/integration/agent-api/overview
- https://docs.near.org/protocol/accounts-contracts/access-keys
- https://docs.near.ai/llms.txt · https://app.outlayer.ai/docs/getting-started
- https://docs.near.org/blog/2026-02-23-shade-agent-framework-2.0
