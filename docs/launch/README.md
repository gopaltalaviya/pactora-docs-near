# Launch drafts

**These are drafts. They are NOT legal advice.**

A lawyer must review the terms of service and the privacy policy (now on the
site, at `/terms` and `/privacy`) before Pactora goes to mainnet — real money
moves between parties there. Nothing here has been reviewed by a lawyer yet.

| File | What it is |
|---|---|
| Terms of service — on the site at `/terms`, source `agentx-interface/app/terms/page.tsx` ([pointer](terms-of-service.md)) | Plain-English terms: what the service is and is not, testnet vs mainnet, keys, caps, fees, disputes, bonds, risks, liability |
| Privacy policy — on the site at `/privacy`, source `agentx-interface/app/privacy/page.tsx` ([pointer](privacy-policy.md)) | What the code really collects (checked against the `v3` backend and site), who else sees it, how long it is kept |
| [launch-announcement.md](launch-announcement.md) | An X thread (7 posts, each under 280 characters) and a short blog / Discord post, with testnet and mainnet versions |

The privacy policy was written from the code, not from guesses. **If the code
changes — a new table, analytics, a new AI provider, log rotation — check the
policy again.**

## Placeholders to fill

### Both legal documents

- `[COMPANY NAME]` — the legal entity or person offering the service
- `[CONTACT EMAIL]`
- `[DATE]` — the "Last updated" date
- `[pactoragents.com]` — confirm the domain once it is bought and live

### Terms of service

- `[CONFIRM MAINNET ARBITER SIGNERS]` — who holds the mainnet arbiter Safe keys
- `[LAWYER: decide whether any appeal or outside dispute process applies]`
- `[AMOUNT]` — the liability cap floor
- `[LAWYER: confirm indemnity wording]`
- `[and on X / Discord]` — where notice of changes is given
- `[NUMBER]` — days of notice before changed terms apply
- `[JURISDICTION]` — governing law
- `[JURISDICTION / VENUE]` and `[or ARBITRATION BODY AND RULES]`
- `[LAWYER: decide courts or arbitration, and any class-action waiver]`
- `[UPDATE WITH EXTERNAL AUDIT FIRM, DATE AND REPORT LINK BEFORE MAINNET]`

### Privacy policy

- `[VPS PROVIDER]` — the server host (Vultr today)
- `[RPC PROVIDER]` — if a paid RPC replaces Monad's public one
- `[STATE WHICH MODE THE HOSTED SERVICE USES, AND LIST ONLY THE PROVIDERS ACTUALLY CONFIGURED]` — `AGENT_MODE` (cached or live) and which AI providers have keys on the server
- `[DECIDE A RETENTION PERIOD]` — for agents, jobs, runs and history (today nothing is deleted)
- `[DECIDE WHETHER A FIXED PERIOD IS ALSO NEEDED]` — Docker logs are now rotated by size (5 × 10 MB per service, backend compose, 2026-11-01), not by age
- `[ADD A CLEAN-UP JOB OR STATE A PERIOD]` — expired sign-in challenges
- `[DESCRIBE THE DELETION PROCESS]` — how someone asks for off-chain data to be deleted
- `[AGE — e.g. 18]` — minimum age
- `[COUNTRIES]` — where servers and providers are
- `[LAWYER: add the transfer basis ...]` — international transfers
- `[LAWYER: state the legal basis for each use ...]`
- `[POSTAL ADDRESS, IF REQUIRED]`

### Launch announcement

- `[LINK]` — the site
- `[GITHUB LINK]`, `[DOCS LINK]`, `[DISCORD LINK]`, `[X HANDLE]`
- Mainnet version only: `[LAUNCH DATE]`, `[AUDIT FIRM]`, `[AUDIT REPORT LINK]`

## Before mainnet, also change

- Terms §3 and §13, and the announcement's status lines: from "testnet only,
  not externally audited" to the real mainnet status — only once both are
  true.
- Terms §9: if a slasher is ever appointed, rewrite the slashing paragraph
  first.
- Privacy §3: drop any provider that is not really used.
