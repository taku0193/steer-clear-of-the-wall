import { describe, expect, it } from "vitest";
import { calculateCanvasViewport } from "./canvasViewport";

describe("calculateCanvasViewport", () => {
  it("CSSサイズを整数へ丸めて通常DPIのbitmapサイズを返す", () => {
    expect(calculateCanvasViewport(1280.4, 719.6, 1)).toEqual({
      cssWidth: 1280,
      cssHeight: 720,
      pixelRatio: 1,
      bitmapWidth: 1280,
      bitmapHeight: 720,
    });
  });

  it("高DPIではpixelRatioに応じてbitmapサイズを拡大する", () => {
    expect(calculateCanvasViewport(800, 450, 1.5)).toEqual({
      cssWidth: 800,
      cssHeight: 450,
      pixelRatio: 1.5,
      bitmapWidth: 1200,
      bitmapHeight: 675,
    });
  });

  it("pixelRatioを1から2の範囲へ制限する", () => {
    expect(calculateCanvasViewport(640, 360, 0.5)?.pixelRatio).toBe(1);
    expect(calculateCanvasViewport(640, 360, 3)?.pixelRatio).toBe(2);
  });

  it("pixelRatioが有限値でない場合は1を使う", () => {
    expect(
      calculateCanvasViewport(640, 360, Number.POSITIVE_INFINITY),
    ).toMatchObject({
      pixelRatio: 1,
      bitmapWidth: 640,
      bitmapHeight: 360,
    });
  });

  it("幅または高さが無効な場合はnullを返す", () => {
    expect(calculateCanvasViewport(0, 360, 1)).toBeNull();
    expect(calculateCanvasViewport(640, -1, 1)).toBeNull();
    expect(calculateCanvasViewport(Number.NaN, 360, 1)).toBeNull();
  });
});
