import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { DuplicateRankingSubmissionError } from "./rankingErrors";
import { createRankingRepository, type RankingRepository } from "./rankingRepository";
import type { RankingSubmission } from "./rankingTypes";

const BASE: RankingSubmission = {
  submissionId: "123e4567-e89b-42d3-a456-426614174000",
  displayName: "プレイヤー",
  score: 100,
  successfulWalls: 10,
  speedLevel: 2,
  misses: 2,
};

describe("rankingRepository", () => {
  let repository: RankingRepository | null = null;
  let directory: string | null = null;

  afterEach(() => {
    repository?.close();
    if (directory) rmSync(directory, { recursive: true, force: true });
    repository = null;
    directory = null;
  });

  it("登録して順位付きTop 100を取得する", () => {
    repository = createRankingRepository(":memory:", {
      now: () => new Date("2026-07-13T00:00:00.000Z"),
    });
    repository.insert(BASE);
    repository.insert({
      ...BASE,
      submissionId: "223e4567-e89b-42d3-a456-426614174000",
      displayName: "上位",
      score: 200,
    });

    expect(repository.getSnapshot()).toMatchObject({
      totalEntries: 2,
      entries: [
        { rank: 1, displayName: "上位", score: 200 },
        { rank: 2, displayName: "プレイヤー", score: 100 },
      ],
    });
  });

  it("submission IDの重複を拒否する", () => {
    repository = createRankingRepository(":memory:");
    repository.insert(BASE);
    expect(() => repository?.insert(BASE)).toThrow(DuplicateRankingSubmissionError);
  });

  it("再open後も記録を保持する", () => {
    directory = mkdtempSync(join(tmpdir(), "ranking-test-"));
    const databasePath = join(directory, "ranking.db");
    repository = createRankingRepository(databasePath);
    repository.insert(BASE);
    repository.close();

    repository = createRankingRepository(databasePath);
    expect(repository.healthCheck()).toBe(true);
    expect(repository.getSnapshot().entries[0]).toMatchObject({ displayName: "プレイヤー" });
  });

  it("全件数を保持しつつ上位100件だけを返す", () => {
    repository = createRankingRepository(":memory:", {
      now: () => new Date("2026-07-13T00:00:00.000Z"),
    });
    for (let index = 0; index < 105; index += 1) {
      repository.insert({
        ...BASE,
        submissionId: `entry-${index}`,
        displayName: `P${index}`,
        score: index,
      });
    }
    const snapshot = repository.getSnapshot();
    expect(snapshot.totalEntries).toBe(105);
    expect(snapshot.entries).toHaveLength(100);
    expect(snapshot.entries[0]).toMatchObject({ rank: 1, displayName: "P104" });
    expect(snapshot.entries[99]).toMatchObject({ rank: 100, displayName: "P5" });
  });
});
