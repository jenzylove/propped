import { describe, it, expect } from "vitest";
import { isRefusal } from "@/lib/refusal";

describe("isRefusal", () => {
  it("flags refusals", () => {
    expect(isRefusal("I cannot provide this list. The data is proprietary.")).toBe(true);
    expect(isRefusal("I don't have access to that data")).toBe(true);
  });
  it("passes lists", () => {
    expect(isRefusal("Chef's Table, Ugly Delicious, Salt Fat Acid Heat")).toBe(false);
  });
});
