export interface ScoreInput {
  sourceQualityScore: number;
  businessSignificanceScore: number;
  noveltyScore: number;
  mustKnowScore: number;
  personalSimilarityScore: number;
  recencyHours: number;
  explicitSignalScore: number;
  explorationBoost: number;
}

export interface ScoreBreakdown {
  total: number;
  personal: number;
  importance: number;
  freshness: number;
  exploration: number;
}

export function scoreArticle(input: ScoreInput): ScoreBreakdown {
  const freshness = Math.max(0, 1 - input.recencyHours / 72);
  const personal = clamp(input.personalSimilarityScore * 0.5 + input.explicitSignalScore * 0.35);
  const importance = clamp(
    input.mustKnowScore * 0.34 +
      input.businessSignificanceScore * 0.28 +
      input.sourceQualityScore * 0.18 +
      input.noveltyScore * 0.12
  );
  const exploration = clamp(input.explorationBoost * 0.55 + input.noveltyScore * 0.2);
  const total = clamp(personal * 0.45 + importance * 0.34 + freshness * 0.12 + exploration * 0.09);
  return { total, personal, importance, freshness, exploration };
}

export function reactionStrength(signalType: string): number {
  switch (signalType) {
    case "save":
    case "show_more_like_this":
      return 1;
    case "interesting":
    case "useful":
      return 0.7;
    case "important":
    case "important_not_interesting":
      return 0.55;
    case "open_summary":
      return 0.18;
    case "not_interesting":
    case "not_useful":
      return -0.35;
    case "too_obvious":
    case "too_noisy":
    case "duplicate":
      return -0.55;
    case "hide_topic":
    case "hide_source":
      return -1;
    default:
      return 0;
  }
}

function clamp(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

