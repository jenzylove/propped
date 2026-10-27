# Security

## What Propped holds

| Thing | Where it lives | Who can see it |
|---|---|---|
| Qloo API key | Server environment only (`QLOO_API_KEY`) | Never sent to the browser. Every Qloo call runs in server only modules (`src/lib/qloo.ts`, `src/lib/shows.ts`, `src/lib/plan.ts`). |
| Language model key | Server environment only (`LLM_API_KEY`, `LLM_BASE_URL`) | Never sent to the browser. |
| Blob storage token | Vercel environment only | Never in the repo. |
| Plans and pitch boards | Vercel Blob, public files under `plans/` and `boards/` | Anyone with a plan's link. Plans hold a brand name, public show facts and letters, never personal data. |

No accounts, no sign in, no cookies, no analytics, and no personal data. Qloo works on anonymous taste patterns; Propped never sees or stores a person.

## Guards in place

- **Rate limits per visitor:** 6 new plans, 20 next moves and 10 copies an hour, because each plan and next move calls a paid model.
- **Read only sample:** the shared sample plan refuses board changes and next moves (HTTP 403). Visitors try the agent on their own copy, so one visitor can never change what the next one sees.
- **Input checks:** brand names are trimmed and capped; plan ids must match `^[a-z0-9-]{3,60}$`; board updates must name a show that is in the plan and a known stage.
- **The agent can't invent facts:** shows, networks, air dates, production companies and platform rules come from Qloo, TVmaze, Wikipedia and code. The model only chooses among real candidates and writes the words, and code rejects any pick outside the candidate list.
- **Propped never acts for you:** it writes letters and settings; it never sends an email, contacts a production or buys an ad.
- **No stale writes:** every save is a new file, never an overwrite, so two visitors can't silently undo each other's board.

## Reporting a problem

Please open a private report through GitHub's **Report a vulnerability** button on this repository's Security tab, or open an issue for anything that isn't sensitive. Include the page or endpoint, what you did and what happened.
