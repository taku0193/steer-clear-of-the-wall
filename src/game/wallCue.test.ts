import { describe, expect, it } from "vitest";
import { WALL_PATTERNS } from "./wallPatterns";
import {
  createWallCueModel,
  getRemainingWallTicks,
  getWallCuePhase,
} from "./wallCue";

describe("壁接近キュー", () => {
  it.each([
    { level: 1, preview: 0.25, ready: 0.5, act: 0.75 },
    { level: 2, preview: 0.3, ready: 0.6, act: 0.9 },
    { level: 3, preview: 0, ready: 0.36, act: 0.72 },
    { level: 4, preview: 0, ready: 0.45, act: 0.9 },
  ])(
    "速度レベル$levelで判定1tick前だけ実行合図を出す",
    ({ level, preview, ready, act }) => {
      expect(getWallCuePhase(preview, level)).toBe("preview");
      expect(getWallCuePhase(ready, level)).toBe("ready");
      expect(getWallCuePhase(act, level)).toBe("act");
    },
  );

  it("初速では確認・構え・実行に使える残りtick数を返す", () => {
    expect(getRemainingWallTicks(0, 1)).toBe(4);
    expect(getRemainingWallTicks(0.25, 1)).toBe(3);
    expect(getRemainingWallTicks(0.5, 1)).toBe(2);
    expect(getRemainingWallTicks(0.75, 1)).toBe(1);
  });

  it("無効な進行率を安全な範囲へ補正する", () => {
    expect(getRemainingWallTicks(Number.NaN, 1)).toBe(4);
    expect(getRemainingWallTicks(-1, 1)).toBe(4);
    expect(getRemainingWallTicks(2, 1)).toBe(0);
  });

  it("ジャンプだけ動作とタイミングを明示する", () => {
    const jumpPattern = WALL_PATTERNS.find(
      (pattern) => pattern.id === "small-jump",
    );
    expect(jumpPattern).toBeDefined();

    const previewCue = createWallCueModel({
      pattern: jumpPattern!,
      wallProgress: 0,
      visualWallProgress: 0,
      wallSpeedLevel: 1,
    });
    const readyCue = createWallCueModel({
      pattern: jumpPattern!,
      wallProgress: 0.75,
      visualWallProgress: 0.8,
      wallSpeedLevel: 1,
    });
    const actCue = createWallCueModel({
      pattern: jumpPattern!,
      wallProgress: 0.75,
      visualWallProgress: 0.875,
      wallSpeedLevel: 1,
    });

    expect(previewCue).toMatchObject({
      phase: "preview",
      headline: "小さくジャンプ",
      isJump: true,
    });
    expect(previewCue.detail).toContain("「いま！」の合図");
    expect(readyCue).toMatchObject({
      phase: "ready",
      headline: "ジャンプの準備",
    });
    expect(actCue).toMatchObject({
      phase: "act",
      headline: "いま！ 小さくジャンプ",
      detail: "その場で真上へ",
    });
  });

  it.each([
    { level: 1, wallProgress: 0.75, halfway: 0.875 },
    { level: 2, wallProgress: 0.9, halfway: 0.95 },
    { level: 3, wallProgress: 0.72, halfway: 0.86 },
    { level: 4, wallProgress: 0.9, halfway: 0.95 },
  ])(
    "速度レベル$levelのジャンプ合図は最終区間の中間で出す",
    ({ level, wallProgress, halfway }) => {
      const jumpPattern = WALL_PATTERNS.find(
        (pattern) => pattern.actionTiming === "jump",
      )!;

      expect(
        createWallCueModel({
          pattern: jumpPattern,
          wallProgress,
          visualWallProgress: halfway - 0.001,
          wallSpeedLevel: level,
        }).phase,
      ).toBe("ready");
      expect(
        createWallCueModel({
          pattern: jumpPattern,
          wallProgress,
          visualWallProgress: halfway,
          wallSpeedLevel: level,
        }).phase,
      ).toBe("act");
    },
  );

  it("保持する姿勢は判定直前にキープを促す", () => {
    const cue = createWallCueModel({
      pattern: WALL_PATTERNS[0],
      wallProgress: 0.75,
      visualWallProgress: 0.75,
      wallSpeedLevel: 1,
    });

    expect(cue).toEqual({
      phase: "act",
      headline: "いま！ 中央でまっすぐ",
      detail: "壁が通るまで姿勢をキープ",
      isJump: false,
    });
  });
});
