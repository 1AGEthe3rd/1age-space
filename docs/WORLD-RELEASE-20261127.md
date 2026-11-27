# World cities and travel — November 27, 2026 release candidate

Founder authorized publication of the previous city and shared gameplay edits before starting the global airport/city expansion. Production baseline: 62907d943a7222ecd4d34b9ecbf9e5d168527d3b, preserved at backup/before-world-cities-travel-20261127. No history rewrite or existing branch deletion. Keep existing hosting paths; no DNS or World cosmic scene change.

## Integrated source checkpoints
- HQ1 Build 015 / PR #29: b3cb7b737dd26cc9db630cb9151b637267c68be6 (includes Builds 010–014).
- HQ2 shared gameplay / PR #30: 5199ffa565fb3f381892b7f1cacc5330cbb174b3, plus latest facade and Metro airport connection / PR #33: c2b3cbe1999d061d1e96b7ab744a1a45a5440ae5. Reconciled hq2.mjs and streets.mjs against common HQ2 Build 012 a0cc9664521234e2ac4c6b1ff42b56751d7effc5. Preserved newer facade glazing and independent road material. Updated pre-extension Metro test to cover all stops and return to Anacostia rather than obsolete indices (previous CI failure).
- DCA architecture and real-player-only terminal / PR #39: 5aa328ee428d457fc43226baec627e9b6c22d62f. Airport delta applied on shared HQ1 ancestor dc4654c2ce280f14fd77fe124a00eb3e0e0e9263. No NPC passengers. No live identity or multiplayer connection.
- Shared scheduling/travel / PR #38: 7dfc2dc4a4f0ac00279283146f7eaf90e85aa978. Includes Scheduling 001–002 and Travel 003–004. Mounted virtual schedule boards and explicit external flight-search counters in both terminal scenes. Existing manual demo flight mechanics unchanged; no enforced schedule boarding, airline feed, real reservation or fare. DC road demo remains opt-in drivePreview=1. Shared transit service code not deployed; credentials unavailable.

## Release gate
Full existing Space validation, dedicated shared schedule validation, consolidated Node regression tests and browser smoke/screenshot artifact. Actual browser/device verification not implied by fixture/model tests. Production merge only after required checks pass and screenshots are reviewed; verify Pages deployment afterwards. The standalone Space discovery center (PR #20), unrelated apps and World entry changes remain excluded. Do not independently merge the superseded draft stacks; preserve branches as reference. Rollback via reviewed revert of the combined merge relative to its first parent, verify later changes, never force-push. 
