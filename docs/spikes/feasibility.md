# Feasibility spikes, run before any product code (2026-10-25)

Every unknown that could block the build, tested against the real services.

| # | Question | What was run | Result | Verdict |
|---|---|---|---|---|
| 1 | Does Qloo know small and mid brands? | Qloo `/search` for 45 DTC, food, drink, beauty and home brands | 41 of 45 found. Missing: Graza, Fishwife (very small). AG1 resolves as "AG1 Energy"; "Prime Hydration" collides with Amazon Prime Video | Pass. Missing brands must show a clear "not in Qloo yet" state and accept a similar brand instead |
| 2 | Do different brands get different shows? | `/v2/insights` filter.type tv_show for each found brand, top 20, mean pairwise overlap | Mean overlap 4.5%; 17 of 820 pairs overlap above half. A few shows recur for many food and lifestyle brands (Somebody Feed Phil 10 brands, Stanley Tucci 9) | Pass. Rank by how specific a show is to the brand (down weight shows common across brands), not raw affinity |
| 3 | Can shows be matched to status, network and posters? | TVmaze singlesearch (free, no key) for 32 Qloo show names | 32 of 32 matched, all with posters; 10 running, several "to be determined" (renewal pending), rest ended | Pass |
| 4 | Does Qloo have audience age and gender for shows? | `/v2/insights` filter.type demographics on a show | Yes (It's Always Sunny: 35 to 54, male lean) | Pass. Enables "your customers and this show's viewers are the same people" |
| 5 | Can the production company be found for free? | Wikipedia API infobox `company` field | Found for 23 of 32; text needs cleaning | Pass with fallback to the network |
| 6 | Can small advertisers buy specific shows? | Universal Ads and Amazon streaming TV ads docs and coverage | No show level targeting for self serve. Universal Ads: viewers of content genres, demographics, location from about $100. Amazon: genres and curated title groups, no minimum | Changes the ad plan: shows become the evidence, genres and networks become what you buy |

Earlier head to head (same day): asked which shows a brand's customers watch, Qwen alone refused for 7 of 8 brands ("proprietary research"); Qloo answered all 8.

Scripts and raw output: `propped-launch/` (outside the repo).
