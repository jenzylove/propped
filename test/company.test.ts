import { describe, expect, it } from "vitest";
import { labelMatches } from "@/lib/company";

describe("labelMatches", () => {
  it("matches on the first significant word", () => {
    expect(labelMatches("Talkback", "Talkback Thames")).toBe(true);
    expect(labelMatches("Doozer Productions", "Doozer")).toBe(true);
    expect(labelMatches("Pilgrim Films & Television", "Pilgrim Media Group")).toBe(true);
  });
  it("is case and punctuation insensitive", () => {
    expect(labelMatches("TALKBACK, Ltd.", "talkback thames")).toBe(true);
  });
  it("rejects unrelated labels", () => {
    expect(labelMatches("Ricochet", "Rhode Island")).toBe(false);
    expect(labelMatches("", "Anything")).toBe(false);
  });
});
