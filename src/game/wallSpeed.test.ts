import { describe, expect, it } from "vitest";
import {
  calculateNextSpeedState,
  getWallProgressStep,
  getWallSpeedLabel,
  getWallSpeedTier,
  INITIAL_WALL_PROGRESS_STEP,
  INITIAL_WALL_SPEED_LEVEL,
  WALL_SPEED_TIERS,
} from "./wallSpeed";

describe("wallSpeed", () => {
  it("成功枚数0では初期速度を返す", () => {
    const tier = getWallSpeedTier(0);

    expect(tier.level).toBe(INITIAL_WALL_SPEED_LEVEL);
    expect(tier.progressStep).toBe(INITIAL_WALL_PROGRESS_STEP);
  });

  it("成功枚数が閾値に達すると速度段階を上げる", () => {
    expect(getWallSpeedTier(2).level).toBe(1);
    expect(getWallSpeedTier(3).level).toBe(2);
    expect(getWallSpeedTier(6).level).toBe(3);
    expect(getWallSpeedTier(10).level).toBe(4);
  });

  it("最大速度段階を超えても最大段階のままにする", () => {
    const maxTier = WALL_SPEED_TIERS[WALL_SPEED_TIERS.length - 1];

    expect(getWallSpeedTier(999)).toEqual(maxTier);
  });

  it("未知の速度段階では初期速度へフォールバックする", () => {
    expect(getWallProgressStep(999)).toBe(INITIAL_WALL_PROGRESS_STEP);
    expect(getWallSpeedLabel(999)).toBe(WALL_SPEED_TIERS[0].label);
  });

  it("成功時だけ成功枚数を増やし、閾値到達時に速度アップを通知する", () => {
    const result = calculateNextSpeedState({
      successfulWalls: 2,
      currentSpeedLevel: 1,
      judgmentType: "success",
    });

    expect(result).toEqual({
      successfulWalls: 3,
      wallSpeedLevel: 2,
      speedLevelUp: true,
    });
  });

  it("ミスと未検出では成功枚数と速度段階を変えない", () => {
    expect(
      calculateNextSpeedState({
        successfulWalls: 2,
        currentSpeedLevel: 1,
        judgmentType: "miss",
      }),
    ).toEqual({
      successfulWalls: 2,
      wallSpeedLevel: 1,
      speedLevelUp: false,
    });
    expect(
      calculateNextSpeedState({
        successfulWalls: 2,
        currentSpeedLevel: 1,
        judgmentType: "notDetected",
      }),
    ).toEqual({
      successfulWalls: 2,
      wallSpeedLevel: 1,
      speedLevelUp: false,
    });
  });
});
