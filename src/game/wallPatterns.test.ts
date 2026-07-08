import { describe, expect, it } from "vitest";
import {
  getWallPatternById,
  getWallPatternByIndex,
  WALL_PATTERNS,
} from "./wallPatterns";

const REQUIRED_EXISTING_PATTERN_IDS = [
  "center-gap",
  "left-gap",
  "right-gap",
  "crouch-low",
  "deep-crouch",
  "left-low",
  "right-low",
  "narrow-center",
  "wide-low",
] as const;

const ADDED_PATTERN_IDS = [
  "jump-center",
  "jump-left",
  "jump-right",
  "high-narrow",
  "tiny-hop",
  "hell-left-low",
  "hell-right-low",
  "hell-left-high",
  "hell-right-high",
  "needle-center",
  "floor-scrape",
  "corner-left",
  "corner-right",
  "high-center-tight",
] as const;

const BOTTOM_OPEN_PATTERN_IDS = [
  "center-gap",
  "left-gap",
  "right-gap",
  "crouch-low",
  "deep-crouch",
  "left-low",
  "right-low",
  "narrow-center",
  "wide-low",
] as const;

describe("WALL_PATTERNS", () => {
  it("既存パターンを削除せずに保持している", () => {
    const ids = WALL_PATTERNS.map((pattern) => pattern.id);

    for (const id of REQUIRED_EXISTING_PATTERN_IDS) {
      expect(ids).toContain(id);
    }
  });

  it("ジャンプ系と高難易度パターンを持つ", () => {
    const ids = WALL_PATTERNS.map((pattern) => pattern.id);

    for (const id of ADDED_PATTERN_IDS) {
      expect(ids).toContain(id);
    }
  });

  it("各パターンのIDは一意で、安全領域とスコア値が有効である", () => {
    const ids = new Set(WALL_PATTERNS.map((pattern) => pattern.id));

    expect(ids.size).toBe(WALL_PATTERNS.length);

    for (const pattern of WALL_PATTERNS) {
      expect(pattern.name.length).toBeGreaterThan(0);
      expect(pattern.verticalAnchor).toBe("top");
      expect(pattern.scoreValue).toBeGreaterThan(0);
      expect(pattern.safeArea.x).toBeGreaterThanOrEqual(0);
      expect(pattern.safeArea.y).toBeGreaterThanOrEqual(0);
      expect(pattern.safeArea.width).toBeGreaterThan(0);
      expect(pattern.safeArea.height).toBeGreaterThan(0);
      expect(pattern.safeArea.x + pattern.safeArea.width).toBeLessThanOrEqual(1);
      expect(pattern.safeArea.y + pattern.safeArea.height).toBeLessThanOrEqual(1);
    }
  });

  it("複合形状を持つパターンのゾーンは正規化範囲内でIDが一意である", () => {
    const shapedPatterns = WALL_PATTERNS.filter((pattern) => pattern.safeShape);

    expect(shapedPatterns.length).toBeGreaterThan(0);

    for (const pattern of shapedPatterns) {
      const zones = pattern.safeShape?.zones ?? [];
      const zoneIds = new Set(zones.map((zone) => zone.id));

      expect(zoneIds.size).toBe(zones.length);

      for (const zone of zones) {
        if (zone.type === "rect") {
          expect(zone.x).toBeGreaterThanOrEqual(0);
          expect(zone.y).toBeGreaterThanOrEqual(0);
          expect(zone.width).toBeGreaterThan(0);
          expect(zone.height).toBeGreaterThan(0);
          expect(zone.x + zone.width).toBeLessThanOrEqual(1);
          expect(zone.y + zone.height).toBeLessThanOrEqual(1);
        }

        if (zone.type === "ellipse") {
          expect(zone.cx).toBeGreaterThanOrEqual(0);
          expect(zone.cy).toBeGreaterThanOrEqual(0);
          expect(zone.cx).toBeLessThanOrEqual(1);
          expect(zone.cy).toBeLessThanOrEqual(1);
          expect(zone.rx).toBeGreaterThan(0);
          expect(zone.ry).toBeGreaterThan(0);
        }

        if (zone.type === "capsule") {
          expect(zone.x1).toBeGreaterThanOrEqual(0);
          expect(zone.y1).toBeGreaterThanOrEqual(0);
          expect(zone.x2).toBeGreaterThanOrEqual(0);
          expect(zone.y2).toBeGreaterThanOrEqual(0);
          expect(zone.x1).toBeLessThanOrEqual(1);
          expect(zone.y1).toBeLessThanOrEqual(1);
          expect(zone.x2).toBeLessThanOrEqual(1);
          expect(zone.y2).toBeLessThanOrEqual(1);
          expect(zone.radius).toBeGreaterThan(0);
        }

        if (zone.type === "polygon") {
          expect(zone.points.length).toBeGreaterThanOrEqual(3);

          for (const point of zone.points) {
            expect(point.x).toBeGreaterThanOrEqual(0);
            expect(point.y).toBeGreaterThanOrEqual(0);
            expect(point.x).toBeLessThanOrEqual(1);
            expect(point.y).toBeLessThanOrEqual(1);
          }
        }
      }
    }
  });

  it("下端まで開く設計の安全領域は壁の下端まで届いている", () => {
    for (const id of BOTTOM_OPEN_PATTERN_IDS) {
      const pattern = getWallPatternById(id);

      expect(
        pattern.safeArea.y + pattern.safeArea.height,
      ).toBeCloseTo(1);
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
