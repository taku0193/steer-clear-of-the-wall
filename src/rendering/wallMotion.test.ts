import { describe, expect, it } from "vitest";
import {
  WALL_PROGRESS_STEP,
  WALL_TICK_INTERVAL_MS,
} from "../game/gameLoop";
import { advanceVisualWallProgress } from "./wallMotion";

describe("advanceVisualWallProgress", () => {
  it("壁1枚の進行時間は2.4秒である", () => {
    expect(WALL_TICK_INTERVAL_MS / WALL_PROGRESS_STEP).toBe(2400);
  });

  it("設定周期に合わせて表示進行率を連続的に進める", () => {
    expect(
      advanceVisualWallProgress({
        currentVisualProgress: 0,
        previousLogicalProgress: 0,
        logicalProgress: 0,
        elapsedMs: 16,
        progressStep: WALL_PROGRESS_STEP,
      }),
    ).toBeCloseTo(
      (16 * WALL_PROGRESS_STEP) / WALL_TICK_INTERVAL_MS,
      6,
    );
  });

  it.each([0.25, 0.3, 0.36, 0.45])(
    "進行step %sでは速度に応じて進み、次の論理更新境界を越えない",
    (progressStep) => {
      expect(
        advanceVisualWallProgress({
          currentVisualProgress: 0,
          previousLogicalProgress: 0,
          logicalProgress: 0,
          elapsedMs: WALL_TICK_INTERVAL_MS / 2,
          progressStep,
        }),
      ).toBeCloseTo(progressStep / 2, 10);
      expect(
        advanceVisualWallProgress({
          currentVisualProgress: 0,
          previousLogicalProgress: 0,
          logicalProgress: 0,
          elapsedMs: WALL_TICK_INTERVAL_MS,
          progressStep,
        }),
      ).toBeCloseTo(progressStep, 10);
      expect(
        advanceVisualWallProgress({
          currentVisualProgress: 0,
          previousLogicalProgress: 0,
          logicalProgress: 0,
          elapsedMs: WALL_TICK_INTERVAL_MS * 2,
          progressStep,
        }),
      ).toBeCloseTo(progressStep, 10);
    },
  );

  it.each([
    { progressStep: 0.25, logicalProgress: 0.75 },
    { progressStep: 0.3, logicalProgress: 0.9 },
    { progressStep: 0.36, logicalProgress: 0.72 },
    { progressStep: 0.45, logicalProgress: 0.9 },
  ])(
    "進行step $progressStepの最終区間は判定周期全体を使って1へ到達する",
    ({ progressStep, logicalProgress }) => {
      const remainingProgress = 1 - logicalProgress;

      expect(
        advanceVisualWallProgress({
          currentVisualProgress: logicalProgress,
          previousLogicalProgress: logicalProgress,
          logicalProgress,
          elapsedMs: WALL_TICK_INTERVAL_MS / 2,
          progressStep,
        }),
      ).toBeCloseTo(logicalProgress + remainingProgress / 2, 10);
      expect(
        advanceVisualWallProgress({
          currentVisualProgress: logicalProgress,
          previousLogicalProgress: logicalProgress,
          logicalProgress,
          elapsedMs: WALL_TICK_INTERVAL_MS,
          progressStep,
        }),
      ).toBeCloseTo(1, 10);
    },
  );

  it("論理進行率が表示より先なら論理値へ追従する", () => {
    expect(
      advanceVisualWallProgress({
        currentVisualProgress: 0.2,
        previousLogicalProgress: 0,
        logicalProgress: 0.25,
        elapsedMs: 0,
        progressStep: WALL_PROGRESS_STEP,
      }),
    ).toBe(0.25);
  });

  it("次の論理更新位置より先へ進まない", () => {
    expect(
      advanceVisualWallProgress({
        currentVisualProgress: 0.2,
        previousLogicalProgress: 0,
        logicalProgress: 0,
        elapsedMs: 2000,
        progressStep: WALL_PROGRESS_STEP,
      }),
    ).toBe(0.25);
  });

  it.each([0, -0.1, Number.NaN, Number.POSITIVE_INFINITY])(
    "無効な進行step %sでは初速へフォールバックする",
    (progressStep) => {
      expect(
        advanceVisualWallProgress({
          currentVisualProgress: 0,
          previousLogicalProgress: 0,
          logicalProgress: 0,
          elapsedMs: WALL_TICK_INTERVAL_MS,
          progressStep,
        }),
      ).toBe(WALL_PROGRESS_STEP);
    },
  );

  it("新しい壁へ切り替わった場合は開始位置へ戻す", () => {
    expect(
      advanceVisualWallProgress({
        currentVisualProgress: 0.99,
        previousLogicalProgress: 0.75,
        logicalProgress: 0,
        elapsedMs: 16,
        progressStep: 0.45,
      }),
    ).toBe(0);
  });

  it("表示進行率を0から1の範囲へ制限する", () => {
    expect(
      advanceVisualWallProgress({
        currentVisualProgress: 0.99,
        previousLogicalProgress: 0.75,
        logicalProgress: 0.75,
        elapsedMs: 100,
        progressStep: 0.45,
      }),
    ).toBe(1);
  });
});
