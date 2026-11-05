# Round 4 — S4: Start, Radar and front door

Local lab implementation on `lab/unified`. No push, deployment, production write or PR.

## Reviewer disposition

| Finding | Result | Implementation / limit |
|---|---|---|
| Sol 3: interrupted Bridge onboarding | Fixed for recoverable local journeys | Public checkpoint per network; restore original backup/phrase in memory, validate receipt address, check funded address or confirmed identity, then continue. Submitted-but-unconfirmed operations stop safely for retry instead of requesting another deposit. Signed transaction/proof recovery is not reconstructed. |
| Opus 8: inconsistent Start destinations / heading | Fixed | Hub doors, nav, map and route links use the focused Testnet itinerary. General Bridge heading describes identity creation and management. |
| Sol 4: Platform health buried on evonodes | Fixed | Core and Platform summaries, observation ages and diagnostics before rewards. Platform status distinguishes failure, syncing, stale, incomplete and absent observations. |
| Sol 10: historical Testnet list | Fixed | Enabled registrations by default; visible All registrations control, explicit sort, URL/reload persistence. Existing explicit filters remain usable. |
| Sol 11: malformed contract choice | Fixed | Recommended choice has content-sized height and padding. |
| Sol 25: hub map detour | Fixed | Map nodes and phone chips launch tools; numbered route context remains in the map. Family links preserve the network, including SVG anchors. |
| Opus 2: hub app promise / test debris | Fixed within hub scope | Apps are labelled Testnet previews; illustrated catalogue is collapsed. App record curation belongs to the app stream. |
| Opus 10: live front-door pulse | Partly | Core reachability and Platform observations with timestamps, overdue/failure states and retry. Payout and protocol summaries were not added. |
| Opus 11: hub length / hierarchy / alignment | Fixed | Six doors align to the finder; empty status band removed; five illustrated sections collapsed; full resource directory moved to `/directory/`. |
| Opus 12: hub taxonomy | Fixed | Nav uses Radar, Governance, Explorer, Start, Apps and Directory. Categories remain catalogue sections. |
| Opus 13: Radar map / stats / denominator | Fixed | Map offset from stats, six tiles, PoSe denominator, tried-address count retained lower on page. |
| Opus 15: Radar terminology | Fixed | Evonode/Masternode and service address agree in title and H1. |
| Opus 23: Bridge funding / Faucet stepper | Fixed | Secondary text disclosure, visible QR and full address, aligned phone step labels. |
| Opus 24: repeated node status / caveats | Fixed | Separate service summaries, identifying H1, voting explanation beside Governance link in a disclosure. |
| Opus 16: Architecture implementation detail | Preserved after inspection | Architecture already introduces the concept in three steps and puts component details in its drawer. The cited unreleased Tenderdash status string is not front-page Architecture copy. |
| Sol 1: family identity story | Pending shared copy | `design/IDENTITY-PAGE.md` was absent at the implementation check. No placeholder explainer or dead `/identity/` link is published. |
| Shared sign-in pattern | Pending documented API | Shell VERSION had reached 1.5.0, but README still documented 1.4.1 and no sign-in explainer API. Bridge key-entry surfaces await that contract. Faucet requests an address; its API portal uses GitHub auth rather than Platform identity keys. |
| Opus 4/21; Sol 16/21/22: shell | Shared integration | Phone lockup, menus and touch targets belong to the director/integration pass. Bridge hides built-in devnets from the public family menu while retaining custom setup. |
| Basics / Vote retirement | Preserved | Existing onward routes, exact network/name forwarding and offline voting explanation retained. |

## Evidence and provenance

These are prior independent review observations compared with new current-state captures, **not a controlled matched-fixture before/after pair**. Live counts and observation times can differ. All new browser work uses the lab read guard with service workers blocked. Disposable unfunded Bridge keys remain in browser/process memory; no phrase screen is captured, no backup is exported and no payout/registration is submitted.

| Surface | Prior evidence | New evidence | Fixture / visible claim |
|---|---|---|---|
| Bridge resumption | `reviews/round3-sol-shots/bridge-return-after-navigation.png` | `shots/r4-s4-journeys/bridge-resume-*.png` | Fresh disposable Testnet address, public checkpoint and backup requirement; recovery to the same address is asserted. |
| Bridge funding | `reviews/round3-sol-shots/bridge-funding.png` | `shots/r4-s4-journeys/bridge-funding-*.png` | New disposable unfunded address; full address and QR shown together. |
| Faucet handoff | `reviews/round3-opus-shots/bridge-faucet-handoff-good.png` | `shots/r4-s4-journeys/faucet-handoff-*.png` | Same new public address forwarded into Faucet; no payout. |
| Hub | `reviews/round3-opus-shots/hub-door-cards-misaligned.png` | `shots/r4-s4/hub/` and `shots/r4-s4-journeys/directory-*.png` | Aligned doors, live observations, collapsed catalogue, separate directory. |
| Radar | `reviews/round3-sol-shots/deep-node-phone.png`, `radar-switched-testnet.png` | `shots/r4-s4/nodes/` | Same public ProTx `d353cdcae53071401345c38ab482935cb62442be2174a1d3210ca356c9017eff`; live observations. Testnet active/all behavior also asserted. |
| Other pages / themes | `shots/round3/` | `shots/r4-s4/{bridge,faucet,arch,basics,vote}/` | Public entry and detail states, 1440 desktop and 390 mobile, light/dark. |

Round-3 source heads: Bridge `6b03a36a27fde31581fa8a314ace0666d8cce044`, Faucet `3cf825c8700c5baee24322b43bc3121da6a88854`, Radar `b9842460d4fa8d2e7b00de3733ad64cdfd231053`, hub `9044191103060eb75f7e1875c006e0535ac9dff3`, Architecture `143496a37a4add30e0e014d3478ea36aae0624e8`, Basics `790f5e6ae714749f93d74c91b7291aeb46fb314a`, Vote `7bbc51bac0133d80957b3b797c1391e767fe8ae5`.

New capture revisions, exact viewport settings and runtime errors are recorded in `shots/r4-s4/report.json` and `shots/r4-s4-journeys/report.json`; those reports are authoritative for their images. The manifest's `baseSha` is the original lab import, not the round-3 comparison revision. Evidence stays local. Every final PNG was opened and inspected at original resolution. Failure-state images deliberately block the public Radar read; contract-choice images use a simple imported public schema fixture.

## Validation and review

- All seven sites rebuilt with `lab/build.sh`; Bridge includes TypeScript compilation and all three Vite bundles.
- Bridge: final full suite passed (831 tests across 52 files); focused recovery, UI and key eligibility suite also passed (37 tests), plus TypeScript check.
- Faucet: 297 tests and typecheck passed. Radar: 21 Worker/browser-helper tests passed. Vote: 11 tests and lint passed.
- Hub, Architecture and Basics have no package-managed unit/type/lint suite; changed static scripts pass Node syntax checks and copy builds.
- Copied shell `start.test.mjs` could not import the lab Playwright dependency from its relative path. This is a baseline vendored-test path issue, not a passing check.
- Guarded journeys passed all 16 combinations (four journeys × phone/desktop × light/dark), including contract-choice sizing, touch stepper alignment and forced network failure/retry, with zero blocked writes and zero page errors. All 72 manifest captures returned HTTP 200 with zero console/page errors, blocked writes or horizontal overflow. Faucet was recaptured after the touch-specific alignment correction.
- Live funded identity creation, paid username submission and authenticated Faucet payout are outside the read-only proof. Submitted transactions with no confirmed identity are deliberately not reconstructed from partial browser metadata.

Direct code-review-validator four-pass review: correctness, maintainability, architecture and security/reliability. Corrections applied: safe backup-allowance boolean validation, async cancellation guard, eligible active/nonrestricted authentication-key checks, repeated-resume username retention, standalone-shell fallback and invalid observation timestamps. No unresolved release-blocking finding; **APPROVED WITH SUGGESTIONS**, subject to the stated live-write limits and shared-spec dependencies.

Code-simplifier review removed stale directory-opening logic, reused the existing login-key validator, and kept the public checkpoint as an allowlisted record. No new transaction recovery abstraction or shell fork was introduced.
