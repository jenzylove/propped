// The Propped agent: reads the brand's shows, picks placements, plans ads, writes pitches.
// Facts (shows, status, networks, genres, audience, platform rules) come from code and data; the model chooses and writes.
import "server-only";
import { chat, type ChatMessage, type ToolDef } from "./llm";
import { brandShows, pool, type BrandShows } from "./shows";
import { AGE_KEYS, type DemoMatch } from "./core/rank";
import { companyOf, setCrew, tvInfo, type ShowInfo } from "./enrich";
import { allowsPlacement, chanceOf, recipientOf, TIER_ORDER, type Chance, type Recipient } from "./placement";
import { companySite } from "./company";

export interface Placement {
  show: string;
  network: string | null;
  status: string;
  company: string | null;
  poster: string | null;
  why: string;
  send: string;
  pitch: string;
  chance?: Chance;
  recipient?: Recipient;
  /** The production company's own website, when Wikidata knows it. */
  site?: string | null;
  /** What the agent did next, driven by the pitch board. */
  declined?: boolean;
  replacedBy?: string;
  replaces?: string;
  followUp?: string;
  replyNote?: string;
  watch?: string;
  onScreen?: string;
}

/** A show the agent can still pitch later, kept so a decline can be swapped for the next best set. */
export interface SavedCandidate {
  name: string;
  rank: number;
  network: string | null;
  kind: string | null;
  poster: string | null;
  status: string;
  tvmazeId: number | null;
  nextEpisode: string | null;
  genres?: string[];
  chance: Chance;
}

export interface Move {
  at: string;
  show: string;
  kind: "swap" | "follow_up" | "reply" | "watch" | "on_screen";
  summary: string;
}

export interface Plan {
  id: string;
  brand: string;
  summary: string;
  placements: Placement[];
  ads: {
    platforms: { name: string; url: string; how: string }[];
    genres: string[];
    networks: string[];
    audience: { ages: string[]; gender: string };
    shows: string[];
    note: string;
    setup?: string[];
  };
  steps: { tool: string; summary: string; ms: number }[];
  qlooCalls: number;
  model: string;
  createdAt: string;
  audience?: { ages: string[]; gender: string };
  candidates?: SavedCandidate[];
  moves?: Move[];
}

/** Who to write to for a show, and where their production office lives on the web. */
export async function contactFor(show: string, tvmazeId: number | null, network: string | null) {
  const [company, crew] = await Promise.all([companyOf(show), setCrew(tvmazeId)]);
  const recipient = recipientOf(show, crew, company, network);
  const site = recipient.company ? await companySite(recipient.company).catch(() => null) : null;
  return { company, recipient, site: site?.url ?? null };
}

export type Step = { tool: string; summary: string; ms: number };

export { PLATFORMS } from "./platforms";
import { PLATFORMS } from "./platforms";

const AGE_TEXT: Record<string, string> = {
  "24_and_younger": "under 25",
  "25_to_29": "25 to 29",
  "30_to_34": "30 to 34",
  "35_to_44": "35 to 44",
  "45_to_54": "45 to 54",
  "55_and_older": "55 and over",
};

export function audienceOf(r: BrandShows) {
  const d = r.brand?.demo;
  if (!d) return { ages: [] as string[], gender: "not known" };
  const ages = AGE_KEYS.filter((k) => (d.age[k] ?? 0) > 0.1).map((k) => AGE_TEXT[k]);
  const m = d.gender.male ?? 0;
  return { ages, gender: m > 0.15 ? "leans male" : m < -0.15 ? "leans female" : "balanced" };
}

// Physical placement needs a live action set: running or awaiting renewal, and not animated.
type Info = Omit<ShowInfo, "company"> & { company?: string | null };
const animated = (i: Info | null) => /anim/i.test(i?.kind ?? "") || (i?.genres ?? []).some((g) => /anim|anime/i.test(g));
export const live = (i: Info | null) => !!i && (i.status === "running" || i.status === "renewal pending") && !animated(i);

interface Candidate {
  name: string;
  rank: number;
  info: Info;
  specific: boolean;
  match: DemoMatch | null;
  chance: Chance;
}

/** Every show Qloo returned that is still filming and live action, rated for how realistic a free placement is. */
async function candidatesFor(data: BrandShows): Promise<{ list: Candidate[]; liveCount: number; total: number }> {
  const ranked = data.ranked ?? data.shows;
  const known = new Map(data.shows.map((s) => [s.id, s]));
  const infos = await pool(ranked, 3, async (r) => known.get(r.id)?.info ?? (await tvInfo(r.name)));
  const list = ranked
    .map((r, i) => ({ r, info: infos[i] as Info | null, i }))
    .filter((x) => live(x.info) && allowsPlacement(x.info!.network))
    .map(({ r, info, i }) => ({
      name: info!.name,
      rank: i + 1,
      info: info!,
      specific: r.specific,
      match: known.get(r.id)?.match ?? null,
      chance: chanceOf(info!.kind, info!.network),
    }));
  const sorted = [...list].sort((x, y) => TIER_ORDER[x.chance.tier] - TIER_ORDER[y.chance.tier] || x.rank - y.rank);
  return { list: sorted.slice(0, 10), liveCount: list.length, total: ranked.length };
}

const TOOLS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "read_shows",
      description: "Read the TV shows this brand's customers over-index on, and the candidates for placement: shows still filming, each with a realistic chance of taking free product (Likely yes, Worth a pitch, Needs an ad buy).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "choose_placements",
      description: "Pick up to 4 shows to pitch for product placement, only from the candidates. Prefer Likely yes, then Worth a pitch; Needs an ad buy shows are refused while two or more realistic candidates exist. For each, one sentence a founder would understand on why it fits: what about the show and its viewers matches the brand (genre, tone, audience fit, made for this brand). Never use field words like renewal pending, still filming, rare for other brands or viewers vs customers. Never list ages or gender; say it in words a person would use, like \"a crowd close to your customers\" when viewers_vs_customers is the same people.",
      parameters: {
        type: "object",
        properties: { picks: { type: "array", items: { type: "object", properties: { show: { type: "string" }, why: { type: "string" } }, required: ["show", "why"] } } },
        required: ["picks"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "plan_ads",
      description: "Plan self serve TV ads. Choose up to 4 genres and up to 4 networks, only from those present in the shows. Platforms only sell genres and audiences, not single shows.",
      parameters: {
        type: "object",
        properties: { genres: { type: "array", items: { type: "string" } }, networks: { type: "array", items: { type: "string" } } },
        required: ["genres", "networks"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "finish",
      description:
        "Finish. For each chosen placement: what to send (product and quantity, short), and a pitch letter of 90 to 140 words. Start it with the exact greeting given for that show in choose_placements, then a comma. The letter should: name the show; suggest one or two natural places the product could sit in a scene, as ideas, matched to the show's genre and tone (for example a bar fridge, a kitchen counter, a gym bag); say the product is free with no paid placement required; offer to ship within a week; sign off from the brand. Don't invent facts about episodes, characters or the brand's history. Never mention ages, gender or audience data in a letter; a set decorator cares about the set, not the targeting. Then a two sentence summary for the founder: which shows to pitch first and what the ads should target. Nothing has been sent or bought yet, so never say secured, booked, placed or guaranteed.",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string" },
          placements: { type: "array", items: { type: "object", properties: { show: { type: "string" }, send: { type: "string" }, pitch: { type: "string" } }, required: ["show", "send", "pitch"] } },
        },
        required: ["summary", "placements"],
      },
    },
  },
];

function showLine(c: Candidate) {
  return {
    show: c.name,
    chance: c.chance.label,
    kind: c.info.kind,
    network: c.info.network,
    genres: c.info.genres,
    rank_for_brand: c.rank,
    rare_for_other_brands: c.specific,
    viewers_vs_customers: c.match?.label ?? "unknown",
  };
}

/** Plain steps to set up the same audience on a self serve TV platform. */
export function adSetup(genres: string[], networks: string[], audience: { ages: string[]; gender: string }) {
  const gender = audience.gender === "leans male" ? ", leaning male" : audience.gender === "leans female" ? ", leaning female" : "";
  return [
    "Open Universal Ads and start a new campaign. It is self serve, from as little as $100.",
    audience.ages.length ? `Audience: people aged ${audience.ages.join(", ")}${gender}.` : "Audience: adults, all ages.",
    genres.length ? `What they watch: ${genres.join(", ")} programming.` : "What they watch: the genres of the shows above.",
    networks.length ? `Networks to favor where offered: ${networks.join(", ")}.` : "Networks: leave open.",
    "Location: only where you ship.",
    "Budget: start with $100 over one week, then keep what works.",
  ];
}

const eq = (a: string, b: string) => a.toLowerCase().trim() === b.toLowerCase().trim();

/** Make sure a letter opens with the right greeting, whatever the model wrote first. */
export function addressed(pitch: string, greeting: string) {
  // Drop any greeting lines the model wrote ("Dear ...", "Hello ...", "Hi ..."), then add the right one once.
  let body = pitch.trim();
  for (let i = 0; i < 3; i++) body = body.replace(/^(dear|hello|hi|hey|greetings|good (morning|afternoon))\b[^\n]{0,80}?(,|\n)\s*/i, "");
  return body ? `${greeting},\n\n${body}` : "";
}

export async function runPlan(brand: string, emit: (s: Step) => void): Promise<Plan> {
  const steps: Step[] = [];
  const record = (tool: string, summary: string, t0: number) => {
    const s = { tool, summary, ms: Date.now() - t0 };
    steps.push(s);
    emit(s);
  };

  const t0 = Date.now();
  const data = await brandShows(brand, { keepRanked: true });
  if (!data.brand) throw new Error(`"${brand}" isn't in Qloo's taste data yet.`);
  record("read_taste", `Read ${data.ranked?.length ?? data.shows.length} shows ${data.brand.name} customers over-index on`, t0);
  const audience = audienceOf(data);
  const allGenres = [...new Set(data.shows.flatMap((s) => s.info?.genres ?? []))];
  // Networks that sell no ads (the BBC, PBS) can't be part of an ad plan.
  const NO_ADS = /^(bbc|pbs\b)/i;
  const allNetworks = [...new Set(data.shows.map((s) => s.info?.network).filter((n): n is string => !!n && !NO_ADS.test(n)))];
  const tc0 = Date.now();
  const cands = await candidatesFor(data);
  const realistic = cands.list.filter((c) => c.chance.tier !== "adbuy");
  const likelyCount = cands.list.filter((c) => c.chance.tier === "likely").length;
  record("read_shows", `${cands.liveCount} of ${cands.total} are still filming; ${likelyCount} of the best are likely to take free product`, tc0);

  let picks: { cand: Candidate; why: string; recipient: Recipient; company: string | null; site: string | null }[] = [];
  let ads: { genres: string[]; networks: string[] } | null = null;
  let done: { summary: string; placements: { show: string; send: string; pitch: string }[] } | null = null;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You plan how a small brand gets its product onto the TV shows its customers watch. Work only through the tools, in order: read_shows, choose_placements, plan_ads, finish. Use only facts the tools return. Plain words, no dashes.`,
    },
    { role: "user", content: `Brand: ${data.brand.name}. Customer audience (use this exact wording if you mention it): ages ${audience.ages.join(", ") || "not known"}, ${audience.gender}.` },
  ];

  for (let turn = 0; turn < 8 && !done; turn++) {
    const { message } = await chat(messages, { tools: TOOLS, maxTokens: 3500, think: false });
    messages.push(message);
    if (!message.tool_calls?.length) {
      messages.push({ role: "user", content: "Continue with the next tool call." });
      continue;
    }
    for (const tc of message.tool_calls) {
      const ts = Date.now();
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(tc.function.arguments || "{}");
      } catch {
        /* empty */
      }
      let result: unknown;
      if (tc.function.name === "read_shows") {
        result = {
          top_shows: data.shows.map((s) => ({ show: s.name, network: s.info?.network ?? null, genres: s.info?.genres ?? [] })),
          candidates: cands.list.map(showLine),
        };
      } else if (tc.function.name === "choose_placements") {
        const want = ((args.picks as { show: string; why: string }[]) ?? []).slice(0, 4);
        const rejected: string[] = [];
        const chosen = want.flatMap((p) => {
          const c = cands.list.find((x) => eq(x.name, p.show));
          if (!c) {
            rejected.push(`${p.show}: not a candidate`);
            return [];
          }
          if (c.chance.tier === "adbuy" && realistic.length >= 2) {
            rejected.push(`${p.show}: needs an ad buy while realistic shows exist`);
            return [];
          }
          return [{ cand: c, why: String(p.why).slice(0, 300) }];
        });
        picks = await Promise.all(
          chosen.map(async (p) => ({ ...p, ...(await contactFor(p.cand.info.name, p.cand.info.tvmazeId, p.cand.info.network)) })),
        );
        result = { accepted: picks.map((p) => ({ show: p.cand.name, greeting: p.recipient.greeting, chance: p.cand.chance.label })), rejected };
        const named = picks.some((p) => p.recipient.person) ? ", with the people who dress their sets" : "";
        record("choose_placements", picks.length ? `Picked ${picks.map((p) => p.cand.name).join(", ")}${named}` : "No shows to pitch right now", ts);
      } else if (tc.function.name === "plan_ads") {
        const g = ((args.genres as string[]) ?? []).filter((x) => allGenres.some((y) => eq(x, y))).slice(0, 4);
        const n = ((args.networks as string[]) ?? []).filter((x) => allNetworks.some((y) => eq(x, y))).slice(0, 4);
        ads = { genres: g, networks: n };
        result = { genres: g, networks: n, audience, note: "Platforms target genres and audiences, not single shows." };
        record("plan_ads", `Ads: ${g.join(", ") || "no genres"} viewers, ${audience.ages.join(", ") || "all ages"}, ${audience.gender}`, ts);
      } else if (tc.function.name === "finish") {
        const ps = ((args.placements as { show: string; send: string; pitch: string }[]) ?? []).filter((p) => picks.some((x) => eq(x.cand.name, p.show)));
        done = { summary: String(args.summary ?? "").slice(0, 600), placements: ps };
        record("finish", `Wrote ${ps.length} pitch letters and the ad setup`, ts);
        result = { ok: true };
      } else {
        result = { error: "Unknown tool" };
      }
      messages.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result).slice(0, 12000) });
    }
  }

  const fin = done as { summary: string; placements: { show: string; send: string; pitch: string }[] } | null;
  if (!fin) throw new Error("The agent didn't finish the plan.");
  const a = (ads as { genres: string[]; networks: string[] } | null) ?? { genres: [], networks: [] };
  const id = `${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30)}-${Date.now().toString(36).slice(-5)}`;
  return {
    id,
    brand: data.brand.name,
    summary: fin.summary,
    placements: picks.map((p) => {
      const w = fin.placements.find((x) => eq(x.show, p.cand.name));
      return {
        show: p.cand.name,
        network: p.cand.info.network,
        status: p.cand.info.status,
        company: p.company,
        poster: p.cand.info.poster,
        why: p.why,
        send: w?.send ?? "",
        pitch: addressed(w?.pitch ?? "", p.recipient.greeting),
        chance: p.cand.chance,
        recipient: p.recipient,
        site: p.site,
      };
    }),
    audience,
    candidates: cands.list.map((c) => ({
      name: c.name,
      rank: c.rank,
      network: c.info.network,
      kind: c.info.kind,
      poster: c.info.poster,
      status: c.info.status,
      tvmazeId: c.info.tvmazeId,
      nextEpisode: c.info.nextEpisode,
      genres: c.info.genres,
      chance: c.chance,
    })),
    moves: [],
    ads: {
      platforms: PLATFORMS,
      genres: a.genres,
      networks: a.networks,
      audience,
      shows: data.shows.slice(0, 6).map((s) => s.name),
      note: "Self serve platforms sell genres and audiences, not single shows. These shows are why these genres were chosen.",
      setup: adSetup(a.genres, a.networks, audience),
    },
    steps,
    qlooCalls: data.calls.length,
    model: process.env.LLM_MODEL ?? "qwen3.8-max",
    createdAt: new Date().toISOString(),
  };
}
