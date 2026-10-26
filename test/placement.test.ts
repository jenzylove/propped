import { describe, it, expect } from "vitest";
import { chanceOf, recipientOf } from "@/lib/placement";

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
