import { describe, expect, it } from "vitest";
import { reactionStrength, scoreArticle } from "./scoring";

describe("scoreArticle", () => {
  it("keeps must-know items competitive even with weak personal similarity", () => {
    const score = scoreArticle({
      sourceQualityScore: 0.9,
      businessSignificanceScore: 0.95,
      noveltyScore: 0.7,
      mustKnowScore: 0.98,
      personalSimilarityScore: 0.12,
      recencyHours: 8,
      explicitSignalScore: 0,
      explorationBoost: 0.1
    });

    expect(score.importance).toBeGreaterThan(0.7);
    expect(score.total).toBeGreaterThan(0.35);
  });

  it("rewards explicit positive signals more than passive summary opens", () => {
    expect(reactionStrength("save")).toBeGreaterThan(reactionStrength("interesting"));
    expect(reactionStrength("interesting")).toBeGreaterThan(reactionStrength("open_summary"));
  });

  it("treats hide actions as hard negative signals", () => {
    expect(reactionStrength("hide_source")).toBe(-1);
    expect(reactionStrength("hide_topic")).toBe(-1);
  });
});

