import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/llm", () => ({ chat: vi.fn(), parseJson: vi.fn(), LlmUnavailable: class extends Error {}, llmConfigured: () => true }));

const { addressed } = await import("@/lib/plan");

describe("addressed", () => {
  it("replaces the model's own greeting with the right one, once", () => {
    expect(addressed("Dear Set Decoration Team,\n\nWe would love to help.", "Dear Cabot McMullen and the set decoration team")).toBe(
      "Dear Cabot McMullen and the set decoration team,\n\nWe would love to help.",
    );
  });
  it("drops a stacked Dear and Hello", () => {
    expect(addressed("Dear set decoration team,\n\nHello set decoration team,\n\nWe admire the show.", "Dear set decoration team")).toBe(
      "Dear set decoration team,\n\nWe admire the show.",
    );
  });
  it("keeps a letter that starts without a greeting", () => {
    expect(addressed("We would love to help.", "Dear set decoration team")).toBe("Dear set decoration team,\n\nWe would love to help.");
  });
});
