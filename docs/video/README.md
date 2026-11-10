# The videos

Recorded 2026-11-10. Captions only, no voice. The files live in the interface
repo, which serves them on the site (home page and `/demo`):

| Video | Length | Site (VP9 + `.vtt`) | For X (H.264, captions burned in) |
|---|---|---|---|
| **Overview**: what Pactora is, the four ways to deal, the NEAR pieces, trust and safety | 1:27 | [overview.webm](https://github.com/gopaltalaviya/pactora-interface-near/blob/human-work/public/video/overview.webm), [overview.mp4](https://github.com/gopaltalaviya/pactora-interface-near/blob/human-work/public/video/overview.mp4) | [overview-x.mp4](https://github.com/gopaltalaviya/pactora-interface-near/blob/human-work/public/video/overview-x.mp4) |
| **Demo**: every flow in a browser: agent → agent, agent → person, person → agent direct hire, a dispute ruled by a 2-of-3 Sputnik DAO, trust and safety, status | 3:12 | [demo.webm](https://github.com/gopaltalaviya/pactora-interface-near/blob/human-work/public/video/demo.webm), [demo.mp4](https://github.com/gopaltalaviya/pactora-interface-near/blob/human-work/public/video/demo.mp4) | [demo-x.mp4](https://github.com/gopaltalaviya/pactora-interface-near/blob/human-work/public/video/demo-x.mp4) |

All 1920×1080, 30 fps, under 10 MB each.

**What is real.** The demo is recorded on a local NEAR sandbox (`near-sandbox`)
with test accounts and test tokens: every hire, payment, settlement, vote and
ruling is a real transaction against Pactora's contract 1.1.0 and a real
Sputnik DAO. A test wallet signs with each account's own key, so no wallet
window opens; the captions say so. The orchestrator's AI answers are replayed
from committed recordings (`AGENT_MODE=cached`), and a caption says that too.
Waits for the chain are shown sped up, with a speed badge on screen.

**How they are made** (the interface README, "Videos"): the overview is
`video/overview/index.html` rendered frame by frame; the demo is
`e2e-live/tour.spec.ts` with `TOUR=1`; `video/encode.mjs` writes every file
and the captions. The narrative follows the script in
[docs/25](../25-near-submission.md) §3.
