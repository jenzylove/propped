import { put } from "@vercel/blob";
import { runPlan } from "@/lib/plan";
import { LlmUnavailable, llmConfigured } from "@/lib/llm";

export const maxDuration = 300;
export const runtime = "nodejs";

const RUNS_PER_HOUR = 6;
const runs = new Map<string, number[]>();

export async function POST(req: Request) {
  if (!llmConfigured()) return Response.json({ error: "The planning model isn't configured." }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  const recent = (runs.get(ip) ?? []).filter((t) => now - t < 3600_000);
  if (recent.length >= RUNS_PER_HOUR) return Response.json({ error: "That's the limit of new plans for this hour." }, { status: 429 });
  const body = (await req.json().catch(() => null)) as { brand?: string } | null;
  const brand = (body?.brand ?? "").trim().slice(0, 80);
  if (brand.length < 2) return Response.json({ error: "Type a brand name." }, { status: 400 });
  recent.push(now);
  runs.set(ip, recent);

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o: unknown) => controller.enqueue(enc.encode(JSON.stringify(o) + "\n"));
      try {
        const plan = await runPlan(brand, (step) => send({ type: "step", step }));
        try {
          await put(`plans/${plan.id}.json`, JSON.stringify(plan), { access: "public", contentType: "application/json", addRandomSuffix: false });
        } catch {
          /* saving is best effort; the plan is still returned */
        }
        send({ type: "done", plan });
      } catch (e) {
        send({ type: "error", message: e instanceof LlmUnavailable ? "The planning model is unavailable right now." : (e as Error).message.slice(0, 300) });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
}
