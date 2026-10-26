import { head, put } from "@vercel/blob";
import { nextMoves } from "@/lib/next";
import { cleanBoard, PLAN_ID_RE } from "@/lib/board";
import { LlmUnavailable, llmConfigured } from "@/lib/llm";
import type { Plan } from "@/lib/plan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const RUNS_PER_HOUR = 20;
const runs = new Map<string, number[]>();

async function readJson<T>(path: string): Promise<T | null> {
  try {
    const meta = await head(path);
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: "no-store" });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

// POST /api/plan/<id>/next: the agent reads the pitch board and takes its next moves.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!PLAN_ID_RE.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  if (!llmConfigured()) return Response.json({ error: "The planning model isn't configured." }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const recent = (runs.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (recent.length >= RUNS_PER_HOUR) return Response.json({ error: "That's the limit of next moves for this hour." }, { status: 429 });
  recent.push(now);
  runs.set(ip, recent);

  const plan = await readJson<Plan>(`plans/${id}.json`);
  if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });
  const board = cleanBoard(await readJson(`boards/${id}.json`));
  try {
    const out = await nextMoves(plan, board);
    if (out.moves.length) {
      await put(`plans/${id}.json`, JSON.stringify(out.plan), {
        access: "public",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 60,
      });
    }
    return Response.json(out, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const message = e instanceof LlmUnavailable ? "The planning model is unavailable right now." : "The agent couldn't finish its next move. Try again.";
    console.error("next move failed", (e as Error).message.slice(0, 300));
    return Response.json({ error: message }, { status: 502 });
  }
}
