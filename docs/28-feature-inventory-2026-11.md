# 28 — Feature inventory against every promise, 2026-11-09

**Purpose.** One table per place where Pactora promised a feature, with the
state of each promise in the code on branch `human-work` as of today, where
the evidence is, what is missing and whose work it is. Then the features a
marketplace user expects that nobody planned, the submission rules of
[docs/24 §1.1](24-near-hackathon.md), and the owner decisions
still open. Written for the hackathon submission (deadline 2026-11-14
23:59 UTC) and for whoever picks the work up after it.

**Date.** Checked on 2026-11-09 against the working trees of the four
`near/pactora-*-near` repos (contracts `25df5c3`, backend `05dcbbb` plus
today's uncommitted work, interface `bfc522a` plus today's uncommitted work,
docs `b089408`). While this was written the backend took commits `444cb74` (text search, status groups) and `7e82c3f` (listing events in the feed) and the interface took `86b08fb` (README pages table, docs pages); the CSP nonce and the listing templates were in the interface working tree, uncommitted.

**Status values.**

| Status | Meaning |
|---|---|
| done with test | the code is in the tree and a test in the tree exercises it; both are cited |
| done | the code is in the tree; the proof is a live run or a gate, not a unit test |
| partial | some of the promise is built; the "What is missing" cell says which part is not |
| missing | nothing in the tree does it |
| owner-blocked | needs a key, an account, money, a vendor or a decision only the owner can give |
| in progress, this round | other agents are building it today (2026-11-09); not in the working tree when checked |

**Evidence rule.** Every Evidence cell is one or more `repo path:line`
references in backticks. A script in the author's scratchpad opened each one
and checked that the file exists and the line is not blank; **617 citations (451 distinct)
were checked, 0 failed** (run at the end of writing, 2026-11-09). Later the
same day the docs were rewritten to describe the NEAR code only and docs
11, 12, 17–23 were withdrawn: rows that rested on those documents were
dropped or re-sourced from the code, and citations into the rewritten
documents (01, 05, 08, 24–27, STATUS, both READMEs) were re-mapped to the
new lines. Citations into `pactora-backend-near` and `pactora-interface-near`
were not re-checked after their later commits. Lines are
cited to implement or test the feature, not to mention it. `docs/04`, `06`,
`08`, `13` and `15` were being edited by another agent while this was
written, so their promises are named by section (§) in the Feature column
and never cited by line. Repo names are shortened nowhere: `pactora-docs-near`,
`pactora-contracts-near`, `pactora-backend-near`, `pactora-interface-near`.

Who column: **built** (before today, on `human-work`), **today** (another
agent, this round), **owner**, **future** (nobody is on it).

---

## 1. docs/01-idea.md

The product idea. Every promise in it is assessed.

| Feature | Status | Evidence (repo file:line) | What is missing | Who |
|---|---|---|---|---|
| Agent identity with a stake that makes it cost something (§2.1) | done with test | `pactora-contracts-near contracts/pactora/src/lib.rs:315` (`register_agent`); `pactora-contracts-near contracts/pactora/src/lib.rs:1180` (`min_stake` checked at hire); `pactora-contracts-near contracts/pactora/src/tests.rs:322` | — | built |
| Agent-to-agent payment bounded by contract-enforced per-task and daily caps (§2.2) | done with test | `pactora-contracts-near contracts/pactora/src/budget.rs:41`; `pactora-contracts-near contracts/pactora/src/lib.rs:430` (`set_caps`); `pactora-contracts-near contracts/pactora/src/tests.rs:370`; `pactora-contracts-near contracts/pactora/tests/sandbox.rs:344` | — | built |
| Escrow: funds locked until the job resolves, refund on reject/expiry (§2.3) | done with test | `pactora-contracts-near contracts/pactora/src/lib.rs:645` (`create_job`); `pactora-contracts-near contracts/pactora/src/lib.rs:756` (`approve`); `pactora-contracts-near contracts/pactora/src/lib.rs:847` (`expire_undelivered`); `pactora-contracts-near contracts/pactora/tests/sandbox.rs:233` | — | built |
| Direct-pay fast path below a threshold, only for a proven worker (§2.3) | done with test | `pactora-contracts-near contracts/pactora/src/lib.rs:897` (`direct_pay`); `pactora-backend-near apps/api/test/api.test.ts:296`; `pactora-backend-near apps/api/test/api.test.ts:316` | — | built |
| Reputation written only by settlement (§2.4) | done with test | `pactora-contracts-near contracts/pactora/src/lib.rs:1228` (`settle`); `pactora-contracts-near contracts/pactora/src/lib.rs:1310` (score sum); `pactora-contracts-near contracts/pactora/src/tests.rs:409`; `pactora-contracts-near contracts/pactora/src/tests.rs:989` (verdicts only for attributable endings) | — | built |
| A hiring agent optimises over price, score, success rate and capability (§2.4) | done with test | `pactora-backend-near apps/api/src/routes/agents.ts:546` (rank modes); `pactora-backend-near apps/api/test/api.test.ts:217`; `pactora-backend-near apps/api/test/skills.test.ts:85` (per-skill record) | — | built |
| The demo: one instruction, agents plan, hire, judge, pay, unattended (§6) | done with test | `pactora-backend-near scripts/demo.mjs:1235` (demo passes through the attack step); `pactora-backend-near packages/agent-core/test/orchestrator.test.ts:129`; `pactora-backend-near README.md:33` (`pnpm demo:local`, cached, no key) | a testnet run (the owner's account) | owner |
| MVP 1–6: register, browse, hire, deliver, settle, reputation, orchestrator (§7) | done with test | `pactora-backend-near apps/api/src/routes/agents.ts:398`; `pactora-backend-near apps/api/src/routes/agents.ts:148`; `pactora-backend-near apps/api/src/routes/jobs.ts:92`; `pactora-backend-near apps/api/src/routes/jobs.ts:294`; `pactora-backend-near apps/api/test/api.test.ts:114`; `pactora-backend-near apps/api/test/api.test.ts:168` | — | built |
| Registration checks the on-chain id before storing it (§7) | done with test | `pactora-backend-near apps/api/test/identity.test.ts:110`; `pactora-backend-near apps/api/test/identity.test.ts:132`; `pactora-backend-near apps/api/test/identity.test.ts:153` (refuses rather than trusts) | — | built |
| "Out of scope": price negotiation (§7) | done (superseded by listings with bids, docs/26 F4) | `pactora-backend-near apps/api/src/routes/listings.ts:800`; `pactora-backend-near apps/api/test/listings.test.ts:286` | — | built |
| "Out of scope": cryptographic result verification, slashing, cross-chain, a token (§7) | missing, by design | `pactora-docs-near docs/01-idea.md:272` | still out of scope | future |

## 2. docs/04-how-it-works.md

Sections §5.1b–§5.1j are the `human-work` features as built; §6, §7.3, §9.3
and §11 also promise or disclaim features. Line numbers of docs/04 are not
cited (it is being edited today).

| Feature | Status | Evidence (repo file:line) | What is missing | Who |
|---|---|---|---|---|
| §5.1b NEP-413 sign-in: challenge, full-access key check, 7-day bearer session, sign out one / all | done with test | `pactora-backend-near apps/api/src/routes/session.ts:94`; `pactora-backend-near apps/api/src/routes/session.ts:125`; `pactora-backend-near apps/api/src/routes/session.ts:211`; `pactora-backend-near apps/api/test/session.test.ts:137`; `pactora-backend-near apps/api/test/session.test.ts:167`; `pactora-backend-near apps/api/test/session.test.ts:201`; `pactora-interface-near e2e/people.spec.ts:118`; `pactora-interface-near e2e/people.spec.ts:154` | — | built |
| §5.1b expired sessions and challenges swept hourly | done | `pactora-backend-near apps/api/src/app.ts:123` | — | built |
| §5.1b two credentials never interchangeable (`WRONG_CREDENTIAL`) | done with test | `pactora-backend-near apps/api/src/auth.ts:84`; `pactora-backend-near apps/api/src/auth.ts:178`; `pactora-backend-near apps/api/test/roles.test.ts:908` (every route × 19 user types) | — | built |
| §5.1b person registration: `register_agent` + `accept_wallet` from the wallet, `kind = 'person'`, no API key | done with test | `pactora-backend-near apps/api/src/routes/people.ts:57`; `pactora-backend-near packages/db/src/schema.ts:61`; `pactora-interface-near e2e/people.spec.ts:204`; `pactora-interface-near e2e-live/live.spec.ts:212` | — | built |
| §5.1b "Not enforced yet": API key scopes | missing | `pactora-backend-near apps/api/src/auth.ts:62` (scopes carried, never checked) | scope enforcement; rotate/re-issue keys would need scopes first | future |
| §5.1c prepare → sign → confirm for a person's accept, submit, approve, dispute, cancel, create | done with test | `pactora-backend-near apps/api/src/routes/person-actions.ts:36`; `pactora-backend-near apps/api/src/routes/person-actions.ts:207`; `pactora-backend-near apps/api/src/routes/person-actions.ts:291`; `pactora-backend-near apps/api/test/person-actions.test.ts:131`; `pactora-backend-near apps/api/test/person-actions.test.ts:195`; `pactora-backend-near apps/api/test/person-actions.test.ts:224` | a person cannot decline an offered job (no `decline` action) | today |
| §5.1c the browser refuses an unexpected call before the wallet opens (audit I1) | done with test | `pactora-interface-near lib/wallet-guard.ts:69`; `pactora-interface-near lib/wallet-guard.ts:119`; `pactora-interface-near e2e/audit.spec.ts:136` | — | built |
| §5.1c result mismatch flagged, approval refused for everyone | done with test | `pactora-backend-near apps/api/test/person-actions.test.ts:277`; `pactora-backend-near apps/api/test/person-actions.test.ts:367` | — | built |
| §5.1c `GET /v1/me`: earnings from settled jobs only | done with test | `pactora-backend-near apps/api/src/routes/me.ts:28`; `pactora-backend-near apps/api/test/person-actions.test.ts:393`; `pactora-interface-near app/me/page.tsx:1` | — | built |
| §5.1d listings: fields, category, interaction mode, deadline ≤ 90 days, windows within the contract maxima, idempotency | done with test | `pactora-backend-near apps/api/src/routes/listings.ts:80`; `pactora-backend-near apps/api/src/routes/listings.ts:432`; `pactora-backend-near apps/api/test/listings.test.ts:182`; `pactora-backend-near apps/api/test/listings.test.ts:231`; `pactora-backend-near apps/api/test/listings.test.ts:239`; `pactora-interface-near e2e/jobs.spec.ts:128` | — | built |
| §5.1d budget reservation `maxWorkers × ceiling` against the on-chain purse | done with test | `pactora-backend-near apps/api/src/routes/listings.ts:408`; `pactora-backend-near apps/api/test/listings.test.ts:254`; `pactora-backend-near apps/api/test/listings.test.ts:268` | the reservation is a check, not an on-chain lock (stated) | built |
| §5.1d bids: ≤ ceiling, one live, 3 per applicant, 1000 per listing, `reopenable` flag, applicants never see each other | done with test | `pactora-backend-near apps/api/src/routes/listings.ts:310`; `pactora-backend-near apps/api/test/listings.test.ts:297`; `pactora-backend-near apps/api/test/listings.test.ts:309`; `pactora-backend-near apps/api/test/listings.test.ts:322`; `pactora-backend-near apps/api/test/roles.test.ts:1074` | — | built |
| §5.1d selecting fills `listing_slots`; N selections → N 1:1 jobs | done with test | `pactora-backend-near apps/api/src/routes/listings.ts:255`; `pactora-backend-near apps/api/src/routes/listings.ts:1129`; `pactora-backend-near apps/api/test/roles.test.ts:1074`; `pactora-interface-near e2e-live/live.spec.ts:285` | — | built |
| §5.1d instant mode: first claimer wins under a row lock | done with test | `pactora-backend-near apps/api/src/routes/listings.ts:1191`; `pactora-backend-near apps/api/test/listings.test.ts:705`; `pactora-backend-near apps/api/test/listings.test.ts:725` | — | built |
| §5.1d matching: skills overlap and city-first location, TypeScript and SQL kept identical | done with test | `pactora-backend-near apps/api/src/matching.ts:51`; `pactora-backend-near apps/api/src/matching.ts:74`; `pactora-backend-near apps/api/test/matching.test.ts:81`; `pactora-interface-near e2e/jobs.spec.ts:76` | availability toggle and profile skills/location fields on the person profile | today |
| §5.1d MCP listing tools (`post_listing`, `list_applications`, `decide_application`, `close_`, `reopen_`) | done with test | `pactora-backend-near apps/mcp/src/tools.ts:257`; `pactora-backend-near apps/mcp/src/tools.ts:313`; `pactora-backend-near apps/mcp/test/tools.test.ts:88` | — | built |
| §5.1e evidence photos: magic bytes, 8 MiB, 10/30, metadata stripped, S3 with SSE, 503 never silent | done with test | `pactora-backend-near apps/api/src/routes/files.ts:242`; `pactora-backend-near apps/api/src/images.ts:48`; `pactora-backend-near packages/storage/src/index.ts:78`; `pactora-backend-near apps/api/test/evidence.test.ts:258`; `pactora-backend-near apps/api/test/evidence.test.ts:297`; `pactora-backend-near apps/api/test/evidence.test.ts:311`; `pactora-backend-near apps/api/test/evidence.test.ts:323`; `pactora-backend-near apps/api/test/evidence.test.ts:377`; `pactora-interface-near e2e/delivery.spec.ts:28` | — | built |
| §5.1e drafts: immutable snapshot, 4 rounds, review written once per hash, stale hash 409, every check met to accept | done with test | `pactora-backend-near apps/api/src/routes/drafts.ts:127`; `pactora-backend-near apps/api/src/routes/drafts.ts:208`; `pactora-backend-near apps/api/test/evidence.test.ts:428`; `pactora-backend-near apps/api/test/evidence.test.ts:488`; `pactora-interface-near e2e/delivery.spec.ts:92`; `pactora-interface-near e2e/delivery.spec.ts:129` | — | built |
| §5.1e the accepted snapshot's hash is the on-chain `result_hash` | done with test | `pactora-backend-near scripts/demo.mjs:628` (live check 8b on the sandbox); `pactora-interface-near e2e/delivery.spec.ts:155`; `pactora-interface-near e2e-live/live.spec.ts:357` | — | built |
| §5.1e chat: two parties, 100 messages, untrusted model input, injection changes nothing | done with test | `pactora-backend-near apps/api/src/routes/messages.ts:61`; `pactora-backend-near apps/api/test/evidence.test.ts:402`; `pactora-backend-near packages/agent-core/test/injection.test.ts:63`; `pactora-backend-near scripts/demo.mjs:628` | — | built |
| §5.1e worker and delivery MCP tools (`get_evidence`, `review_job`, `send_message`, `list_jobs`, `accept_job`, `submit_draft`, `submit_result`, `decline_job`) | done with test | `pactora-backend-near apps/mcp/src/tools.ts:361`; `pactora-backend-near apps/mcp/src/tools.ts:383`; `pactora-backend-near apps/mcp/src/tools.ts:500`; `pactora-backend-near apps/mcp/src/tools.ts:567`; `pactora-backend-near apps/mcp/test/tools.test.ts:129` | — | built |
| §5.1f one feed per agent with no gaps, from a trigger on `job_events`; long-poll; MCP `get_updates` | done with test | `pactora-backend-near packages/db/migrations/0018_agent_events_webhooks_faucet.sql:12`; `pactora-backend-near apps/api/src/routes/agent-events.ts:92`; `pactora-backend-near apps/api/test/events.test.ts:123`; `pactora-backend-near apps/api/test/events.test.ts:145`; `pactora-backend-near apps/api/test/events.test.ts:191`; `pactora-backend-near scripts/demo.mjs:793` | listing and bid events: landed today, backend commit `7e82c3f` (`pactora-backend-near apps/api/src/agent-events.ts:1`; `pactora-backend-near apps/api/test/listing-events.test.ts:117`; `pactora-backend-near packages/db/migrations/0024_listing_events.sql:1`) | today (landed) |
| §5.1f webhooks: sealed secrets, SKIP LOCKED pool, no redirects, public addresses only, 8 tries, hook disabled after 10 | done with test | `pactora-backend-near apps/api/src/routes/webhooks.ts:73`; `pactora-backend-near apps/notifier/src/notifier.ts:81`; `pactora-backend-near apps/notifier/test/notifier.test.ts:106`; `pactora-backend-near apps/notifier/test/notifier.test.ts:142`; `pactora-backend-near apps/notifier/test/notifier.test.ts:197`; `pactora-backend-near apps/notifier/test/notifier.test.ts:209`; `pactora-backend-near packages/sdk/src/index.ts:1246` (`verifyWebhook`) | — | built |
| §5.1f notifications: unread count, forward-only read mark, `/notifications` | done with test | `pactora-backend-near apps/api/src/routes/agent-events.ts:113`; `pactora-backend-near apps/api/src/routes/agent-events.ts:146`; `pactora-backend-near apps/api/test/events.test.ts:220`; `pactora-interface-near components/market/NotificationsBell.tsx:43`; `pactora-interface-near e2e/notifications.spec.ts:18` | — | built |
| §5.1f faucet: separate float account, never the token owner, once per account per day | done with test | `pactora-backend-near apps/api/src/routes/faucet.ts:83`; `pactora-backend-near apps/signer/test/faucet.test.ts:33`; `pactora-backend-near apps/signer/test/faucet.test.ts:39`; `pactora-backend-near apps/api/test/events.test.ts:352`; `pactora-backend-near scripts/demo.mjs:882`; `pactora-interface-near e2e/notifications.spec.ts:81` | no standing check (STATUS "Known, not fixed") | today |
| §5.1g opt-in public profiles, directory with search/sort/20 a page, OG metadata | done with test | `pactora-backend-near apps/api/src/routes/profiles.ts:170`; `pactora-backend-near apps/api/src/routes/profiles.ts:245`; `pactora-backend-near apps/api/test/profiles.test.ts:94`; `pactora-backend-near apps/api/test/profiles.test.ts:145`; `pactora-interface-near app/people/[id]/page.tsx:17`; `pactora-interface-near e2e/profiles.spec.ts:22`; `pactora-interface-near e2e/profiles.spec.ts:82` | skills, location and an availability toggle on the profile | today |
| §5.1g two-way blind reviews of settled work, 14 days, ratings computed on read | done with test | `pactora-backend-near apps/api/src/routes/profiles.ts:337`; `pactora-backend-near apps/api/test/profiles.test.ts:187`; `pactora-backend-near apps/api/test/profiles.test.ts:245`; `pactora-backend-near apps/api/test/profiles.test.ts:302`; `pactora-interface-near e2e/profiles.spec.ts:107`; `pactora-interface-near e2e/profiles.spec.ts:132`; `pactora-backend-near scripts/demo.mjs:830` | — | built |
| §5.1g moderation hides a review, kept and audited | done with test | `pactora-backend-near apps/api/src/routes/admin.ts:455`; `pactora-backend-near apps/api/test/admin.test.ts:339`; `pactora-backend-near apps/api/test/profiles.test.ts:288` | — | built |
| §5.1h sanctions lists OFAC, UN, UK with refresh guards; Jaro-Winkler two-pass matcher | done with test | `pactora-backend-near packages/compliance/src/lists.ts:61`; `pactora-backend-near packages/compliance/src/lists.ts:148`; `pactora-backend-near packages/compliance/src/lists.ts:184`; `pactora-backend-near packages/compliance/src/match.ts:24`; `pactora-backend-near packages/compliance/test/compliance.test.ts:98`; `pactora-backend-near packages/compliance/test/compliance.test.ts:103`; `pactora-backend-near apps/api/test/kyc.test.ts:126`; `pactora-backend-near apps/api/test/kyc.test.ts:141`; `pactora-backend-near scripts/sanctions-refresh.mjs:1` | the EU list (its file needs a token) | owner-blocked |
| §5.1h NEAR wallet screening | missing, stated as not available | `pactora-docs-near docs/26-human-work-integration-plan.md:18` (no list names a NEAR address) | a provider that screens NEAR accounts (TRM Labs claims it); the API says `walletScreening: "not available"` | future |
| §5.1h the 0.92 threshold misses "Erik"/"Eric" | owner-blocked | `pactora-backend-near packages/compliance/test/compliance.test.ts:98` (pins the behaviour); `pactora-docs-near docs/STATUS.md:94` | a decision on the trade-off | owner |
| §5.1h identity checks behind `IdentityProvider`; webhook only triggers a re-read; sweep polls | done with test (simulated provider only) | `pactora-backend-near apps/api/src/routes/kyc.ts:191`; `pactora-backend-near apps/api/src/routes/kyc.ts:291`; `pactora-backend-near apps/api/test/kyc.test.ts:181`; `pactora-backend-near apps/api/test/kyc.test.ts:280`; `pactora-backend-near apps/api/test/kyc.test.ts:309`; `pactora-backend-near apps/api/test/kyc.test.ts:334`; `pactora-interface-near e2e/identity.spec.ts:20` | a vendor adapter (docs/26 D3) | owner-blocked |
| §5.1h compliance cases: two reviewers clear a strong match, nobody decides their own case, `confirm` blocks | done with test | `pactora-backend-near apps/api/src/routes/kyc.ts:359`; `pactora-backend-near apps/api/test/kyc.test.ts:241`; `pactora-backend-near apps/api/test/kyc.test.ts:381`; `pactora-interface-near e2e-live/live.spec.ts:470` | — | built |
| §5.1h standing is a soft gate: API refuses post/apply/claim/accept/select, keeper skips, signer refuses `approve` | done with test | `pactora-backend-near apps/api/src/compliance.ts:185`; `pactora-backend-near apps/api/src/routes/listings.ts:435`; `pactora-backend-near apps/api/src/routes/jobs.ts:95`; `pactora-backend-near apps/api/src/routes/jobs.ts:274`; `pactora-backend-near apps/signer/src/keeper.ts:252`; `pactora-backend-near apps/signer/src/signer.ts:808`; `pactora-backend-near apps/api/test/roles.test.ts:1124`; `pactora-backend-near scripts/demo.mjs:1077` (8h, live) | a hard hold: `auto_approve` is permissionless on chain; needs a contract change | future (contract frozen at 1.1.0) |
| §5.1h `compliance_audit` is append-only in the database | done with test | `pactora-backend-near packages/db/migrations/0020_identity_sanctions_trigger_constraints.sql:43`; `pactora-backend-near apps/api/test/kyc.test.ts:437` | — | built |
| §5.1h retention: pending checks expire at 30 days, rejected/expired deleted at 90 | done with test | `pactora-backend-near apps/api/src/routes/kyc.ts:122`; `pactora-backend-near apps/api/test/kyc.test.ts:334` | a purge job for chat, evidence and compliance cases (F27 "rest") | today |
| §5.1i admin role read from the chain on every request; 1-hour sign-in rule | done with test | `pactora-backend-near apps/api/src/routes/admin.ts:276`; `pactora-backend-near apps/api/test/admin.test.ts:143`; `pactora-backend-near apps/api/test/admin.test.ts:158`; `pactora-backend-near apps/api/test/admin.test.ts:170`; `pactora-backend-near apps/api/test/admin.test.ts:191` | — | built |
| §5.1i dispute desk: evidence hash, `add_proposal` and `act_proposal` built for the member's own wallet, stale hash refused | done with test | `pactora-backend-near apps/api/src/routes/admin.ts:330`; `pactora-backend-near apps/api/src/routes/admin.ts:410`; `pactora-backend-near apps/api/test/admin.test.ts:229`; `pactora-backend-near apps/api/test/admin.test.ts:263`; `pactora-backend-near scripts/demo.mjs:930` (8g, real Sputnik DAO); `pactora-interface-near e2e/admin.spec.ts:13`; `pactora-interface-near e2e-live/live.spec.ts:541` | — | built |
| §5.1i a council member who is a party recuses | done | `pactora-backend-near apps/api/src/routes/admin.ts:181` | the DAO itself cannot tell who is a party (stated) | built |
| §5.1j Telegram: code + browser number, 3 wrong cancel, 5 bad codes lock 15 min across restarts, outbox scrub, bot never spends | done with test, unverified live | `pactora-backend-near apps/channels/src/channels.ts:28`; `pactora-backend-near apps/channels/src/channels.ts:84`; `pactora-backend-near apps/channels/test/channels.test.ts:79`; `pactora-backend-near apps/channels/test/channels.test.ts:115`; `pactora-backend-near apps/channels/test/channels.test.ts:160`; `pactora-backend-near apps/channels/test/channels.test.ts:202`; `pactora-backend-near apps/api/src/routes/channels.ts:89`; `pactora-interface-near e2e/channels.spec.ts:14` | a real bot token for one live acceptance test | owner-blocked |
| §5.1j email: 6-digit code, 3 wrong cancel, counted before refusal | done with test, fake provider only | `pactora-backend-near apps/api/src/routes/channels.ts:109`; `pactora-backend-near apps/api/src/routes/channels.ts:135`; `pactora-backend-near apps/api/test/channels.test.ts:93`; `pactora-interface-near e2e/channels.spec.ts:24` | an email provider | owner-blocked |
| §6 MCP server: 25 tools over stdio | done with test | `pactora-backend-near apps/mcp/src/tools.ts:74`; `pactora-backend-near apps/mcp/test/tools.test.ts:88` | remote MCP over HTTP (docs/26 F22 "later"); the backend README still says "Nine MCP tools" at `pactora-backend-near README.md:114` | today |
| §7.3 prompt-injection containment: results delimited as data, caps outside the model, schema check before the model | done with test | `pactora-backend-near packages/agent-core/test/injection.test.ts:63`; `pactora-backend-near packages/agent-core/test/orchestrator.test.ts:169`; `pactora-backend-near apps/api/test/chaos.test.ts:138`; `pactora-backend-near scripts/demo.mjs:1235`; `pactora-backend-near scripts/demo.mjs:1284` (stolen key, refused by the chain) | — | built |
| §9.3 "not solved": result quality not verified; disputes decided by people (the DAO); keeper single; fast path writes feedback before work; no cross-chain | missing, by design, disclosed | `pactora-contracts-near contracts/pactora/src/lib.rs:799` (arbiter rules); `pactora-contracts-near contracts/pactora/src/lib.rs:897` (direct pay rates at payment) | keep the disclosure in the submission | future |
| §11 open: reputation decay; per-epoch batching; who pays the fee | missing (decay, batching); done (worker pays) | `pactora-contracts-near contracts/pactora/src/lib.rs:1215` (`fee_of`, taken from the payout); `pactora-contracts-near contracts/pactora/src/tests.rs:650` | decay and batching are unplanned (see §13) | future |

## 3. docs/05-roadmap.md

| Feature | Status | Evidence (repo file:line) | What is missing | Who |
|---|---|---|---|---|
| P0 register, discover, hire, deliver, settle, reputation (`pactora-docs-near docs/05-roadmap.md:68`) | done with test | see §1 rows 1–8; `pactora-contracts-near contracts/pactora/tests/sandbox.rs:233` | — | built |
| P0 orchestrator running the demo unattended (`:69`) | done with test | `pactora-backend-near packages/agent-core/test/orchestrator.test.ts:129`; `pactora-backend-near scripts/demo.mjs:524` | — | built |
| P0 live demo page (`:70`) | done with test | `pactora-interface-near app/demo/page.tsx:1`; `pactora-interface-near e2e/edge.spec.ts:49` | hosted demo (Vercel/Vultr) | owner-blocked |
| P1 escrow path (`:71`) | done with test | `pactora-contracts-near contracts/pactora/src/lib.rs:645`; `pactora-contracts-near contracts/pactora/tests/sandbox.rs:233` | — | built |
| P1 on-chain policy caps (`:72`) | done with test | `pactora-contracts-near contracts/pactora/src/budget.rs:41`; `pactora-contracts-near contracts/pactora/src/tests.rs:370`; `pactora-contracts-near contracts/pactora/src/tests.rs:436` (bonds count against caps) | — | built |
| P2 dispute + arbiter resolution (`:73`) | done with test | `pactora-contracts-near contracts/pactora/src/lib.rs:775`; `pactora-contracts-near contracts/pactora/src/lib.rs:799`; `pactora-contracts-near contracts/pactora/src/tests.rs:568`; `pactora-contracts-near contracts/pactora/tests/adversarial.rs:2008` (a real Sputnik DAO) | — | built |
| P2 agent profile page (`:74`) | done | `pactora-interface-near app/agents/[id]/page.tsx:1` | — | built |
| P3 staking UI (`:75`) | done | `pactora-interface-near app/agents/[id]/manage/page.tsx:1`; `pactora-interface-near e2e-live/live.spec.ts:88` (fund/stake through the page, live) | — | built |
| P3 score-over-time chart (`:76`) | missing | `pactora-docs-near docs/05-roadmap.md:76` | the chart; the data exists in `job_events` | future |
| P3 four ranking modes (`:77`) | done with test | `pactora-backend-near apps/api/src/routes/agents.ts:546`; `pactora-backend-near apps/api/test/api.test.ts:217`; `pactora-interface-near README.md:74` | — | built |
| Trust: optimistic verification, staked challengers (`:126`) | missing | — | the question "what is re-checkable" first | future |
| P2 the arbiter is a multisig, not a single key (`:73`) | done with test | `pactora-contracts-near contracts/pactora/src/lib.rs:255` (`set_arbiter`); `pactora-contracts-near scripts/verify-near.mjs:291` (`--dao`); `pactora-contracts-near contracts/pactora/tests/adversarial.rs:2008` | — | built |
| Scale: per-epoch netting (`:127`) | missing | `pactora-docs-near docs/05-roadmap.md:127` | a netting design; nothing started | future |
| Open network: permissionless onboarding, public SDK (`:128`) | done | `pactora-interface-near app/register/page.tsx:1`; `pactora-backend-near packages/sdk/src/index.ts:423` (`PactoraClient`) | capability taxonomy; streaming/subscription pricing | future |
| Compliance audit-log export (`:120`) | missing | `pactora-docs-near docs/05-roadmap.md:120` | the export | future |

## 4. Operations readiness

What a production marketplace needs to run, checked against the NEAR
backend and its `deploy/vps` recipe.

| Feature | Status | Evidence (repo file:line) | What is missing | Who |
|---|---|---|---|---|
| Alerting | done, checked locally | `pactora-backend-near deploy/vps/alerts.sh:10`; `pactora-backend-near deploy/vps/alerts.sh:13`; `pactora-backend-near deploy/vps/alerts.sh:23` | a server and `ALERT_WEBHOOK_URL` | owner-blocked |
| Error tracking | missing | — (pino logs only, `pactora-backend-near apps/api/src/app.ts:123` area) | a sink (Sentry or similar) and a decision to send errors off-host | future |
| Dashboards | partial | `pactora-interface-near app/status/page.tsx:1`; `pactora-backend-near apps/api/src/routes/status.ts:260`; `pactora-backend-near apps/api/test/status.test.ts:69` | metrics dashboards; `/metrics` exists but is 404 at the edge (`pactora-backend-near deploy/vps/Caddyfile:8`) | owner |
| Off-server backup copies | done, checked locally | `pactora-backend-near deploy/vps/backup.sh:2`; `pactora-backend-near deploy/vps/backup-lib.test.sh:1` | `BACKUP_REMOTE` and a monthly restore test on the server | owner-blocked |
| Retention (`job_events`, `run_events`, `signer_txs`) | partial | `pactora-backend-near apps/api/src/routes/kyc.ts:122` (identity checks); `pactora-backend-near apps/channels/src/channels.ts:399` (inbox rows) | a purge for chat, evidence, compliance cases and those three tables | today |
| Staging environment | missing | — | a second stack; `docker-compose.full.yml` runs the production shape locally | owner |
| OpenAPI | done with test | `pactora-backend-near apps/api/src/app.ts:320`; `pactora-backend-near apps/api/test/openapi.test.ts:73` | — | built |
| SSE event ids and resume | done with test | `pactora-backend-near apps/api/test/sse-resume.test.ts:92`; `pactora-backend-near apps/api/test/sse-resume.test.ts:98` | — | built |
| Key management endpoints | done with test | `pactora-backend-near apps/api/src/routes/keys.ts:56`; `pactora-backend-near apps/api/src/routes/keys.ts:114`; `pactora-backend-near apps/api/test/keys.test.ts:84`; `pactora-backend-near apps/api/test/keys.test.ts:119` | sessions are not revoked when the owner re-issues a key (docs/27 B info) | today |
| Wallet balance monitoring | done with test | `pactora-backend-near apps/signer/src/wallets.ts:80`; `pactora-backend-near apps/signer/test/keys-dos.test.ts:29` | — | built |
| Reindex tooling | partial | `pactora-backend-near apps/indexer/src/main.ts:91` (`INDEXER_START_AT_HEAD`) | a check for a start block the RPC has garbage-collected on a non-archival testnet node (STATUS) | future |
| Uptime monitor on `/v1/status` | owner-blocked | `pactora-backend-near apps/api/src/routes/status.ts:260` | the monitor | owner |
| `METRICS_TOKEN` | owner-blocked | `pactora-backend-near deploy/vps/Caddyfile:8` | the token, if metrics are scraped | owner |
| Release tags and a changelog | owner-blocked | `pactora-contracts-near wasm/SHA256SUMS:1` (contract releases carry hashes) | tags on the backend and interface | owner |
| Agent key rotation | done with test | `pactora-backend-near apps/api/src/routes/keys.ts:56`; `pactora-backend-near apps/api/test/keys.test.ts:84` | — | built |
| A gate on registration | in progress, this round | `pactora-backend-near apps/api/src/routes/agents.ts:326` (wallet-key route rate-limited since the audit) | a per-owner agent cap | today |
| RPO/RTO targets | owner-blocked | `pactora-backend-near deploy/vps/backup.sh:2` (daily; 7 days kept) | the targets, written down | owner |

## 5. Hardening and verification

What the contract and the backend must hold before real money, checked
against the code.

| Feature | Status | Evidence (repo file:line) | What is missing | Who |
|---|---|---|---|---|
| Optimistic verification | missing | — | see §3 v0.2 | future |
| TEE attestation of the judge (NEAR AI Cloud) | partial | `pactora-backend-near packages/agent-core/src/providers/near-ai.ts:18`; `pactora-backend-near packages/agent-core/test/near-ai.test.ts:57`; `pactora-backend-near packages/shared/src/judge-env.ts:25`; `pactora-docs-near docs/24-near-hackathon.md:131` (the signature recipe) | verification of the response signature against the attestation, and storing the verdict hash with the ruling; one live call needs `NEAR_AI_API_KEY` | today + owner |
| Pauser role: stops new jobs, never an exit | done with test | `pactora-contracts-near contracts/pactora/src/lib.rs:263`; `pactora-contracts-near contracts/pactora/src/lib.rs:293`; `pactora-contracts-near contracts/pactora/src/tests.rs:610` | — | built |
| No hot key holds a role off testnet (arbiter = DAO) | done with test | `pactora-contracts-near contracts/pactora/src/lib.rs:255`; `pactora-contracts-near contracts/pactora/tests/adversarial.rs:1732` | the contract account's full-access key still governs upgrades (docs/27 C8); remove or DAO-gate before mainnet | owner |
| Keys in KMS | done with test | `pactora-backend-near apps/signer/src/kms.ts:1`; `pactora-backend-near apps/signer/test/kms.test.ts:50` | a KMS account | owner |
| Config guards with a refuse-to-start suite | done with test | `pactora-backend-near scripts/test-startup.mjs:56`; `pactora-docs-near docs/STATUS.md:296` (40 refused) | — | built |
| An upgrade path | done with test | `pactora-contracts-near contracts/pactora/src/lib.rs:184` (`migrate`); `pactora-contracts-near contracts/pactora/tests/adversarial.rs:2198` | — | built |
| Dependencies audited | done | `pactora-docs-near docs/27-audit-2026-11.md:299` | vitest 5 (dev-only advisories) | future |
| External audit before mainnet | owner-blocked | `pactora-docs-near docs/27-audit-2026-11.md:436` | the auditor | owner |

## 6. Launch and mainnet

The steps between the hackathon and a public launch. **No NEAR mainnet
procedure is written yet; it is future work.** Standing rule: testnet only;
any mainnet action needs the owner's explicit confirmation, per action.

| Feature | Status | Evidence (repo file:line) | What is missing | Who |
|---|---|---|---|---|
| Trademark search, buy the domain, claim the handles | owner-blocked | — | all three | owner |
| Code identifiers renamed to Pactora | done | `pactora-backend-near README.md:115` (`@pactora/*` packages); `pactora-interface-near README.md:3` | — | built |
| Repo and folder names | done (as `pactora-*-near`) | `pactora-docs-near README.md:37` | — | built |
| Terms of service and privacy policy | partial (drafts with placeholders) | `pactora-interface-near app/terms/page.tsx:1`; `pactora-interface-near app/privacy/page.tsx:295` | legal review; the placeholders | owner |
| Hosting costs, launch announcement, the video | owner-blocked | `pactora-docs-near docs/launch/launch-announcement.md:1` (the draft) | decisions | owner |
| A NEAR mainnet procedure: a `near:mainnet` entry in `pactora-contracts-near config/networks.json` and a `config/params.mainnet.json`; the contracts README flow (`create-dao.mjs`, `deploy.mjs`, `verify-near.mjs`) allowed on mainnet, writing `deployments/mainnet.json` for the backend's `chain/`; the backend on `ENABLED_CHAINS=near:mainnet`; the signer on `SIGNER_KMS_KEYS` / `KEEPER_KMS_KEY_ID` (AWS KMS `ECC_NIST_EDWARDS25519`); ownership handed to the DAO and the deployer's key removed from the contract account; an external audit; then a written checklist | missing | `pactora-contracts-near scripts/deploy.mjs:46` (params per network slug); `pactora-backend-near apps/signer/src/kms.ts:1` | all of it; every script refuses mainnet today | future (owner) |

## 7. docs/24-near-hackathon.md, §1.4, §1.5 plan and §5 status

| Feature | Status | Evidence (repo file:line) | What is missing | Who |
|---|---|---|---|---|
| §1.5 5–7 Nov Rust contract: jobs, bonds, reputation, rolling caps; unit + sandbox tests; **deploy to testnet** (`pactora-docs-near docs/24-near-hackathon.md:82`) | done with test; testnet deploy owner-blocked | `pactora-contracts-near contracts/pactora/src/lib.rs:645`; `pactora-contracts-near contracts/pactora/src/tests.rs:1236` (property test); `pactora-contracts-near contracts/pactora/tests/sandbox.rs:233`; `pactora-contracts-near deployments/sandbox.json:1` (the only deployment file) | `deployments/testnet.json`; needs `DEPLOYER_ACCOUNT_ID` / `DEPLOYER_SECRET_KEY` | owner |
| §1.5 8–9 Nov backend chain adapter: signer with function-call keys, indexer, chain reads, sub-accounts (`:83`) | done with test | `pactora-backend-near apps/signer/src/signer.ts:42`; `pactora-backend-near apps/signer/test/signer.test.ts:299` (full-access key refused); `pactora-backend-near apps/indexer/src/indexer.ts:163`; `pactora-backend-near apps/indexer/test/events.test.ts:86`; `pactora-interface-near lib/wallet.ts:188` | — | built |
| §1.5 10–11 Nov judge on NEAR AI Cloud with attestation recorded (`:84`) | partial | `pactora-backend-near packages/agent-core/src/providers/near-ai.ts:18`; `pactora-backend-near packages/agent-core/test/near-ai.test.ts:57`; `pactora-backend-near README.md:150` | signature/attestation verification (today); a live call with the owner's key to capture real fixtures (`pactora-docs-near docs/STATUS.md:424`) | today + owner |
| §1.5 Sputnik DAO arbiter (`:84`) | done with test | `pactora-contracts-near contracts/pactora/tests/adversarial.rs:2008`; `pactora-contracts-near scripts/verify-near.mjs:291`; `pactora-backend-near scripts/demo.mjs:930` | a DAO on testnet (`create-dao.mjs --network testnet`, owner's account) | owner |
| §1.5 trust verdict allow/warn/block enforced at hire (`:84`) | done with test | `pactora-backend-near apps/api/src/routes/agents.ts:286`; `pactora-backend-near packages/db/src/trust.ts:41`; `pactora-backend-near apps/api/test/api.test.ts:455`; `pactora-backend-near apps/api/test/api.test.ts:486`; `pactora-backend-near apps/mcp/src/tools.ts:140` | — | built |
| §1.5 prompt-injection attack demo (`:84`) | done with test | `pactora-backend-near scripts/demo.mjs:1235`; `pactora-backend-near scripts/demo.mjs:1247`; `pactora-backend-near scripts/demo.mjs:1301` | — | built |
| §1.5 12 Nov optional Intents payout (dry quote), Agent Market listing (`:85`) | missing (optional) | `pactora-docs-near docs/24-near-hackathon.md:154` | Intents is mainnet-only (per-action owner OK); the listing needs the owner's account | owner |
| §1.5 13 Nov README "do X → see Y", one-command cached demo, diff link, LICENSE (`:86`) | done | `pactora-contracts-near README.md:141`; `pactora-backend-near README.md:33`; `pactora-backend-near README.md:15`; `pactora-interface-near README.md:31`; `pactora-docs-near README.md:13`; `pactora-backend-near LICENSE:1` | the testnet addresses in the READMEs (after the deploy) | owner |
| §1.5 13 Nov tags, hosted demo up to 25 Nov (`:86`) | owner-blocked | `pactora-docs-near docs/24-near-hackathon.md:156` | `hackathon-submission` tag in all four repos; Vultr + Vercel | owner |
| §1.5 14 Nov video, X post, form (`:87`) | owner-blocked | `pactora-docs-near docs/25-near-submission.md:124` | all three | owner |
| §1.4 function-call access keys scoped to one contract (`:67`) | done with test | `pactora-contracts-near contracts/pactora/tests/sandbox.rs:344`; `pactora-backend-near apps/signer/test/signer.test.ts:307` | — | built |
| §1.4 one sub-account per agent (`:68`) | done with test | `pactora-interface-near lib/wallet.ts:188`; `pactora-interface-near e2e/connect.spec.ts:73`; `pactora-interface-near e2e-live/live.spec.ts:126` | — | built |
| §1.4 NEAR AI Cloud judge with signed verdict hash stored with the ruling (`:69`) | partial | see §1.5 10–11 Nov row | the verdict hash is not stored on chain or with the ruling | today + owner |
| §1.4 NEAR Intents / 1Click, Agent API / PingPay, OutLayer / Shade (`:71`, `:72`) | missing (optional / skipped) | `pactora-docs-near docs/24-near-hackathon.md:71` | — | owner / future |
| §5 interface on NEAR (`:151`) | done with test | `pactora-interface-near e2e/a11y.spec.ts:52`; `pactora-interface-near e2e/user-agents.spec.ts:1`; `pactora-interface-near e2e-live/live.spec.ts:673` | — | built |

## 8. docs/25-near-submission.md §5 "Before you submit"

| Feature | Status | Evidence (repo file:line) | What is missing | Who |
|---|---|---|---|---|
| Run on testnet: `create-dao`, `deploy`, `verify-near` (`pactora-docs-near docs/25-near-submission.md:120`) | owner-blocked | `pactora-contracts-near scripts/verify-near.mjs:291`; `pactora-docs-near docs/STATUS.md:418` | the funded account in `.env` | owner |
| Testnet addresses in the READMEs, tag `hackathon-submission` on `human-work`, push (`:121`, `:122`) | owner-blocked | `pactora-docs-near docs/25-near-submission.md:122` | follows the deploy | owner |
| Make all four repos public (`:123`) | owner-blocked (not verifiable from here) | `pactora-docs-near docs/25-near-submission.md:123` | D6 rights confirmation first (`pactora-docs-near docs/STATUS.md:97`) | owner |
| Video and X post (`:124`) | owner-blocked | `pactora-docs-near docs/25-near-submission.md:71` (the script) | recording; the demo output is the script | owner |
| Form: mainnet payout account, `website` empty (`:125`) | owner-blocked | `pactora-docs-near docs/25-near-submission.md:26` (the description text) | re-check figures against the testnet run | owner |
| Hosted demo up until 2026-11-18 (`:126`) | owner-blocked | `pactora-backend-near deploy/vps/Caddyfile:8` (the overlay is ready) | the server and `.env` (`pactora-docs-near docs/STATUS.md:421`) | owner |

## 9. docs/26-human-work-integration-plan.md, F1–F33 and §4

The plan's own status table is at `pactora-docs-near docs/26-human-work-integration-plan.md:3`. This table checks each feature against the code.

| Feature | Status | Evidence (repo file:line) | What is missing | Who |
|---|---|---|---|---|
| F1 sessions (`pactora-docs-near docs/26-human-work-integration-plan.md:175`) | done with test | `pactora-backend-near apps/api/src/routes/session.ts:125`; `pactora-backend-near apps/api/test/session.test.ts:167`; `pactora-backend-near apps/api/test/session.test.ts:174`; `pactora-backend-near apps/api/test/session.test.ts:185` | bearer instead of the planned cookie (design change, recorded in docs/04 §5.1b); key scopes still unenforced | built |
| F2 person role (`:212`) | done with test | `pactora-backend-near apps/api/src/routes/people.ts:57`; `pactora-contracts-near contracts/pactora/src/tests.rs:309` (`SameOwner` still blocks self-hire); `pactora-backend-near apps/signer/test/signer.test.ts:299`; `pactora-interface-near e2e-live/live.spec.ts:212` | live check on testnet | owner |
| F3 job pages and board, `/me`, server-side filters (`:250`) | done with test | `pactora-interface-near app/jobs/page.tsx:1`; `pactora-interface-near app/jobs/[id]/page.tsx:1`; `pactora-interface-near app/me/page.tsx:1`; `pactora-interface-near e2e/jobs.spec.ts:32`; `pactora-backend-near apps/api/test/pagination.test.ts:72` | text search (`q`) and status groups landed today in the API (`pactora-backend-near apps/api/src/routes/jobs.ts:40`; `pactora-backend-near apps/api/test/search.test.ts:139`); the board's search box is still to come | today (API landed) |
| F4 listings with bids (`:275`) | done with test | see §2 rows §5.1d | — | built |
| F5 multi-worker (`:334`) | done with test | `pactora-backend-near apps/api/src/routes/listings.ts:255`; `pactora-backend-near apps/api/test/roles.test.ts:1074` | — | built |
| F6-a instant mode (`:354`) | done with test | `pactora-backend-near apps/api/test/listings.test.ts:705` | — | built |
| F6 evidence (`:373`) | done with test | `pactora-backend-near apps/api/test/evidence.test.ts:258`; `pactora-backend-near scripts/demo.mjs:628` | — | built |
| F7 review with checks, revisions off chain (D2 = a) (`:417`) | done with test | `pactora-backend-near apps/api/src/routes/drafts.ts:208`; `pactora-backend-near apps/api/test/evidence.test.ts:488`; `pactora-contracts-near contracts/pactora/src/tests.rs:460` (`auto_approve` unchanged) | a contract `request_revision` (D2 = b) if off-chain rounds prove too tight | future |
| F8 chat (`:460`) | done with test | `pactora-backend-near apps/api/src/routes/messages.ts:61`; `pactora-backend-near apps/api/test/evidence.test.ts:402` | — | built |
| F9 events and webhooks (`:490`) | done with test | `pactora-backend-near apps/api/test/events.test.ts:145`; `pactora-backend-near apps/notifier/test/notifier.test.ts:209` | — | built |
| F10 notifications (`:527`) | done with test | `pactora-backend-near apps/api/test/events.test.ts:220`; `pactora-interface-near e2e/notifications.spec.ts:18` | "optional web push later" | future |
| F11 Telegram (`:537`) | done with test, unverified live | `pactora-backend-near apps/channels/test/channels.test.ts:115` | bot token | owner-blocked |
| F12 email (`:575`) | done with test, fake provider | `pactora-backend-near apps/api/test/channels.test.ts:93` | provider | owner-blocked |
| F13 KYC (`:585`) | done with test, simulated | `pactora-backend-near apps/api/test/kyc.test.ts:280` | vendor (D3) | owner-blocked |
| F14 sanctions and review queue (`:623`) | done with test | `pactora-backend-near apps/api/test/kyc.test.ts:381`; `pactora-backend-near apps/api/test/kyc.test.ts:172` (screening on with no list refuses to start) | EU list; NEAR wallet screening; hard payout hold | owner / future |
| F15 admin console and DAO desk (`:683`) | done with test | `pactora-backend-near apps/api/test/admin.test.ts:229`; `pactora-interface-near e2e/admin.spec.ts:13` | — | built |
| F16 profiles (`:717`) | done with test | `pactora-backend-near apps/api/test/profiles.test.ts:94` | skills, location, availability | today |
| F17 two-way reviews (`:733`) | done with test | `pactora-backend-near apps/api/test/profiles.test.ts:187` | ratings on read, not a trigger (recorded) | built |
| F18 matching (`:750`) | done with test | `pactora-backend-near apps/api/test/matching.test.ts:81` | availability toggle | today |
| F19 owner funding, caps, unstake, withdraw pages (`:765`) | done | `pactora-interface-near app/agents/[id]/manage/page.tsx:1`; `pactora-interface-near e2e-live/live.spec.ts:88`; `pactora-contracts-near contracts/pactora/tests/sandbox.rs:344` (a function-call key still cannot withdraw) | live check on testnet | owner |
| F20 connect page with a first funding (`:792`) | done with test | `pactora-interface-near e2e/connect.spec.ts:73`; `pactora-interface-near e2e/connect.spec.ts:115`; `pactora-interface-near e2e-live/live.spec.ts:126` | it is a step of `/register`, not a separate page (recorded) | built |
| F21 fee display (`:817`) | done with test | `pactora-interface-near lib/fees.ts:42`; `pactora-backend-near apps/api/test/listings.test.ts:158` | — | built |
| F22 skill file and `/.well-known` (P0-a) (`:828`) | done | `pactora-interface-near public/SKILL.md:2`; `pactora-interface-near app/.well-known/pactora.json/route.ts:4` | remote MCP over HTTP | today |
| F23 faucet (`:858`) | done with test | `pactora-backend-near apps/api/src/routes/faucet.ts:83`; `pactora-backend-near scripts/demo.mjs:882` | standing check | today |
| F24 idempotency on every write that moves money or decisions (`:878`) | done with test | `pactora-backend-near apps/api/test/listings.test.ts:182`; `pactora-backend-near apps/api/test/api.test.ts:349`; `pactora-backend-near apps/api/test/x402.test.ts:185` | — | built |
| F25 bounded limits with a test at cap + 1 (`:887`) | done with test | `pactora-backend-near apps/api/test/listings.test.ts:309`; `pactora-backend-near apps/api/test/evidence.test.ts:323`; `pactora-backend-near apps/api/test/events.test.ts:294` | 100 agents per owner | today |
| F26 startup guards with a refuse-to-start suite (`:899`) | done with test | `pactora-backend-near scripts/test-startup.mjs:56`; `pactora-backend-near packages/shared/test/compose-env.test.ts:89` | — | built |
| F27 retention policy and purge (`:911`) | partial | `pactora-backend-near apps/api/src/routes/kyc.ts:122`; `pactora-interface-near app/privacy/page.tsx:295` | the purge for chat, evidence and cases; legal review | today / owner |
| F28 backups, alerts, edge 404 (`:921`) | done, checked locally | `pactora-backend-near deploy/vps/backup.sh:2`; `pactora-backend-near deploy/vps/alerts.sh:10`; `pactora-backend-near deploy/vps/Caddyfile:8` | a server; `BACKUP_REMOTE`, `ALERT_WEBHOOK_URL` | owner-blocked |
| F29 keeper backlog gauge and recovery (`:937`) | done with test | `pactora-backend-near apps/signer/src/keeper.ts:290`; `pactora-backend-near apps/signer/test/keeper.test.ts:276`; `pactora-backend-near apps/signer/test/keeper.test.ts:295` | — | built |
| F30 multi-network routing (`:952`) | missing, planned later | `pactora-docs-near docs/26-human-work-integration-plan.md:22` | revisit with mainnet | future |
| F31 modes, categories, templates (`:960`) | done (templates landed today, uncommitted) | `pactora-backend-near apps/api/src/routes/listings.ts:80`; `pactora-backend-near apps/api/src/routes/listings.ts:81`; `pactora-interface-near lib/listing-templates.ts:74`; `pactora-interface-near e2e/templates.spec.ts:6` | the commit and the gate | today (landed) |
| F32 AI onboarding helper (`:970`) | missing, skipped on purpose | `pactora-docs-near docs/26-human-work-integration-plan.md:22` | — | — |
| F33 marketing pages for both sides (`:978`) | partial | `pactora-interface-near app/join/page.tsx:1`; `pactora-interface-near app/docs/people/page.tsx:1` | a split landing and a people FAQ (planned only when the human side ships) | future |
| §4 D0 build before 14 Nov (`:1046`) | decided: built on `human-work` | `pactora-docs-near docs/26-human-work-integration-plan.md:3` | — | owner (done) |
| §4 D1 stake and bond for people = (a) `set_params` (`:1047`) | done | `pactora-contracts-near contracts/pactora/src/lib.rs:281` (`set_params`); `pactora-contracts-near config/params.testnet.json:12` | the testnet params the owner wants for people | owner |
| §4 D2 revisions = (a) off chain (`:1048`) | done | `pactora-backend-near apps/api/src/routes/drafts.ts:127` | — | built |
| §4 D3 KYC vendor (`:1049`) | open | `pactora-docs-near docs/STATUS.md:93` | the vendor | owner |
| §4 D4 evidence storage provider (`:1050`) | done (S3-compatible, SSE) | `pactora-backend-near packages/storage/src/index.ts:114` | the production bucket | owner |
| §4 D5 Telegram (`:1051`) | built, off without a token | `pactora-backend-near apps/channels/src/channels.ts:84` | yes/no and a token | owner |
| §4 D6 rights to reuse the reference's ideas (`:1052`) | open | `pactora-docs-near docs/STATUS.md:97` | confirmation before the repos go public | owner |

## 10. docs/27-audit-2026-11.md, "not covered" and documented-not-fixed

| Feature | Status | Evidence (repo file:line) | What is missing | Who |
|---|---|---|---|---|
| C6 a leaked wallet key can burn the agent's storage NEAR (`pactora-docs-near docs/27-audit-2026-11.md:120`) | documented, not fixed | `pactora-contracts-near SECURITY.md:64`; `pactora-contracts-near contracts/pactora/src/tests.rs:1497` | a storage refund on `cancel` would be a contract change | future (contract frozen) |
| C8 jobs a default-cap worker can never accept; NEP-145 name reuse; 35 Tgas floor; recreated account names; upgrades by the contract account key; a frozen client cannot dispute (`:147`–`:161`) | documented, not fixed | `pactora-contracts-near contracts/pactora/src/tests.rs:1527`; `pactora-contracts-near contracts/pactora/src/lib.rs:413` (`freeze_agent`) | the upgrade-key item is a mainnet task (§6) | owner |
| B dispute reason public in `job.disputed`; a session outlives key removal up to 7 days; API and signer share one database role (`:294`) | documented, not fixed | `pactora-contracts-near contracts/pactora/src/events.rs:99`; `pactora-backend-near apps/api/src/routes/session.ts:193` | session revocation on key change | today |
| I CSP keeps `script-src 'unsafe-inline'` (`:397`) | fixed today in the working tree, uncommitted: a per-request nonce from `middleware.ts` with `'strict-dynamic'` | `pactora-interface-near lib/csp.mjs:67`; `pactora-interface-near middleware.ts:1`; `pactora-interface-near e2e/csp.spec.ts:17` | the commit and the gate | today (landed) |
| I `/me` long on a phone; signed-in pages load in sequence; notifications page does not say reviews are not notifications (`:397`) | documented, not fixed | `pactora-interface-near app/me/MeView.tsx:25` | layout and copy | future |
| §6 real wallets (Meteor, Intear) never driven (`:427`) | missing | `pactora-interface-near e2e-live/live.spec.ts:126` (scripted wallet only) | one manual pass with a real wallet on testnet | owner |
| §6 KYC held and blocked pages reviewed in code only (`:429`) | done (live suite covers them) | `pactora-interface-near e2e-live/live.spec.ts:470`; `pactora-interface-near e2e-live/live.spec.ts:521` | — | built |
| §6 whether a real nearcore answers a duplicate `send_tx` with `InvalidNonce` (`:431`) | documented | `pactora-backend-near apps/signer/test/signer.test.ts:206` (the fix does not depend on it) | a testnet observation | owner |
| §6 property suite runs in the mocked runtime (`:434`) | documented; sandbox covers it | `pactora-contracts-near contracts/pactora/src/fuzz.rs:774`; `pactora-contracts-near contracts/pactora/tests/adversarial.rs:1376` (yocto rules on a real node) | — | built |
| §6 external audit before mainnet (`:436`) | owner-blocked | `pactora-docs-near docs/27-audit-2026-11.md:436` | the auditor | owner |

## 11. docs/STATUS.md: "What is left", "Known, not fixed", "Blocked on the owner"

| Feature | Status | Evidence (repo file:line) | What is missing | Who |
|---|---|---|---|---|
| Left: a testnet run of the new flows (`pactora-docs-near docs/STATUS.md:95`, the list) | owner-blocked | `pactora-backend-near scripts/live-ui-stack.mjs:1` (the stack is scripted) | the funded account | owner |
| Left 3: D3 vendor, threshold, bot token, email provider, D6 (`:80`–`:85`) | owner-blocked | `pactora-docs-near docs/STATUS.md:93` | five decisions | owner |
| Left 4: held payout end to end; NEAR AI judge off by default (`:86`) | done | `pactora-backend-near scripts/demo.mjs:1077`; `pactora-backend-near packages/agent-core/src/providers/near-ai.ts:8` | EU list (`:90`); server for the ops scripts | owner |
| Known: faucet has no standing check (`:222`) | in progress, this round | `pactora-backend-near apps/api/src/routes/faucet.ts:83` | the check | today |
| Known: 409 before 403 for a non-party in the wrong state (`:223`) | documented | `pactora-backend-near apps/api/test/roles.test.ts:908` | nothing (the state is public) | — |
| Known: indexer loops on a garbage-collected start block (`:225`) | partial | `pactora-backend-near apps/indexer/src/main.ts:91` | a testnet check on a non-archival RPC | future |
| Blocked: testnet account (`:380`) | owner-blocked | `pactora-docs-near docs/STATUS.md:418` | `.env` | owner |
| Blocked: the server `.env` for Vultr (`:383`) | owner-blocked | `pactora-backend-near packages/shared/test/compose-env.test.ts:89` (compose passes every setting a service reads) | the values, on the server only | owner |
| Blocked: `NEAR_AI_API_KEY` for one live call (`:386`) | owner-blocked | `pactora-backend-near packages/shared/src/judge-env.ts:25` | the key | owner |

## 12. pactora-backend-near/PROGRESS.md, entries dated 2026-11

| Feature | Status | Evidence (repo file:line) | What is missing | Who |
|---|---|---|---|---|
| Held payout end to end on the sandbox (`pactora-backend-near PROGRESS.md:95`) | done | `pactora-backend-near scripts/demo.mjs:1077`; `pactora-backend-near apps/signer/src/signer.ts:808` | — | built |
| NEAR AI Cloud judge, off by default (`:106`) | done with test | `pactora-backend-near packages/agent-core/src/providers/near-ai.ts:18`; `pactora-backend-near packages/agent-core/test/near-ai.test.ts:57`; `pactora-backend-near packages/agent-core/test/near-ai.test.ts:115`; `pactora-docs-near docs/08-configuration.md:431` | attestation verification; live fixtures | today + owner |
| Audit H1: a retried hire signed twice on `InvalidNonce` (`:132`) | done with test | `pactora-backend-near apps/signer/test/signer.test.ts:206` (file holds the uncertain-fate suite) | — | built |
| Audit M1: scrypt DoS, junk wallet keys (`:148`) | done with test | `pactora-backend-near apps/api/src/routes/agents.ts:326`; `pactora-backend-near apps/signer/test/keys-dos.test.ts:29`; `pactora-backend-near apps/signer/test/keystore.test.ts:43` | — | built |
| Audit M2: unauthenticated re-issue cost RPC reads (`:173`) | done with test | `pactora-backend-near apps/api/src/routes/keys.ts:83`; `pactora-backend-near apps/api/test/keys.test.ts:213` | — | built |
| Audit L1–L5, I1–I3 (`:186`–`:232`) | done with test | `pactora-backend-near apps/api/test/admin.test.ts:170` (L3); `pactora-backend-near apps/signer/test/faucet.test.ts:39` (L5); `pactora-backend-near packages/shared/test/compose-env.test.ts:93` (L4); `pactora-backend-near deploy/vps/backup.sh:2` (I1 HMAC) | — | built |
| Contracts 1.1.0 follow-through: `dispute_grace` in params, keeper waits out the grace, `/v1/network` exposes it, indexer decodes the split (`:246`, `:255`) | done with test | `pactora-contracts-near config/params.testnet.json:13`; `pactora-backend-near apps/signer/src/keeper.ts:90`; `pactora-backend-near apps/signer/test/keeper.test.ts:81`; `pactora-backend-near apps/api/src/routes/meta.ts:121`; `pactora-backend-near apps/indexer/src/events.ts:93`; `pactora-backend-near apps/indexer/test/events.test.ts:86` | — | built |
| Docs follow-up: the four judge variables in docs/08 (`:124`) | done | `pactora-docs-near docs/08-configuration.md:431` | — | built |

---

## 13. Expected by a marketplace user, not planned

Ranked by value to a person or agent using the marketplace. "Contract" in
the Status column means the change cannot ship without a new wasm, and the
owner froze the contract at 1.1.0 (`pactora-contracts-near wasm/SHA256SUMS:1`),
so these wait for a release after the hackathon.

| # | Feature | Value | Effort | Where it would go | Status |
|---|---|---|---|---|---|
| 1 | Deadline extension (both parties agree to push `work_deadline`) | high: a late worker today loses the bond on `expire_undelivered` with no way to ask for time | M | contract: a new method on `Job` (`pactora-contracts-near contracts/pactora/src/lib.rs:847` is the exit it would delay); indexer decoder; API + UI | needs a contract change (frozen at 1.1.0) |
| 2 | Worker-side dispute (a worker contests an approval that never comes, or a client's revision abuse) | high: today only the client can `dispute` (`pactora-contracts-near contracts/pactora/src/lib.rs:775`); the worker's only exit is `auto_approve` | L | contract (a worker-initiated dispute with its own bond); DAO desk | needs a contract change |
| 3 | Hard compliance hold (a held party cannot be paid even by `auto_approve`) | high for mainnet: the soft gate is bypassable by calling the contract (`pactora-contracts-near contracts/pactora/src/lib.rs:856`) | M | contract (an allowlist or hold flag read by `validate_hire` and the exits); API | needs a contract change |
| 4 | Text search on the job board and listings (`q`) | high: a board without search does not scale past a page | S | `pactora-backend-near apps/api/src/routes/listings.ts:517`; `pactora-backend-near apps/api/src/routes/jobs.ts:125`; interface `/jobs` | landed today, backend commit `444cb74` (`pactora-backend-near apps/api/src/routes/listings.ts:184`; `pactora-backend-near apps/api/test/search.test.ts:78`); the interface search box is in progress |
| 5 | Status filter on jobs in the UI (`open` / `closed` groups) | high | S | `pactora-backend-near apps/api/src/routes/jobs.ts:171` has `state`, and since today `status` groups (`pactora-backend-near apps/api/src/routes/jobs.ts:36`); the interface filter is in progress | landed today in the API, commit `444cb74`; interface in progress |
| 6 | Milestones helper (one goal → several escrowed jobs with one timeline) | high for people's work over 5 hours (testnet `max_work_window`) | M | backend: a parent record over N jobs, like a listing (`pactora-backend-near apps/api/src/routes/listings.ts:255`); interface | future |
| 7 | Pre-hire Q&A on a listing (applicant asks, owner answers, public to applicants) | medium-high: chat exists only between the two parties while `accepted` (`pactora-backend-near apps/api/src/routes/messages.ts:61`) | S | backend: a `listing_questions` table reusing the chat limits; interface listing page | future |
| 8 | Invoices and receipts export (per job: parties, amount, fee, tx hash; CSV/PDF) | medium-high: every figure exists on chain and in `/v1/me` (`pactora-backend-near apps/api/src/routes/me.ts:28`) | S | backend `GET /v1/me/receipts.csv`; interface `/me` | future |
| 9 | Account deletion UX (GDPR export and scrub) | medium-high: a person's chat, photos and KYC fields exist with no self-service erase | M | backend `GET /v1/me/export`, `DELETE /v1/me`; interface `/me` | being built today |
| 10 | Reports and blocks (report a listing or a profile; block a counterparty; admin queue) | medium-high: moderation today is hide-a-review only (`pactora-backend-near apps/api/src/routes/admin.ts:455`) | M | backend `reports` table and `/v1/admin/reports`; interface report buttons and an admin tab | being built today |
| 11 | Web push for people | medium: the feed and bell exist (`pactora-interface-near components/market/NotificationsBell.tsx:43`); nothing reaches a closed tab | M | interface service worker; backend push subscriptions beside `webhooks` (`pactora-backend-near packages/db/src/schema.ts:985`) | future (docs/26 F10 "optional web push later") |
| 12 | Email digests (daily summary of new matching listings, bids, decisions) | medium | S after an email provider | `pactora-backend-near apps/channels/src/channels.ts:30` (outbox) | future; owner-blocked on a provider |
| 13 | Saved searches and listing alerts ("tell me when a listing matches me") | medium: `?match=me` exists on request only (`pactora-backend-near apps/api/src/matching.ts:51`) | S | backend: a `saved_searches` table fed by the listing event (needs listing events in the feed, being built today) | future |
| 14 | Reputation decay (older settlements count less) | medium: a docs/04 §11 open question | M | contract (`pactora-contracts-near contracts/pactora/src/types.rs:171` holds lifetime sums only) or an off-chain time-weighted score beside it | needs a contract change for the on-chain score; an off-chain view is S |
| 15 | Score-over-time chart on a profile | medium-low | S | interface `/agents/[id]` and `/people/[id]` from `job_events` | future (cut as P3 in `pactora-docs-near docs/05-roadmap.md:76`) |
| 16 | Dark and light mode | low-medium: the site is dark only (`pactora-interface-near app/globals.css:75`) | S | interface tokens in `globals.css` | future |
| 17 | i18n | low for the hackathon; medium for people's work in other countries | L | interface (`pactora-interface-near app/layout.tsx:104` is `lang="en"` only); API error texts | future |
| 18 | Multi-currency / any NEP-141 | low-medium: one payment token by design (`pactora-contracts-near contracts/pactora/src/tests.rs:702`); Intents could pay out in other tokens | L | contract (a token allowlist and per-token totals) or NEAR Intents at payout (mainnet only) | needs a contract change, or owner (Intents) |
| 19 | People-to-people escrow without an agent | — already works: a person is an `agents` row of kind `person`, and a person client hires a person worker through a listing (`pactora-interface-near e2e-live/live.spec.ts:245`; `pactora-interface-near e2e-live/live.spec.ts:357`) | — | — | done; the docs should say so plainly |
| 20 | Job templates in the create form | medium for first-time posters | S | interface `/jobs/new` (`pactora-interface-near lib/listing-templates.ts:74`; `pactora-interface-near e2e/templates.spec.ts:6`) | landed today, uncommitted |
| 21 | Per-owner agent cap | medium (spam) | S | `pactora-backend-near apps/api/src/routes/agents.ts:398` | being built today |
| 22 | Session revoke when a key is re-issued or the owner changes | medium (security) | S | `pactora-backend-near apps/api/src/routes/keys.ts:114`; `pactora-backend-near apps/api/src/routes/session.ts:211` | being built today |
| 23 | Client-side dispute evidence (the client attaches photos or text to a dispute) | medium: today the client gives a reason only (`pactora-backend-near apps/api/src/routes/person-actions.ts:36`) | S | backend `files.ts` for the client while `submitted`; DAO desk | being built today |
| 24 | 2FA for admins | low: admin actions are wallet signatures with a 1-hour rule (`pactora-backend-near apps/api/test/admin.test.ts:191`) and the ruling itself is a 2-of-3 DAO vote | — | — | not needed as designed; say so |
| 25 | Audit log export for compliance (CSV of `compliance_audit`) | low-medium | S | backend `GET /v1/compliance/audit.csv` for reviewers (`pactora-backend-near packages/db/migrations/0020_identity_sanctions_trigger_constraints.sql:43`) | future |
| 26 | Remote MCP over HTTP (an agent connects without running the stdio binary) | medium for agent adoption | M | `pactora-backend-near apps/mcp/src/main.ts:21` | being built today |
| 27 | Signed judge verdicts stored with the ruling (NEAR AI Cloud attestation) | medium (the docs/24 selling point) | M | `pactora-backend-near packages/agent-core/src/providers/near-ai.ts:18`; `review_hash` on `approve` (`pactora-contracts-near contracts/pactora/src/lib.rs:756`) | being built today (verification); live fixtures owner-blocked |
| 28 | An x402 step in the one-command demo | medium (judges see pay-per-request work) | S | `pactora-backend-near scripts/demo.mjs:524` area; the scheme is tested at `pactora-backend-near apps/api/test/x402.test.ts:159` | being built today |

---

## 14. Submission readiness against docs/24 §1.1

| Rule | What it requires | Status | Evidence (repo file:line) | Owner or agent |
|---|---|---|---|---|
| Q-002 existing product (`pactora-docs-near docs/24-near-hackathon.md:18`) | disclose in the README what existed before the window; only NEAR work is judged | met | `pactora-contracts-near README.md:7`; `pactora-backend-near README.md:9`; `pactora-interface-near README.md:27`; `pactora-docs-near README.md:10` | agent (done) |
| Q-003 branch or tags + README diff link (`:19`) | tags `pre-hackathon` and `hackathon-submission` and a compare link | partly: the links and the `pre-hackathon` tag are in place; `hackathon-submission` is not tagged | `pactora-contracts-near README.md:10`; `pactora-backend-near README.md:15`; `pactora-interface-near README.md:31`; `pactora-docs-near README.md:13`; `pactora-docs-near docs/24-near-hackathon.md:156` | owner (the tag, after the testnet run); note the submission is `human-work`, so the compare link must point at that branch's head |
| Q-004 old project as-is: no (`:20`) | new work in the window, separated per Q-003 | met (`master` and `human-work` are both in the window) | `pactora-docs-near docs/26-human-work-integration-plan.md:3` | — |
| Q-005 libraries and AI listed in README (`:21`) | a list of libraries and AI tools | met in the three code repos: backend "Built with", contracts "Libraries used" (versions locked), interface "Built with" (a paragraph naming each library with its version, which the rule accepts); the docs repo has no dependencies | `pactora-backend-near README.md:184`; `pactora-backend-near README.md:190`; `pactora-contracts-near README.md:28`; `pactora-interface-near README.md:100` | — |
| Q-007 Intents testnet (`:24`) | none exists; `dry: true` quotes only | n/a (Intents not used) | `pactora-docs-near docs/24-near-hackathon.md:154` | owner, optional |
| Q-010 testnet (`:23`) | deployed on testnet | not met yet: sandbox only | `pactora-contracts-near deployments/sandbox.json:1`; `pactora-docs-near docs/STATUS.md:418` | owner (deploy); agent (`sync-chain-facts`, READMEs after) |
| Q-011 mandatory tech: none (`:22`) | own contract on NEAR that fits the track | met | `pactora-contracts-near contracts/pactora/src/lib.rs:645`; `pactora-contracts-near wasm/SHA256SUMS:1` | — |
| Q-012 demo (`:25`) | public repo, reproducible README, X post with a video; hosted demo a plus, up to 18 Nov | partly: the reproducible README and one-command demo exist; repo public, video, X post, hosting are the owner's | `pactora-backend-near README.md:33`; `pactora-docs-near README.md:21`; `pactora-docs-near docs/25-near-submission.md:71` | owner |
| Q-014 licence (`:26`) | any; add a LICENSE file; repo public through judging | met (MIT in all four) | `pactora-contracts-near LICENSE:1`; `pactora-backend-near LICENSE:1`; `pactora-interface-near LICENSE:1`; `pactora-docs-near LICENSE:1`; `pactora-contracts-near README.md:389` | agent (done); public: owner |
| Q-015 two projects per person (`:27`) | each README names the other | n/a unless the owner enters a second project in this hackathon | `pactora-docs-near README.md:37` (sibling repos listed; no second project) | owner decides whether a second project is entered; then agent adds the line |
| Q-017 AI screen (`:28`) | reproducibility from the README, no step needing a key or quota | met: `pnpm demo:local` runs with `AGENT_MODE=cached` and no key | `pactora-backend-near README.md:33`; `pactora-backend-near scripts/demo.mjs:524` | agent (done); re-run on the final commit |
| README standard (`:29`) | "do X, see Y" for a machine reader; no marketing | met: the interface README's pages table gained the `human-work` pages today (commit `86b08fb`) | `pactora-contracts-near README.md:141`; `pactora-backend-near README.md:42`; `pactora-interface-near README.md:66`; `pactora-interface-near README.md:80`; `pactora-interface-near README.md:86` | agent (done) |
| Submission form (`:30`) | public repo, X post, mainnet payout account, 20–2,000-char description, `website` empty | text ready; the rest is the owner's | `pactora-docs-near docs/25-near-submission.md:26` | owner |

One README fact is stale and a machine reader will trip on it: the backend
README says "Nine MCP tools" (`pactora-backend-near README.md:114`) while the
server exposes 25 (`pactora-backend-near apps/mcp/test/tools.test.ts:88`). The
interface's pages table and docs pages were brought up to date today
(interface commit `86b08fb`).

---

## 15. Owner decisions still open

From docs/26 §4, STATUS "Blocked on the owner", and what this inventory found.

1. **Testnet deploy** — a funded account (about 25 NEAR) in `pactora-contracts-near/.env`, then `create-dao`, `deploy`, `verify-near --network testnet`, `sync-chain-facts` (`pactora-docs-near docs/STATUS.md:418`). Everything in §14 Q-003, Q-010 and Q-012 waits on this.
2. **Public repos and the `hackathon-submission` tag**, after the deploy (`pactora-docs-near docs/25-near-submission.md:122`); confirm the compare link targets the `human-work` head.
3. **D6 rights** to reuse the reference product's ideas, before the repos go public (`pactora-docs-near docs/26-human-work-integration-plan.md:1052`).
4. **Video, X post, form** with a mainnet payout account (`pactora-docs-near docs/25-near-submission.md:124`).
5. **Hosting**: the Vultr server `.env` (`SIGNER_TOKEN`, `SIGNER_KEY_PASSPHRASE`, `API_HOST`, `CORS_ORIGINS`, `MINIO_KMS_SECRET_KEY`, `BACKUP_REMOTE`, `ALERT_WEBHOOK_URL`, optional keeper account) and Vercel for the interface (`pactora-docs-near docs/STATUS.md:421`).
6. **`NEAR_AI_API_KEY`** for one live judge call to capture real fixtures; whether to switch `JUDGE_PROVIDER=near-ai` on for the demo (`pactora-docs-near docs/STATUS.md:424`).
7. **D3 KYC vendor**, and whether KYC runs on testnet at all (simulated and labelled today) (`pactora-docs-near docs/STATUS.md:93`).
8. **Sanctions matching threshold**: keep 0.92 per word (misses "Erik"/"Eric") or lower it and accept more false alarms (`pactora-docs-near docs/STATUS.md:94`).
9. **EU sanctions list**: a token for its file, or stay with OFAC, UN and UK (`pactora-docs-near docs/STATUS.md:102`).
10. **Telegram bot token** (D5) and an **email provider** (`pactora-docs-near docs/STATUS.md:95`, `pactora-docs-near docs/STATUS.md:96`).
11. **Contract 1.2.0 scope**, after the hackathon: deadline extension, worker-side dispute, hard compliance hold, D1(b) person kind, D2(b) `request_revision`, storage refund on `cancel` (§13 rows 1–3, 14, 18; docs/26 §3 says to batch them into one release).
12. **Q-015**: is a second project entered in the NEAR hackathon? If so each README names the other.
13. **Legal**: trademark search, terms and privacy review, retention policy sign-off (§6).
14. **Operations**: uptime monitor, `METRICS_TOKEN`, release tags, RPO/RTO, retention for `job_events` / `run_events` / `signer_txs` (§4).
15. **A real wallet pass** (Meteor or Intear) on testnet, since only the scripted wallet was driven (`pactora-docs-near docs/27-audit-2026-11.md:427`).
16. **The leftover local branch** `verify-2026-11-07`: keep or delete (`pactora-docs-near docs/STATUS.md:434`).
