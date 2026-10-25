import "server-only";
import { cleanCompany, mapStatus, type ShowStatus } from "./enrich-pure";

export { cleanCompany, mapStatus };

export interface ShowInfo {
  name: string;
  status: ShowStatus;
  network: string | null;
  genres: string[];
  kind: string | null; // TVmaze type: Scripted, Animation, Reality, Documentary, Talk Show...
  poster: string | null;
  url: string | null;
  premiered: string | null;
  nextEpisode: string | null;
  company: string | null;
}

const UA = "Propped/1.0 (public TV placement research)";
const cache = new Map<string, ShowInfo | null>();

async function getJson(url: string): Promise<any | null> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) return null;
  return res.json();
}

async function wikiCompany(name: string): Promise<string | null> {
  for (const title of [`${name} (TV series)`, name]) {
    try {
      const j = await getJson(
        `https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&redirects=1&format=json&titles=${encodeURIComponent(title)}`,
      );
      const pages = j?.query?.pages ?? {};
      for (const p of Object.values<any>(pages)) {
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

export async function showInfo(name: string): Promise<ShowInfo | null> {
  if (cache.has(name)) return cache.get(name)!;
  let s: any;
  try {
    s = await getJson(`https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(name)}&embed=nextepisode`);
  } catch {
    return null;
  }
  if (!s) return null;
  const company = await wikiCompany(name).catch(() => null);
  const info: ShowInfo = {
    name: s.name ?? name,
    status: mapStatus(s.status),
    network: s.network?.name ?? s.webChannel?.name ?? null,
    genres: s.genres ?? [],
    kind: s.type ?? null,
    poster: s.image?.medium ?? s.image?.original ?? null,
    url: s.url ?? null,
    premiered: s.premiered ?? null,
    nextEpisode: s._embedded?.nextepisode?.airdate ?? null,
    company,
  };
  cache.set(name, info);
  return info;
}
