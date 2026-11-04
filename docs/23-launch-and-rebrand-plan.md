# 23 — Launch and rebrand plan: AGENTX becomes Pactora

Decided by the owner on 2026-10-30. This is the order of everything left
between today and a public launch, and who does each step.
[docs/21](21-launch-runbook.md) is the step-by-step for the mainnet part;
this file is the whole picture around it.

## The name

**Pactora** — *pact* (a deal both sides must keep) + *agora* (the ancient
Greek marketplace). A trusted marketplace where AI agents make deals.

- Tagline: **"Pactora — where AI agents make deals they can't break."**
- "Agent" goes in the tagline, not the name: short names are stronger, and
  "agent" is in hundreds of product names already.
- Domain: **pactoragents.com** (owner checked it was free, 2026-10-30).
  `pactoraai.com` was skipped — the double "aa" is easy to mistype.

**Kept on 2026-11-02, knowing the name is already in use.** A check that
day found other "Pactora"s: CAC Corporation (Japan) launched a Pactora
escrow-based settlement service for tokenized assets in August 2026, a PayPal
AI Hackathon 2026 project uses the name for agent-to-agent commerce, and
there is a Pactora Inc. A new name was searched for — about 120 real and
made-up words, including Vousora, Treaty, Standing, Earned, Credence, Stead
and Trellis — and the owner chose to keep **Pactora** and the Keystone Arch.
Before buying the domain or launching, the owner should run a trademark
search (USPTO, EUIPO, and Japan's JPO because of CAC) or ask a lawyer.

## The logo

**The Keystone Arch**, chosen by the owner on **2026-11-02** over 70
explored options. An arch: its two halves are the two agents; the keystone
at the top is the pact that locks them together — take it away and the arch
falls. An arch is also a gateway: Pactora = pact + agora, the marketplace.

- It replaces **"The Pact"** (two overlapping rings, chosen 2026-11-01),
  retired the next day: two interlocking circles look too much like a major
  card network's logo.
- The wordmark is unchanged: `Pact` + `ora`.
- One source: `lib/brand/mark.ts` in agentx-interface; the site, its icons
  and the kit in [`docs/brand/`](brand/README.md) are all drawn from it.
- The AGENTX logo files were deleted from `docs/brand/` the same day; they
  are in the git history.

## What changes in a rebrand, and what does not

| Changes — everything a person reads | Stays — everything a program or the chain reads |
|---|---|
| Product name in the site, docs, READMEs, deck, page titles, metadata | On-chain tags `"agentx"`, `"agentx-settlement"`: reviews already written carry them, and reputation reads filter on them |
| Logo files in `docs/brand/` and the site | The ERC-7201 storage slot `agentx.storage.AgentAccount`: changing it moves every account's storage |
| Contract source **comments** — no: deployed source is not edited (decision 2026-09-29), so verification keeps matching | x402 scheme ids `agentx-escrow` / `agentx-directpay`: stored in payment rows and read by the indexer |
| **Renamed 2026-11-01**, before any outside developer depends on them: package names `@agentx/*` → `@pactora/*`, env vars `AGENTX_*` → `PACTORA_*` (a service that still sees an `AGENTX_*` variable refuses to start and names the replacement), class names `AgentxClient` / `AgentxError` / `AgentxConfig` → `Pactora*`, the MCP server name, the agent card's service name, error type URIs (now `https://pactoragents.com/errors/…`) | Database names and users, docker service / volume / container names, Postgres `NOTIFY` channel, metric names, the `ax_` API-key prefix, the `agentx:sign:v1:` prefix of the signer idempotency keys stored in `signer_txs` |
| | Repo and folder names — renaming a GitHub repo is the owner's, and breaks every link until redirects settle |

The code identifiers were renamed on 2026-11-01 as their own change, with
their own tests (backend Session 39). Everything in the right-hand column
still stays: it is read by the chain, by stored data, or by the hosted
deployment's volumes.

## The order

### 1. Now — the owner

- [ ] Trademark search for "Pactora" (USPTO, EUIPO, JPO), given the
      other Pactoras above
- [ ] Buy **pactoragents.com**
- [ ] Claim the handles: `@pactora` or `@pactoraAI` on X, a GitHub
      organisation, a Discord server

### 2. Now — Claude, on the local `v3` branches, nothing pushed

The hackathon version (v2, `master`, the hosted site) stays frozen until
Monad Metropolis results on **2026-11-03**.

- [ ] This plan, and PROGRESS.md pointing at it
- [ ] Remaining work: none of it is code. Every open item in
      [docs/21](21-launch-runbook.md) and [docs/20](20-mainnet-checklist.md)
      is the owner's (keys, money, an auditor, mainnet transactions), and
      every unbuilt item in [docs/19 §8](19-v3.md#8-not-built-and-why) waits
      on an outside fact or decision
- [ ] Rebrand: new logo files, then every name a person reads, per the
      table above
- [ ] Re-run every test suite and the live testnet checks after the rebrand

### 3. After 2026-11-03 — the owner, with Claude

- [ ] Merge `v3` into `master` in all four repos and push; CI green
- [ ] Hosted switch (docs/21 §7) and point **pactoragents.com** at the site
- [ ] Destroy the old VPS — it bills about $24 a month once the credit ends

### 3b. After 2026-11-03 — repo names (decided 2026-11-01)

The owner chose to rename the four repos. Order matters, because the code
finds its siblings by folder name (`../agentx-contracts`, `../agentx-docs`):

1. Owner: in GitHub settings rename `agentx-contracts` → `pactora-contracts`,
   `agentx-backend` → `pactora-backend`, `agentx-interface` →
   `pactora-interface`, `agentx-docs` → `pactora-docs` (GitHub redirects
   the old URLs). Update the Vercel project's linked repo if it does not
   follow.
2. Rename the four local folders the same way, and each repo's
   `git remote set-url origin` to the new URL.
3. Claude: replace every `gopaltalaviya/agentx-*` link and every sibling
   path (`../agentx-*`, `PACTORA_DOCS_DIR` defaults, CI's docs checkout) in
   all four repos; re-run every suite and the link check; then push only
   when the owner says so.

### 4. Before mainnet — the owner (docs/21)

- [ ] External audit of the eight contracts; give the auditors docs/22
- [ ] Mainnet Safes with hardware signers
- [ ] AWS KMS keys for the signer, keeper and renewer
- [ ] Fund the deployer (about 3.3 MON plus margin)
- [ ] `EXPLORER_API_KEY` for verified source
- [ ] GitHub private vulnerability reporting switched on in each repo

### 5. Launch — the owner, one transaction at a time

- [ ] Mainnet fork dry run, deploy, hand-over to the Safes, launch check
      (docs/21 §3–6)
- [ ] Backend on chain 143 (docs/21 §7)

### Not covered by the runbook — the owner's to decide

- Terms of service and a privacy policy: real money moves between parties (drafts in docs/launch/)
- Hosting costs after the free VPS credit
- A launch announcement on the new handles (drafts in docs/launch/)
- Whether to re-record the demo video and rebuild the deck under the new
  name; the current ones are the hackathon submission and say AGENTX
