import { head, put } from "@vercel/blob";
import { PLAN_ID_RE, cleanBoard, parseUpdate, type Board } from "@/lib/board";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

async function readJson(path: string): Promise<unknown | null> {
  try {
    const meta = await head(path);
    const res = await fetch(`${meta.url}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function readBoard(id: string): Promise<Board> {
  return cleanBoard(await readJson(`boards/${id}.json`));
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!PLAN_ID_RE.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ board: await readBoard(id) }, { headers: NO_STORE });
}

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

  const plan = (await readJson(`plans/${id}.json`)) as { placements?: { show?: unknown }[] } | null;
  if (!plan) return Response.json({ error: "Plan not found" }, { status: 404 });
  const shows = Array.isArray(plan.placements) ? plan.placements.map((p) => p?.show) : [];
  if (!shows.includes(update.show)) return Response.json({ error: "Show not in plan" }, { status: 400 });

  try {
    const board = await readBoard(id);
    board[update.show] = update.stage;
    await put(`boards/${id}.json`, JSON.stringify(board), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
    return Response.json({ board }, { headers: NO_STORE });
  } catch {
    return Response.json({ error: "Could not save" }, { status: 500 });
  }
}
