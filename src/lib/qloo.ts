// Server side Qloo client. Hackathon base URL only, X-Api-Key header, no legacy endpoints.
// Every call is logged (path, params, status, timing, result count) without the key.
import "server-only";

const BASE = "https://hackathon.api.qloo.com";
const TIMEOUT_MS = 20000;
const MAX_ATTEMPTS = 3;

export interface QlooCall {
  path: string;
  params: Record<string, string | number>;
  status: number;
  ms: number;
  results: number;
  at: string;
}

export class QlooError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export interface Entity {
  id: string;
  name: string;
  affinity: number;
  popularity: number | null;
  image: string | null;
}

export interface Demographics {
  age: Record<string, number>;
  gender: Record<string, number>;
}

const cache = new Map<string, Record<string, unknown>>();

function key() {
  const k = process.env.QLOO_API_KEY;
  if (!k) throw new QlooError("QLOO_API_KEY is not set", 500);
  return k;
}

async function getJson(path: string, params: Record<string, string | number>, log: QlooCall[]) {
  const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  const url = `${BASE}${path}?${qs}`;
  const hit = cache.get(url);
  if (hit) return hit;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const t0 = Date.now();
    try {
      const res = await fetch(url, { headers: { "X-Api-Key": key(), Accept: "application/json" }, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const r = body.results as { entities?: unknown[] } | unknown[] | undefined;
      const n = Array.isArray(r) ? r.length : (r?.entities?.length ?? 0);
      log.push({ path, params, status: res.status, ms: Date.now() - t0, results: n, at: new Date().toISOString() });
      if (res.status === 429 || res.status >= 500) {
        lastErr = new QlooError(`Qloo ${res.status}`, res.status);
        await new Promise((ok) => setTimeout(ok, 600 * attempt));
        continue;
      }
      if (!res.ok) throw new QlooError(`Qloo ${res.status}: ${JSON.stringify(body).slice(0, 300)}`, res.status);
      cache.set(url, body);
      return body;
    } catch (e) {
      if (e instanceof QlooError && e.status < 500 && e.status !== 429) throw e;
      lastErr = e;
      log.push({ path, params, status: 0, ms: Date.now() - t0, results: 0, at: new Date().toISOString() });
    }
  }
  throw lastErr instanceof Error ? lastErr : new QlooError("Qloo request failed", 502);
}

function toEntity(e: Record<string, unknown>): Entity {
  const props = (e.properties ?? {}) as { image?: { url?: string } };
  const q = (e.query ?? {}) as { affinity?: number };
  return {
    id: String(e.entity_id),
    name: String(e.name),
    affinity: typeof q.affinity === "number" ? q.affinity : 0,
    popularity: typeof e.popularity === "number" ? (e.popularity as number) : null,
    image: props.image?.url ?? null,
  };
}

/** Up to 5 candidate entities for a name, best first. */
export async function findEntities(name: string, type: "brand" | "tv_show" | "artist", log: QlooCall[]) {
  const body = await getJson("/search", { query: name, types: `urn:entity:${type}`, take: 5 }, log);
  return ((body.results as Record<string, unknown>[] | undefined) ?? []).map(toEntity);
}

/** Find an entity by name. Returns the top match or null. */
export async function findEntity(name: string, type: "brand" | "tv_show" | "artist", log: QlooCall[]) {
  const body = await getJson("/search", { query: name, types: `urn:entity:${type}`, take: 5 }, log);
  const results = (body.results as Record<string, unknown>[] | undefined) ?? [];
  return results.length ? toEntity(results[0]) : null;
}

/** Entities of `type` that fans of `signalId` over-index on. */
export async function affinities(signalId: string, type: "tv_show" | "brand" | "artist", take: number, log: QlooCall[]) {
  const body = await getJson("/v2/insights", { "filter.type": `urn:entity:${type}`, "signal.interests.entities": signalId, take }, log);
  return (((body.results as { entities?: Record<string, unknown>[] })?.entities) ?? []).map(toEntity);
}

/** Age and gender lean of an entity's fans (positive = over-indexes). */
export async function demographics(entityId: string, log: QlooCall[]): Promise<Demographics | null> {
  const body = await getJson("/v2/insights", { "filter.type": "urn:demographics", "signal.interests.entities": entityId }, log);
  const d = ((body.results as { demographics?: { query?: Demographics }[] })?.demographics ?? [])[0]?.query;
  return d?.age && d?.gender ? d : null;
}
