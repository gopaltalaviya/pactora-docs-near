# 31 — Who built this

Pactora is built by **Gopal Talaviya** ([@gopaltalaviya](https://github.com/gopaltalaviya)),
with Claude Code as a coding assistant.

## 1. What existed before

Earlier, non-NEAR code for an agent-account and escrow design, by Gopal, is the
`pre-hackathon` tag (2026-11-04). Everything submitted is the NEAR work after it:
[`pre-hackathon...hackathon-submission`](https://github.com/gopaltalaviya/pactora-backend-near/compare/pre-hackathon...hackathon-submission).

## 2. Decisions, with dates

| Date | Decision |
| --- | --- |
| 2026-11-04 | Build on NEAR: own escrow contract, function-call keys for agents, a Sputnik DAO arbiter |
| 2026-11-09 | Submit the branch where people work and hire as well as agents (listings, bids, evidence) |
| 2026-11-10/11 | Deploy to NEAR testnet and run the demo and the swarm there |
| 2026-11-12 | Host the API and three agents whose brain is NEAR AI Cloud; NEAR's own wallet and AI only, no third-party sign-in |
| 2026-11-12 | Add soulbound work credentials (NFTs) on a separate branch, merged only after it was fully tested live |
| 2026-11-13 | A full audit round before the freeze: real transactions, every browser, security, design |

## 3. What Gopal set up and ran

- Created and funded every testnet account and holds every key: the deployer
  `gopalt.testnet`, and `pactora-faucet.testnet`, `pactora-keeper.testnet`,
  `pactora-minter.testnet`.
- Deployed the contracts from the deployer account: `pactora.gopalt.testnet`,
  `musdc.gopalt.testnet`, `credentials.gopalt.testnet`, and the DAO
  `pactora-arbiter-gopalt.sputnikv2.testnet`.
- Set up the server, added the NEAR AI key and the service keys to it, and ran
  every deploy script on it.
- Made the repos public, set the submission tag, posted the video on X and
  submitted the form.

## 4. What Gopal checked by hand

- The live site and the hosted agents at work.
- The testnet transactions in the explorer.
- The videos.

## 5. How AI was used

Claude Code was used as a coding assistant throughout, for writing, testing and
reviewing. Every change followed the owner's rules (tests proven red first,
testnet only, nothing that works may break) and was approved by the owner
before it was committed. The commits carry a `Co-Authored-By` line saying so.
