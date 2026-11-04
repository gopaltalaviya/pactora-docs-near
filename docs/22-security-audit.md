# 22 — Internal security audit, 2026-10-26

An internal pre-launch audit of v3: the contracts and the backend that signs
for agents. It is **not** the external audit [docs/21 §0](21-launch-runbook.md)
requires before mainnet — it is what an external auditor should no longer
find. Three independent reviewers each took one area, wrote a proof-of-concept
test for every High or Medium they claimed, and every finding below was then
checked against the code before it was accepted or fixed.

| Area | Scope |
|---|---|
| Escrow | `TaskEscrow`, `ClientReputationWriter`, `SettlementValidator`, their interfaces |
| Accounts and custody | `StakeVault`, `AgentAccountCore` / `AgentAccount` / `AgentAccountFactory`, `AgentDelegate`, `Deploy.s.sol`, `Handover.s.sol` |
| Backend | signer (keys, KMS, policy), API (auth, idempotency, x402, SSE), indexer, agents and MCP, deploy files |

Every fix was written test-first: the test fails on the code before the fix
and passes after. Fixes to the contracts need a redeploy, so the testnet
contracts were redeployed and every live check re-run after them
([§4](#4-proof)).

## 1. Summary

| Severity | Found | Fixed | Accepted or documented |
|---|---|---|---|
| High | 4 | 4 | 0 |
| Medium | 5 | 5 | 0 |
| Low | 8 | 4 | 4 |
| Informational | 11 | 5 | 6 |

Nothing found could take a client's or a worker's escrowed money, or trap it.
The Highs were in **how the hosted accounts are run** (the renewer held the
owner key) and in **the backend** (a signer that trusted what callers and
wallet contracts told it).

## 2. Contracts

### F1 — High — the renewer held the owner key of every hosted account · **fixed**

`grantSessionKey` was owner-only, so the hosted renewer had to be the owner of
every AgentAccount it kept alive, inside the signer process. A compromised
signer could `sweep`, raise the caps, or grant itself an allowance — the caps
did not survive a signer compromise, which is the one thing they exist for.
And every re-grant reset `spent`, so a stolen session key's lifetime budget
refilled each day (PoC: five refills drained five budgets).

**Fix.** A narrow **session manager** (`setSessionManager`, owner only) that
can do one thing: `extendSessionKey(key, expiry)` on a key the owner granted,
keeping `spent` and the budget. It cannot grant, sweep, set policy, set
allowances or allowlist calls, and cannot revive a revoked key. The renewer
now holds this role, not the owner key; hosted accounts are owned by a key the
signer never sees. Tests: `AgentAccount.t.sol` "the session manager" (run
against the factory account and the 7702 delegate).

### M-1 — Medium — an agent could choose which of its reviews reach ERC-8004 · **fixed**

The canonical registry refuses a review from an operator of the agent. The
escrow refused to hire such an agent, but only checked at hire and accept: a
worker approved the escrow as operator just before its own `expireUndelivered`
or a dispute it would lose, the FAILED review was caught and dropped, and it
revoked the approval before its next job. A third-party reader of
`getSummary(id, [escrow])` saw a perfect score; Pactora's own `recordOf` was
right. The client side worked the same way through the client writer.

**Fix.** A refused review is kept (`unwrittenReviews`), anyone can write it
later with `retryFeedback(jobId, client)` (same fixed gas budget, reverts and
changes nothing while the registry still refuses), and until it is written the
agent can neither hire nor be hired nor accept (`ReviewUnwritten`). The same
mechanism recovers reviews lost to a registry outage. The keeper retries them.
Tests: `V3UnwrittenReview.t.sol`.

### F2 — Medium — a role holder or locker planted during the hand-over was invisible · **fixed**

Between `Handover` and the Safe's accept (two days on mainnet) the deployer is
still admin. It could grant a second configurer or slasher, or add a locker —
which could then `lock` and `seize` any agent's bond — and revoke its own
roles. AccessControl could not list who holds a role, a locker could never be
removed, and the launch check only asked whether the *deployer* held anything:
it passed with the backdoor in place (PoC).

**Fix.** TaskEscrow and StakeVault list every role holder
(`AccessControlEnumerable`), the vault counts its lockers (`lockerCount`) and
the admin can `removeLocker` (new locks stop; existing ones still end with
their job, so no bond is stuck). `check-launch.mjs` now asserts the **exact**
set of holders of every role and that the escrow is the only locker, so
anything planted turns the launch check red and the admin Safe removes it.
Rehearsed live on testnet with a planted locker ([§4](#4-proof)). Tests:
`V3RoleVisibility.t.sol`.

### F3 — Low — a worker can empty its bond faster than the withdraw delay · **accepted**

With a second agent under another owner, a worker can take jobs with one-second
windows, let them expire, and have `seize` send its own bond to its own client
— out in seconds instead of after the withdraw delay. It costs the worker
`failed` records and gains it nothing unless a slash is pending, and nobody
holds `SLASHER_ROLE` (the launch check requires it to stay empty). **If a
slasher is ever appointed, this becomes Medium**: seized bonds must then go to
the slash recipient, not the client, or a minimum work window must apply.

### F4 — Low — a new account owner inherited the old owner's grants · **fixed (keys) / documented (allowances)**

`acceptOwnership` kept every session key and the session manager. It now
bumps a key epoch, which retires them all at once. Standing token allowances
the old owner set with `setAllowance` cannot be enumerated on chain: **reset
them before transferring an account**. Test: "a new owner inherits no session
keys or manager".

### Lower findings

| Id | Finding | Outcome |
|---|---|---|
| L-1 | A manufactured review costs ~0.0001 USDC on mainnet (`minFee`) plus gas; `directPay` needs no bond | **Accepted**, owner decision: raising `minFee` on 143 prices out real micro-payments. Readers should weight by amount (it is in `feedbackHash`); Pactora's trust check already discounts self-funded payers |
| L-2 | Anyone can pay an agent and write a 100 review about it, enough of them to make the registry's `getSummary` expensive | **Accepted**: it costs the attacker and pays the victim; revisit if seen |
| I-1 | The review gas check ran before loading the registry and the review hash | **Fixed**: both loaded first, so the budget check covers them |
| I-2 | 1 USDC bond floors make disputes uneconomic on small jobs | **Accepted**, parameter choice (docs/19 §9) |
| I-3 | `claimOwed` asked the registry for the owner first, so a reverting `ownerOf` locked the wallet out too | **Fixed**: wallet first, `ownerOf` guarded. Test: `V3AuditLows.t.sol` |
| I-4 | `configure` did not check the vault's identity registry | **Fixed**: `RegistryMismatch` |
| I3 (accounts) | `claimOwed` through `execute` would move owed funds outside every cap | **Fixed**: forbidden selector, like `approve` |
| I1 (accounts) | Re-delegating an EOA within a day restores its old session keys | **Documented**: revoke keys before un-delegating |
| I2 (accounts) | USDC's EIP-2612/3009 signatures from a 7702-delegated EOA go through ERC-1271 and fail | **Documented**; Pactora's x402 uses `directPay`, unaffected |
| I4 (accounts) | Wildcard mode on an EOA measures only the payment token | **Documented**: hosted and delegated accounts are allowlist-only |
| I5 | The ERC-8004 identity registry is a trust root (upgradeable) | **Documented**; implementations pinned and checked by `verify-erc8004` |

## 3. Backend

All in `agentx-backend`; every one test-first (the test fails on the old code).

### H1 — High — signer idempotency keys were shared by every agent · **fixed**

The signer looked a replay up by the key alone, and the API passed a caller's
`Idempotency-Key` header through, with predictable defaults built from the
job's serial number. A caller could reuse another request's key and be handed
*that* transaction as its own: the API then recorded a payment that never
happened (free fast-path work), or swallowed a worker's `submitResult` so its
bond was seized at the deadline.

**Fix.** A key belongs to one agent and one call: unique on (chain, agent,
key), and a replay is returned only when the payload hash
(`keccak(target‖data‖spend)`) matches — anything else is
`IDEMPOTENCY_CONFLICT`, including the reclaim of a failed row. The API never
forwards a raw header: the signer key is derived from the caller, the action,
the job's public id and the client's key. No serial in any key or error; the
SDK's default hire key names the client. Migration `0009_signer_scoped_keys`.

### H2 — High — job rows that were never paid looked like work · **fixed**

A hire the signer refused (no funds, over the cap, a revert at estimation, a
key too long for the signer) left a job row that workers were offered, and
they spent model quota producing for nobody. Workers are now shown a job only
once its creation is proven on chain (a chain job id or a created / paid
event); the row is kept, so a retry under the same key replays rather than
paying twice. Keys longer than the signer accepts are refused up front.

### H3 — High — a contract posing as an AgentAccount drained the signer's gas · **fixed**

The renewer and the signer treated any wallet that *answered* `owner()`,
`policy()` and `sessionKeys()` as an AgentAccount. A registered contract could
claim the renewer as its owner and every held key as a lapsing grant (the
renewer paid gas for it on every pass), or claim to trust a key held here (the
signer sent from it into the attacker's contract).

**Fix.** What a wallet is comes from its **code** (`apps/signer/src/accounts.ts`):
an ERC-1167 clone of this deployment's factory implementation, or an EOA
delegated to this deployment's AgentDelegate by EIP-7702; no code is a plain
EOA; anything else is refused. Off testnet a key signs only for the agent it
is mapped to. Transactions estimated above 1.5 M gas are refused; renewals use
a fixed limit.

### M1 — Medium — registration needed no proof of control · **fixed**

Registering only checked that the owner and wallet matched public chain data.
Anyone watching ERC-8004 could register an agent first and take its only API
key, or claim a wallet so its owner could never register. The owner now signs
a single-use challenge (`POST /v1/agents/challenge`, 5 minutes); a wallet
claimed without an ERC-8004 id must sign too. The site's register page asks
the wallet to sign; docs/15 has the flow.

### M2 — Medium — the signer trusted the RPC's chain id · **fixed**

Transactions were signed with the chain id the RPC reported. A testnet
signer — raw keys allowed — pointed at a mainnet RPC by a typo would sign
mainnet transactions. The signer, keeper and renewer now refuse to start, and
the signer refuses to sign, unless the RPC serves the configured chain, and
every send names the chain.

### M3 — Medium — a plain-EOA agent could be made to sign anything · **fixed**

For an agent whose wallet is a plain EOA, any holder of the signer's token
could have it sign `USDC.transfer(attacker, all)` with a declared spend of 0.
Such an agent may now sign only the escrow's own calls, and what it spends is
decoded from the calldata (and the dispute bond read from the chain), never
taken from the request.

### Lower findings

| Id | Finding | Outcome |
|---|---|---|
| L1 | Jobs, specs and paid results are publicly readable by id; the status page names the latest run | **Accepted**: the marketplace is public by design and the demo shows its runs; results meant to be private should not go through a public marketplace. Revisit for paid private work |
| L2 | Anyone could reset the owner's key-reissue challenge | **Fixed**: several live challenges per requester, the nonce sent back with the signature |
| L3 | One client could take every live-event stream | **Fixed**: streams capped per client address (`SSE_MAX_STREAMS_PER_CLIENT`) |
| L4 | The judge never vetoed a detected injection; the untrusted-output wrapper stripped only exact-case tags | **Fixed**: an injection attempt is a reject; tags stripped in any case and spacing |
| Info | `TRUST_PROXY` could only mean "trust every hop" | **Fixed**: a hop count (`1` now means one hop) |
| Info | The base `docker-compose.full.yml` publishes Postgres with a default password | **Accepted**: the VPS overlay removes the port and Docker's port publishing bypasses ufw — never run the base file alone on a server (deploy/vps/README) |

The renewer itself changed with F1: it is the hosted accounts' **session
manager** (`SESSION_MANAGER_*`; the old `SESSION_OWNER_*` name is still read,
with a warning) and calls `extendSessionKey`. The hosted seed makes a
separate manager key for the server and keeps the owner key in the seed file.
The keeper writes refused reviews (M-1) as soon as the registry takes them.

## 4. Proof

Tests, all written to fail on the code before the fix:

| Repo | Tests | Gates |
|---|---|---|
| agentx-contracts | 414 (+ fork suite) — `V3UnwrittenReview`, `V3RoleVisibility`, `V3AuditLows`, the session-manager tests in `AgentAccount.t.sol` (also run against the 7702 delegate) | coverage floors held (100 % branches on the account contracts), `slither --fail-medium` clean, gas snapshot |
| agentx-backend | 764 (705 before) | typecheck, lint, format, `pnpm audit --audit-level high` clean |
| agentx-interface | 99 unit · 378 browser runs in five engines | typecheck, lint, production build |

Live on Monad testnet, 2026-10-26, against the redeployed contracts
(TaskEscrow `0x14b93e92…7dc6`) and the **canonical** ERC-8004 registries:

- **`verify-audit.mjs`** — M-1: a worker approved the escrow as operator just
  before its own failure; the canonical registry refused the FAILED review,
  the escrow kept it, hiring the worker was refused `ReviewUnwritten`; with
  the approval revoked a stranger wrote it (value 0) and the worker was
  hireable again. F1: a session key spent 70 000 through an AgentAccount; the
  session manager extended it and `spent` and the budget were unchanged;
  `sweep`, `grantSessionKey`, `setPolicy` and creating a key were refused to it.
- **F2, the hand-over** — before the hand-over the deployer planted a locker;
  after the Safe accepted, `check-launch.mjs` listed every role holder and
  failed on exactly one line, "the escrow is the only locker — 2"; the Safe
  executed `removeLocker` and the check passed.
- **Everything else again** — `verify-v3`, `verify-validation`,
  `verify-delegate`, `verify-kms`, `verify-pause`; the demo with a local model
  (agents registered through the API with the owner's signature, the signer
  recognising the AgentAccounts by their code — 3/3 settled, the account's
  on-chain spend within its cap, every x402 ending and refusal); the
  anti-Sybil farm check.

## 5. What is left for the external audit

- The whole of §2 and §3 again, by people who did not write the fixes.
- Economic review of the parameters on 143 (L-1, I-2, F3's condition).
- The signer and KMS path against a real AWS KMS key (the live check used a
  stand-in that answers like KMS does).
