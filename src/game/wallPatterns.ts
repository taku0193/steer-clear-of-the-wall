import type { WallPattern } from "./types";

export const WALL_PATTERNS: readonly WallPattern[] = [
  {
    id: "center-gap",
    name: "中央",
    safeArea: {
      x: 0.36,
      y: 0.18,
      width: 0.28,
      height: 0.64,
    },
    scoreValue: 100,
  },
  {
    id: "left-gap",
    name: "左",
    safeArea: {
      x: 0.12,
      y: 0.2,
      width: 0.28,
      height: 0.62,
    },
    scoreValue: 100,
  },
  {
    id: "right-gap",
    name: "右",
    safeArea: {
      x: 0.6,
      y: 0.2,
      width: 0.28,
      height: 0.62,
    },
    scoreValue: 100,
  },
];

export function getWallPatternById(patternId: string): WallPattern {
  return WALL_PATTERNS.find((wallPattern) => wallPattern.id === patternId) ?? WALL_PATTERNS[0];
}

export function getWallPatternByIndex(index: number): WallPattern {
  return WALL_PATTERNS[index % WALL_PATTERNS.length] ?? WALL_PATTERNS[0];
}
