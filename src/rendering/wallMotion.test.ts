import { describe, expect, it } from "vitest";
import { WALL_CYCLE_DURATION_MS } from "../game/gameLoop";
import { advanceVisualWallProgress } from "./wallMotion";

describe("advanceVisualWallProgress", () => {
  it("壁1枚の進行時間は2.4秒である", () => {
    expect(WALL_CYCLE_DURATION_MS).toBe(2400);
  });

  it("設定周期に合わせて表示進行率を連続的に進める", () => {
    expect(
      advanceVisualWallProgress({
        currentVisualProgress: 0,
        previousLogicalProgress: 0,
        logicalProgress: 0,
        elapsedMs: 16,
      }),
    ).toBeCloseTo(16 / WALL_CYCLE_DURATION_MS, 6);
  });

  it("論理進行率が表示より先なら論理値へ追従する", () => {
    expect(
      advanceVisualWallProgress({
        currentVisualProgress: 0.2,
        previousLogicalProgress: 0,
        logicalProgress: 0.25,
        elapsedMs: 0,
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
      }),
    ).toBe(0.25);
  });

  it("新しい壁へ切り替わった場合は開始位置へ戻す", () => {
    expect(
      advanceVisualWallProgress({
        currentVisualProgress: 0.99,
        previousLogicalProgress: 0.75,
        logicalProgress: 0,
        elapsedMs: 16,
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
      }),
    ).toBe(1);
  });
});
