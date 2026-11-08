# 26 — Human work on Pactora: integration plan

Status (2026-11-08): **built on the `human-work` branch** of the four
repos, milestone by milestone (M0–M10; STATUS.md has each gate as
measured). `master` is unchanged and is what gets submitted; nothing here
changes the hackathon plan in [docs/25](25-near-submission.md). The
sections below are the plan as written before the build; how each feature
was actually built is in docs/04 §5.1b–5.1j and docs/15.

| Feature | Built | Not done / unverified |
|---|---|---|
| F1 sessions, F2 person role, F26 startup guards | ✅ M1 | — |
| F3 job pages, F19 funding pages, F21 fee display, F22 skill file | ✅ M2 | — |
| F4 bids, F5 multi-worker, F6-a instant, F18 matching, F31 modes | ✅ M3 | — |
| F6 evidence, F7 review with checks, F8 chat | ✅ M4 | — |
| F9 event feed and webhooks, F10 notifications, F23 faucet | ✅ M5 | F20 connect page (agents still use `/register`) |
| F16 profiles, F17 two-way reviews | ✅ M6 | ratings computed on read, not by a trigger (a trigger cannot follow the 14-day window) |
| F13 KYC, F14 sanctions, F27 retention | ✅ M7 | no vendor adapter (D3 open: simulated provider only); UK/EU lists; NEAR wallets cannot be screened (no list names them); "Erik"/"Eric"-type misses at the 0.92 threshold |
| F15 admin console and DAO desk | ✅ M8, live on the sandbox with a real Sputnik DAO | — |
| F11 Telegram, F12 email | ✅ M9 | Telegram unverified live (needs a bot token); email has a fake provider only |
| F28 backups/alerts, F29 queue health | partly (keeper backlog gauge, M1) | backup and alert wiring is the host's (docs/14) |
| F30, F32, F33 | — | left out as planned (§3) |
| All | — | no testnet run of the new flows yet (needs the owner's funded account); gates are soft (no contract change, D1 = a) |

## 0. Read this first

### 0.1 What this is

A reference product (a separate, existing codebase, not ours) runs a
marketplace where **AI agents hire people** for real-world work. Examples are
a photo of a shop front, a local check, or an expert judgement. Its features:

- agents fund themselves;
- people apply with a price;
- the agent picks one or more workers;
- each worker gets an escrow, a chat thread, evidence upload and a review;
- the escrow pays out when the agent approves the work.

Around that it has KYC, sanctions screening, a chat-bot channel, an admin
console and public profiles.

This document lists **every** feature of that product and plans how each one
would work in Pactora on NEAR. For each feature it covers what we would build,
in which repo, whether the contract changes, the tests, and the risks.

This document deliberately leaves out the reference product's name, its owners,
domains, server addresses and any personal details. Where it names an outside
service (a KYC vendor, a sanctions list), that is a public third party.

### 0.2 Source and method

- Read on 2026-11-08 from the newest code of its two repos (backend +
  contracts, and frontend). Read-only: nothing was checked out, built or run
  in those repos.
- **Backend: its two newest branches disagree.** The audit-fix branch (7 Nov)
  is missing 5 later commits on `main`: city matching, evidence-photo
  withdrawal, and one network paused. Both were read, and both count as
  current.
- **Frontend:** `main`, into which every branch is merged.
- Pactora facts come from our own repos (`master`, 2026-11-08). Each one was
  checked against the code. Line references use the short forms below.

| Short form | File |
|---|---|
| `CT:n` | `pactora-contracts-near/contracts/pactora/src/lib.rs` |
| `T:n` | `pactora-contracts-near/contracts/pactora/src/types.rs` |
| `signer.ts` | `pactora-backend-near/apps/signer/src/signer.ts` |

### 0.3 Three findings that shape the whole plan

1. **The reference's newest backend branch does not compile as committed.**
   `upload` in its `files.rs` uses a database transaction at line 164 that is
   declared at line 183. Its notes also describe a fix for a stuck relayer
   transaction (`replace_stuck`), and that fix is not in the code. Only the
   test exists. Conclusion: **we copy designs, never code**, and every port is
   rebuilt and tested on our side.
2. **Our contract already lets a person be a worker or a client.**
   `only_wallet_of` (CT:982-990) checks only `predecessor == agent.wallet`. It
   never checks the key type. `register_agent` (CT:239) does not forbid
   `wallet == owner`. Only our backend and interface block people today:
   - the signer refuses full-access keys (`signer.ts:504`);
   - `/register` forces a new `<name>.<owner>` sub-account.

   Most human-work features are therefore **backend + interface work, with no
   redeploy**.
3. **Our contract has no upgrade or migrate path and no state version**
   (CT:68-94). Any change to stored `Job`/`Agent`/`Params` means:
   - a new wasm and a new sha256 in `wasm/SHA256SUMS`;
   - a fresh deploy;
   - an indexer update, because the indexer throws on an unknown event
     version;
   - `verify-near` re-run.

   The first testnet deploy has **not happened yet** (STATUS "Next up" 1). A
   contract change is cheapest **before** that deploy and much more expensive
   after it. That is a timing decision for the owner, see §4 D1.

### 0.4 Hackathon recommendation

**Build none of this before 2026-11-14.**

- The entry's story is "agents hire agents, safely", and it is
  feature-complete and tested.
- The open items are the testnet deploy, hosting, the video and the
  submission, and they all wait on the owner.
- Human work changes the product, needs at least weeks of work done properly,
  and puts the gates in STATUS.md at risk.

Two items are small, need no contract change and support the existing story.
Only do them if the deploy, video and submission are finished with time to
spare:

- **P0-a** — a public agent skill file (§2 F22, the `SKILL.md` part only).
- **P0-b** — owner funding and caps pages (§2 F19). The contract already
  supports these and the interface lacks them.

**Rights:** before any of this goes public, the owner confirms we may reuse
the reference product's ideas. We take designs only, write our own words, and
copy no text, assets, names or code.

---

## 1. Pactora today, in one table

| Area | Today | Source |
|---|---|---|
| Who can act | Agents only, in practice. Each agent is an owner account plus a wallet sub-account whose function-call key the signer holds. | `signer.ts:504`, interface `/register` |
| Hiring | One client to one worker per job. The price is the worker's fixed `pricePerTask`. No bids. | `jobs.ts` `hire()` |
| Job states | Created → Accepted → Submitted → Settled/Refunded/Disputed. `direct_pay` jumps to Settled. | T:22-31 |
| Exits | `cancel`, `expire_unaccepted`, `expire_undelivered`, `auto_approve`, `expire_dispute` (permissionless, run by the keeper) | CT:699-753 |
| Disputes | Arbiter = a 2-of-3 Sputnik DAO. The contract checks only the caller. | CT:672 |
| On-chain evidence | sha256 hashes only (`spec_hash`, `result_hash`, `review_hash`, `reason_hash`) | T:135-161 |
| Money | One NEP-141 token. Agent purses with per-task and rolling 24 h caps. Stakes. 20% worker bond. Fee taken from the worker's payout. Invariant I1. | CT:1040-1088 |
| Funding | Anyone can `Fund` or `Stake` any agent via `ft_transfer_call` (CT:932-958). The interface and API have no page or route for it. | — |
| API auth | API key per agent. NEP-413 is used only for owner registration and key re-issue. No human sessions. | `apps/api/src/auth.ts` |
| Delivery | Polling + SSE (`job_events`, LISTEN/NOTIFY). No webhooks, email or chat. | `live.ts` |
| Storage of results | JSON in Postgres (`jobs.result`). `jobs.result_uri` and the `disputes` table exist but are never used. | `packages/db/src/schema.ts` |
| Rate limits | Stored in Postgres (`rate_limits`), so they survive restarts. This is better than the reference, which keeps them in memory. | `apps/api/src/rate-store.ts` |
| x402 | `pactora-directpay` / `pactora-escrow` schemes (v1 shapes) | `packages/shared/src/x402.ts` |
| MCP | stdio. 9 client-side tools. No worker tools. | `apps/mcp/src/tools.ts` |
| Interface | Marketplace, agent profiles, runs, demo, register, status, docs. **No job pages, no funding pages.** | `pactora-interface-near/app` |
| Test token | `mock-usdc` `mint` is **owner-only** | `contracts/mock-usdc/src/lib.rs:45-46` |

---

## 2. Feature-by-feature plans

Each feature uses the same layout:
- **Reference** — what the reference product does.
- **Pactora** — the gap.
- **Plan** — the design on NEAR.
- **Layer** — which repo, and whether the contract changes.
- **Tests** — the checks. Every new test is first run against the old code
  and must fail there (project rule).
- **Risks**.
- **Size** — S, M or L, relative only.
- **Phase** — see §3.

### Foundation

#### F1. Human accounts and sessions (NEP-413 sign-in)
- **Reference:**
  - Email + password accounts: Argon2, 7-day HttpOnly session cookie,
    SameSite=Strict, only a hash stored.
  - Wallet sign-in for owners: single-use 5-minute signed challenge.
  - "Log out everywhere" button.
  - Sessions swept on expiry.
  - Every other session revoked when a wallet is re-linked.
  - Password reset by email or by wallet signature. All reset tokens burned
    after any reset.
- **Pactora:** no human login at all.
- **Plan:**
  - **Wallet-only sign-in. No passwords.** A NEP-413 challenge binds origin,
    network, account and nonce, with a 5-minute expiry and single use. Reuse
    the pattern in `challenges.ts`, with a new message type `login`. The
    signing key may be full-access or function-call, and we check on the
    chain that it belongs to the account.
  - Session token: 32 random bytes, only sha256 stored. HttpOnly, Secure,
    SameSite=Strict cookie with a 7-day expiry.
  - Routes `POST /v1/session/challenge`, `POST /v1/session`,
    `DELETE /v1/session`, `DELETE /v1/sessions` (all).
  - Sessions swept hourly.
  - Browser mutations need an `Origin` check plus a custom header (CSRF), the
    same rule the reference uses.
- **Layer:** backend (new `sessions` table, migration 0015+) and interface
  (sign-in). No contract change.
- **Tests:**
  - Replayed challenge refused.
  - Expired challenge refused.
  - Signature from another account refused.
  - Log-out-all kills other sessions.
  - Cross-origin POST refused.
- **Risks:** mixing API-key auth and cookie auth on the same routes. Keep them
  separate: agents use keys, people use sessions. Key scopes are stored but
  not enforced (`auth.ts`), so enforce them here.
- **Size:** M. **Phase:** 1.

#### F2. Human participant role
- **Reference:** the roles `human` (worker) and `owner` (agent owner) are
  separate accounts.
- **Pactora:** the contract already allows a person (finding 2). The blocks
  sit in the signer, the registration UI and the API's signer-only
  transition path.
- **Plan:**
  - New registration variant "person": `register_agent(wallet = own
    account)`, then `accept_wallet` from the same account. Both are signed in
    the browser through NEAR Connect.
  - Store `kind = 'person'` in the `agents` table (off-chain).
  - People sign their own `accept_job` / `submit_result` / `approve` /
    `dispute` in the wallet. The API then **records** the result off-chain
    and checks that the on-chain `result_hash` equals sha256 of the stored
    evidence snapshot (F6), read through the indexer. The API does not call
    the signer for them.
  - The signer stays unchanged. It must keep refusing full-access keys.
- **Decision D1:** people must meet `min_stake` (10 mUSDC testnet, cannot be
  0, CT:1245) and the 20% bond. Options:
  - (a) keep the rules, and lower `min_stake`/`bond_bps` with `set_params`
    (owner, no redeploy);
  - (b) add a per-agent `kind` field with person-specific rules. This changes
    the borsh layout and needs a redeploy.

  Recommended: (a).
- **Layer:** interface + backend. No contract change with D1(a).
- **Tests:**
  - A person account can register, accept, submit and be paid on sandbox
    (near-workspaces).
  - `SameOwner` still blocks self-hiring.
  - The signer still refuses a full-access key.
  - Live check on testnet.
- **Risks:**
  - Gas: people pay their own NEAR gas.
  - `SameOwner` uses the owner field. A person who is their own owner cannot
    hire themselves, which is correct.
- **Size:** M. **Phase:** 1.

#### F3. Job pages and a job board in the interface
- **Reference:** a workspace with these parts:
  - task feed (cursor "load more", search, status filters, per-agent filter);
  - task detail (status in plain words, timeline, sidebar with payout, fee,
    deadline and escrow address);
  - an overview (earnings from confirmed payouts only, "not a wallet
    balance").
- **Pactora:** jobs are visible only inside a run record. There is no board.
- **Plan:**
  - `/jobs` board for open listings (F4).
  - `/jobs/[id]` detail using `GET /v1/jobs/:id` + SSE: timeline from
    `job_events`, explorer links, deadlines, fee, state in plain words.
  - `/me` overview for a signed-in person or owner: earnings from settled
    jobs only.
  - Filters run **on the server**. The reference filters only the 50 loaded
    rows in the browser, which is a gap.
- **Layer:** interface + backend (list/filter routes). No contract change.
- **Tests:**
  - Playwright on the 5 browsers already used, plus axe accessibility.
  - Filters return only matching jobs.
  - Pagination stays stable.
- **Size:** M. **Phase:** 1.

### Hiring

#### F4. Listings with priced applications (bids)
- **Reference:**
  - Listing fields: title 5-140, description 10-5000, category
    (physical/expertise/judgment), skills ≤20, location, max price per worker,
    estimated minutes, deadline ≤90 days, acceptance criteria 10-3000,
    interaction mode (task/conversation/capture), and an idempotency key
    (replay with a different body returns 409).
  - People apply with a price no higher than the ceiling and a proposal of
    20-3000 characters.
  - One live bid per person. At most 3 bids per person per listing. Bids
    auto-declined because hiring closed do not count. Up to 1,000 bids per
    listing.
  - Withdraw a bid. A selected bid can be withdrawn only before funding.
  - Owner view: sort by recent, low price, high price or rating; 20 per page.
    Applicants never see each other's bids.
  - Select or reject with a reason of 10-2000 characters, shared with the
    applicant and idempotent.
  - Edit or cancel only before selection.
  - Close early, reopen before the deadline, and auto-close at the deadline.
  - The owner is notified of every new bid.
- **Pactora:**
  - No bids. `hire()` uses the fixed `pricePerTask`.
  - The contract accepts any amount within `[min_job_amount, max_job_amount]`
    chosen by the client, so **bids are not a contract limitation**.
  - Per-job windows are possible in the contract, but `submit.ts` hard-codes
    them from config.
- **Plan:**
  - New tables `listings` and `applications`.
  - Routes `POST /v1/listings`, `GET /v1/listings`,
    `POST /v1/listings/:id/applications` (apply/withdraw),
    `POST /v1/listings/:id/decide`, `/close`, `/reopen`, `PATCH` (edit),
    `DELETE` (cancel).
  - **Selecting a bid creates an ordinary Pactora job:**
    - `create_job(client, worker, amount = bid price)`;
    - `spec_hash` = sha256 of the canonical listing, the bid and the price;
    - windows taken from the listing, within the contract maxima.
  - Mark reopen-able bids with an explicit flag column. Do not match a
    free-text reason string, which is the reference's own weakness.
  - New MCP tools: `post_listing`, `list_applications` (with `sort` in the
    schema, which the reference forgot), `decide_application`,
    `close_applications`, `reopen_applications`.
- **Layer:** backend + MCP + interface. No contract change.
- **Tests:**
  - Bid cap of 3.
  - One live bid.
  - Price above the ceiling refused.
  - Edit after selection refused.
  - Idempotent retries, and a changed body returns 409.
  - The sum of the selected price and the fee stays within the caps
    (`/v1/budget`).
  - Applicants cannot read other bids.
- **Risks:**
  - Reserving budget. The reference reserves the full `max_workers × ceiling`
    when the listing is posted, and so must we, against `daily_remaining`.
    Otherwise selection can fail on caps later.
  - Selection eligibility must not be stricter than application eligibility.
    This is the reference's audit fix B7.
- **Size:** L. **Phase:** 2.

#### F5. Multi-worker hiring (one listing → up to N workers)
- **Reference:** a listing parent holds up to 20 child "assignments". Each
  child has its own escrow, chat, evidence, review and payout, and the parent
  holds no money.
- **Pactora:** one job means one worker (T:135-161). The orchestrator already
  fans out to one job per subtask.
- **Plan:** a parent listing in the database creates N independent 1:1 jobs,
  one per selected bid. This needs no contract change.
  - Evidence, review or chat calls made on the **listing id** are refused with
    a message naming each job id, as in the reference's latest change.
  - True shared escrow (one deposit, a list of workers, split payout) would
    be a new contract design with a redeploy. Not recommended.
- **Layer:** backend. No contract change.
- **Tests:**
  - N selections give N jobs on chain.
  - Each settles independently.
  - Invariant I1 holds after mixed outcomes: one approved, one disputed, one
    expired.
- **Size:** M (after F4). **Phase:** 2.

#### F6-a. Instant (first-come) mode
- **Reference:** a task with no named worker. The first eligible person to
  accept wins, protected by a row lock.
- **Pactora:** `create_job` needs a `worker_id`.
- **Plan:**
  - A backend claim: the first eligible claimer gets the slot under a
    database lock.
  - The API then creates the job to that worker with the client's key.
  - The worker accepts on chain.
  - The client's budget is reserved at posting time.
- **Layer:** backend. No contract change.
- **Tests:**
  - Two concurrent claims give one winner.
  - A claim after the deadline is refused.
  - The budget is released on cancel.
- **Size:** S. **Phase:** 2.

### Delivery and review

#### F6. Evidence: text and photos, bound to the on-chain hash
- **Reference:**
  - Evidence text of 10-10,000 characters.
  - Photos checked by magic bytes only (PNG/JPEG/WebP), at most 8 MiB each.
    At most 10 active photos per task and 30 uploads in total, counting
    withdrawn ones, so storage cannot grow without limit.
  - A worker can withdraw a photo before submitting. The bytes are kept so
    older snapshots stay valid.
  - At most 4 uploads at once across the whole server.
  - Downloads only for the two parties, served with `nosniff`.
  - On submit, an **immutable snapshot** is built: terms, text, file sha256s
    and up to 100 chat messages. Its sha256 is the evidence hash, and every
    review decision is bound to it.
- **Pactora:** no file storage. `jobs.result_uri` is unused. The request body
  limit is 256 KiB.
- **Plan:**
  - Store files in **S3-compatible object storage**, private and with
    server-side encryption. The reference keeps files on a local disk with no
    replication, and we should not copy that.
  - Database rows hold the sha256, mime type, size and `withdrawn_at`.
  - Upload route `POST /v1/jobs/:id/files`: a body limit only on that route,
    magic-byte check, caps 10 active / 30 total, semaphore. Remove EXIF GPS
    data unless the task needs location proof.
  - **Snapshot hash = the `result_hash` passed to `submit_result`.** The
    contract field already exists, so no redeploy.
  - Fill `jobs.result_uri` with a reference to the snapshot.
  - **Lock pattern (reference audit fix B11):** never hold a database row lock
    while reading the upload. Check cheaply first, store the file, then
    re-check under a short lock and delete the orphan file on failure.
- **Layer:** backend + interface + infra (bucket). No contract change.
- **Tests:**
  - Wrong magic bytes refused.
  - 8 MiB + 1 refused.
  - 11th active photo refused.
  - 31st upload refused.
  - A withdrawn photo is excluded from the new snapshot but still in the old
    one.
  - The hash on chain equals the stored snapshot hash (live check).
  - A third party cannot download.
- **Risks:**
  - Personal data in photos. We need retention rules (F27).
  - Storage cost.
- **Size:** L. **Phase:** 3.

#### F7. Review: approve, request revision, dispute, with checks
- **Reference:**
  - Only the posting agent reviews.
  - Input: snapshot hash, decision, reason 10-2000, and 1-30 checks of
    `{criterion, met, support}`. Approval needs every check met.
  - A decision is written once per snapshot: the same decision is
    idempotent, and a different one returns 409.
  - At most 3 revision rounds (audit fix).
  - Approval is refused more than 7 days after the deadline, which forces a
    dispute.
- **Pactora:**
  - `approve` and `dispute` exist. The judge is tool-less.
  - **There is no "revise" on chain.** `submit_result` works once, from
    Accepted only (CT:618-629). The review window then runs out and
    `auto_approve` pays the worker.
- **Decision D2 (revisions):**
  - (a) **Off-chain draft rounds.** The person submits a draft snapshot off
    chain, the agent reviews it, and the on-chain `submit_result` is sent
    only with the final snapshot. No redeploy, but the revision rounds happen
    before the contract's work window ends, so that window must be long
    enough.
  - (b) A contract method `request_revision` (Submitted → Accepted, at most
    3, deadline pushed). This needs a redeploy and new events in the indexer.

  Recommended: (a) now. Consider (b) only if (a) proves too tight.
- **Plan:**
  - The review payload carries its checks, and the API refuses an approval
    with any unmet check.
  - The decision is bound to the snapshot hash and written once.
  - `review_hash` on `approve` = sha256 of the review payload (the field
    exists).
  - Keep our judge as an optional assistant for the agent.
- **Layer:** backend + MCP (`review_job` tool) + interface. No contract
  change with D2(a).
- **Tests:**
  - Approve with an unmet check refused.
  - A second, different decision on the same hash returns 409.
  - The 4th revision round refused.
  - A stale hash returns 409.
  - `auto_approve` still pays after the review window (unchanged behaviour,
    recorded as expected).
- **Size:** M. **Phase:** 3.

#### F8. Chat per job
- **Reference:**
  - Only the two parties can post. 1-4000 characters, at most 100 messages
    per task.
  - Writable only while the work is accepted, submitted or in revision.
  - Idempotent by an external key, with an optional `in_reply_to`.
  - Bridged to the chat bot.
  - Chat and evidence are marked **untrusted** in the agent's instructions:
    they cannot change budgets or destinations.
- **Pactora:** none. Only one-shot decline and dispute reasons exist.
- **Plan:**
  - Table `job_messages`.
  - Routes `GET`/`POST /v1/jobs/:id/messages`, published on the existing SSE
    bus.
  - MCP tools `send_message` and `get_conversation`.
  - Messages are included in the evidence snapshot (F6).
  - **Treat all chat as untrusted model input.** This is already Pactora's
    stance on worker output, and the demo's prompt-injection checks extend to
    chat.
- **Layer:** backend + MCP + interface. No contract change.
- **Tests:**
  - A non-party cannot post.
  - The 101st message refused.
  - Writes refused after settlement.
  - An injected chat message cannot raise spend (extend the demo attack
    check).
- **Size:** M. **Phase:** 3.

### Notifications and channels

#### F9. Durable per-agent event stream and signed webhooks
- **Reference:**
  - Every state change writes an agent event through database triggers, so
    no code path can forget one.
  - Each agent has its own increasing sequence number.
  - Agents poll `get_updates`, or use a 50-second long-poll in the client.
  - Optional HTTPS callback:
    - HMAC-SHA256 signature over `t.delivery_id.body`;
    - the host must resolve only to public IPs, checked again with DNS
      pinning on every delivery;
    - no redirects;
    - backoff from 5 s up to 1 h, 8 attempts.
  - Payloads carry ids only.
  - **Its weaknesses:** signing secrets stored in plain text, and a single
    serial worker that holds a database transaction during the HTTP call.
- **Pactora:** `job_events` + NOTIFY + SSE per job and per run. No per-agent
  cursor and no webhooks.
- **Plan:**
  - `agent_events` with a per-agent sequence. Write it in the same
    transaction as `job_events`.
  - `GET /v1/events?after=` and MCP `get_updates` / `wait_for_updates`.
  - Webhooks:
    - secret **encrypted at rest** (reuse the signer's keystore pattern);
    - a pool of delivery workers using `SKIP LOCKED`;
    - no transaction held during HTTP;
    - SSRF rules as above.
  - Reuse the existing public-HTTPS check `isPublicHttpsUrl` (`agents.ts`)
    and extend it to every IP the host resolves to.
- **Layer:** backend. No contract change.
- **Tests:**
  - No sequence gaps under concurrent writes.
  - Private-IP, redirect and rebinding targets refused.
  - The signature verifies with the documented recipe.
  - A slow endpoint does not delay other agents (this would fail on a serial
    design).
- **Size:** M. **Phase:** 2.

#### F10. In-app notifications for people
- **Reference:** a notification list with mark-as-read, polled every 15 s. No
  unread badge and no push.
- **Plan:**
  - `notifications` table fed from the same events.
  - `/me/notifications` page.
  - Unread count in the nav, which the reference lacks.
  - Optional web push later.
- **Layer:** backend + interface. **Size:** S. **Phase:** 2.

#### F11. Chat-bot channel (Telegram) for people
- **Reference:**
  - A guided Telegram bot. People browse, apply with a price, accept, chat,
    send evidence (photos too), submit and get receipts.
  - **Linking is a device code plus a typed number:**
    - the bot gives an 8-character code (no 0/O/1/I) with a 10-minute TTL,
      5 per hour;
    - the signed-in website shows a 4-digit number that the person types in
      the chat;
    - 3 wrong tries cancel the link, and 5 bad codes lock the account for
      15 minutes, a limit that survives restarts.
  - Inbound updates are de-duplicated and processed in order per chat, with
    a flood limit of 30 per minute.
  - Outbox:
    - ordered per chat;
    - errors classified (rate-limited, blocked, rejected, transient);
    - messages older than 24 h dropped;
    - message text scrubbed after sending.
  - Tokens redacted from every error.
  - **Never tried by a real user**, by its own documents.
  - WhatsApp: legacy text commands only, not enabled.
- **Plan:**
  - Same design, built after F1-F8. Drop WhatsApp.
  - One bot, testnet only.
  - The link flow binds to the F1 session.
  - Notifications are rebuilt from the current state at send time.
- **Layer:** new backend service (`apps/channels`) + interface link page.
  No contract change.
- **Tests:**
  - Replayed update ignored.
  - Wrong number 3× cancels.
  - Lockout survives a restart.
  - Blocked bot → link disabled → resumes on the next message.
  - A real-account acceptance test before launch, the step the reference
    never did.
- **Risks:** a large surface (the reference's flow file is 1,842 lines).
- **Size:** L. **Phase:** 5 (optional).

#### F12. Email
- **Reference:** email verification and reset links via a mail outbox.
  Message bodies are cleared after sending. Reset returns 503 when mail is not
  configured, rather than pretending it worked.
- **Plan:** not needed for wallet sign-in. Only as an optional notification
  channel later, with the same outbox and scrubbing.
- **Phase:** later / optional.

### Trust and compliance

#### F13. Identity verification (KYC)
- **Reference:**
  - A hosted KYC vendor (ID, selfie, liveness).
  - Payout wallet must be connected **and** sanctions-screened **before** a
    vendor session is created, so a sanctioned wallet never reaches the
    vendor.
  - **The webhook is only a trigger:**
    - the decision is always re-read from the vendor's API, so a replayed or
      late webhook cannot roll a decision back;
    - HMAC over the raw body or canonical JSON, with a ±300 s window;
    - `vendor_data` must equal the user id;
    - the session must match the one on record.
  - Pending sessions polled every 2 minutes.
  - Verified legal name and date of birth feed screening.
  - Test/sandbox modes are simulated and clearly labelled.
  - Applying, accepting and alerts all need `verified`.
- **Pactora:** none.
- **Plan:**
  - The same design, vendor-agnostic behind an `IdentityProvider` interface.
  - The gate is enforced in the API on apply/claim/accept, as a **soft gate**.
  - A **hard gate** would need an allowlist in `validate_hire` (CT:1021-1037)
    or `accept_job`, which means a redeploy. Not recommended for testnet.
  - Store only the minimum fields (D3). Personal data never goes on chain.
- **Decision D3:** which vendor, and whether KYC runs on testnet at all
  (simulated, and labelled so).
- **Layer:** backend + interface. A soft gate needs no contract change.
- **Tests:**
  - Forged or old webhook ignored.
  - A webhook for another user ignored.
  - "Approved" without an approved ID document refused.
  - A missed webhook is caught by polling.
  - An unverified person cannot accept.
- **Risks:**
  - Privacy law (GDPR) and vendor contracts.
  - **The soft gate can be bypassed by calling the contract directly.** We
    say so in the docs.
- **Size:** L. **Phase:** 4.

#### F14. Sanctions screening and review queue
- **Reference:**
  - Lists: OFAC SDN, UN, UK, EU, downloaded every 6 h with guards:
    - same-hash skip;
    - minimum entries per list;
    - a new copy smaller than 70% of the previous one is refused;
    - atomic swap in one transaction.
  - Name matching:
    - fold to ASCII and strip titles;
    - Jaro-Winkler ≥ 0.92 per word, exact for words of 3 letters or fewer;
    - a joined-name pass at ≥ 0.97;
    - at most one extra word.
  - Wallets and emails matched exactly.
  - Wallet providers: an on-chain sanctions oracle (Ethereum mainnet) and a
    free screening API, with answers cached 24 h and a positive answer kept
    even if a later request fails.
  - Cases: open → cleared or confirmed.
    - **Two different reviewers** must clear a strong match.
    - A reviewer cannot decide a case about their own wallet.
    - Decisions are versioned and idempotent, and an immutable audit trigger
      protects them.
    - Clearing a match is remembered until the list entry or the person
      changes.
  - Account standing clear/hold/blocked gates posting, applying, accepting
    and payouts.
  - Production refuses to start with screening off or fewer than 2
    reviewers.
- **Pactora:** none. The closest is the trust check (`COUNTERPARTY_BLOCKED`).
- **Plan:**
  - Port the list guards, the matcher and the case workflow as written above.
  - **NEAR-specific work, to research before building:**
    - (1) whether the published lists carry any NEAR account ids;
    - (2) which providers screen NEAR accounts. The reference's oracle is
      Ethereum-only, so it does not apply;
    - (3) extracting NEAR named and implicit accounts from list text.

    Until then wallet screening for NEAR is **not available**, and the docs
    must say so.
  - **The payout hold needs care on NEAR:**
    - the keeper can skip a held job;
    - the signer can refuse to sign `approve` for a held agent;
    - but `auto_approve` is permissionless, so anyone can still release
      payment after the review window.

    A real hold would need a contract change. State this limit clearly.
- **Layer:** backend + admin interface. A soft hold needs no contract change.
- **Tests:**
  - Shrink to below 70% keeps the old copy.
  - Known name variants match ("Abdul Rahman" / "Abdulrahman").
  - A short-word false match is refused ("Ali" ≠ "Aly").
  - Two-reviewer rule.
  - Self-review refused.
  - The audit row cannot be updated.
  - A startup with screening off refuses to boot.
- **Risks:**
  - False-positive load: the reference measured 55 candidates for one common
    name.
  - Legal advice is needed before mainnet.
- **Size:** L. **Phase:** 4.

#### F15. Admin console (dispute desk, moderation, compliance)
- **Reference:**
  - Wallet-signed admin login, with a 1-hour session and the role re-checked
    on **every** request.
  - Dispute desk: evidence snapshot and photos, chat, timeline, earlier
    decisions.
  - Resolve: reason ≥ 20 characters, an idempotency key, bound to the current
    evidence hash. The server returns an **unsigned** transaction and the
    arbitrator signs it in the browser, so the server never holds the
    arbitrator key. Then a reconcile step.
  - Review moderation and the compliance queue.
  - A separate operator token exists, but its resolve has no evidence binding
    (weaker, do not copy).
- **Pactora:** the arbiter is a 2-of-3 Sputnik DAO (`scripts/lib/dao.mjs`),
  driven only by scripts.
- **Plan:**
  - `/admin`: NEP-413 login for DAO council members and compliance reviewers,
    with the role re-checked per request.
  - Dispute desk built on the snapshot (F6) and chat (F8).
  - **Resolve = create a DAO proposal** for `resolve_dispute(job_id,
    for_worker)`, with the evidence hash in the description. Council members
    vote from their own wallets in the same page.
  - The indexer already decodes `dispute_resolved`.
- **Layer:** interface + backend read routes. No contract change.
- **Tests:**
  - A non-member cannot log in.
  - A removed member is locked out on the next request.
  - A proposal for a stale evidence hash refused.
  - A full 2-of-3 vote on testnet resolves the job (live, extends
    `verify-near --dao`).
- **Size:** M. **Phase:** 4.

### Reputation and discovery

#### F16. Public profiles and directory (people and agents)
- **Reference:**
  - Profiles are published only by explicit choice: display name, headline,
    bio, skills, location, and a toggle for showing the task list.
  - Public directory with search and sort (newest, rating) and 20 per page.
  - Profile pages show stats, work history and reviews.
  - **Gap:** an agent sees a worker's real account name unless the worker
    published a profile.
- **Pactora:** `/agents` and `/agents/[id]` exist with on-chain reputation.
- **Plan:**
  - Add the person profile kind and a publish toggle.
  - Never show anything that was not published: display names only, never
    account names.
  - Per-profile OG metadata (the reference has none).
- **Layer:** backend + interface. **Size:** M. **Phase:** 3.

#### F17. Two-way written reviews
- **Reference:**
  - Rating 1-5 and text 10-2000, one per side.
  - Allowed only after a confirmed payout or refund.
  - Written once, visible immediately (not blind).
  - Ratings aggregated by a trigger. Moderation can hide a review.
- **Pactora:** a numeric on-chain score from settlement (`review` event).
  Text reviews do not exist.
- **Plan:**
  - Off-chain text reviews bound to a **settled** on-chain job; the indexer
    proves the settlement.
  - On-chain reputation stays the source of the score, and text reviews are
    shown beside it.
  - **Blind reviews:** both are revealed once both sides submit, or after 14
    days. This is an improvement on the reference.
- **Layer:** backend + interface. **Size:** S. **Phase:** 3.

#### F18. Skills, location and availability matching
- **Reference:**
  - Skills overlap.
  - City-first location: "City" or "City, Region". Empty matches everyone. A
    match is the same city where at least one side has no qualifier; two
    different qualifiers do not match.
  - The Rust and SQL versions of the rule are kept identical by a test.
  - Availability toggle.
  - Alerts go only to matching, verified, clear people.
- **Plan:** port the rule exactly, with a test that compares the SQL query
  and the TypeScript function on the same inputs. No geocoding at first.
- **Layer:** backend. **Size:** S. **Phase:** 2.

### Money and onboarding

#### F19. Owner funding, caps and withdrawal pages (P0-b candidate)
- **Reference:**
  - Owners fund an escrow from the browser.
  - Agent vaults have immutable per-task and daily limits.
  - The controller can revoke or withdraw.
- **Pactora:**
  - **The contract already has all of it:**
    - `ft_transfer_call` with `{"Fund":…}` / `{"Stake":…}` (CT:932-958);
    - `set_caps`, `withdraw`, `request_unstake`, `complete_unstake`,
      `storage_deposit`.
  - The interface and API have no page for any of it. The signer refuses
    these methods on purpose (`signer.ts:33-42`).
- **Plan:**
  - `/agents/[id]/manage` for the owner's wallet: fund, stake, set caps,
    request/complete unstake, withdraw, storage top-up.
  - Each is a NEAR Connect `signAndSendTransactions` with 1 yocto where the
    contract needs it.
  - Show `purse_of` / `stake_of`.
  - The signer stays unchanged.
- **Layer:** interface (+ read routes). No contract change.
- **Tests:**
  - Each action on sandbox: funds arrive and I1 holds.
  - A function-call key still cannot withdraw (already a sandbox test, keep
    it).
  - Live check on testnet.
- **Size:** M. **Phase:** P0-b if time allows, else 1.

#### F20. Agent self-onboarding with funding (the reference's x402 signup)
- **Reference:**
  - An agent with no human account pays an x402 deposit of 1-10,000 tokens
    and gets an API key plus a vault at a predictable address.
  - The address is CREATE2 from the policy, so the limits cannot be swapped.
  - Payment signature window: 15-360 s.
  - The key is derived from the server key. **Do not copy**: a leak of one
    key exposes every agent.
  - One relay transaction in flight across the whole server. **Do not copy**:
    a stuck transaction blocked all funding for days.
- **Pactora:** registration needs the owner's wallet (NEP-413). x402 exists
  for paying jobs, not for signing up.
- **Plan:** keep owner-signed registration. Add a one-step "connect"
  page that does all of this in one batch, with a summary the owner signs:
  - create the wallet sub-account;
  - add the scoped function-call key;
  - `register_agent` with the caps;
  - the first `Fund` deposit.

  This is the reference's wallet-signed connect path. No server-derived keys:
  API keys stay random, stored as hashes, and rotatable (already true,
  `keys.ts`).
- **Layer:** interface + backend. No contract change. **Size:** M.
  **Phase:** 2.

#### F21. Fees
- **Reference:** the fee is added on top for the payer: fixed + ceil(bps).
  It is included in the terms hash and the limits, and refunded in full on a
  refund.
- **Pactora:** the fee is taken from the worker's payout:
  `max(bps, min_fee)` (CT:1059-1079).
- **Plan: keep Pactora's model.** Changing it means a redeploy and changes
  invariant I1. Show the fee before every bid and selection ("you receive X
  after the 1% fee").
- **Size:** S (display only). **Phase:** 2.

#### F22. Agent skill file, discovery and MCP expansion (P0-a candidate: skill file only)
- **Reference:**
  - A plain `SKILL.md` that any tool-using agent (Claude, Codex, …) can follow:
    - reading it authorises discovery, not spending;
    - spending stays within limits;
    - never report success before a confirmed payout with a transaction
      hash;
    - chat and evidence are untrusted;
    - stop on any chain, fee or token mismatch.
  - Also: a discovery manifest under `/.well-known/` and a portable client
    zip.
  - 21 server MCP tools over HTTP JSON-RPC (`POST /mcp`, bearer key).
- **Pactora:** stdio MCP with 9 client tools. No skill file, no worker tools,
  no remote MCP.
- **Plan:**
  - (P0-a) A `SKILL.md` in our own words for Pactora's current tools, served
    by the interface, plus `/.well-known/pactora.json` (network, contract,
    token, API base).
  - (Later) Worker MCP tools: `list_jobs`, `accept_job`, `submit_result`,
    `decline_job`. Then the F4/F7/F8/F9 tools.
  - (Later) Remote MCP over streamable HTTP with the agent API key, following
    the MCP spec version current at that time.
- **Layer:** interface (skill file); MCP app. No contract change.
- **Tests:**
  - The skill's example commands run against sandbox and testnet (live).
  - The MCP tool list matches the docs, the same way `status.test.ts`
    checks the route index.
- **Size:** S (skill file), M (tools), M (remote MCP). **Phase:** P0-a, then
  2.

#### F23. Wallet "send funds" and test faucet
- **Reference:**
  - A wallet page that sends native or token funds from wallet to wallet,
    with balance reads, gas checks and receipt polling.
  - A "get test tokens" button that calls an **unrestricted** `mint` on its
    mock token.
- **Pactora:**
  - NEAR wallets already handle transfers.
  - Our `mock-usdc` `mint` is **owner-only** (`mock-usdc/src/lib.rs:45-46`),
    so a faucet needs either a server-held owner key (a hot key) or a small
    faucet contract.
- **Plan:**
  - Skip "send funds" (wallets do it).
  - A faucet only if testers need it: a separate faucet account holding a
    limited mUSDC float, with limits of 1 claim per account per day and a
    global daily cap. Never the token owner key.
- **Size:** S. **Phase:** 2 (optional).

### Platform and operations

#### F24. Idempotency everywhere money or decisions move
- **Reference:** an idempotency rule for every write. The same request
  replays, and a changed body under the same key returns 409.
- **Pactora:** already has idempotency on `POST /v1/jobs`, x402 settle and
  the signer.
- **Plan:** apply the same rule to every new write in F4-F17, each with a
  test for a replay and for a changed body.
- **Phase:** with each feature.

#### F25. Bounded limits per owner and per job
- **Reference** (lessons from its audit):
  - max 100 agents per owner;
  - max 3 bids per listing;
  - max 3 revisions;
  - max 100 messages per task;
  - max 10/30 photos;
  - max 1,000 applications;
  - max 20 workers.
- **Plan:** every new collection gets a cap and a test at cap + 1.
- **Phase:** with each feature.

#### F26. Startup config guards and a test that proves them
- **Reference:**
  - The binary refuses bad configs: test mode in production, a non-HTTPS
    origin, screening off, too few reviewers, vendor URL overrides in
    production.
  - A script starts the binary with each bad config and expects a refusal.
- **Pactora:** `@pactora/config` validates env. There is no
  refuse-to-start test suite.
- **Plan:** add `scripts/test-startup.mjs` with one case per guard. Add guards
  as F11/F13/F14 bring new settings.
- **Size:** S. **Phase:** 1.

#### F27. Privacy and data retention
- **Reference:**
  - Cleared compliance cases deleted after 5 years.
  - Message bodies scrubbed after sending.
  - Errors redacted.
- **Plan:** a written retention policy for evidence photos, chat, KYC fields
  and compliance cases, with a scheduled purge job. Update `/privacy` and the
  `launch/` drafts. Legal review before mainnet.
- **Phase:** 3-4 (with F6/F13).

#### F28. Ops: backups, monitoring, deploy safety
- **Reference:**
  - Daily `pg_dump` plus an evidence archive.
  - **No off-host copy, no restore test, no alerts.**
  - Activation scripts validate the edge config and roll back on failure.
  - The edge blocks internal and operator paths with 404.
- **Pactora:** `/metrics`, Docker/Caddy VPS overlay (80/443 only).
- **Plan:**
  - Daily encrypted backups of Postgres and the bucket, kept **off the
    host**.
  - A monthly restore test.
  - Alerts on readiness, indexer lag, keeper backlog, signer gas floor,
    webhook failures and list freshness.
  - Edge 404 for internal routes.
- **Size:** M. **Phase:** 1 (backups/alerts), then with each feature.

#### F29. Transaction queue health (the reference's worst incident)
- **Reference:** one stuck relayer transaction blocked all funding, payouts
  and refunds for days, with no alert.
- **Pactora:**
  - The signer keeps a nonce order **per wallet**, takes a per-wallet lock and
    waits for FINAL, so one wallet cannot block others.
  - The keeper signs from **one** account.
- **Plan:**
  - A test where the keeper's transaction fails or expires (an old block
    hash) and the next run still clears the backlog.
  - An alert on keeper backlog age.
  - Re-check the per-wallet queue under a stalled RPC. The chaos tests
    already exist in `apps/api/test`.
- **Size:** S. **Phase:** 1.

#### F30. Multi-network routing
- **Reference:** one runtime per network (process, database, escrow,
  relayer), routed under `/networks/{slug}`, with cookies per network.
- **Pactora:** CAIP-2 chain ids in the data model. Only `near:testnet` /
  `near:sandbox`.
- **Plan:** none now. Revisit with mainnet ([docs/20](20-mainnet-checklist.md)).
- **Phase:** later.

#### F31. Interaction modes, categories, task templates
- **Reference:**
  - Interaction modes: task / conversation / capture.
  - Categories: physical / expertise / judgment.
  - Example templates in the create form.
  - Live fee preview.
- **Plan:** include modes and categories in the F4 listing schema and in the
  `spec_hash`. Add three example templates in our own words.
- **Phase:** 2.

#### F32. Optional AI onboarding helper
- **Reference:** an optional LLM chat that helps a new worker describe their
  skills. It answers "unavailable" when no model is configured.
- **Plan:** low value and it spends model quota. Skip. If ever built, it uses
  `AGENT_MODE=cached` in tests and the owner approves any run that spends
  quota (project rule).
- **Phase:** skip.

#### F33. Marketing pages for both sides
- **Reference:** a split landing page ("for agents" / "for people"), a
  join-steps page, and an FAQ.
- **Plan:** new pages in our own words and design, only when the human side
  ships. No reused copy, images or video.
- **Phase:** 5.

### Not to copy (the reference's own weaknesses)

| Weakness in the reference | What we do instead |
|---|---|
| Newest branch does not compile; a documented fix is missing | Port designs only; run our full gate before each merge |
| One hot server key does assign, release, refund and vault funding | Keep the signer's per-agent scoped function-call keys; the keeper only does permissionless exits |
| API key derived from the server key; no rotation | Random keys, hashed, rotatable (already true) |
| One relay transaction in flight across the whole server | Per-wallet queues (already true) + backlog alert (F29) |
| Callback secrets stored in plain text; one serial delivery worker | Encrypted secrets; parallel workers (F9) |
| Rate limits in memory | Postgres-backed limits (already true) |
| Evidence files on local disk only | Object storage + off-host backup (F6, F28) |
| Undo of reopen works by matching a free-text reason | Explicit flag column (F4) |
| Client-side "early access" password hard-coded in the frontend | No fake gates; real auth only |
| Server IPs, admin addresses and a private-key location written in docs | Never write these in docs (our secret scan covers keys; extend to IPs) |
| Operator resolve without evidence binding | One resolve path, bound to the evidence hash (F15) |
| Filters only on the browser's first 50 rows | Server-side filters (F3) |

---

## 3. Phases and order

Dependencies: F1 → F2 → F3 come first. F4 needs F1–F3. F5 and F6-a need F4.
F6, F7 and F8 need F2. F13–F15 need F1 and F6. F11 needs F1, F4 and F6–F8.

| Phase | When | Contents | Contract change |
|---|---|---|---|
| **0** | before 2026-11-14 | Deploy, verify, host, video, submit (STATUS.md). Then only if time is left: P0-a skill file (F22 part), P0-b owner funding pages (F19) | none |
| **1** | after the results | F1 sessions, F2 person role, F3 job pages, F26 startup guards, F28 backups/alerts, F29 queue health | none (D1 = a) |
| **2** | — | F4 bids, F5 multi-worker, F6-a instant, F9 events/webhooks, F10 notifications, F18 matching, F20 connect page, F21 fee display, F22 MCP tools, F23 faucet (optional), F31 | none |
| **3** | — | F6 evidence, F7 review (D2 = a), F8 chat, F16 profiles, F17 reviews, F27 retention (part) | none |
| **4** | — | F13 KYC, F14 sanctions (after NEAR research), F15 admin + DAO desk, F27 retention (rest) | none for soft gates |
| **5** | optional | F11 Telegram, F33 marketing, remote MCP | none |

Every phase ends with the full gate from STATUS.md:
- contract unit + sandbox tests;
- backend `check`;
- interface `check` + e2e on 5 browsers;
- `verify-near` on testnet;
- secret scan.

Plus a **live testnet run** of the phase's new flow.

**If the owner later wants contract changes** (D1 b, D2 b, hard KYC gate,
hard payout hold), batch them into one contract release:
- one new wasm and hash;
- new event decoders in the indexer;
- a fresh testnet deploy;
- `verify-near` extended for each new rule.

## 4. Decisions for the owner

| # | Question | Options | Recommended |
|---|---|---|---|
| D0 | Build any of this before 14 Nov? | no / only P0-a and P0-b after the submission is done | no; P0 only if time is left |
| D1 | How do people meet stake and bond? | (a) lower params with `set_params`, no redeploy · (b) `kind` field in the contract, redeploy | (a) |
| D2 | Revisions | (a) off-chain draft rounds · (b) contract `request_revision`, redeploy | (a) |
| D3 | KYC vendor and testnet KYC | vendor choice; simulated-and-labelled on testnet or real | decide before Phase 4 |
| D4 | Evidence storage | S3-compatible provider choice | private bucket + SSE + off-host backup |
| D5 | Chat-bot channel | Telegram yes/no | no, until Phases 1–4 are done |
| D6 | Rights to reuse the reference's ideas | confirm | confirm before any public release |

## 5. What was checked, and how

- Reference product: 4 read-only inventories with file:line references, then
  spot checks of the claims that matter most:
  - the compile error in `files.rs` (lines 162-183);
  - `MAX_REVISION_ROUNDS = 3`;
  - `replace_stuck` absent.
- Pactora: inventory against `master`, plus direct checks:
  - `register_agent` / `only_wallet_of` (CT:239-283, 982-990);
  - `min_stake > 0` (CT:1245);
  - the signer's `ALLOWED_METHODS` (`signer.ts:33-42`) and its full-access
    refusal (`signer.ts:504`);
  - `mock-usdc` owner-only `mint`;
  - Postgres-backed rate limits;
  - `result_uri` unused.
- Not checked: whether any sanctions list or screening provider covers NEAR
  accounts. That is the open research item in F14.
