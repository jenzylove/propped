# Propped: build plan

All blocking unknowns were spiked first (see `docs/spikes/feasibility.md`). No open "needs a spike" items remain.

## Stack

Next.js 15 (patched), TypeScript, on Vercel · Qloo hackathon API, server only · Qwen 3.8 Max through the Bitget gateway (OpenAI compatible, `enable_thinking:false`, streaming) · TVmaze (free, no key) · Wikipedia API (free) · Vercel Blob for saved results · Vitest, Playwright.

Reused, reviewed code from the Civic repo: the Qloo client (retries, cache, call log), the Qwen streaming client, the agent tool loop shape, the Blob save and load.

## Phases

| # | Phase | Who | Done when |
|---|---|---|---|
| 0 | Repo, scaffold, env vars, first deploy | Me | Live URL serves the scaffold |
| 1 | Core logic, pure and tested: specificity ranking, demographic match, shared tastes, show enrichment parsing | Me | Unit tests pass on saved Qloo and TVmaze data |
| 2 | Reference brand set (40 brands) built and stored by script | Helper | `data/reference.json` committed; overlap statistic reproduced |
| 3 | API: `/api/shows?brand=` (Qloo, rank, enrich via TVmaze and Wikipedia) | Me | Liquid Death and Brightland return ranked, enriched shows in under 20s cold |
| 4 | Model comparison endpoint (same question to Qwen, live) | Helper | Returns the model's answer; never hardcoded |
| 5 | Agent: placement pack and ad plan, streamed | Me | Plan for a running show and an ad plan with only genres, networks, demographics, location |
| 6 | Frontend: home input, poster wall, model panel, agent page | Helper builds to my design spec; I review screenshots | Real brands render on desktop, phone, light, dark |
| 7 | Saved public results and method page | Helper | Result URL loads with call log |
| 8 | Proof page: refusal rate across the reference set, overlap statistic | Me (numbers), helper (page) | Numbers computed by script, page renders them |
| 9 | **Gate: you approve the design and test it yourself** | You | Your OK |
| 10 | Release readiness audit, fixes, secrets scan, MIT, repo public | Me plus audit skill | Findings fixed or listed |
| 11 | **Gate: you approve the live product** | You | Your OK |
| 12 | README, Devpost text, then demo video and launch post | Me plus skills | Submitted on Devpost |

## Risks

| Risk | Status | Plan |
|---|---|---|
| Some small brands missing from Qloo | Known (4 of 45) | Clear state plus "pick a similar brand" |
| Generic food and lifestyle shows top many lists | Known | Specificity ranking against the reference set |
| Only about a third of matched shows are still running | Known | Placement pack uses running and renewal pending shows; ended shows still count as taste evidence and for the ad plan |
| No show level ad buying for small advertisers | Known (spike 6) | Ad plan buys genres, networks, demographics |
| Qwen credit runs out during judging | Known | Saved example results never need the model; new plans show a clear message if it's down |
| Qloo quota not published | Known | Cache per brand; precompute the three example brands |
| Wikipedia production company text is messy | Known | Clean parser with tests; fallback to network |
