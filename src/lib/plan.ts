// The Propped agent: reads the brand's shows, picks placements, plans ads, writes pitches.
// Facts (shows, status, networks, genres, audience, platform rules) come from code and data; the model chooses and writes.
import "server-only";
import { chat, type ChatMessage, type ToolDef } from "./llm";
import { brandShows, type BrandShows, type ShowResult } from "./shows";
import { AGE_KEYS } from "./core/rank";

export interface Placement {
  show: string;
  network: string | null;
  status: string;
  company: string | null;
  poster: string | null;
  why: string;
  send: string;
  pitch: string;
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
  };
  steps: { tool: string; summary: string; ms: number }[];
  qlooCalls: number;
  model: string;
  createdAt: string;
}

export type Step = { tool: string; summary: string; ms: number };

// Documented self serve options (sources in docs/spikes/feasibility.md). Show level buying isn't offered.
export const PLATFORMS = [
  {
    name: "Universal Ads (Comcast)",
    url: "https://www.universalads.com/",
    how: "Self serve from about $100. Target viewers of content genres, plus age, gender and location. Reaches NBCUniversal, Fox, Paramount and others.",
  },
  {
    name: "Amazon streaming TV ads",
    url: "https://advertising.amazon.com/solutions/products/streaming-tv-ads",
    how: "Self serve with no minimum spend. Runs on Prime Video, Twitch and Fire TV. Target by genre, curated title groups and audience segments.",
  },
];

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
const animated = (s: ShowResult) => /anim/i.test(s.info?.kind ?? "") || (s.info?.genres ?? []).some((g) => /anim|anime/i.test(g));
export const placeable = (s: ShowResult) => (s.info?.status === "running" || s.info?.status === "renewal pending") && !animated(s);

const TOOLS: ToolDef[] = [
  {
    type: "function",
    function: {
      name: "read_shows",
      description: "Read the TV shows this brand's customers over-index on, ranked for the brand, with status, network, genres, production company and audience fit.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "choose_placements",
      description: "Pick up to 4 shows to pitch for product placement, only from the placeable list (running or awaiting renewal, live action). For each, one sentence a founder would understand on why it fits: what about the show and its viewers matches the brand (genre, tone, audience fit, made for this brand). Never mention status or field names. If you mention the audience, use exactly the audience wording from the user message; never restate ages differently.",
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
        "Finish. For each chosen placement: what to send (product and quantity, short), and a pitch letter of 90 to 140 words to the production company's set decoration and props team. The letter should: name the show; suggest one or two natural places the product could sit in a scene, as ideas, matched to the show's genre and tone (for example a bar fridge, a kitchen counter, a gym bag); say the product is free with no paid placement required; offer to ship within a week; sign off from the brand. Don't invent facts about episodes, characters or the brand's history. Then a two sentence summary for the founder.",
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

function showLine(s: ShowResult) {
  return {
    show: s.name,
    status: s.info?.status ?? "unknown",
    network: s.info?.network ?? null,
    genres: s.info?.genres ?? [],
    company: s.info?.company ?? null,
    made_for_this_brand: s.specific,
    audience_fit: s.match?.label ?? "unknown",
  };
}

const eq = (a: string, b: string) => a.toLowerCase().trim() === b.toLowerCase().trim();

export async function runPlan(brand: string, emit: (s: Step) => void): Promise<Plan> {
  const steps: Step[] = [];
  const record = (tool: string, summary: string, t0: number) => {
    const s = { tool, summary, ms: Date.now() - t0 };
    steps.push(s);
    emit(s);
  };

  const t0 = Date.now();
  const data = await brandShows(brand);
  if (!data.brand) throw new Error(`"${brand}" isn't in Qloo's taste data yet.`);
  record("read_taste", `Read ${data.shows.length} shows ${data.brand.name} customers over-index on`, t0);
  const audience = audienceOf(data);
  const allGenres = [...new Set(data.shows.flatMap((s) => s.info?.genres ?? []))];
  const allNetworks = [...new Set(data.shows.map((s) => s.info?.network).filter(Boolean) as string[])];

  let picks: { show: ShowResult; why: string }[] = [];
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
        result = { shows: data.shows.map(showLine), placeable: data.shows.filter(placeable).map((s) => s.name) };
        record("read_shows", `${data.shows.filter(placeable).length} of ${data.shows.length} shows are still running or awaiting renewal`, ts);
      } else if (tc.function.name === "choose_placements") {
        const want = ((args.picks as { show: string; why: string }[]) ?? []).slice(0, 4);
        picks = want.flatMap((p) => {
          const s = data.shows.find((x) => eq(x.name, p.show) && placeable(x));
          return s ? [{ show: s, why: String(p.why).slice(0, 300) }] : [];
        });
        result = { accepted: picks.map((p) => p.show.name), rejected: want.filter((p) => !picks.some((x) => eq(x.show.name, p.show))).map((p) => `${p.show}: not running or not in the list`) };
        record("choose_placements", picks.length ? `Picked ${picks.map((p) => p.show.name).join(", ")}` : "No running shows to pitch", ts);
      } else if (tc.function.name === "plan_ads") {
        const g = ((args.genres as string[]) ?? []).filter((x) => allGenres.some((y) => eq(x, y))).slice(0, 4);
        const n = ((args.networks as string[]) ?? []).filter((x) => allNetworks.some((y) => eq(x, y))).slice(0, 4);
        ads = { genres: g, networks: n };
        result = { genres: g, networks: n, audience, note: "Platforms target genres and audiences, not single shows." };
        record("plan_ads", `Ads: ${g.join(", ") || "no genres"} viewers, ${audience.ages.join(", ") || "all ages"}, ${audience.gender}`, ts);
      } else if (tc.function.name === "finish") {
        const ps = ((args.placements as { show: string; send: string; pitch: string }[]) ?? []).filter((p) => picks.some((x) => eq(x.show.name, p.show)));
        done = { summary: String(args.summary ?? "").slice(0, 600), placements: ps };
        record("finish", `Wrote ${ps.length} pitch letters and the ad plan`, ts);
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
      const w = fin.placements.find((x) => eq(x.show, p.show.name));
      return {
        show: p.show.name,
        network: p.show.info?.network ?? null,
        status: p.show.info?.status ?? "unknown",
        company: p.show.info?.company ?? null,
        poster: p.show.info?.poster ?? null,
        why: p.why,
        send: w?.send ?? "",
        pitch: w?.pitch ?? "",
      };
    }),
    ads: {
      platforms: PLATFORMS,
      genres: a.genres,
      networks: a.networks,
      audience,
      shows: data.shows.slice(0, 6).map((s) => s.name),
      note: "Self serve platforms sell genres and audiences, not single shows. These shows are why these genres were chosen.",
    },
    steps,
    qlooCalls: data.calls.length,
    model: process.env.LLM_MODEL ?? "qwen3.8-max",
    createdAt: new Date().toISOString(),
  };
}
