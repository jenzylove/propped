import { describe, it, expect } from "vitest";
import { allowsPlacement, chanceOf, recipientOf } from "@/lib/placement";

describe("chanceOf", () => {
  it("rates unscripted shows as likely", () => {
    expect(chanceOf("Reality", "Netflix").tier).toBe("likely");
    expect(chanceOf("Documentary", "Channel 4").tier).toBe("likely");
    expect(chanceOf("Game Show", "ABC").tier).toBe("likely");
  });
  it("rates big scripted shows as needing an ad buy", () => {
    expect(chanceOf("Scripted", "Apple TV").tier).toBe("adbuy");
    expect(chanceOf("Scripted", "ABC").tier).toBe("adbuy");
    expect(chanceOf("Scripted", "Netflix").tier).toBe("adbuy");
  });
  it("rates smaller scripted shows as worth a pitch", () => {
    expect(chanceOf("Scripted", "IFC").tier).toBe("pitch");
    expect(chanceOf("Scripted", null).tier).toBe("pitch");
  });
});

describe("recipientOf", () => {
  it("names the crew lead and the company office", () => {
    const r = recipientOf("Shrinking", [{ name: "Cabot McMullen", role: "production designer" }], "Doozer Productions", "Apple TV");
    expect(r.greeting).toBe("Dear Cabot McMullen and the set decoration team");
    expect(r.line).toBe("Cabot McMullen, production designer, and the set decoration team, care of the Doozer Productions production office");
  });
  it("falls back to the company, then the network", () => {
    expect(recipientOf("Alone", [], "Leftfield Pictures", "History").line).toBe("The set decoration team, care of the Leftfield Pictures production office");
    expect(recipientOf("Alone", [], null, "History").line).toBe("The set decoration team, care of the Alone production team at History");
    expect(recipientOf("Alone", [], null, null).greeting).toBe("Dear set decoration team");
  });
});

describe("allowsPlacement", () => {
  it("rules out public broadcasters that take no product placement", () => {
    expect(allowsPlacement("BBC One")).toBe(false);
    expect(allowsPlacement("BBC Two")).toBe(false);
    expect(allowsPlacement("PBS")).toBe(false);
  });
  it("allows commercial networks and unknown ones", () => {
    expect(allowsPlacement("Channel 4")).toBe(true);
    expect(allowsPlacement("HGTV")).toBe(true);
    expect(allowsPlacement(null)).toBe(true);
  });
});

import { filmingNow } from "@/lib/placement";
describe("filmingNow", () => {
  const now = Date.parse("2026-10-27T00:00:00Z");
  it("trusts a scheduled episode", () => {
    expect(filmingNow({ status: "running", nextEpisode: "2026-11-02", lastAired: null }, now)).toBe(true);
  });
  it("keeps shows that aired in the last 18 months", () => {
    expect(filmingNow({ status: "running", nextEpisode: null, lastAired: "2026-05-03" }, now)).toBe(true);
  });
  it("drops streaming shows left marked running for years", () => {
    expect(filmingNow({ status: "running", nextEpisode: null, lastAired: "2020-07-01" }, now)).toBe(false);
    expect(filmingNow({ status: "renewal pending", nextEpisode: null, lastAired: "2024-01-31" }, now)).toBe(false);
    expect(filmingNow({ status: "running", nextEpisode: null, lastAired: null }, now)).toBe(false);
  });
});

import { fitScore } from "@/lib/placement";
describe("fitScore", () => {
  it("is 100 for the top ranked, same audience, likely set", () => {
    expect(fitScore(1, 50, "the same people", "likely")).toBe(100);
  });
  it("drops for low rank, different crowd and an ad buy", () => {
    expect(fitScore(50, 50, "different", "adbuy")).toBe(16);
  });
  it("treats an unknown audience as neutral", () => {
    expect(fitScore(1, 50, null, "pitch")).toBe(73);
  });
});
