# Propped: product requirements

Hackathon: Qloo Agentic Hackathon. Deadline Oct 30 2026, 11:45pm EDT (Oct 31 03:45 UTC). All facts below were tested live (see `docs/spikes/feasibility.md`).

## 1. One line

Type your brand. See the TV shows your customers actually watch, then get your product onto those sets or your ad in front of those viewers.

## 2. The problem

- About 95% of TV product placements involve no money. Crews need real products for their sets, and brands send them ([RangeMe](https://www.rangeme.com/blog/how-to-get-product-placement-in-movies-and-tv/)). Doing it yourself means months of cold outreach ([Filmustage](https://filmustage.com/blog/product-placement-in-film-how-it-works-and-how-to-get-it-2026/)); agencies charge big brand prices.
- TV ads opened to small brands: Universal Ads from about $100, Amazon streaming TV ads with no minimum ([Universal Ads](https://www.universalads.com/article/best-tv-advertising-options-for-small-businesses)).
- What no tool tells a small brand: which shows its customers watch. A language model can't either. Asked directly, it refused for 7 of 8 brands because that data is paid research.

## 3. User and front door

**User:** founders and marketers at small and mid consumer brands (food, drink, beauty, home, apparel).

**First ten seconds:** one input, "Your brand". Within about 15 seconds:
1. A wall of show posters: the shows your customers love most, ranked by how specific they are to your brand.
2. On each poster: running, renewal pending or ended; where it airs; one line on why it fits (shared tastes, audience age and gender match).
3. Beside the wall: what a language model says when asked the same question, shown live.
4. One button: "Get on these shows".

## 4. How it works

1. **Find the brand** in Qloo (`/search`, type brand). If it's missing, say so and let the user pick a similar brand they compete with.
2. **Read the shows** (`/v2/insights`, filter.type tv_show, signal the brand, top 50).
3. **Rank for this brand:** score each show by its affinity, down weighted by how many brands in a reference set also get it (so generic food docs don't top every list). Reference set: 40 brands, stored, refreshed by script.
4. **Explain the fit:** Qloo demographics for the brand and the show, compared; plus what both audiences love (shared brands and artists).
5. **Enrich each show** from TVmaze (status, network, genres, poster, next episode) and Wikipedia (production company).
6. **The agent's plan** (Qwen tool loop, streamed step by step):
   - **Placement pack** for running and renewal pending shows: why the show fits, what to send, a pitch letter addressed to the production company's art department, and what to include (product, short brand story, rights note).
   - **Ad plan:** translate the shows into what small advertisers can actually buy: genres, networks and audience (age, gender) on Universal Ads and Amazon streaming TV, with the shows as evidence. Never claims show level buying.
7. **Save** each result as a public page with a run id, the Qloo calls made and the method version.

Counting and ranking are deterministic code; the model only plans and writes.

## 5. Full scope

Home with the live input and three example brands (Liquid Death, Brightland, Parachute) · result page (poster wall, model comparison, fit details) · agent plan page (placement pack and ad plan, streamed) · saved public results · method page · proof page · light and dark · phone width.

Not in scope, with reasons: show level ad buying (platforms don't offer it to self serve advertisers); contacting productions on the user's behalf (the user sends the pitch; no outbound email from us).

## 6. Judging criteria

| Criterion | How |
|---|---|
| Technological Implementation | Brand to tv_show affinity, specificity ranking across a brand reference set, demographics match, shared tastes, TVmaze and Wikipedia enrichment, agent tool loop, saved runs with call logs |
| Design | One input to a wall of real posters in seconds; the model's blank answer beside it; one button to act |
| Potential Impact | Placement is mostly free and TV ads start at $100; choosing the right show is the gap every small brand has |
| Quality of the Idea | Non obvious use of Qloo nobody in the field has built; the model itself says this data is paid research |

**Where Qloo is the hero:** remove it and there is no answer. The model refuses.

## 7. Claims and proof

| Claim | Proof |
|---|---|
| A language model can't answer this | Proof page: the same question to Qwen for every brand in the reference set, refusal rate published |
| Lists are specific to each brand, not generic | Published overlap statistic across the reference set (spike: 4.5% mean) and the specificity ranking |
| Shows are real and current | TVmaze status and links on every poster |
| The fit is about the same people | Qloo demographics for brand and show, shown side by side |
| Plans don't overpromise | Ad plan only names targeting the platforms document (genres, demographics, location) |

Honest limit: there's no free outside answer key for "which shows a brand's customers watch" (the TV ad airing data is paid). The proof page says so.

## 8. What it doesn't do

No personal data. No contacting productions or buying ads for the user. No claims about individuals. No show level ad targeting. Brands missing from Qloo get a clear message, not a guess.

## 9. Sponsor checklist

Becomes `docs/SUBMISSION_CHECKLIST.md`, ticked only from the live app.

## 10. Acceptance tests

1. Typing "Liquid Death" shows a poster wall within 20 seconds, cold.
2. Two different brands from different categories share fewer than 30% of their top 10 shows.
3. Every poster shows status and network from TVmaze, with a link.
4. A brand missing from Qloo shows the "not in Qloo yet" state and accepts a similar brand.
5. "Get on these shows" streams agent steps and ends with a placement pack and an ad plan.
6. The ad plan names only genres, networks, demographics and location as targeting.
7. The model comparison is generated live, not hardcoded.
8. Each result has a public link with the Qloo calls (key removed).
9. The Qloo and Qwen keys aren't in the client bundle, the repo or its history.
10. Light, dark and 390px phone width all work.
