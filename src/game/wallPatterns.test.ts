import { describe, expect, it } from "vitest";
import {
  getWallPatternById,
  getWallPatternByIndex,
  WALL_PATTERNS,
} from "./wallPatterns";

describe("WALL_PATTERNS", () => {
  it("中央・左・右の3パターンを持つ", () => {
    expect(WALL_PATTERNS.map((pattern) => pattern.id)).toEqual([
      "center-gap",
      "left-gap",
      "right-gap",
    ]);
  });

  it("各パターンのIDは一意で、安全領域とスコア値が有効である", () => {
    const ids = new Set(WALL_PATTERNS.map((pattern) => pattern.id));

    expect(ids.size).toBe(WALL_PATTERNS.length);

    for (const pattern of WALL_PATTERNS) {
      expect(pattern.name.length).toBeGreaterThan(0);
      expect(pattern.scoreValue).toBeGreaterThan(0);
      expect(pattern.safeArea.x).toBeGreaterThanOrEqual(0);
      expect(pattern.safeArea.y).toBeGreaterThanOrEqual(0);
      expect(pattern.safeArea.width).toBeGreaterThan(0);
      expect(pattern.safeArea.height).toBeGreaterThan(0);
      expect(pattern.safeArea.x + pattern.safeArea.width).toBeLessThanOrEqual(1);
      expect(pattern.safeArea.y + pattern.safeArea.height).toBeLessThanOrEqual(1);
    }
  });

  it("ID検索で該当パターンを返し、不明なIDでは先頭を返す", () => {
    expect(getWallPatternById("right-gap").id).toBe("right-gap");
    expect(getWallPatternById("unknown").id).toBe(WALL_PATTERNS[0].id);
  });

  it("インデックス検索はパターン数で循環する", () => {
    expect(getWallPatternByIndex(WALL_PATTERNS.length).id).toBe(
      WALL_PATTERNS[0].id,
    );
  });
});
