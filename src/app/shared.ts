export type Status = "running" | "renewal pending" | "ended" | "unknown";

export const AMBER = "#d98a00";

export function statusStyle(s: Status | string | undefined): { label: string; color: string } {
  if (s === "running") return { label: "Running", color: "var(--green)" };
  if (s === "renewal pending") return { label: "Renewal pending", color: AMBER };
  if (s === "ended") return { label: "Ended", color: "var(--ink-3)" };
  return { label: "Unknown", color: "var(--ink-3)" };
}
