// Proof numbers, computed, never typed by hand.
// node --env-file=.env --conditions=react-server --import tsx scripts/proof.mts
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { chat } from "../src/lib/llm";
import { isRefusal } from "../src/lib/refusal";
import { rankShows } from "../src/lib/core/rank";

interface RefBrand { query: string; name: string; shows: { id: string; name: string; affinity: number }[] }
const ref = JSON.parse(await readFile("data/reference.json", "utf8")) as { builtAt: string; brands: RefBrand[]; showBrandCounts: Record<string, number> };
const N = ref.brands.length;
const TOP = 12;

// 1. distinctness before and after ranking (no network)
function meanOverlap(lists: string[][]) {
  let sum = 0, n = 0, high = 0;
  for (let i = 0; i < lists.length; i++)
    for (let j = i + 1; j < lists.length; j++) {
      const a = new Set(lists[i]), b = new Set(lists[j]);
      const inter = [...a].filter((x) => b.has(x)).length;
      const jac = inter / new Set([...a, ...b]).size;
      sum += jac; n++; if (jac > 0.5) high++;
    }
  return { mean: Math.round((sum / n) * 1000) / 1000, pairsAboveHalf: high, pairs: n };
}
const raw = ref.brands.map((b) => b.shows.slice(0, TOP).map((s) => s.id));
const ranked = ref.brands.map((b) => rankShows(b.shows, ref.showBrandCounts, N).slice(0, TOP).map((s) => s.id));
const distinct = { top: TOP, raw: meanOverlap(raw), ranked: meanOverlap(ranked) };
console.error("overlap raw", distinct.raw, "ranked", distinct.ranked);

// 2. the same question to the model alone, for every reference brand
const rows: { brand: string; refused: boolean; answer: string }[] = [];
for (const b of ref.brands) {
  const q = `List the 10 TV shows whose viewers disproportionately love the brand ${b.query}, compared with the general population. Plain comma separated list, nothing else.`;
  let answer = "";
  try {
    answer = (await chat([{ role: "user", content: q }], { think: false, maxTokens: 300 })).message.content ?? "";
  } catch (e) {
    answer = `ERROR ${(e as Error).message}`;
  }
  rows.push({ brand: b.query, refused: isRefusal(answer), answer: answer.slice(0, 600) });
  console.error(b.query, isRefusal(answer) ? "refused" : "answered");
}
const answered = rows.filter((r) => !r.refused && !r.answer.startsWith("ERROR"));
const out = {
  ranAt: new Date().toISOString(),
  model: process.env.LLM_MODEL ?? "qwen3.8-max",
  referenceBuilt: ref.builtAt,
  brands: N,
  refusal: { refused: rows.filter((r) => r.refused).length, answered: answered.length, errors: rows.filter((r) => r.answer.startsWith("ERROR")).length, total: rows.length },
  distinct,
  rows,
};
await mkdir("src/data", { recursive: true });
await writeFile("src/data/proof.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify({ refusal: out.refusal, distinct }));
