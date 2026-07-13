import { describe, expect, it } from "vitest";
import {
  countGraphemes,
  normalizeDisplayName,
  validateDisplayName,
  validateRankingSubmission,
} from "./rankingValidation";

const VALID_SUBMISSION = {
  submissionId: "123e4567-e89b-42d3-a456-426614174000",
  displayName: "プレイヤー",
  score: 1200,
  successfulWalls: 12,
  speedLevel: 3,
  misses: 2,
};

describe("rankingValidation", () => {
  it("表示名をNFKC化し空白をまとめる", () => {
    expect(normalizeDisplayName("  ＡＢＣ   太郎  ")).toBe("ABC 太郎");
  });

  it("結合文字と絵文字をgrapheme単位で数える", () => {
    expect(countGraphemes("か\u3099👍🏽")).toBe(2);
  });

  it.each(["", "abcdefghijklmn", "<script>", "abc\u200Bdef", "abc\n"])(
    "危険または範囲外の表示名を拒否する: %s",
    (name) => expect(validateDisplayName(name).ok).toBe(false),
  );

  it("正常なsubmissionを正規化する", () => {
    expect(validateRankingSubmission({ ...VALID_SUBMISSION, displayName: "  ＡＢＣ  " })).toEqual({
      ok: true,
      value: { ...VALID_SUBMISSION, displayName: "ABC" },
    });
  });

  it("UUIDと数値範囲を検証する", () => {
    const result = validateRankingSubmission({
      ...VALID_SUBMISSION,
      submissionId: "bad",
      score: -1,
      speedLevel: 1.5,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fields).toHaveProperty("submissionId");
      expect(result.fields).toHaveProperty("score");
      expect(result.fields).toHaveProperty("speedLevel");
    }
  });
});
