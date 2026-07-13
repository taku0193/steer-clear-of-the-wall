import type { RankingSubmission } from "./rankingTypes";

export const DISPLAY_NAME_MAX_GRAPHEMES = 12;
export const RANKING_LIMITS = {
  score: { min: 0, max: 1_000_000 },
  successfulWalls: { min: 0, max: 10_000 },
  speedLevel: { min: 1, max: 100 },
  misses: { min: 0, max: 100 },
} as const;

type ValidationSuccess = {
  ok: true;
  value: RankingSubmission;
};

type ValidationFailure = {
  ok: false;
  fields: Record<string, string>;
};

export type RankingValidationResult = ValidationSuccess | ValidationFailure;

const UNSAFE_DISPLAY_NAME = /[<>\p{Cc}\p{Cf}]/u;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeDisplayName(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ");
}

export function countGraphemes(value: string): number {
  if (typeof Intl.Segmenter === "function") {
    return Array.from(
      new Intl.Segmenter("ja", { granularity: "grapheme" }).segment(value),
    ).length;
  }
  return Array.from(value).length;
}

export function validateDisplayName(value: unknown):
  | { ok: true; value: string }
  | { ok: false; message: string } {
  if (typeof value !== "string") {
    return { ok: false, message: "表示名を入力してください" };
  }
  if (UNSAFE_DISPLAY_NAME.test(value)) {
    return { ok: false, message: "表示名に使用できない文字が含まれています" };
  }
  const normalized = normalizeDisplayName(value);
  const length = countGraphemes(normalized);
  if (length < 1 || length > DISPLAY_NAME_MAX_GRAPHEMES) {
    return { ok: false, message: "表示名は1〜12文字で入力してください" };
  }
  return { ok: true, value: normalized };
}

export function validateRankingSubmission(input: unknown): RankingValidationResult {
  if (!isRecord(input)) {
    return { ok: false, fields: { form: "送信内容が正しくありません" } };
  }

  const fields: Record<string, string> = {};
  const displayName = validateDisplayName(input.displayName);
  if (!displayName.ok) fields.displayName = displayName.message;
  if (typeof input.submissionId !== "string" || !UUID_PATTERN.test(input.submissionId)) {
    fields.submissionId = "ゲームセッションIDが正しくありません";
  }

  for (const key of Object.keys(RANKING_LIMITS) as (keyof typeof RANKING_LIMITS)[]) {
    const value = input[key];
    const { min, max } = RANKING_LIMITS[key];
    if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
      fields[key] = `${min}〜${max}の整数で指定してください`;
    }
  }

  if (Object.keys(fields).length > 0 || !displayName.ok) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      submissionId: input.submissionId as string,
      displayName: displayName.value,
      score: input.score as number,
      successfulWalls: input.successfulWalls as number,
      speedLevel: input.speedLevel as number,
      misses: input.misses as number,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
