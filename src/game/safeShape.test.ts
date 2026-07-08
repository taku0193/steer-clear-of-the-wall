import { describe, expect, it } from "vitest";
import {
  arePlayerAnchorsInsideSafeShape,
  createPlayerAnchorPoints,
  isPointInsideSafeShape,
  isPointInsideSafeZone,
} from "./safeShape";
import type { SafeShape } from "./types";

describe("safeShape", () => {
  it("プレイヤー矩形から代表点を作る", () => {
    const points = createPlayerAnchorPoints({
      x: 0.25,
      y: 0.2,
      width: 0.5,
      height: 0.6,
    });

    expect(points).toContainEqual({
      id: "head",
      x: 0.5,
      y: 0.248,
    });
    expect(points).toContainEqual({
      id: "leftFoot",
      x: 0.39,
      y: 0.8,
    });
  });

  it("矩形ゾーンの内外を判定する", () => {
    expect(
      isPointInsideSafeZone(
        { x: 0.5, y: 0.5 },
        { type: "rect", id: "body", x: 0.3, y: 0.2, width: 0.4, height: 0.6 },
        0,
      ),
    ).toBe(true);
    expect(
      isPointInsideSafeZone(
        { x: 0.2, y: 0.5 },
        { type: "rect", id: "body", x: 0.3, y: 0.2, width: 0.4, height: 0.6 },
        0,
      ),
    ).toBe(false);
  });

  it("楕円ゾーンと許容幅を判定する", () => {
    expect(
      isPointInsideSafeZone(
        { x: 0.5, y: 0.3 },
        { type: "ellipse", id: "head", cx: 0.5, cy: 0.3, rx: 0.1, ry: 0.08 },
        0,
      ),
    ).toBe(true);
    expect(
      isPointInsideSafeZone(
        { x: 0.62, y: 0.3 },
        { type: "ellipse", id: "head", cx: 0.5, cy: 0.3, rx: 0.1, ry: 0.08 },
        0.03,
      ),
    ).toBe(true);
  });

  it("カプセルゾーンの内外を判定する", () => {
    expect(
      isPointInsideSafeZone(
        { x: 0.5, y: 0.5 },
        {
          type: "capsule",
          id: "torso",
          x1: 0.5,
          y1: 0.25,
          x2: 0.5,
          y2: 0.75,
          radius: 0.12,
        },
        0,
      ),
    ).toBe(true);
    expect(
      isPointInsideSafeZone(
        { x: 0.75, y: 0.5 },
        {
          type: "capsule",
          id: "torso",
          x1: 0.5,
          y1: 0.25,
          x2: 0.5,
          y2: 0.75,
          radius: 0.12,
        },
        0,
      ),
    ).toBe(false);
  });

  it("ポリゴンゾーンの内外と許容幅を判定する", () => {
    const zone = {
      type: "polygon" as const,
      id: "silhouette",
      points: [
        { x: 0.5, y: 0.2 },
        { x: 0.7, y: 0.5 },
        { x: 0.55, y: 0.8 },
        { x: 0.35, y: 0.8 },
        { x: 0.3, y: 0.5 },
      ],
    };

    expect(isPointInsideSafeZone({ x: 0.5, y: 0.5 }, zone, 0)).toBe(true);
    expect(isPointInsideSafeZone({ x: 0.9, y: 0.5 }, zone, 0)).toBe(false);
    expect(isPointInsideSafeZone({ x: 0.72, y: 0.5 }, zone, 0.03)).toBe(true);
  });


  it("複数ゾーンのいずれかに点が入ればsafeShape内と判定する", () => {
    const shape: SafeShape = {
      zones: [
        { type: "ellipse", id: "head", cx: 0.5, cy: 0.25, rx: 0.12, ry: 0.1 },
        {
          type: "capsule",
          id: "torso",
          x1: 0.5,
          y1: 0.3,
          x2: 0.5,
          y2: 0.8,
          radius: 0.16,
        },
      ],
    };

    expect(isPointInsideSafeShape({ x: 0.5, y: 0.25 }, shape, 0)).toBe(true);
    expect(isPointInsideSafeShape({ x: 0.5, y: 0.6 }, shape, 0)).toBe(true);
    expect(isPointInsideSafeShape({ x: 0.9, y: 0.6 }, shape, 0)).toBe(false);
  });

  it("代表点がすべて複合形状内なら成功できる", () => {
    const forgivingHumanShape: SafeShape = {
      zones: [
        { type: "ellipse", id: "head", cx: 0.5, cy: 0.25, rx: 0.18, ry: 0.12 },
        {
          type: "capsule",
          id: "body",
          x1: 0.5,
          y1: 0.3,
          x2: 0.5,
          y2: 0.72,
          radius: 0.24,
        },
        {
          type: "rect",
          id: "feet",
          x: 0.32,
          y: 0.72,
          width: 0.36,
          height: 0.18,
        },
      ],
    };

    expect(
      arePlayerAnchorsInsideSafeShape({
        playerArea: {
          x: 0.37,
          y: 0.18,
          width: 0.26,
          height: 0.66,
        },
        safeShape: forgivingHumanShape,
        tolerance: 0.03,
      }),
    ).toBe(true);
  });
});
