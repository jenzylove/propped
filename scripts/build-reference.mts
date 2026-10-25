import { mkdir, writeFile } from "node:fs/promises";
import { findEntity, affinities, type QlooCall } from "../src/lib/qloo.ts";

const BRANDS = [
  "Brightland", "Olipop", "Poppi", "Liquid Death", "Athletic Brewing", "Allbirds", "Bombas", "Parachute",
  "Brooklinen", "Our Place", "Caraway", "Glossier", "Summer Fridays", "Rhode", "Fenty Beauty", "Hims",
  "Ritual", "Oatly", "Chobani", "Siete Foods", "Magic Spoon", "Liquid I.V.", "Celsius", "Feastables",
  "Dr. Squatch", "Native", "Away", "Warby Parker", "Casper", "Outdoor Voices", "Vuori", "Skims",
  "Mejuri", "Stanley", "Yeti", "Hydro Flask", "Rare Beauty", "Olaplex", "Ghia", "Recess",
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
const log: QlooCall[] = [];

interface Show { id: string; name: string; affinity: number }
interface Brand { query: string; id: string; name: string; shows: Show[] }

async function one(query: string): Promise<Brand | null> {
  const hit = await findEntity(query, "brand", log);
  if (!hit || !norm(hit.name).startsWith(norm(query).slice(0, 5))) return null;
  const shows = await affinities(hit.id, "tv_show", 50, log);
  return { query, id: hit.id, name: hit.name, shows: shows.map((s) => ({ id: s.id, name: s.name, affinity: s.affinity })) };
}

const results: (Brand | null)[] = new Array(BRANDS.length).fill(null);
const failed: string[] = [];
let next = 0;
async function worker() {
  while (next < BRANDS.length) {
    const i = next++;
    try {
      results[i] = await one(BRANDS[i]);
    } catch (e) {
      failed.push(`${BRANDS[i]}: ${(e as Error).message}`);
    }
  }
}
await Promise.all([worker(), worker(), worker()]);

const brands = results.filter((b): b is Brand => !!b);
const missing = BRANDS.filter((_, i) => !results[i]);
const showBrandCounts: Record<string, number> = {};
const showNames: Record<string, string> = {};
for (const b of brands) for (const s of b.shows) {
  showBrandCounts[s.id] = (showBrandCounts[s.id] ?? 0) + 1;
  showNames[s.id] = s.name;
}

await mkdir("data", { recursive: true });
await writeFile("data/reference.json", JSON.stringify({ builtAt: new Date().toISOString(), brandCount: brands.length, missing, brands, showBrandCounts }, null, 2));

const sets = brands.map((b) => new Set(b.shows.slice(0, 20).map((s) => s.id)));
let sum = 0, pairs = 0, above = 0;
for (let i = 0; i < sets.length; i++) for (let j = i + 1; j < sets.length; j++) {
  let inter = 0;
  for (const x of sets[i]) if (sets[j].has(x)) inter++;
  const union = sets[i].size + sets[j].size - inter;
  const jac = union ? inter / union : 0;
  sum += jac; pairs++;
  if (jac > 0.5) above++;
}

console.log(`Brands found: ${brands.length}, missing: ${missing.length}${missing.length ? ` (${missing.join(", ")})` : ""}`);
if (failed.length) console.log(`Errors (${failed.length}): ${failed.join(" | ")}`);
console.log(`Mean pairwise Jaccard (top 20 shows): ${pairs ? (sum / pairs).toFixed(4) : "n/a"} over ${pairs} pairs`);
console.log(`Pairs with Jaccard > 0.5: ${above}`);
console.log("Top 10 shows by brand count:");
Object.entries(showBrandCounts).sort((a, b) => b[1] - a[1]).slice(0, 10)
  .forEach(([id, n]) => console.log(`  ${n}  ${showNames[id]} (${id})`));
