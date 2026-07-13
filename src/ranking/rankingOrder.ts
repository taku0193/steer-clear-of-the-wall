import type { StoredRankingEntry } from "./rankingTypes";

export function compareRankingEntries(
  left: StoredRankingEntry,
  right: StoredRankingEntry,
): number {
  return (
    right.score - left.score ||
    right.successfulWalls - left.successfulWalls ||
    left.misses - right.misses ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.databaseId - right.databaseId
  );
}
