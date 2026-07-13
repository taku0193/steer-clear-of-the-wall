import { describe, expect, it } from "vitest";
import { calculatePerformanceRank } from "./performanceRank";

describe("calculatePerformanceRank", () => {
  it.each([
    [12, 3, 2, "S"],
    [6, 3, 2, "A"],
    [3, 2, 2, "B"],
    [0, 1, 5, "C"],
  ] as const)("結果から%sランク相当を計算する", (walls, level, misses, rank) => {
    expect(calculatePerformanceRank({ successfulWalls: walls, wallSpeedLevel: level, misses })).toBe(rank);
  });
});
