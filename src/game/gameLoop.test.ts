import { describe, expect, it } from "vitest";
import {
  advanceWallProgress,
  WALL_PROGRESS_PASSED,
  WALL_PROGRESS_STEP,
} from "./gameLoop";
import { createGameState, MAX_HEARTS } from "./state";
import { WALL_PATTERNS } from "./wallPatterns";
import { getWallProgressStep } from "./wallSpeed";

describe("advanceWallProgress", () => {
  it("プレイ状態でなければ壁進行や判定を更新しない", () => {
    const state = {
      ...createGameState("countdown"),
      wallProgress: WALL_PROGRESS_PASSED - WALL_PROGRESS_STEP,
    };

    expect(advanceWallProgress(state, WALL_PATTERNS)).toBe(state);
  });

  it("判定位置より前では壁進行だけを更新する", () => {
    const state = createGameState("playing");
    const result = advanceWallProgress(state, WALL_PATTERNS);

    expect(result.wallProgress).toBe(WALL_PROGRESS_STEP);
    expect(result.lastJudgment).toBeNull();
    expect(result.score).toBe(0);
    expect(result.misses).toBe(0);
  });

  it("壁通過時にモック姿勢を1回判定し、成功スコアと次の壁を設定する", () => {
    const state = {
      ...createGameState("playing"),
      wallProgress: WALL_PROGRESS_PASSED - WALL_PROGRESS_STEP,
    };

    const result = advanceWallProgress(state, WALL_PATTERNS);
    const nextTick = advanceWallProgress(result, WALL_PATTERNS);

    expect(result.lastJudgment).toEqual({
      type: "success",
      patternId: WALL_PATTERNS[0].id,
    });
    expect(result.score).toBe(WALL_PATTERNS[0].scoreValue);
    expect(result.misses).toBe(0);
    expect(result.successfulWalls).toBe(1);
    expect(result.wallSpeedLevel).toBe(1);
    expect(result.lastSpeedLevelUp).toBe(false);
    expect(result.wallProgress).toBe(0);
    expect(result.wallSequenceIndex).toBe(1);
    expect(result.activeWallPatternId).toBe(WALL_PATTERNS[1].id);
    expect(nextTick.lastJudgment).toEqual(result.lastJudgment);
    expect(nextTick.score).toBe(result.score);
  });

  it("実姿勢が安全領域外の場合はミスだけを加算する", () => {
    const state = {
      ...createGameState("playing"),
      poseInputMode: "camera" as const,
      playerArea: {
        x: 0,
        y: 0,
        width: 0.2,
        height: 0.2,
      },
      wallProgress: WALL_PROGRESS_PASSED - WALL_PROGRESS_STEP,
    };

    const result = advanceWallProgress(state, WALL_PATTERNS);

    expect(result.lastJudgment?.type).toBe("miss");
    expect(result.misses).toBe(1);
    expect(result.remainingHearts).toBe(MAX_HEARTS - 1);
    expect(result.successfulWalls).toBe(0);
    expect(result.wallSpeedLevel).toBe(1);
    expect(result.lastSpeedLevelUp).toBe(false);
    expect(result.score).toBe(0);
  });

  it("成功枚数が閾値に達したら速度段階を上げ、次の壁から進行量を増やす", () => {
    const state = {
      ...createGameState("playing"),
      successfulWalls: 2,
      wallSpeedLevel: 1,
      wallProgress: WALL_PROGRESS_PASSED - WALL_PROGRESS_STEP,
    };

    const result = advanceWallProgress(state, WALL_PATTERNS);
    const nextTick = advanceWallProgress(result, WALL_PATTERNS);

    expect(result.lastJudgment?.type).toBe("success");
    expect(result.successfulWalls).toBe(3);
    expect(result.wallSpeedLevel).toBe(2);
    expect(result.lastSpeedLevelUp).toBe(true);
    expect(nextTick.wallProgress).toBe(getWallProgressStep(2));
  });

  it("ハートがなくなったら結果状態へ遷移する", () => {
    const state = {
      ...createGameState("playing"),
      poseInputMode: "camera" as const,
      playerArea: {
        x: 0,
        y: 0,
        width: 0.2,
        height: 0.2,
      },
      misses: MAX_HEARTS - 1,
      remainingHearts: 1,
      wallProgress: WALL_PROGRESS_PASSED - WALL_PROGRESS_STEP,
    };

    const result = advanceWallProgress(state, WALL_PATTERNS);

    expect(result.phase).toBe("result");
    expect(result.lastJudgment?.type).toBe("miss");
    expect(result.misses).toBe(MAX_HEARTS);
    expect(result.remainingHearts).toBe(0);
  });

  it("実姿勢が未検出の場合はスコアとミスを変更しない", () => {
    const state = {
      ...createGameState("playing"),
      poseInputMode: "camera" as const,
      playerArea: null,
      wallProgress: WALL_PROGRESS_PASSED - WALL_PROGRESS_STEP,
    };

    const result = advanceWallProgress(state, WALL_PATTERNS);

    expect(result.lastJudgment?.type).toBe("notDetected");
    expect(result.misses).toBe(0);
    expect(result.remainingHearts).toBe(MAX_HEARTS);
    expect(result.successfulWalls).toBe(0);
    expect(result.wallSpeedLevel).toBe(1);
    expect(result.lastSpeedLevelUp).toBe(false);
    expect(result.score).toBe(0);
  });

  it("壁パターンが空なら状態を更新しない", () => {
    const state = createGameState("playing");

    expect(advanceWallProgress(state, [])).toBe(state);
  });
});
