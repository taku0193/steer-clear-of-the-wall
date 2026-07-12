import { describe, expect, it } from "vitest";
import {
  getWallPatternById,
  getWallPatternByIndex,
  WALL_PATTERNS,
} from "./wallPatterns";

const REQUIRED_PATTERN_IDS = [
  "center-gap",
  "left-gap",
  "right-gap",
  "crouch-low",
  "left-low",
  "right-low",
  "arms-wide",
  "hands-up",
  "side-step-left",
  "side-step-right",
] as const;

describe("WALL_PATTERNS", () => {
  it("立位・横移動・しゃがみ・腕のポーズを提供する", () => {
    const ids = WALL_PATTERNS.map((pattern) => pattern.id);
    for (const id of REQUIRED_PATTERN_IDS) expect(ids).toContain(id);
  });

  it("床に倒れ込む姿勢や意図が伝わらない名称を持たない", () => {
    const unsafeWords = /伏せ|床すれすれ|鬼畜|針/;
    for (const pattern of WALL_PATTERNS) expect(pattern.name).not.toMatch(unsafeWords);
  });

  it("各パターンのID、外接領域、スコアが有効である", () => {
    expect(new Set(WALL_PATTERNS.map((pattern) => pattern.id)).size).toBe(
      WALL_PATTERNS.length,
    );

    for (const pattern of WALL_PATTERNS) {
      expect(pattern.verticalAnchor).toBe("top");
      expect(pattern.scoreValue).toBeGreaterThan(0);
      expect(pattern.safeArea.x).toBeGreaterThanOrEqual(0);
      expect(pattern.safeArea.y).toBeGreaterThanOrEqual(0);
      expect(pattern.safeArea.width).toBeGreaterThan(0);
      expect(pattern.safeArea.height).toBeGreaterThan(0);
      expect(pattern.safeArea.x + pattern.safeArea.width).toBeLessThanOrEqual(1);
      expect(pattern.safeArea.y + pattern.safeArea.height).toBeLessThanOrEqual(1);
      expect(pattern.safeArea.height).toBeLessThanOrEqual(0.92);
      if (pattern.id === "small-jump") {
        expect(pattern.safeArea.y + pattern.safeArea.height).toBeLessThan(1);
      } else {
        expect(pattern.safeArea.y + pattern.safeArea.height).toBeCloseTo(1);
      }
    }
  });

  it("動作に必要な場合だけ横幅を広く取る", () => {
    for (const pattern of WALL_PATTERNS) {
      if (pattern.id === "arms-wide") {
        expect(pattern.safeArea.width).toBeGreaterThan(0.6);
      } else if (pattern.id.includes("seat")) {
        expect(pattern.safeArea.width).toBeLessThanOrEqual(0.4);
        expect(pattern.safeArea.height).toBeLessThanOrEqual(0.4);
      } else if (
        pattern.id.includes("low") ||
        pattern.id === "wide-stance"
      ) {
        expect(pattern.safeArea.width).toBeLessThanOrEqual(0.65);
      } else if (pattern.id === "small-jump") {
        expect(pattern.safeArea.width).toBeLessThanOrEqual(0.5);
      } else if (pattern.id.includes("lean")) {
        expect(pattern.safeArea.width).toBeLessThanOrEqual(0.5);
      } else {
        expect(pattern.safeArea.width).toBeLessThanOrEqual(0.45);
      }
    }
  });

  it("すべての穴が動作に合わせた単一の連続ポリゴンである", () => {
    for (const pattern of WALL_PATTERNS) {
      const zones = pattern.safeShape?.zones ?? [];
      expect(zones).toHaveLength(1);
      expect(zones[0]?.type).toBe("polygon");
      if (zones[0]?.type !== "polygon") continue;
      expect(zones[0].points.length).toBeGreaterThanOrEqual(8);
      const bottom = Math.max(...zones[0].points.map((point) => point.y));
      expect(bottom).toBe(pattern.id === "small-jump" ? 0.7 : 1);
      for (const point of zones[0].points) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(1);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(1);
      }
    }
  });

  it("ID検索とインデックス検索がフォールバック・循環する", () => {
    expect(getWallPatternById("right-gap").id).toBe("right-gap");
    expect(getWallPatternById("unknown").id).toBe(WALL_PATTERNS[0].id);
    expect(getWallPatternByIndex(WALL_PATTERNS.length).id).toBe(WALL_PATTERNS[0].id);
  });
});
