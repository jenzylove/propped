import { NextResponse } from "next/server";
import { brandShows } from "@/lib/shows";
import { QlooError } from "@/lib/qloo";

export const maxDuration = 60;

// GET /api/shows?brand=Liquid Death
export async function GET(req: Request) {
  const brand = (new URL(req.url).searchParams.get("brand") ?? "").trim().slice(0, 80);
  if (brand.length < 2) return NextResponse.json({ error: "Type a brand name." }, { status: 400 });
  try {
    const r = await brandShows(brand);
    if (!r.brand) return NextResponse.json({ error: `"${brand}" isn't in Qloo's taste data yet. Try a brand your customers also buy.` }, { status: 404 });
    return NextResponse.json(r, { headers: { "Cache-Control": "public, s-maxage=3600" } });
  } catch (e) {
    const status = e instanceof QlooError && e.status >= 400 ? e.status : 502;
    console.error("shows failed", (e as Error).message.slice(0, 300));
    return NextResponse.json({ error: "Qloo couldn't be read right now." }, { status });
  }
}
