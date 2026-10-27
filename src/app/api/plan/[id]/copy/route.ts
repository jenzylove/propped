import { PLAN_ID_RE } from "@/lib/board";
import { readBoard, readPlan, saveBoard, savePlan } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COPIES_PER_HOUR = 10;
const runs = new Map<string, number[]>();

// POST /api/plan/<id>/copy: a private copy of a plan (and its pitch board) to try the agent's next moves on.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!PLAN_ID_RE.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const recent = (runs.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (recent.length >= COPIES_PER_HOUR) return Response.json({ error: "That's the limit of copies for this hour." }, { status: 429 });
  recent.push(now);
  runs.set(ip, recent);

  const plan = await readPlan(id);
  if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });
  const board = await readBoard(id);
  const copyId = `${id.replace(/-c[a-z0-9]{5}$/, "").slice(0, 50)}-c${now.toString(36).slice(-5)}`;
  try {
    await savePlan({ ...plan, id: copyId }, true);
    await saveBoard(copyId, board);
    return Response.json({ id: copyId }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Couldn't make a copy right now. Try again." }, { status: 500 });
  }
}
