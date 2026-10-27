import { isSample } from "@/lib/samples";
import { nextMoves } from "@/lib/next";
import { cleanBoard, PLAN_ID_RE, type Board } from "@/lib/board";
import { LlmUnavailable, llmConfigured } from "@/lib/llm";
import { readBoard, readPlan, savePlan } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const RUNS_PER_HOUR = 20;
const runs = new Map<string, number[]>();

// POST /api/plan/<id>/next { board? }: the agent reads the pitch board and takes its next moves.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!PLAN_ID_RE.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  if (isSample(id)) return Response.json({ error: "This is the shared sample. Make your own copy to try it." }, { status: 403 });
  if (!llmConfigured()) return Response.json({ error: "The planning model isn't configured." }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const recent = (runs.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (recent.length >= RUNS_PER_HOUR) return Response.json({ error: "That's the limit of next moves for this hour." }, { status: 429 });
  recent.push(now);
  runs.set(ip, recent);

  const plan = await readPlan(id);
  if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });
  const sent = ((await req.json().catch(() => null)) as { board?: unknown } | null)?.board;
  const board: Board = sent ? cleanBoard(sent) : await readBoard(id);
  try {
    const out = await nextMoves(plan, board);
    if (out.moves.length) await savePlan(out.plan);
    return Response.json(out, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const message = e instanceof LlmUnavailable ? "The planning model is unavailable right now." : "The agent couldn't finish its next move. Try again.";
    console.error("next move failed", (e as Error).message.slice(0, 300));
    return Response.json({ error: message }, { status: 502 });
  }
}
