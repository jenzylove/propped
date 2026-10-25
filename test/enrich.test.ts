import { describe, it, expect } from "vitest";
import { cleanCompany, mapStatus } from "@/lib/enrich-pure";

describe("cleanCompany", () => {
  it("handles season ranges", () => {
    expect(cleanCompany("* 20th Century Fox Television (Seasons 1–2)\n* FXP (Season 3–present) }}")).toBe("20th Century Fox Television, FXP");
  });
  it("handles br and year ranges", () => {
    expect(cleanCompany("Talkback (1999–2006)<br>Talkback Thames (2006–11, 2025–)<br>Boundless (2012–20)")).toBe("Talkback, Talkback Thames, Boundless");
  });
  it("drops junk lines", () => {
    expect(cleanCompany("| channel = Discovery Channel")).toBeNull();
  });
  it("unwraps links", () => {
    expect(cleanCompany("[[Netflix Studios]]")).toBe("Netflix Studios");
    expect(cleanCompany("{{Plainlist|\n* [[Wall to Wall (production company)|Wall to Wall Media]]\n}}")).toBe("Wall to Wall Media");
  });
});

describe("mapStatus", () => {
  it("maps", () => {
    expect(mapStatus("Running")).toBe("running");
    expect(mapStatus("To Be Determined")).toBe("renewal pending");
    expect(mapStatus("In Development")).toBe("renewal pending");
    expect(mapStatus("Ended")).toBe("ended");
    expect(mapStatus("x")).toBe("unknown");
    expect(mapStatus(null)).toBe("unknown");
  });
});
