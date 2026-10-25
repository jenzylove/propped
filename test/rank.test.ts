import { describe, expect, it } from "vitest";
import { demoMatch, fitSentence, rankShows } from "@/lib/core/rank";

describe("rankShows", () => {
  const shows = [
    { id: "generic", name: "Somebody Feed Phil", affinity: 0.99 },
    { id: "specific", name: "Trailer Park Boys", affinity: 0.95 },
  ];

  it("puts a show specific to the brand above a generic one with slightly higher affinity", () => {
    const r = rankShows(shows, { generic: 12, specific: 0 }, 40);
    expect(r[0].id).toBe("specific");
    expect(r[0].specific).toBe(true);
    expect(r[1].specific).toBe(false);
  });

  it("keeps affinity order when nothing is shared", () => {
    expect(rankShows(shows, {}, 40)[0].id).toBe("generic");
  });

  it("is deterministic", () => {
    expect(JSON.stringify(rankShows(shows, { generic: 3 }, 40))).toBe(JSON.stringify(rankShows(shows, { generic: 3 }, 40)));
  });
});

describe("demoMatch", () => {
  // real Qloo values (Oct 25 2026)
  const glossier = { age: { "24_and_younger": 0.4, "25_to_29": 0.38, "30_to_34": 0.31, "35_to_44": -0.68, "45_to_54": -0.45, "55_and_older": -0.51 }, gender: { male: -0.74, female: 0.74 } };
  const oliviaRodrigo = { age: { "24_and_younger": 0.87, "25_to_29": 0.74, "30_to_34": 0.09, "35_to_44": -0.6, "45_to_54": -0.23, "55_and_older": -0.34 }, gender: { male: -0.68, female: 0.68 } };
  const alwaysSunny = { age: { "24_and_younger": -0.04, "25_to_29": -0.09, "30_to_34": -0.71, "35_to_44": 0.17, "45_to_54": 0.09, "55_and_older": -0.68 }, gender: { male: 0.28, female: -0.28 } };

  it("reads Glossier and Olivia Rodrigo fans as the same people", () => {
    const m = demoMatch(glossier, oliviaRodrigo);
    expect(m.label).toBe("the same people");
    expect(m.genderLean).toBe("both lean female");
    expect(m.sharedAges).toContain("under 25");
    expect(fitSentence(m)).toMatch(/both lean female/);
  });

  it("reads Glossier and It's Always Sunny viewers as different", () => {
    expect(demoMatch(glossier, alwaysSunny).label).toBe("different");
  });
});
