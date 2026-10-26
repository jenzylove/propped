export const STAGES = ["not_sent", "pitched", "no_reply", "declined", "replied", "shipped", "on_screen"] as const;
export type Stage = (typeof STAGES)[number];
export type Board = Record<string, Stage>;

export const STAGE_LABELS: Record<Stage, string> = {
  not_sent: "Not sent",
  pitched: "Pitched",
  no_reply: "No reply",
  declined: "Declined",
  replied: "Replied",
  shipped: "Shipped",
  on_screen: "On screen",
};

export const PLAN_ID_RE = /^[a-z0-9-]{3,60}$/;

export function isStage(v: unknown): v is Stage {
  return typeof v === "string" && (STAGES as readonly string[]).includes(v);
}

export function parseUpdate(body: unknown): { show: string; stage: Stage } | null {
  if (!body || typeof body !== "object") return null;
  const { show, stage } = body as { show?: unknown; stage?: unknown };
  if (typeof show !== "string" || show.trim().length === 0 || show.length > 120) return null;
  if (!isStage(stage)) return null;
  return { show, stage };
}

export function cleanBoard(raw: unknown): Board {
  const out: Board = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (isStage(v)) out[k] = v;
  }
  return out;
}
