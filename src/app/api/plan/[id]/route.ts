import { head } from "@vercel/blob";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[a-z0-9-]{3,60}$/.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  try {
    const meta = await head(`plans/${id}.json`);
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(await res.json());
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
