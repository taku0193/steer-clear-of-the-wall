import { DuplicateRankingSubmissionError } from "./rankingErrors";
import { getRankingRepository, type RankingRepository } from "./rankingRepository";
import type { RankingSnapshot, RankingSubmissionResponse } from "./rankingTypes";
import { validateRankingSubmission } from "./rankingValidation";

export type RankingServiceResult<T> =
  | { ok: true; value: T }
  | {
      ok: false;
      type: "invalidSubmission";
      fields: Record<string, string>;
    }
  | { ok: false; type: "duplicateSubmission" };

export function listRankings(
  repository: RankingRepository = getRankingRepository(),
): RankingSnapshot {
  return repository.getSnapshot();
}

export function submitRanking(
  input: unknown,
  repository: RankingRepository = getRankingRepository(),
): RankingServiceResult<RankingSubmissionResponse> {
  const validation = validateRankingSubmission(input);
  if (!validation.ok) {
    return { ok: false, type: "invalidSubmission", fields: validation.fields };
  }
  try {
    return { ok: true, value: repository.insert(validation.value) };
  } catch (error) {
    if (error instanceof DuplicateRankingSubmissionError) {
      return { ok: false, type: "duplicateSubmission" };
    }
    throw error;
  }
}
