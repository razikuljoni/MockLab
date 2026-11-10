import { describe, it, expect } from "vitest";
import { TOKENS } from "@mocklab/shared";

describe("Web App Design Token Alignment", () => {
  it("enforces signal lime as the sole brand accent", () => {
    expect(TOKENS.dark.signal).toBe("#BFFF3C");
    expect(TOKENS.light.signal).toBe("#65A30D");
  });

  it("enforces graphite surface background for dark theme", () => {
    expect(TOKENS.dark.surface0).toBe("#101208");
    expect(TOKENS.dark.surface1).toBe("#171A10");
  });
});
