# 07 — What the owner provides

Everything on this list is the owner's to do or decide: accounts, keys,
money and choices nobody else should make. The running state is
[STATUS.md](STATUS.md) ("Blocked on the owner", "Next up"); the submission
checklist is [docs/25 §5](25-near-submission.md#5-before-you-submit-owner-items-are-marked).
Testnet only: no item here touches NEAR mainnet.

Private keys go only into `.env` files, written by the owner. Nobody else
generates or funds keys for the owner.

## 1. A funded NEAR testnet account (blocks the testnet run)

- [ ] A NEAR testnet account with **about 25 testnet NEAR**, the budget for
      one full pass (contracts README "Testnet": ~8 for `create-dao`, ~9 for
      `deploy`, ~7 held while `verify-near` runs, ~1 of it spent).
- [ ] Its id and key in `pactora-contracts-near/.env`:
      `DEPLOYER_ACCOUNT_ID`, `DEPLOYER_SECRET_KEY` (start from
      `.env.example`; the `.env` is gitignored).
- [ ] Optional: your own council accounts for the arbiter DAO
      (`COUNCIL_1_*`, `COUNCIL_2_*`); otherwise `create-dao.mjs` creates two
      and writes their keys into your `.env`.

Then, from `pactora-contracts-near` (commands in its README, "Testnet"):

```sh
node --env-file=.env scripts/create-dao.mjs --network testnet
node --env-file=.env scripts/deploy.mjs --network testnet
node --env-file=.env scripts/verify-near.mjs --network testnet --dao
```

and in `pactora-backend-near`: `node scripts/sync-chain-facts.mjs`, commit
`chain/`, then `DEMO_NETWORK=testnet pnpm demo`.

## 2. Hosting (optional)

Local-only is acceptable for the hackathon (rule Q-012) with the public
repos, the README and the video. To host:

- [ ] A VPS for the backend (`pactora-backend-near/deploy/vps/README.md`)
      and the server's `.env`, on the server only: `SIGNER_TOKEN`,
      `SIGNER_KEY_PASSPHRASE`, `API_HOST`, `CORS_ORIGINS`,
      `MINIO_KMS_SECRET_KEY`, `BACKUP_REMOTE`, `ALERT_WEBHOOK_URL`, and
      optionally a keeper account ([docs/08 §5](08-configuration.md)).
- [ ] The interface on Vercel with `NEXT_PUBLIC_API_URL=https://$API_HOST`.
- [ ] Where off-host backups go (`BACKUP_REMOTE`) and where alerts go
      (`ALERT_WEBHOOK_URL`).

## 3. Optional keys

- [ ] A NEAR AI Cloud key (`NEAR_AI_API_KEY`) for one live call of the
      judge adapter (`JUDGE_PROVIDER=near-ai`, off by default). Its fixtures
      follow the documented shape and are not from a live call until then.
- [ ] A Telegram bot token, to verify the Telegram adapter live (it is
      tested against a fake fetch only).
- [ ] An email provider (only a fake provider exists today).
- [ ] Any run that spends LLM API quota: `AGENT_MODE=cached` is the default
      and needs no key; ask before a live run.

## 4. Decisions

From [docs/26 §4](26-human-work-integration-plan.md#4-decisions-for-the-owner):

| # | Decision | Where it stands |
|---|---|---|
| D3 | KYC vendor and testnet KYC | open; the provider is simulated and labelled until then |
| D6 | The rights, before the repos go public | open; required before making the repos public |
| — | The name-matching threshold trade-off for sanctions screening ("Erik"/"Eric", [docs/04](04-how-it-works.md) §5.1h) | open; the current behaviour is pinned by a test |

## 5. Submission steps (docs/25 §5)

- [ ] Put the testnet account ids in the READMEs and in STATUS.md.
- [ ] Tag `hackathon-submission` on `human-work` in all four repos and push.
- [ ] Make all four repos public (after D6).
- [ ] Record the video ([docs/25 §3](25-near-submission.md)) and post on X
      (§2), tagging @NEARProtocol with #NEARHackathon.
- [ ] Submit the form (§1 text, mainnet payout account, `website` empty).
- [ ] Keep any hosted demo up until 2026-11-18 at least (Q-012).
