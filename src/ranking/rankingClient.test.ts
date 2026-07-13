import { describe, expect, it } from "vitest";
import { parseRankingSnapshot, RankingClientError } from "./rankingClient";

describe("parseRankingSnapshot", () => {
  it("正常なsnapshotを受け入れる", () => {
    const snapshot = {
      entries: [{
        id: "id",
        rank: 1,
        displayName: "A",
        score: 10,
        successfulWalls: 1,
        speedLevel: 1,
        achievedAt: "2026-07-13T00:00:00.000Z",
      }],
      totalEntries: 1,
      updatedAt: "2026-07-13T00:00:00.000Z",
    };
    expect(parseRankingSnapshot(snapshot)).toEqual(snapshot);
  });

  it("不正な応答を拒否する", () => {
    expect(() => parseRankingSnapshot({ entries: [{ rank: "1" }] })).toThrow(
      RankingClientError,
    );
  });
});
