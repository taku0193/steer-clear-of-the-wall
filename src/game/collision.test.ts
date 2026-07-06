import { describe, expect, it } from "vitest";
import { COLLISION_TOLERANCE, judgeCollision } from "./collision";
import type { WallPattern } from "./types";

const wallPattern: WallPattern = {
  id: "test-wall",
  name: "テスト壁",
  verticalAnchor: "ground",
  safeArea: {
    x: 0.25,
    y: 0.2,
    width: 0.5,
    height: 0.6,
  },
  scoreValue: 100,
};

describe("judgeCollision", () => {
  it("プレイヤー領域がsafeArea内に収まる場合は成功を返す", () => {
    const result = judgeCollision({
      playerArea: {
        x: 0.3,
        y: 0.25,
        width: 0.4,
        height: 0.5,
      },
      wallPattern,
    });

    expect(result).toEqual({
      type: "success",
      patternId: wallPattern.id,
    });
  });

  it("safeAreaの境界と一致する場合は成功を返す", () => {
    const result = judgeCollision({
      playerArea: wallPattern.safeArea,
      wallPattern,
    });

    expect(result.type).toBe("success");
  });

  it("許容幅内のはみ出しは成功を返す", () => {
    const result = judgeCollision({
      playerArea: {
        x: wallPattern.safeArea.x - COLLISION_TOLERANCE,
        y: wallPattern.safeArea.y - COLLISION_TOLERANCE,
        width:
          wallPattern.safeArea.width + COLLISION_TOLERANCE * 2,
        height:
          wallPattern.safeArea.height + COLLISION_TOLERANCE * 2,
      },
      wallPattern,
    });

    expect(result.type).toBe("success");
  });

  it("許容幅を超えてsafeAreaからはみ出す場合は失敗を返す", () => {
    const result = judgeCollision({
      playerArea: {
        x: 0.19,
        y: 0.25,
        width: 0.4,
        height: 0.5,
      },
      wallPattern,
    });

    expect(result).toEqual({
      type: "miss",
      patternId: wallPattern.id,
      reason: "outsideSafeArea",
    });
  });

  it("プレイヤー領域がない場合は未検出を返す", () => {
    const result = judgeCollision({
      playerArea: null,
      wallPattern,
    });

    expect(result).toEqual({
      type: "notDetected",
      patternId: wallPattern.id,
    });
  });
});
