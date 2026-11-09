# pactora-docs-near

Specification and submission material for **Pactora on NEAR** — a marketplace
where AI agents and people hire each other through an on-chain escrow with
spend caps the contract enforces, a 2-of-3 Sputnik DAO ruling disputes, and
reputation only a settled payment can write. Built for the NEAR Hackathon
(Nov 2026), tracks Agent Economy and AI Security & Defense. The submission is
the **`human-work`** branch of all four repos (owner, 2026-11-09).

> **What existed before (Q-002).** Pactora started as AgentX on Monad (EVM).
> The tag `pre-hackathon` is that work, imported unchanged. Only the NEAR work
> is judged. Diff: [`pre-hackathon...hackathon-submission`](https://github.com/gopaltalaviya/pactora-docs-near/compare/pre-hackathon...hackathon-submission)
> (the tag is added on `human-work` after the testnet run; until then compare
> against `human-work`).

## Start here (NEAR)

| | |
|---|---|
| **See it work** | two clones, `pnpm install`, **`pnpm demo:local`** in [`pactora-backend-near`](https://github.com/gopaltalaviya/pactora-backend-near): a fresh local NEAR node, the contracts, a real Sputnik DAO, agents and people hiring each other, the attack demo; the last line is `Demo passed.` (64 checks). No API key: `AGENT_MODE=cached` |
| **The contract** | [`pactora-contracts-near`](https://github.com/gopaltalaviya/pactora-contracts-near) README: how it works in one paragraph, the method table, `verify-near` (28 live checks with the DAO), the 1.1.0 audit fixes, the testnet procedure |
| **Status and resume point** | [`docs/STATUS.md`](docs/STATUS.md): what is built, the gate results, what is left, what is blocked on the owner |
| **Submission** | [docs/25](docs/25-near-submission.md): form text, X post, video script, README requirements, the checklist |
| **Rules and fit** | [docs/24](docs/24-near-and-solana-hackathons.md): the hackathon rules (§1.1), tracks, the Agent Market positioning (§1.3), spike results |
| **Audit** | [docs/27](docs/27-audit-2026-11.md): five independent reviews of contracts, backend and interface; findings, fixes, what held |
| **Feature inventory and gaps** | [docs/28](docs/28-feature-inventory-2026-11.md): every promised feature with its evidence, what a marketplace user would expect that is not planned, and readiness against each hackathon rule |
| **Human work** | [docs/26](docs/26-human-work-integration-plan.md): people as workers and clients — listings, bids, evidence, disputes, compliance (F1–F33) |
| **Demo video** | to be recorded by the owner over `pnpm demo:local` or the testnet run; script in docs/25 §3. The links below under the EVM baseline are the **Monad** videos, not this submission |

## The code

| Repo | What |
|---|---|
| [`pactora-contracts-near`](https://github.com/gopaltalaviya/pactora-contracts-near) | Rust (near-sdk 5.30): the Pactora contract 1.1.0 (registry, escrow, bonds, caps, reputation, disputes with a grace period, `migrate`), mock USDC, the Sputnik DAO arbiter scripts, `verify-near`, a property suite (256 cases) and 14 on-chain attack tests |
| [`pactora-backend-near`](https://github.com/gopaltalaviya/pactora-backend-near) | API, signer (function-call keys, keeper, faucet), indexer, notifier (webhooks), channels (Telegram, email), MCP server (25 tools), agents; `deploy/vps` hosting recipe; **`pnpm demo:local`** |
| [`pactora-interface-near`](https://github.com/gopaltalaviya/pactora-interface-near) | The Next.js site: marketplace, agent and people profiles, jobs and listings, runs, admin console with the DAO dispute desk, status, registration and sign-in with NEAR wallets |
| `pactora-docs-near` (this repo) | What is below |

The wire contract between the NEAR services and the chain is
[`pactora-backend-near/docs/NEAR-PORT.md`](https://github.com/gopaltalaviya/pactora-backend-near/blob/master/docs/NEAR-PORT.md).

## The documents

Written in the hackathon window (NEAR): **24, 25, 26, 27, 28** and
`STATUS.md`. Documents 00–23 are the Monad/EVM baseline; six of them carry
NEAR sections or were rebased on the NEAR code and are marked so inside:
**04** (§2 banner + "NEAR differences", §5.1e–j, §6 MCP tools), **06** (the
NEAR repository tree), **08** (rebased 2026-11-09: NEAR networks, params,
deployments, every environment variable; Monad in an appendix), **13**,
**14**, **15** (the NEAR API, checked by a backend test), **16** (NEAR
runbooks where they exist, Monad ones under a banner). The rest describe the
EVM build; each Monad-only procedure carries a banner saying so.

| # | Document | Era |
|---|---|---|
| 00 | [Overview](docs/00-overview.md) | Monad |
| 01 | [The idea](docs/01-idea.md) | Monad (the product idea still applies) |
| 02 | [Flowcharts](docs/02-flowcharts.md) | Monad |
| 03 | [Tech stack](docs/03-tech-stack.md) | Monad |
| 04 | [How it works](docs/04-how-it-works.md) (contracts, state machine, threat model) | Monad + NEAR sections |
| 05 | [Roadmap](docs/05-roadmap.md) | Monad |
| 06 | [Repository structure](docs/06-repo-structure.md) | NEAR (rewritten 2026-11-09) |
| 07 | [What the owner provides](docs/07-what-i-need-from-you.md) | Monad |
| 08 | [Configuration](docs/08-configuration.md) | NEAR (rebased 2026-11-09) |
| 09 | [Landscape](docs/09-landscape.md) | Monad |
| 10 | [LLM architecture](docs/10-llm-architecture.md) | Monad (the brains are unchanged) |
| 11 | [Submission](docs/11-submission.md) | Monad (Metropolis) |
| 12 | [ERC-8183 mapping](docs/12-erc8183-mapping.md) | Monad |
| 13 | [Deploy](docs/13-deploy.md) | Monad + NEAR notes; the live procedure is the backend's `deploy/vps/README.md` |
| 14 | [Operations](docs/14-operations.md) | Monad + NEAR sections |
| 15 | [API reference](docs/15-api.md) | NEAR |
| 16 | [Runbooks](docs/16-runbooks.md) | Monad + NEAR sections |
| 17 | [Production readiness](docs/17-production-readiness.md) | Monad |
| 18 | [Portal entry](docs/18-portal-entry.md) | Monad (historical) |
| 19 | [v3](docs/19-v3.md) | Monad |
| 20 | [Mainnet checklist](docs/20-mainnet-checklist.md) | Monad baseline; no NEAR mainnet procedure is written |
| 21 | [Launch runbook](docs/21-launch-runbook.md) | Monad baseline; same |
| 22 | [Security audit](docs/22-security-audit.md) | Monad |
| 23 | [Launch and rebrand plan](docs/23-launch-and-rebrand-plan.md) | Monad → Pactora |
| 24 | [NEAR and Solana hackathons: rules, fit and plan](docs/24-near-and-solana-hackathons.md) | NEAR |
| 25 | [NEAR Hackathon submission: form text, X post, video script](docs/25-near-submission.md) | NEAR |
| 26 | [Human work: integration plan](docs/26-human-work-integration-plan.md) | NEAR |
| 27 | [Audit of the NEAR port, 2026-11-09](docs/27-audit-2026-11.md) | NEAR |
| 28 | [Feature inventory and gap analysis, 2026-11](docs/28-feature-inventory-2026-11.md) | NEAR |
| — | [STATUS](docs/STATUS.md): the resume point | NEAR |

**About paths in the docs.** Paths such as `apps/…`, `packages/…`, `scripts/…`,
`chain/…`, `deploy/…` and `.env.example` refer to **pactora-backend-near**
unless a document names another repo. Commands assume the four repos are
checked out side by side.

Two checks keep the docs honest:

- `docs/15-api.md` is kept exact by a test: pactora-backend-near's CI checks
  this repo out and fails if the endpoint index differs from the routes the
  API serves.
- `docs/08-configuration.md` §5 is kept complete by `pnpm check:env`
  (`scripts/check-env-docs.mjs`): it collects every variable named in the
  three code repos' `.env.example` files (commented lines included), every
  `process.env` read in their source, and the compose files, and fails on
  any name §5 does not document.

---

# Pre-hackathon: the EVM baseline (AgentX on Monad)

Kept for the history and the Q-002 disclosure. None of this is the NEAR
submission.

| | |
|---|---|
| **Monad demo video** | [YouTube](https://youtu.be/IQESfGqXn1M): 2:35, recorded on Monad testnet. File: [`docs/video/agentx-demo.mp4`](docs/video/agentx-demo.mp4) |
| **Monad pitch video** | [YouTube](https://www.youtube.com/watch?v=EWuxbUnHfF0): 1:35, animated. File: [`docs/video/agentx-pitch.mp4`](docs/video/agentx-pitch.mp4) |
| **Deck** | [`docs/deck/agentx.pptx`](docs/deck/agentx.pptx): 11 slides (Monad Metropolis) |
| **Logo** | [`docs/brand/`](docs/brand/): the Keystone Arch mark, SVG and PNG, and the [brand guide](docs/brand/README.md) — still the Pactora mark |
| **Portal answers** | [`docs/18-portal-entry.md`](docs/18-portal-entry.md): the Monad Metropolis form, field by field |
| **Submission write-up** | [`docs/11-submission.md`](docs/11-submission.md) |
| **Build status workbook** | [`docs/agentx-status.xlsx`](docs/agentx-status.xlsx) |

## Rebuilding the deck and the workbook

```bash
pnpm install
pnpm deck                                   # writes docs/deck/agentx.pptx
(cd docs/deck && python check-geometry.py)  # bounds and overlap audit
python docs/build-status-workbook.py        # rewrites docs/agentx-status.xlsx (openpyxl)
```

The docs moved here from `agentx-backend/docs/` on 2026-10-06, with their
history.

## License

[MIT](LICENSE)
