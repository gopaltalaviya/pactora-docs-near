# pactora-docs-near

Specification and submission material for **Pactora on NEAR** — AI agents
that hire each other, paid through an on-chain escrow with spend caps the
contract enforces, a 2-of-3 Sputnik DAO ruling disputes, and reputation only a
settled payment can write. Built for the NEAR Hackathon (Nov 2026), tracks
Agent Economy and AI Security & Defense.

> **What existed before.** Pactora started as AgentX on Monad (EVM). The tag
> `pre-hackathon` is that work, imported unchanged; the documents below it
> (00–23) describe the EVM build and are kept as the baseline. Written in the
> hackathon window: [docs/24](docs/24-near-and-solana-hackathons.md) (rules,
> fit, plan and status), and the NEAR changes to
> [15 — API](docs/15-api.md). The wire contract between the NEAR services and
> the chain is
> [`pactora-backend-near/docs/NEAR-PORT.md`](https://github.com/gopaltalaviya/pactora-backend-near/blob/master/docs/NEAR-PORT.md).
> Diff: [`pre-hackathon...hackathon-submission`](https://github.com/gopaltalaviya/pactora-docs-near/compare/pre-hackathon...hackathon-submission).

## The code

| Repo | What |
|---|---|
| [`pactora-contracts-near`](https://github.com/gopaltalaviya/pactora-contracts-near) | Rust (near-sdk 5.30): the Pactora contract (registry, escrow, bonds, caps, reputation), mock USDC, the Sputnik DAO arbiter scripts, `verify-near` (20 live checks) |
| [`pactora-backend-near`](https://github.com/gopaltalaviya/pactora-backend-near) | API, signer (function-call keys), indexer, MCP server, agents; **`pnpm demo:local`** runs everything on a local NEAR node with no keys |
| [`pactora-interface-near`](https://github.com/gopaltalaviya/pactora-interface-near) | The Next.js site: marketplace, agent profiles, runs, status, registration with NEAR Connect |
| `pactora-docs-near` (this repo) | What is below |

**To see it work:** follow "Run it" in the backend README — two clones,
`pnpm install`, `pnpm demo:local`, and the last line is `Demo passed.`

---

# The EVM baseline (AgentX on Monad, before the hackathon)

## Start here

| | |
|---|---|
| **Demo video** | **[Watch on YouTube](https://youtu.be/IQESfGqXn1M)**: 2:35, recorded on testnet, nothing mocked. File: [`docs/video/agentx-demo.mp4`](docs/video/agentx-demo.mp4) |
| **Pitch video** | **[Watch on YouTube](https://www.youtube.com/watch?v=EWuxbUnHfF0)**: 1:35, animated. File: [`docs/video/agentx-pitch.mp4`](docs/video/agentx-pitch.mp4) |
| **Deck** | [`docs/deck/agentx.pptx`](docs/deck/agentx.pptx): 11 slides |
| **Logo** | [`docs/brand/`](docs/brand/): the brand kit for the mark, the Keystone Arch — SVG and PNG, for dark and light backgrounds — and the [brand guide](docs/brand/README.md) (meaning, clear space, minimum size, colours, don'ts) |
| **Portal answers** | [`docs/18-portal-entry.md`](docs/18-portal-entry.md): the hackathon form, field by field |
| **Submission write-up** | [`docs/11-submission.md`](docs/11-submission.md) |
| **Overview** | [`docs/00-overview.md`](docs/00-overview.md) |
| **Build status workbook** | [`docs/agentx-status.xlsx`](docs/agentx-status.xlsx) |

## The specification, in reading order

| # | Document |
|---|---|
| 00 | [Overview](docs/00-overview.md) |
| 01 | [The idea](docs/01-idea.md) |
| 02 | [Flowcharts](docs/02-flowcharts.md) |
| 03 | [Tech stack](docs/03-tech-stack.md) |
| 04 | [How it works](docs/04-how-it-works.md) (contracts, state machine, threat model) |
| 05 | [Roadmap](docs/05-roadmap.md) |
| 06 | [Repository structure](docs/06-repo-structure.md) |
| 07 | [What the owner provides](docs/07-what-i-need-from-you.md) |
| 08 | [Configuration](docs/08-configuration.md) |
| 09 | [Landscape](docs/09-landscape.md) |
| 10 | [LLM architecture](docs/10-llm-architecture.md) |
| 11 | [Submission](docs/11-submission.md) |
| 12 | [ERC-8183 mapping](docs/12-erc8183-mapping.md) |
| 13 | [Deploy](docs/13-deploy.md) |
| 14 | [Operations](docs/14-operations.md) |
| 15 | [API reference](docs/15-api.md) |
| 16 | [Runbooks](docs/16-runbooks.md) |
| 17 | [Production readiness](docs/17-production-readiness.md) |
| 18 | [Portal entry](docs/18-portal-entry.md) |
| 19 | [v3](docs/19-v3.md) |
| 20 | [Mainnet checklist](docs/20-mainnet-checklist.md) |
| 21 | [Launch runbook](docs/21-launch-runbook.md) |
| 22 | [Security audit](docs/22-security-audit.md) |
| 23 | [Launch and rebrand plan](docs/23-launch-and-rebrand-plan.md) |
| 24 | [NEAR and Solana hackathons: rules, fit and plan](docs/24-near-and-solana-hackathons.md) |

**About paths in the docs.** Paths such as `apps/…`, `packages/…`, `scripts/…`,
`chain/…`, `deploy/…` and `.env.example` refer to **agentx-backend** unless a
document names another repo. Commands assume the four repos are checked out
side by side.

`docs/15-api.md` is kept exact by a test: agentx-backend's CI checks this repo
out and fails if its route table differs from the routes the API serves.

`docs/08-configuration.md` §5 is kept complete by `pnpm check:env`: it fails
when any repo's `.env.example` names a variable §5 does not document.

## Rebuilding the deck

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
