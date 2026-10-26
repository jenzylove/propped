import { describe, expect, it } from "vitest";
import { PLAN_ID_RE, STAGES, cleanBoard, isStage, parseUpdate } from "@/lib/board";

describe("board validation", () => {
  it("accepts every stage and rejects others", () => {
    for (const s of STAGES) expect(isStage(s)).toBe(true);
    expect(isStage("done")).toBe(false);
    expect(isStage(1)).toBe(false);
  });
  it("parses a valid update", () => {
    expect(parseUpdate({ show: "Succession", stage: "pitched" })).toEqual({ show: "Succession", stage: "pitched" });
  });
  it("rejects bad updates", () => {
    expect(parseUpdate(null)).toBeNull();
    expect(parseUpdate({ show: "", stage: "pitched" })).toBeNull();
    expect(parseUpdate({ show: "   ", stage: "pitched" })).toBeNull();
    expect(parseUpdate({ show: "x".repeat(121), stage: "pitched" })).toBeNull();
    expect(parseUpdate({ show: "x".repeat(120), stage: "pitched" })).not.toBeNull();
    expect(parseUpdate({ show: "A", stage: "nope" })).toBeNull();
    expect(parseUpdate({ show: 5, stage: "pitched" })).toBeNull();
  });
  it("cleans stored boards", () => {
    expect(cleanBoard({ A: "shipped", B: "bad" })).toEqual({ A: "shipped" });
    expect(cleanBoard(null)).toEqual({});
  });
  it("validates plan ids", () => {
    expect(PLAN_ID_RE.test("abc-123")).toBe(true);
    expect(PLAN_ID_RE.test("AB")).toBe(false);
    expect(PLAN_ID_RE.test("../x")).toBe(false);
  });
});
