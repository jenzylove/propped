import { readPlan } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9-]{3,60}$/.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const plan = await readPlan(id);
  if (!plan) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(plan, { headers: { "Cache-Control": "no-store" } });
}
