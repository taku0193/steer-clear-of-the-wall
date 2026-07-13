import { describe, expect, it } from "vitest";
import { compareRankingEntries } from "./rankingOrder";
import type { StoredRankingEntry } from "./rankingTypes";

const BASE: StoredRankingEntry = {
  databaseId: 1,
  submissionId: "123e4567-e89b-42d3-a456-426614174000",
  displayName: "A",
  score: 100,
  successfulWalls: 10,
  speedLevel: 2,
  misses: 2,
  createdAt: "2026-07-13T00:00:00.000Z",
};

describe("compareRankingEntries", () => {
  it("スコア、クリア枚数、ミス、日時、IDで並べる", () => {
    const entries = [
      { ...BASE, databaseId: 5, displayName: "later-id" },
      { ...BASE, databaseId: 4, displayName: "earlier-id" },
      { ...BASE, databaseId: 3, displayName: "later-date", createdAt: "2026-07-14T00:00:00.000Z" },
      { ...BASE, databaseId: 2, displayName: "fewer-miss", misses: 1 },
      { ...BASE, databaseId: 1, displayName: "more-walls", successfulWalls: 11 },
      { ...BASE, databaseId: 6, displayName: "high-score", score: 101 },
    ];
    expect(entries.sort(compareRankingEntries).map((entry) => entry.displayName)).toEqual([
      "high-score",
      "more-walls",
      "fewer-miss",
      "earlier-id",
      "later-id",
      "later-date",
    ]);
  });
});
