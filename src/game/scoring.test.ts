import { describe, expect, it } from "vitest";
import { calculateScore } from "./scoring";
import type { WallPattern } from "./types";

const wallPattern: WallPattern = {
  id: "score-wall",
  name: "スコア壁",
  verticalAnchor: "ground",
  safeArea: {
    x: 0.25,
    y: 0.2,
    width: 0.5,
    height: 0.6,
  },
  scoreValue: 120,
};

describe("calculateScore", () => {
  it("成功時は壁のscoreValueを加算する", () => {
    const result = calculateScore({
      currentScore: 200,
      judgment: {
        type: "success",
        patternId: wallPattern.id,
      },
      wallPattern,
    });

    expect(result).toBe(320);
  });

  it("失敗時はスコアを変更しない", () => {
    const result = calculateScore({
      currentScore: 200,
      judgment: {
        type: "miss",
        patternId: wallPattern.id,
        reason: "outsideSafeArea",
      },
      wallPattern,
    });

    expect(result).toBe(200);
  });

  it("未検出時はスコアを変更しない", () => {
    const result = calculateScore({
      currentScore: 200,
      judgment: {
        type: "notDetected",
        patternId: wallPattern.id,
      },
      wallPattern,
    });

    expect(result).toBe(200);
  });

  it("別の壁に対する成功判定ではスコアを変更しない", () => {
    const result = calculateScore({
      currentScore: 200,
      judgment: {
        type: "success",
        patternId: "other-wall",
      },
      wallPattern,
    });

    expect(result).toBe(200);
  });
});
