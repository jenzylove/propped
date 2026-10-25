// Minimal OpenAI compatible chat client (Qwen through the configured gateway).
import "server-only";

export class LlmUnavailable extends Error {}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}
export interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}
export interface ToolDef {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

// One retry on network errors ("fetch failed"); the gateway blips occasionally.
async function fetchRetry(url: string, init: RequestInit) {
  try {
    return await fetch(url, init);
  } catch {
    await new Promise((ok) => setTimeout(ok, 1500));
    return fetch(url, { ...init, signal: AbortSignal.timeout(240000) });
  }
}

export function llmConfigured() {
  return Boolean(process.env.QWEN_API_KEY && process.env.LLM_BASE_URL);
}

export async function chat(messages: ChatMessage[], opts: { tools?: ToolDef[]; maxTokens?: number; json?: boolean; think?: boolean } = {}) {
  if (!llmConfigured()) throw new LlmUnavailable("The language model isn't configured");
  const res = await fetchRetry(`${process.env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.QWEN_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.LLM_MODEL ?? "qwen3.8-max",
      messages,
      max_tokens: opts.maxTokens ?? 4000,
      temperature: 0,
      ...(opts.tools ? { tools: opts.tools } : {}),
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
      // Qwen reasons before answering by default; extraction doesn't need it and it's 3x slower
      ...(opts.think === false ? { enable_thinking: false } : {}),
      stream: true,
    }),
    signal: AbortSignal.timeout(240000),
  });
  if (res.status === 401 || res.status === 402 || res.status === 403 || res.status === 429) {
    throw new LlmUnavailable(`The language model refused the request (${res.status})`);
  }
  if (!res.ok || !res.body) throw new Error(`LLM ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return readStream(res.body);
}

// Streaming keeps long reasoning calls alive through the gateway's 2 minute idle cut off.
async function readStream(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let content = "";
  let usage: Record<string, unknown> | undefined;
  const calls = new Map<number, ToolCall>();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      const chunk = JSON.parse(data);
      if (chunk.usage) usage = chunk.usage;
      const delta = chunk.choices?.[0]?.delta ?? {};
      if (delta.content) content += delta.content;
      for (const tc of delta.tool_calls ?? []) {
        const cur = calls.get(tc.index) ?? { id: "", type: "function" as const, function: { name: "", arguments: "" } };
        if (tc.id) cur.id = tc.id;
        if (tc.function?.name) cur.function.name += tc.function.name;
        if (tc.function?.arguments) cur.function.arguments += tc.function.arguments;
        calls.set(tc.index, cur);
      }
    }
  }
  const tool_calls = [...calls.values()];
  const message: ChatMessage = { role: "assistant", content: content || null, ...(tool_calls.length ? { tool_calls } : {}) };
  return { message, usage };
}

/** Parse the first JSON object in a model reply. */
export function parseJson<T>(text: string | null): T {
  const s = (text ?? "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("The model didn't return JSON");
  return JSON.parse(s.slice(start, end + 1)) as T;
}
