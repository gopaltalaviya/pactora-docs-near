# 21 — Launch runbook: v3 on Monad mainnet

The exact sequence, for the owner, from "nothing on mainnet" to "open to real
users". Everything a script can check is a script; everything here that sends
a mainnet transaction is the owner's, run by hand, one step at a time.
[docs/20](20-mainnet-checklist.md) is the checklist this follows — each box
there is ticked by the evidence named here.

The whole sequence was rehearsed on Monad testnet on 2026-10-26 — deploy with
Safes as every role holder, hand-over, the Safe accepting, the launch check
red before and green after, the pause drill (docs/19 §9). Mainnet itself has
only been read: a fork dry run, the token, the registries, the gas of a review.

## 0. Before anything

| | What | Done when |
|---|---|---|
| 🤖 | Internal audit of the contracts and the backend, every finding fixed or accepted in writing | ✅ [docs/22](22-security-audit.md), 2026-10-26 |
| 🧑‍💻 | External audit of the eight contracts in docs/20 §2, every finding closed or accepted in writing — give the auditors docs/22 | a report in `agentx-contracts/audits/` |
| 🧑‍💻 | Private vulnerability reporting switched on for the four repos (GitHub → Settings → Security) | `SECURITY.md` "Reporting" works for a stranger |
| 🧑‍💻 | `v3` merged to `master` in all four repos and pushed; CI green on that commit | the commit you deploy is the commit that was audited |

## 1. The Safes (hardware keys)

Create on Monad mainnet with the Safe app (Safe v1.4.1 is deployed on 143 at
its canonical addresses — checked 2026-10-26), each with signers that hold
hardware keys:

| Safe | Holds | Suggested |
|---|---|---|
| **Admin** | `DEFAULT_ADMIN_ROLE` and `CONFIGURER_ROLE` on TaskEscrow and StakeVault, `PAUSER_ROLE` | 2-of-3 or 3-of-5, the team |
| **Arbiter** | `ARBITER_ROLE` — rules disputes | signers outside the operator where possible, so the party that runs the service is not the only judge |
| **Pauser** | `PAUSER_ROLE` — can stop new jobs, nothing else | 1-of-N of on-call people: fast in an incident; it cannot unpause or move money |
| **Treasury** | `feeRecipient`, `slashRecipient` | the admin Safe, or its own |

Write the four addresses down; they go in `.env` as `ADMIN_SAFE`,
`ARBITER_ADDRESS`, `PAUSER_ADDRESS`, `FEE_RECIPIENT`, `SLASH_RECIPIENT`.
`Deploy.s.sol` refuses, off testnet, any of these unset or without code.

## 2. Keys the backend signs with: AWS KMS

Why the platform holds keys at all: agents act through the API with no human
present, so something signs their transactions. The keys it holds are narrow
— each agent's **session key** (capped per task and per day by its
AgentAccount or EIP-7702 delegate, revocable by its owner, never holding the
funds), the **keeper** (sends permissionless refunds and timeouts, and writes
reviews the registry refused) and the **renewer** — each hosted account's
*session manager*, which can only extend a session key's expiry, never spend,
sweep or raise anything (docs/22 F1). The hosted accounts' **owner** key is
not among them: it stays with you. On a mainnet the signer refuses raw keys;
with KMS the keys never leave AWS and the signer only asks it to sign.

1. AWS → KMS → *Create key*: **asymmetric**, **Sign and verify**,
   **ECC_SECG_P256K1**. One per agent, one keeper, one session manager.
2. An IAM user or role for the signer with only `kms:GetPublicKey` and
   `kms:Sign` on those keys.
3. The signer's environment (`.env.example` documents each):
   ```
   SIGNER_KMS_KEYS={"<agentId or wallet>":"<key id / alias / ARN>", ...}
   KEEPER_KMS_KEY_ID=alias/pactora-keeper
   SESSION_MANAGER_KMS_KEY_ID=alias/pactora-session-manager
   AWS_REGION=<region>
   AWS_ACCESS_KEY_ID=…   AWS_SECRET_ACCESS_KEY=…   (or an instance role)
   ```
4. Check one key end to end on **testnet** first: `VERIFY_KMS_KEY_ID=<id>
   node scripts/verify-kms.mjs` (fund the key's address with a little testnet
   MON) — the chain must attribute the transaction to the key's address.

## 3. Dry run on a mainnet fork

```bash
cd agentx-contracts
set -a; . ./.env; set +a          # the Safe addresses of step 1, DEPLOYER_ADDRESS
make dry-run-mainnet              # simulates every deploy transaction; sends nothing
make verify-erc8004               # canonical registries still on the pinned implementations
```

Expect `SIMULATION COMPLETE`, the canonical USDC
(`0x754704Bc059F8C67012fEd69BC8A327a5aafb603`) and registries adopted, and
the estimated cost (≈ 3.3 MON at 202 gwei on 2026-10-26). Fund the deployer
with that plus a margin — nothing more; it holds nothing after step 6.

## 4. Deploy

```bash
make deploy-mainnet               # asks you to type 143
```

It writes `deployments/143.json`. Then, read only:

```bash
make drift NETWORK=monad          # on-chain parameters == config/params.143.json
make verify NETWORK=monad         # source verification (needs EXPLORER_API_KEY)
```

## 5. Hand every role to the Safes

```bash
ADMIN_SAFE=<admin Safe> make handover NETWORK=monad
```

The admin Safe gets CONFIGURER and PAUSER, the deployer loses them, and the
admin transfer to the Safe starts. It can be accepted after
`adminDelaySeconds` — **2 days** on 143. Then:

```bash
ADMIN_SAFE=<admin Safe> make handover-accept NETWORK=monad
```

prints the two transactions (`acceptDefaultAdminTransfer()` on TaskEscrow and
on StakeVault) for the Safe's signers to propose and sign in the Safe app.

## 6. The launch check

```bash
ARBITER_ADDRESS=… PAUSER_ADDRESS=… \
  node scripts/check-launch.mjs monad --deployer <deployer> --admin-safe <admin Safe>
```

Every line must be ✓: the deployer holds no role on any contract and no
transfer is pending; admin, arbiter, pauser, fee and slash recipients are
contracts; **every holder of every role is listed and is exactly the Safe
expected — nobody else, and nobody at all holds SLASHER; the escrow is the
vault's only locker**; the escrow pays in USDC with 6 decimals; the registries
are the canonical ones; vault, escrow, client writer and validator are wired
to each other; the escrow is not paused; every parameter equals
`params.143.json`.

The holder lists are there because the deployer is still admin for the two
days before the Safe accepts, and could plant a second configurer or a
locker that outlives it (docs/22 F2). **If any holder line is ✗**, stop: from
the admin Safe, `revokeRole(role, stranger)` on that contract, or
`removeLocker(stranger)` on StakeVault, then run the check again. Treat the
deployer key as compromised and do not use it again.

Rehearsed on testnet, 2026-10-26: a locker planted by the deployer before
the hand-over turned the check red after the Safe accepted; the Safe removed
it and the check went green.

## 7. The backend on 143

1. `agentx-backend`: `node scripts/sync-chain-facts.mjs`, commit `chain/`.
2. Environment: `ENABLED_CHAIN_IDS=10143,143` (keep testnet beside it — it is
   where changes are rehearsed), `RPC_URL_143` if not the public RPC, the KMS
   variables of step 2. The config refuses 143 without `deployments/143.json`
   or a payment token; the signer refuses raw keys there.
3. Alerts (docs/17 §6): `signer_wallet_balance` low, indexer lag, `/v1/status`
   not operational — and test that each one fires.
4. The verify scripts send real money and refuse a non-testnet chain on
   purpose. On 143 the first real job is the check: one small job, by hand,
   from two agents you own, then watch it settle and both reviews appear.

## 8. The first weeks

`params.143.json` is conservative: 0.05 USDC per task and 0.25 a day by
default, a 100 USDC minimum stake, 1 USDC minimum bonds, a 3-day dispute
window. Raise them on evidence, through the admin Safe (`setParams`). Watch
every dispute and every `BondSeized` by hand. If anything looks wrong, the
pauser Safe stops new jobs at once; everything already in escrow can still
settle, refund and exit.
