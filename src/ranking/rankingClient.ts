import type {
  RankingApiError,
  RankingEntry,
  RankingSnapshot,
  RankingSubmission,
  RankingSubmissionResponse,
} from "./rankingTypes";

export class RankingClientError extends Error {
  constructor(
    message: string,
    public readonly code: RankingApiError["error"]["code"] = "rankingUnavailable",
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "RankingClientError";
  }
}

export async function fetchRankingSnapshot(
  signal?: AbortSignal,
): Promise<RankingSnapshot> {
  const response = await fetch("/api/rankings", {
    cache: "no-store",
    signal,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw parseError(body);
  return parseRankingSnapshot(body);
}

export async function postRankingSubmission(
  submission: RankingSubmission,
  signal?: AbortSignal,
): Promise<RankingSubmissionResponse> {
  const response = await fetch("/api/rankings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
    signal,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw parseError(body);
  if (!isRecord(body) || !isRankingEntry(body.entry) || !isInteger(body.rank)) {
    throw new RankingClientError("ランキングの応答が正しくありません");
  }
  return { entry: body.entry, rank: body.rank };
}

export function parseRankingSnapshot(value: unknown): RankingSnapshot {
  if (
    !isRecord(value) ||
    !Array.isArray(value.entries) ||
    !value.entries.every(isRankingEntry) ||
    !isInteger(value.totalEntries) ||
    typeof value.updatedAt !== "string"
  ) {
    throw new RankingClientError("ランキングの応答が正しくありません");
  }
  return {
    entries: value.entries,
    totalEntries: value.totalEntries,
    updatedAt: value.updatedAt,
  };
}

function isRankingEntry(value: unknown): value is RankingEntry {
  return isRecord(value) &&
    typeof value.id === "string" &&
    isInteger(value.rank) &&
    typeof value.displayName === "string" &&
    isInteger(value.score) &&
    isInteger(value.successfulWalls) &&
    isInteger(value.speedLevel) &&
    typeof value.achievedAt === "string";
}

function parseError(value: unknown): RankingClientError {
  if (isRecord(value) && isRecord(value.error)) {
    const code = typeof value.error.code === "string"
      ? value.error.code as RankingApiError["error"]["code"]
      : "rankingUnavailable";
    const fields = isStringRecord(value.error.fields) ? value.error.fields : undefined;
    return new RankingClientError(
      typeof value.error.message === "string"
        ? value.error.message
        : "ランキングを利用できません",
      code,
      fields,
    );
  }
  return new RankingClientError("ランキングを利用できません");
}

function isInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "string");
}
