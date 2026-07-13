import { describe, expect, it } from "vitest";
import { applyWallPass, calculateWallRect } from "./wallGeometry";

describe("calculateWallRect", () => {
  it("top配置は進行中も壁上端をCanvas上端へ固定する", () => {
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const rect = calculateWallRect(1000, 600, progress, "top");

      expect(rect.y).toBe(0);
    }
  });

  it("ground配置は進行中も壁下端をCanvas下端へ固定する", () => {
    const canvasWidth = 1000;
    const canvasHeight = 600;

    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const rect = calculateWallRect(
        canvasWidth,
        canvasHeight,
        progress,
        "ground",
      );

      expect(rect.y + rect.height).toBeCloseTo(canvasHeight);
    }
  });

  it("center配置は将来の浮遊壁向けに上下中央へ配置する", () => {
    const rect = calculateWallRect(1000, 600, 0, "center");

    expect(rect).toEqual({
      x: 225,
      y: 135,
      width: 550,
      height: 330,
    });
  });

  it("進行率を0から1へ制限する", () => {
    expect(calculateWallRect(1000, 600, -1, "ground")).toEqual(
      calculateWallRect(1000, 600, 0, "ground"),
    );
    expect(calculateWallRect(1000, 600, 2, "ground")).toEqual(
      calculateWallRect(1000, 600, 1, "ground"),
    );
  });
});

describe("applyWallPass", () => {
  it("通過進行に応じて中心を維持したまま壁を拡大する", () => {
    const rect = { x: 100, y: 50, width: 400, height: 300 };
    const passed = applyWallPass(rect, 1);
    expect(passed.width).toBeGreaterThan(rect.width);
    expect(passed.height).toBeGreaterThan(rect.height);
    expect(passed.x + passed.width / 2).toBeCloseTo(rect.x + rect.width / 2);
    expect(passed.y + passed.height / 2).toBeCloseTo(rect.y + rect.height / 2);
  });
});
