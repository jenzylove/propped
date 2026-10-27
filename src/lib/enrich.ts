import "server-only";
import { cleanCompany, mapStatus, type ShowStatus } from "./enrich-pure";
import { filmingNow } from "./placement";

export { cleanCompany, mapStatus };

export interface ShowInfo {
  tvmazeId: number | null;
  name: string;
  status: ShowStatus;
  network: string | null;
  genres: string[];
  kind: string | null; // TVmaze type: Scripted, Animation, Reality, Documentary, Talk Show...
  poster: string | null;
  url: string | null;
  premiered: string | null;
  nextEpisode: string | null;
  lastAired: string | null;
  company: string | null;
}

const UA = "Propped/1.0 (public TV placement research)";
const cache = new Map<string, ShowInfo | null>();

interface TvmazeShow {
  id?: number;
  name?: string;
  status?: string;
  type?: string;
  genres?: string[];
  network?: { name?: string } | null;
  webChannel?: { name?: string } | null;
  image?: { medium?: string; original?: string } | null;
  url?: string;
  premiered?: string;
  _embedded?: { nextepisode?: { airdate?: string }; previousepisode?: { airdate?: string } };
}
interface WikiPage {
  revisions?: { slots?: { main?: { "*"?: string } }; "*"?: string }[];
}
interface WikiResponse {
  query?: { pages?: Record<string, WikiPage> };
}

async function getJson<T>(url: string): Promise<T | null> {
  // TVmaze allows about 20 calls per 10 seconds; back off and retry when it says slow down.
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    if (!res.ok) return null;
    return res.json();
  }
  return null;
}

async function wikiCompany(name: string): Promise<string | null> {
  for (const title of [`${name} (TV series)`, name]) {
    try {
      const j = await getJson<WikiResponse>(
        `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&redirects=1&format=json&titles=${encodeURIComponent(title)}`,
      );
      const pages = j?.query?.pages ?? {};
      for (const p of Object.values(pages)) {
        const text: string | undefined = p?.revisions?.[0]?.slots?.main?.["*"] ?? p?.revisions?.[0]?.["*"];
        if (!text) continue;
        const lines = text.split("\n");
        const i = lines.findIndex((l) => /^\|\s*(production_)?company\s*=/i.test(l));
        if (i < 0) continue;
        const buf = [lines[i].replace(/^\|\s*[a-z_]+\s*=/i, "")];
        for (let k = i + 1; k < lines.length; k++) {
          if (lines[k].startsWith("|") || lines[k].startsWith("}}")) break;
          buf.push(lines[k]);
        }
        const c = cleanCompany(buf.join("\n"));
        if (c) return c;
      }
    } catch {
      /* try next */
    }
  }
  return null;
}

const tvCache = new Map<string, Omit<ShowInfo, "company"> | null>();

/** TVmaze facts only: status, type, network, genres, poster. Cheap enough for a whole list. */
export async function tvInfo(name: string): Promise<Omit<ShowInfo, "company"> | null> {
  if (tvCache.has(name)) return tvCache.get(name)!;
  let s: TvmazeShow | null;
  try {
    s = await getJson<TvmazeShow>(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(name)}&embed[]=nextepisode&embed[]=previousepisode`);
  } catch {
    return null;
  }
  const info = s
    ? {
        tvmazeId: s.id ?? null,
        name: s.name ?? name,
        status: mapStatus(s.status),
        network: s.network?.name ?? s.webChannel?.name ?? null,
        genres: s.genres ?? [],
        kind: s.type ?? null,
        poster: s.image?.medium ?? s.image?.original ?? null,
        url: s.url ?? null,
        premiered: s.premiered ?? null,
        nextEpisode: s._embedded?.nextepisode?.airdate ?? null,
        lastAired: s._embedded?.previousepisode?.airdate ?? null,
      }
    : null;
  // A show "running" on TVmaze with nothing new in 18 months has stopped making episodes.
  if (info && (info.status === "running" || info.status === "renewal pending") && !filmingNow(info)) info.status = "ended";
  tvCache.set(name, info);
  return info;
}

/** The production company, from the show's Wikipedia infobox. */
export const companyOf = (name: string) => wikiCompany(name).catch(() => null);

/** People who run the look of the set: production designers, set decorators and prop masters listed on TVmaze. */
export async function setCrew(tvmazeId: number | null): Promise<{ name: string; role: string }[]> {
  if (!tvmazeId) return [];
  try {
    const crew = await getJson<{ type?: string; person?: { name?: string } }[]>(`https://api.tvmaze.com/shows/${tvmazeId}/crew`);
    const roles = ["Set Decorator", "Property Master", "Production Designer"];
    return (crew ?? [])
      .filter((c) => c.type && roles.includes(c.type) && c.person?.name)
      .sort((a, b) => roles.indexOf(a.type!) - roles.indexOf(b.type!))
      .map((c) => ({ name: c.person!.name!, role: c.type!.toLowerCase() }));
  } catch {
    return [];
  }
}

export async function showInfo(name: string): Promise<ShowInfo | null> {
  if (cache.has(name)) return cache.get(name)!;
  const tv = await tvInfo(name);
  if (!tv) return null;
  const info: ShowInfo = { ...tv, company: await companyOf(name) };
  cache.set(name, info);
  return info;
}
