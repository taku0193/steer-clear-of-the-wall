import { describe, expect, it } from "vitest";
import { createJudgmentAudioKey, selectBgmTrack, selectJudgmentEffect } from "./audioSelection";

describe("audioSelection", () => {
  it.each([
    ["title", "lobby"], ["preparing", "lobby"], ["countdown", "play"],
    ["playing", "play"], ["result", "none"], ["error", "none"],
  ] as const)("%sでは%sを選ぶ", (phase, track) => {
    expect(selectBgmTrack(phase)).toBe(track);
  });

  it("判定結果ごとの効果音を選ぶ", () => {
    const success = { type: "success", patternId: "wall" } as const;
    expect(selectJudgmentEffect(success, false)).toBe("success");
    expect(selectJudgmentEffect(success, true)).toBe("speedUp");
    expect(selectJudgmentEffect({ type: "miss", patternId: "wall", reason: "outsideSafeArea" }, false)).toBe("miss");
    expect(selectJudgmentEffect({ type: "notDetected", patternId: "wall" }, false)).toBe("notDetected");
  });

  it("壁indexを含む一意な判定キーを作る", () => {
    expect(createJudgmentAudioKey({ type: "success", patternId: "a" }, 2)).toBe("2:a:success");
  });
});
