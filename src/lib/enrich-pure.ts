export type ShowStatus = "running" | "renewal pending" | "ended" | "unknown";

export function mapStatus(s: string | null | undefined): ShowStatus {
  if (s === "Running") return "running";
  if (s === "To Be Determined" || s === "In Development") return "renewal pending";
  if (s === "Ended") return "ended";
  return "unknown";
}

export function cleanCompany(raw: string): string | null {
  let s = raw ?? "";
  s = s.replace(/<ref[^>]*\/>/gi, "").replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = s.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, "$2").replace(/\[\[([^\]]*)\]\]/g, "$1");
  s = s.replace(/\{\{\s*small\s*\|[^{}]*\}\}/gi, "");
  // footnote templates ({{efn|...}}, {{refn|...}}, {{sfn|...}}), closed or cut off at the line end
  s = s.replace(/\{\{\s*(efn|refn|sfn|note|citation needed|cn)\b[^}\n]*(\}\})?/gi, "");
  s = s.replace(/\{\{\s*(plainlist|ubl|unbulleted list|flatlist|hlist)\s*\|?/gi, "\n").replace(/\}\}/g, "\n");
  // parenthetical year/season ranges
  s = s.replace(/\([^()]*(\d{4}|season)[^()]*\)/gi, "");
  const parts = s.split(/[\n,*|]+/).map((p) => p.replace(/^[\s*•]+/, "").trim());
  const out: string[] = [];
  for (const p of parts) {
    if (!p || /^none$/i.test(p) || p.startsWith("|") || p.includes("=")) continue;
    if (!out.includes(p)) out.push(p);
  }
  return out.length ? out.slice(0, 3).join(", ") : null;
}
