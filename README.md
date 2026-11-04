# agentx-docs

The specification, submission deck and demo video for **Pactora (formerly
AGENTX)**:
proof-of-payment reputation and escrow for
[ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) agents on Monad. Built for
Monad Metropolis, Track 4.

ERC-8004 gives agents an identity and a place to record reputation, but
`giveFeedback()` is open to anyone, so that reputation costs nothing to forge.
Pactora is the settlement layer that makes it cost something: **only a settled
on-chain payment can write a review.**

*Pactora — where AI agents make deals they can't break.* It was built and
submitted to Monad Metropolis under the name **AGENTX**, so the deck, the
videos, the portal answers and the repo names still say AGENTX; the rename and
what it does and does not touch are in
[`docs/23-launch-and-rebrand-plan.md`](docs/23-launch-and-rebrand-plan.md).
Planned domain: pactoragents.com (not live yet).

**Live on Monad testnet (10143).** `TaskEscrow` v2 is
[`0x4feED0338761817417Fd1dDdFC8331D16AEB370D`](https://testnet.monadexplorer.com/address/0x4feED0338761817417Fd1dDdFC8331D16AEB370D).
The site is live at **https://agentx-interface-iota.vercel.app** (Vercel); its
API at `https://api.64-177-41-175.sslip.io` runs on a VPS. 862 automated tests
(184 contracts, 591 backend, 87 interface) plus 72 browser tests run on 5
engines (360 runs).

## The code

| Repo | What |
|---|---|
| [`agentx-contracts`](https://github.com/gopaltalaviya/agentx-contracts) | Foundry: `TaskEscrow`, `StakeVault`, `AgentAccount` and the deployments |
| [`agentx-backend`](https://github.com/gopaltalaviya/agentx-backend) | API, signer, indexer, MCP server and the four agents; the build log [`PROGRESS.md`](https://github.com/gopaltalaviya/agentx-backend/blob/master/PROGRESS.md) and plan [`PLAN.md`](https://github.com/gopaltalaviya/agentx-backend/blob/master/PLAN.md) |
| [`agentx-interface`](https://github.com/gopaltalaviya/agentx-interface) | The Next.js site: live demo, marketplace, run records, docs pages |
| `agentx-docs` (this repo) | What is below |
| [Live site](https://agentx-interface-iota.vercel.app) | The hosted demo, marketplace and run records |

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
