// Pure ranking and matching. No network. Same inputs, same output.

export interface ShowAffinity {
  id: string;
  name: string;
  affinity: number;
}

export interface RankedShow extends ShowAffinity {
  score: number; // 0..1, affinity weighted by how specific the show is to this brand
  commonIn: number; // how many reference brands also get this show
  specific: boolean; // true when few reference brands share it
}

/**
 * Down weight shows that many brands get (generic food docs), keep shows peculiar to this brand.
 * idf = ln((N + 1) / (c + 1)) + 1, normalised by its maximum (c = 0).
 */
export function rankShows(shows: ShowAffinity[], counts: Record<string, number>, referenceBrands: number): RankedShow[] {
  const N = Math.max(referenceBrands, 1);
  const maxIdf = Math.log(N + 1) + 1;
  const ranked = shows.map((s) => {
    const c = counts[s.id] ?? 0;
    const idf = (Math.log((N + 1) / (c + 1)) + 1) / maxIdf;
    return { ...s, commonIn: c, specific: c <= Math.max(2, Math.round(N * 0.1)), score: Math.round(s.affinity * idf * 1000) / 1000 };
  });
  return ranked.sort((a, z) => z.score - a.score || z.affinity - a.affinity || a.name.localeCompare(z.name));
}

export const AGE_KEYS = ["24_and_younger", "25_to_29", "30_to_34", "35_to_44", "45_to_54", "55_and_older"] as const;
const AGE_LABEL: Record<(typeof AGE_KEYS)[number], string> = {
  "24_and_younger": "under 25",
  "25_to_29": "25 to 29",
  "30_to_34": "30 to 34",
  "35_to_44": "35 to 44",
  "45_to_54": "45 to 54",
  "55_and_older": "55 and over",
};

export interface Demo {
  age: Record<string, number>;
  gender: Record<string, number>;
}

export interface DemoMatch {
  similarity: number; // cosine, -1..1
  label: "the same people" | "close" | "different";
  sharedAges: string[]; // age bands both over-index on
  genderLean: "both lean female" | "both lean male" | "different gender lean" | "balanced";
}

function vec(d: Demo) {
  return [...AGE_KEYS.map((k) => d.age[k] ?? 0), (d.gender.male ?? 0) * 0.8];
}

export function demoMatch(brand: Demo, show: Demo): DemoMatch {
  const a = vec(brand);
  const b = vec(show);
  const dot = a.reduce((s, x, i) => s + x * b[i], 0);
  const na = Math.hypot(...a);
  const nb = Math.hypot(...b);
  const similarity = na && nb ? Math.round((dot / (na * nb)) * 100) / 100 : 0;
  const sharedAges = AGE_KEYS.filter((k) => (brand.age[k] ?? 0) > 0.1 && (show.age[k] ?? 0) > 0.1).map((k) => AGE_LABEL[k]);
  const bm = brand.gender.male ?? 0;
  const sm = show.gender.male ?? 0;
  const genderLean =
    Math.abs(bm) < 0.1 && Math.abs(sm) < 0.1 ? "balanced" : bm > 0 && sm > 0 ? "both lean male" : bm < 0 && sm < 0 ? "both lean female" : "different gender lean";
  return { similarity, label: similarity >= 0.6 ? "the same people" : similarity >= 0.25 ? "close" : "different", sharedAges, genderLean };
}

/** Plain words: "25 to 29 and 30 to 34, both lean female". */
export function fitSentence(m: DemoMatch) {
  const ages = m.sharedAges.length ? m.sharedAges.join(", ") : null;
  if (m.label === "different") return "Different audiences by age and gender";
  return [ages ? `Both over-index ${ages}` : null, m.genderLean !== "different gender lean" ? m.genderLean : null].filter(Boolean).join("; ");
}
