// Server side only. Not marked with `server-only` because that package throws
// when imported under vitest, and this module's helper is unit tested.

const UA = "Propped/1.0 (github.com/jenzylove/propped)";
const API = "https://www.wikidata.org/w/api.php";

const NOISE = new Set([
  "ltd", "limited", "inc", "llc", "productions", "production", "pictures",
  "media", "entertainment", "television", "tv", "films", "film", "the", "and",
  "group", "studios", "studio",
]);

function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** True when the query's first significant word appears in the label. */
export function labelMatches(query: string, label: string): boolean {
  const qw = words(query);
  const sig = qw.find((w) => !NOISE.has(w)) ?? qw[0];
  if (!sig) return false;
  return words(label).includes(sig);
}

const DESC_RE =
  /company|production|studio|television|media|entertainment|broadcaster|network|business|film/i;
const COMPANY_TYPES = new Set(["Q4830453", "Q783794", "Q1762059", "Q10689397"]);

type Claim = { mainsnak?: { datavalue?: { value?: unknown } } };
type Entity = {
  labels?: { en?: { value: string } };
  descriptions?: { en?: { value: string } };
  claims?: Record<string, Claim[]>;
};

function claimValues(e: Entity, prop: string): unknown[] {
  return (e.claims?.[prop] ?? [])
    .map((c) => c.mainsnak?.datavalue?.value)
    .filter((v) => v !== undefined);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getJson(params: Record<string, string>): Promise<Record<string, any>> {
  const url = `${API}?${new URLSearchParams({ ...params, format: "json" })}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`wikidata ${res.status}`);
  return res.json();
}

const cache = new Map<string, { name: string; url: string } | null>();

export async function companySite(
  company: string,
): Promise<{ name: string; url: string } | null> {
  const key = company.trim().toLowerCase();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key)!;
  let result: { name: string; url: string } | null = null;
  try {
    const search = await getJson({
      action: "wbsearchentities",
      search: company,
      language: "en",
      type: "item",
      limit: "5",
    });
    const ids: string[] = (search.search ?? []).map((s: { id: string }) => s.id);
    if (ids.length) {
      const got = await getJson({
        action: "wbgetentities",
        ids: ids.join("|"),
        props: "claims|labels|descriptions",
        languages: "en",
      });
      const entities: Record<string, Entity> = got.entities ?? {};
      for (const id of ids) {
        const e = entities[id];
        if (!e) continue;
        const label = e.labels?.en?.value;
        const site = claimValues(e, "P856").find((v) => typeof v === "string") as
          | string
          | undefined;
        if (!label || !site) continue;
        const desc = e.descriptions?.en?.value ?? "";
        const types = claimValues(e, "P31").map(
          (v) => (v as { id?: string }).id ?? "",
        );
        const looksLikeCompany =
          DESC_RE.test(desc) || types.some((t) => COMPANY_TYPES.has(t));
        if (!looksLikeCompany || !labelMatches(company, label)) continue;
        result = { name: label, url: site };
        break;
      }
    }
  } catch {
    result = null;
  }
  cache.set(key, result);
  return result;
}
