import { describe, expect, it } from "vitest";
import { calculateGameViewport, GAME_ASPECT_RATIO } from "./gameViewport";

describe("calculateGameViewport", () => {
  it("横長Canvasでは高さを使い左右へ余白を置く", () => {
    const viewport = calculateGameViewport(1920, 900);
    expect(viewport?.gameHeight).toBeCloseTo(900);
    expect((viewport?.gameWidth ?? 0) / (viewport?.gameHeight ?? 1)).toBeCloseTo(GAME_ASPECT_RATIO);
    expect(viewport?.gameX).toBeGreaterThan(0);
    expect(viewport?.gameY).toBeCloseTo(0);
  });

  it("縦長Canvasでは幅を使い上下へ余白を置く", () => {
    const viewport = calculateGameViewport(390, 844);
    expect(viewport?.gameWidth).toBeCloseTo(390);
    expect(viewport?.gameX).toBeCloseTo(0);
    expect(viewport?.gameY).toBeGreaterThan(0);
  });

  it("無効サイズではnullを返す", () => {
    expect(calculateGameViewport(0, 500)).toBeNull();
    expect(calculateGameViewport(Number.NaN, 500)).toBeNull();
  });
});
