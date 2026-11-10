import { describe, it, expect } from "vitest";
import { TOKENS, METHOD_COLORS, PLAN_LIMITS } from "./index.js";

describe("Shared Tokens & Configuration", () => {
  it("defines exact signal lime tokens from §3.1", () => {
    expect(TOKENS.dark.signal).toBe("#BFFF3C");
    expect(TOKENS.light.signal).toBe("#65A30D");
    expect(TOKENS.dark.surface0).toBe("#101208");
    expect(TOKENS.dark.surface3).toBe("#0C0E07");
  });

  it("defines all standard HTTP method chip colors", () => {
    expect(METHOD_COLORS.GET.color).toBe("#4ADE80");
    expect(METHOD_COLORS.POST.color).toBe("#FACC15");
    expect(METHOD_COLORS.DELETE.color).toBe("#F87171");
    expect(METHOD_COLORS.PATCH.color).toBe("#C084FC");
  });

  it("contains plan limits for FREE, PRO, TEAM", () => {
    expect(PLAN_LIMITS.FREE.pricePerMonth).toBe(0);
    expect(PLAN_LIMITS.PRO.pricePerMonth).toBe(19);
    expect(PLAN_LIMITS.TEAM.pricePerMonth).toBe(79);
    expect(PLAN_LIMITS.FREE.mockRequestsPerMonth).toBe(5000);
    expect(PLAN_LIMITS.FREE.logRetentionDays).toBe(14);
    expect(PLAN_LIMITS.FREE.maxLogRowsRetained).toBe(2500);
  });
});
