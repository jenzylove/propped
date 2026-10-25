import { NextResponse } from "next/server";
import { chat, LlmUnavailable } from "@/lib/llm";
import { isRefusal } from "@/lib/refusal";

export const maxDuration = 60;

const cache = new Map<string, unknown>();

export async function GET(req: Request) {
  const brand = new URL(req.url).searchParams.get("brand")?.trim();
  if (!brand) return NextResponse.json({ error: "Missing brand" }, { status: 400 });
  const key = brand.toLowerCase();
  if (cache.has(key)) return NextResponse.json(cache.get(key));
  const question = `List the 10 TV shows whose viewers disproportionately love the brand ${brand}, compared with the general population. Plain comma separated list, nothing else.`;
  try {
    const { message } = await chat([{ role: "user", content: question }], { think: false, maxTokens: 300 });
    const answer = (message.content ?? "").trim();
    const refused = isRefusal(answer);
    const shows = refused ? [] : answer.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 10);
    const body = { brand, question, answer, refused, shows, model: process.env.LLM_MODEL ?? "qwen3.8-max", at: new Date().toISOString() };
    cache.set(key, body);
    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof LlmUnavailable) return NextResponse.json({ error: e.message }, { status: 503 });
    return NextResponse.json({ error: "The comparison failed" }, { status: 502 });
  }
}
