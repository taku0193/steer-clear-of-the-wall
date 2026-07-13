export type RankingSubmission = {
  submissionId: string;
  displayName: string;
  score: number;
  successfulWalls: number;
  speedLevel: number;
  misses: number;
};

export type StoredRankingEntry = RankingSubmission & {
  databaseId: number;
  createdAt: string;
};

export type RankingEntry = {
  id: string;
  rank: number;
  displayName: string;
  score: number;
  successfulWalls: number;
  speedLevel: number;
  achievedAt: string;
};

export type RankingSnapshot = {
  entries: RankingEntry[];
  totalEntries: number;
  updatedAt: string;
};

export type RankingSubmissionResponse = {
  entry: RankingEntry;
  rank: number;
};

export type RankingApiErrorCode =
  | "invalidSubmission"
  | "duplicateSubmission"
  | "payloadTooLarge"
  | "databaseUnavailable"
  | "rankingUnavailable";

export type RankingApiError = {
  error: {
    code: RankingApiErrorCode;
    message: string;
    fields?: Record<string, string>;
  };
};
