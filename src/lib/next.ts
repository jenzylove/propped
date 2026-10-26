// The agent's next move: reads the pitch board and keeps working the campaign.
// Declined sets are swapped for the next best candidate, silence gets a follow up, a reply gets an answer,
// shipped product gets a watch plan from the real air dates, and a placement on screen switches the TV campaign on.
import "server-only";
import { chat, parseJson } from "./llm";
import { tvInfo } from "./enrich";
import { addressed, contactFor, type Move, type Plan, type Placement } from "./plan";
import type { Board } from "./board";

const RULES = "Plain words, no dashes, no hyphenated words. Never invent facts about episodes, characters, people or the brand's history.";

async function write<T>(prompt: string, maxTokens = 900): Promise<T> {
  const { message } = await chat(
    [
      { role: "system", content: `You write short, warm, professional notes for a small brand pitching free product to TV set decoration teams. ${RULES} Reply with JSON only.` },
      { role: "user", content: prompt },
    ],
    { json: true, think: false, maxTokens },
  );
  return parseJson<T>(message.content);
}

const when = (d: string | null) =>
  d ? new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }) : null;

export async function nextMoves(plan: Plan, board: Board): Promise<{ plan: Plan; moves: Move[] }> {
  const moves: Move[] = [];
  const at = new Date().toISOString();
  const add = (show: string, kind: Move["kind"], summary: string) => moves.push({ at, show, kind, summary });
  const placements: Placement[] = [...plan.placements];
  const taken = new Set(placements.map((p) => p.show.toLowerCase()));

  for (const p of [...placements]) {
    const stage = board[p.show];
    if (!stage || p.declined) continue;

    if (stage === "declined") {
      const next = (plan.candidates ?? []).find((c) => !taken.has(c.name.toLowerCase()) && c.chance.tier !== "adbuy");
      p.declined = true;
      if (!next) {
        add(p.show, "swap", `${p.show} said no, and no other realistic set is filming right now. Lean on the TV campaign.`);
        continue;
      }
      const contact = await contactFor(next.name, next.tvmazeId, next.network);
      const out = await write<{ why: string; send: string; pitch: string }>(
        `Brand: ${plan.brand}. Its customers' audience: ${plan.audience?.ages.join(", ") || "not known"}, ${plan.audience?.gender ?? ""}.
The show ${p.show} declined. Pitch this show instead: ${next.name} (${next.kind ?? "series"} on ${next.network ?? "TV"}, still filming).
What the brand sent the last show: ${p.send}.
Return JSON with:
"why": one sentence a founder would understand on why ${next.name} fits ${plan.brand} (genre, tone, its viewers), no ages, no field words;
"send": what to send, product and quantity, short;
"pitch": a letter of 90 to 140 words to the show's set decoration and props team. Suggest one or two natural places the product could sit in a scene, matched to the show. Say the product is free with no paid placement required, offer to ship within a week, sign off from ${plan.brand}.`,
      );
      const swap: Placement = {
        show: next.name,
        network: next.network,
        status: next.status,
        company: contact.company,
        poster: next.poster,
        why: String(out.why ?? "").slice(0, 300),
        send: String(out.send ?? p.send).slice(0, 200),
        pitch: addressed(String(out.pitch ?? ""), contact.recipient.greeting),
        chance: next.chance,
        recipient: contact.recipient,
        site: contact.site,
        replaces: p.show,
      };
      p.replacedBy = next.name;
      taken.add(next.name.toLowerCase());
      placements.push(swap);
      add(p.show, "swap", `${p.show} said no. Swapped in ${next.name}, the next best set still filming, with a new letter.`);
    } else if (stage === "no_reply" && !p.followUp) {
      const out = await write<{ note: string }>(
        `Brand: ${plan.brand}. A week ago it sent this letter to ${p.show} and heard nothing back:
"""${p.pitch}"""
Return JSON with "note": a follow up of 50 to 80 words. Open with "${p.recipient?.greeting ?? "Dear set decoration team"},". Be brief and kind, restate the free offer in one line, make it easy to say yes (reply with an address and we ship), sign off from ${plan.brand}.`,
      );
      p.followUp = String(out.note ?? "").slice(0, 900);
      add(p.show, "follow_up", `No reply from ${p.show}. Wrote a short follow up.`);
    } else if (stage === "replied" && !p.replyNote) {
      const out = await write<{ note: string }>(
        `Brand: ${plan.brand}. The set decoration team of ${p.show} replied with interest to this letter:
"""${p.pitch}"""
Return JSON with "note": an answer of 60 to 100 words. Thank them, confirm exactly what ships (${p.send}), ask for the shipping address, a contact name and any clearance or release forms the production needs, promise shipping within a week, sign off from ${plan.brand}.`,
      );
      p.replyNote = String(out.note ?? "").slice(0, 1000);
      add(p.show, "reply", `${p.show} replied. Wrote the answer that confirms shipping and asks for their forms.`);
    } else if (stage === "shipped" && !p.watch) {
      const info = await tvInfo(p.show).catch(() => null);
      const next = when(info?.nextEpisode ?? null);
      p.watch = next
        ? `The next new episode of ${p.show} airs ${next}${info?.network ? ` on ${info.network}` : ""}. Product that goes to set usually shows up in episodes filmed after it arrives, so it may take a few weeks. Ask the props team which episodes it is likely to appear in, and ask before sharing any stills.`
        : `${p.show} has no air date listed yet. Product that goes to set usually shows up in episodes filmed after it arrives. Ask the props team which episodes it is likely to appear in, and ask before sharing any stills.`;
      add(p.show, "watch", next ? `Shipped to ${p.show}. Next new episode airs ${next}.` : `Shipped to ${p.show}. No air date listed yet, so the agent set a watch plan.`);
    } else if (stage === "on_screen" && !p.onScreen) {
      p.onScreen = `${plan.brand} is on screen in ${p.show}. Now launch Step 1, the TV campaign, to the same viewers while the moment is fresh, and ask the production before posting stills on your channels.`;
      add(p.show, "on_screen", `On screen in ${p.show}. The TV campaign is the next move.`);
    }
  }

  const updated: Plan = { ...plan, placements, moves: [...(plan.moves ?? []), ...moves] };
  return { plan: updated, moves };
}
