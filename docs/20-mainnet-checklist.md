# 20 — Mainnet launch checklist

Nothing in v3 has been sent to Monad mainnet (143), and nothing should be
until every box below is ticked by the owner. Each item says **why** it is
there and **how to verify** it — a box is ticked by evidence, not by intent.

Legend: 🧑‍💻 the owner's to do or decide · 🤖 can be done in the repo, then
checked by the owner · ✅ done, with its evidence (2026-10-26).

The sequence that ticks the rest, step by step: [docs/21](21-launch-runbook.md).

## 1. Decisions only the owner can make

| | Decision | Why it blocks | Where |
|---|---|---|---|
| ✅ | **The payment token** (D8): Circle's native USDC `0x754704Bc059F8C67012fEd69BC8A327a5aafb603`, from developers.circle.com | Every amount, fee and cap is denominated in it; the deploy refuses without it, and now so does the backend's config | Read on 143: `decimals()` 6, `symbol()` and `name()` "USDC", ~218 M supply |
| ✅ | **Bond floors on mainnet**: `minBond` and `minDisputeBond` **1 USDC** (were 0.01) | A floor that small does little against spam disputes with real money; 1 USDC is still 1% of the 100 USDC minimum stake | `config/params.143.json`; `check-config.mjs` OK |
| ✅ | **`feedbackGas`** stays **500 k** | Too low brings back the starvation bug fixed in v3 | `eth_estimateGas` of `giveFeedback` on 143's pinned registry, first review from a new writer: ≤ 296,133 gas for the whole transaction (× 1.5 = 444 k) |
| ✅ | **ERC-8183**: not yet — deferred until the EIP leaves Draft | The draft contradicts itself (docs/12 §8.1); building to either side breaks the other's callers | docs/19 §8 |
| ✅ | **ERC-4337**: deferred | EIP-7702 `AgentDelegate` already gives agents on-chain caps with no bundler or paymaster; sponsored gas can come later without touching the escrow | docs/19 §5, §8 |
| ✅ | **A pauser**: `PAUSER_ROLE` may `pause()` and nothing else; `unpause()` stays the admin's | A multisig admin is slow in an incident; a leaked pauser key costs downtime, never funds | `V3Pauser.t.sol` (7 tests, red first); live pause drill on testnet (docs/19 §9) |
| ✅ | **The dispute-bond default** — 10%, minimum 0.01 on testnet, 1 USDC on 143 — confirmed | Proven live: a rejected dispute pays the worker, an upheld or unanswered one returns it | `V3DisputeBond`; `verify-v3.mjs` C |

## 2. Security

| | Item | Verify |
|---|---|---|
| 🧑‍💻 | **External audit** of `TaskEscrow`, `StakeVault`, `AgentAccountCore`, `AgentAccount`, `AgentDelegate`, `AgentAccountFactory`, `ClientReputationWriter`, `SettlementValidator` | A report, every finding closed or accepted in writing |
| ✅ | A disclosure route | GitHub private vulnerability reporting, in `SECURITY.md` of contracts, backend and interface, and on the site's `/docs/security` — 🧑‍💻 switch it on in each repo's settings. A bounty is the owner's call |
| 🤖 | Static analysis and tests at the audited commit | All green at `v3` on 2026-10-26: 376 tests (CI profile), solhint, Slither `--fail-medium`, coverage floors, snapshot — **re-run on the exact commit deployed** |
| ✅ | ERC-8004 registries unchanged since integration | `make verify-erc8004` 2026-10-26: identity, reputation and validation implementations on 143 are the pinned ones |

## 3. Keys and roles

Every role below is held by the deployer at deploy time on testnet. On mainnet
none should be a key from `.env`.

| | Role | Holder on mainnet | Verify |
|---|---|---|---|
| 🧑‍💻 | `DEFAULT_ADMIN_ROLE` (both contracts; changes take `adminDelaySeconds` = 2 days on 143) | A Safe whose signers hold hardware keys | `defaultAdmin()` on chain |
| 🧑‍💻 | `ARBITER_ROLE` | A Safe — ideally with signers outside the operator, so the party that runs the service is not the only judge | `hasRole`; the deployer must NOT hold it (as on testnet) |
| 🧑‍💻 | `CONFIGURER_ROLE` | The admin Safe | `hasRole` |
| 🧑‍💻 | `feeRecipient`, `slashRecipient` | Safe addresses | `config()` / vault config on chain |
| 🧑‍💻 | Signer keys (agents' session keys) | **AWS KMS**, `ECC_SECG_P256K1` — built (`apps/signer/src/kms.ts`, `SIGNER_KMS_KEYS`); raw keys and a single shared keystore are refused off testnet. 🧑‍💻 create the keys (docs/21 §2) | `verify-kms.mjs` with `VERIFY_KMS_KEY_ID`; the signer logs `aws-kms` on 143 |
| 🧑‍💻 | Keeper and renewer | `KEEPER_KMS_KEY_ID`, `SESSION_MANAGER_KMS_KEY_ID` — built; raw keys refused off testnet. The renewer is each hosted account's session manager, never its owner (docs/22 F1) | the signer's startup log |

## 4. Deploy

| | Step | Verify |
|---|---|---|
| ✅ | Dry run on a mainnet fork: `make dry-run-mainnet` | 2026-10-26: `SIMULATION COMPLETE` — every contract, canonical USDC and registries, validator bound to 143's Validation Registry; ≈ 3.27 MON at 202 gwei. It also found that `forge script` refused chain 143 outright ("Chain 143 not supported", from the `[etherscan]` entry) — `make deploy-mainnet` would have failed; fixed |
| 🧑‍💻 | Real deploy with `ARBITER_ADDRESS`, `FEE_RECIPIENT`, `SLASH_RECIPIENT`, `PAUSER_ADDRESS` set to the Safes — `Deploy.s.sol` now **refuses** off testnet if any is unset or has no code | `ONCHAIN EXECUTION COMPLETE`; then `deployments/143.json` |
| 🧑‍💻 | Source verification on the explorer for every contract | `make verify NETWORK=monad` with `EXPLORER_API_KEY` |
| ✅ | Parameter drift | `check-param-drift.mjs` now covers all 16 parameters, v3's six included; part of `check-launch` |
| ✅ | Admin hand-over | `make handover` / `make handover-accept` (`script/Handover.s.sol`, 5 tests; a mutation dropping one step fails them). Rehearsed live on testnet with the 2-of-3 Safe; `check-launch.mjs` failed 11 checks before, passed every one after (docs/19 §9) |

## 5. Backend

| | Item | Verify |
|---|---|---|
| ✅ | `ENABLED_CHAIN_IDS` gains 143 only once `deployments/143.json` exists | The config refuses 143 without it, and (v3) without a payment token |
| ✅ | `maxLogRange` for mainnet's RPC | Measured 2026-10-26 on `rpc.monad.xyz`: a wider `eth_getLogs` is refused, "limited to a 100 range" — 100 is right |
| 🧑‍💻 | Alerts on `signer_wallet_balance`, indexer lag and `/v1/status` | An alert fires when tested (docs/17 §6) |
| 🧑‍💻 | Error tracking and log retention | docs/17 |
| ✅ | Mainnet checks that send nothing | `check-launch.mjs` is the read-only check. The three verify scripts send money and now all refuse a non-testnet chain; on 143 the first real job, by hand, is the live check (docs/21 §7) |

## 6. The first weeks

- Start with the conservative `params.143.json` (0.05 USDC per task, 0.25 a
  day by default; 100 USDC minimum stake) and raise them on evidence.
- Watch every dispute and every `BondSeized` by hand.
- Keep the testnet deployment running beside mainnet: it is where changes are
  rehearsed before they touch real funds.

## 7. Not on this list, deliberately

- A redeploy of v2. v2 stays on testnet for the judges until 2026-11-03 and
  is not a mainnet candidate.
- Anything the hosted VPS or Vercel do today: their switch to v3 is its own
  confirmed step after 2026-11-03.
