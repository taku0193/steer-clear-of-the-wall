export class DuplicateRankingSubmissionError extends Error {
  constructor(public readonly submissionId: string) {
    super("Ranking submission already exists");
    this.name = "DuplicateRankingSubmissionError";
  }
}

export class RankingDatabaseUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super("Ranking database is unavailable", options);
    this.name = "RankingDatabaseUnavailableError";
  }
}
