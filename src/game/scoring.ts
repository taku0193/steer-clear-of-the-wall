import type { JudgmentResult, WallPattern } from "./types";

type ScoreCalculationInput = {
  currentScore: number;
  judgment: JudgmentResult;
  wallPattern: WallPattern;
};

export function calculateScore({
  currentScore,
  judgment,
  wallPattern,
}: ScoreCalculationInput): number {
  if (judgment.type !== "success" || judgment.patternId !== wallPattern.id) {
    return currentScore;
  }

  return currentScore + wallPattern.scoreValue;
}
