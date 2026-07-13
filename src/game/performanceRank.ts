export type PerformanceRank = "S" | "A" | "B" | "C";

export function calculatePerformanceRank({
  successfulWalls,
  wallSpeedLevel,
  misses,
}: {
  successfulWalls: number;
  wallSpeedLevel: number;
  misses: number;
}): PerformanceRank {
  const points = successfulWalls * 2 + wallSpeedLevel * 3 - misses;
  if (points >= 30) return "S";
  if (points >= 18) return "A";
  if (points >= 8) return "B";
  return "C";
}
