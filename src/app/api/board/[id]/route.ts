import { PLAN_ID_RE, cleanBoard, parseUpdate, type Board } from "@/lib/board";
import { readBoard, readPlan, saveBoard } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!PLAN_ID_RE.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ board: await readBoard(id) }, { headers: NO_STORE });
}

// PUT { show, stage, board? }: the page sends its whole board with each change, so no update is lost.
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!PLAN_ID_RE.test(id)) return Response.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const update = parseUpdate(body);
  if (!update) return Response.json({ error: "Invalid show or stage" }, { status: 400 });

  const plan = await readPlan(id);
  if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });
  const shows = new Set(plan.placements.map((p) => p.show));
  if (!shows.has(update.show)) return Response.json({ error: "Show not in plan" }, { status: 400 });

  const sent = (body as { board?: unknown }).board;
  const base: Board = sent ? cleanBoard(sent) : await readBoard(id);
  const board: Board = {};
  for (const [show, stage] of Object.entries(base)) if (shows.has(show)) board[show] = stage;
  board[update.show] = update.stage;
  try {
    await saveBoard(id, board);
    return Response.json({ board }, { headers: NO_STORE });
  } catch {
    return Response.json({ error: "Could not save" }, { status: 500 });
  }
}
