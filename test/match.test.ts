import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/enrich", () => ({ showInfo: async () => null }));
import { plausibleMatch } from "@/lib/shows";

describe("plausibleMatch", () => {
  it.each([
    ["Dr. Squatch", "Dr. Squatch Soap Co.", true],
    ["Siete Foods", "Siete Family Foods", true],
    ["Rare Beauty", "Rare Beauty by Selena Gomez", true],
    ["Athletic Brewing", "Athletic Brewing Co", true],
    ["Liquid Death", "Liquid Death", true],
    ["Rhode", "Rhode Island School Of Design", false],
    ["Prime Hydration", "Amazon Prime Video", false],
    ["Away", "Away Resorts", false],
    ["victoria secrets", "Victoria's Secret", true],
    ["ben and jerrys", "Ben & Jerry's", true],
    ["trader joes", "Trader Joe's", true],
  ])("%s -> %s is %s", (q, f, ok) => expect(plausibleMatch(q, f)).toBe(ok));
});
