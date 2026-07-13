import { describe, expect, it, vi } from "vitest";
import { DuplicateRankingSubmissionError } from "./rankingErrors";
import type { RankingRepository } from "./rankingRepository";
import { submitRanking } from "./rankingService";

const VALID = {
  submissionId: "123e4567-e89b-42d3-a456-426614174000",
  displayName: "プレイヤー",
  score: 100,
  successfulWalls: 10,
  speedLevel: 2,
  misses: 2,
};

function createRepository(insert: RankingRepository["insert"]): RankingRepository {
  return {
    insert,
    getSnapshot: vi.fn(),
    healthCheck: vi.fn(),
    close: vi.fn(),
  };
}

describe("submitRanking", () => {
  it("検証済みsubmissionをrepositoryへ渡す", () => {
    const insert = vi.fn(() => ({
      rank: 1,
      entry: {
        id: VALID.submissionId,
        rank: 1,
        displayName: VALID.displayName,
        score: 100,
        successfulWalls: 10,
        speedLevel: 2,
        achievedAt: "2026-07-13T00:00:00.000Z",
      },
    }));
    expect(submitRanking(VALID, createRepository(insert)).ok).toBe(true);
    expect(insert).toHaveBeenCalledWith(VALID);
  });

  it("入力不正と重複をdomain errorへ変換する", () => {
    expect(submitRanking({}, createRepository(vi.fn()))).toMatchObject({
      ok: false,
      type: "invalidSubmission",
    });
    const duplicate = createRepository(() => {
      throw new DuplicateRankingSubmissionError(VALID.submissionId);
    });
    expect(submitRanking(VALID, duplicate)).toEqual({
      ok: false,
      type: "duplicateSubmission",
    });
  });
});
