// Brand in, ranked and enriched shows out. Qloo for taste, TVmaze and Wikipedia for show facts.
import "server-only";
import reference from "../../data/reference.json";
import { affinities, demographics, findEntities, type Demographics, type QlooCall } from "./qloo";
import { demoMatch, fitSentence, rankShows, type DemoMatch, type RankedShow } from "./core/rank";
import { showInfo, type ShowInfo } from "./enrich";

export const METHOD_VERSION = "1.0";
const TOP = 12;

export interface ShowResult extends RankedShow {
  info: ShowInfo | null;
  match: DemoMatch | null;
  fit: string | null;
}

export interface BrandShows {
  query: string;
  brand: { id: string; name: string; demo: Demographics | null } | null;
  shows: ShowResult[];
  calls: QlooCall[];
  method: { version: string; referenceBrands: number; referenceBuilt: string };
  at: string;
}

const ref = reference as { builtAt: string; brands: unknown[]; showBrandCounts: Record<string, number> };

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const SUFFIX = new Set(["co", "company", "inc", "foods", "food", "family", "soap", "brewing", "beverages", "beverage", "drinks", "beauty", "cosmetics", "brand", "brands", "the", "and", "usa", "us", "official"]);
const tokens = (s: string) => s.toLowerCase().replace(/&/g, " and ").split(/[^a-z0-9]+/).filter(Boolean);

/**
 * Accept a Qloo name for a query only if every query word is in it and the extra words are company suffixes
 * ("Dr. Squatch" -> "Dr. Squatch Soap Co.") or a "by ..." tail ("Rare Beauty by Selena Gomez").
 * Rejects "Rhode" -> "Rhode Island School Of Design" and "Prime Hydration" -> "Amazon Prime Video".
 */
export function plausibleMatch(query: string, found: string) {
  const q = tokens(query);
  const f = tokens(found);
  if (!q.length || !f.length) return false;
  if (norm(query) === norm(found)) return true;
  if (!q.every((t) => f.includes(t))) return f.every((t) => q.includes(t) || SUFFIX.has(t)); // found is the shorter form
  const extra = f.filter((t) => !q.includes(t));
  const by = extra.indexOf("by");
  const rest = by === 0 ? [] : extra;
  return rest.every((t) => SUFFIX.has(t));
}

async function pool<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>) {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

export async function brandShows(query: string): Promise<BrandShows> {
  const calls: QlooCall[] = [];
  const method = { version: METHOD_VERSION, referenceBrands: ref.brands.length, referenceBuilt: ref.builtAt };
  const at = new Date().toISOString();
  const candidates = await findEntities(query, "brand", calls);
  const e = candidates.find((c) => plausibleMatch(query, c.name)) ?? null;
  if (!e) return { query, brand: null, shows: [], calls, method, at };

  const [raw, brandDemo] = await Promise.all([affinities(e.id, "tv_show", 50, calls), demographics(e.id, calls)]);
  const ranked = rankShows(raw, ref.showBrandCounts, ref.brands.length).slice(0, TOP);
  const shows = await pool(ranked, 4, async (s) => {
    const [info, demo] = await Promise.all([showInfo(s.name), demographics(s.id, calls).catch(() => null)]);
    const match = brandDemo && demo ? demoMatch(brandDemo, demo) : null;
    return { ...s, info, match, fit: match ? fitSentence(match) : null };
  });
  return { query, brand: { id: e.id, name: e.name, demo: brandDemo }, shows, calls, method, at };
}
