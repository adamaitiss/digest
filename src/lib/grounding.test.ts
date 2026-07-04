import { describe, expect, it } from "vitest";
import { fallbackLiteralSummary, verifyGroundedText } from "./grounding";

describe("verifyGroundedText", () => {
  it("passes when generated entities and numbers are present in source text", () => {
    const result = verifyGroundedText(
      "The Federal Reserve held rates at 5.25%.",
      "Federal Reserve officials said they held rates at 5.25% while inflation cools."
    );

    expect(result.passed).toBe(true);
    expect(result.missingEntities).toEqual([]);
    expect(result.missingNumbers).toEqual([]);
  });

  it("flags invented named entities and numbers", () => {
    const result = verifyGroundedText(
      "The Federal Reserve cut rates by 2% after Chair Morgan Lee spoke.",
      "Federal Reserve officials said they need more evidence before adjusting rates."
    );

    expect(result.passed).toBe(false);
    expect(result.missingEntities).toContain("Morgan Lee");
    expect(result.missingNumbers).toContain("2%");
  });

  it("falls back to literal headline-only summary for thin source text", () => {
    expect(fallbackLiteralSummary("Headline only", "")).toContain("Headline only");
  });
});
