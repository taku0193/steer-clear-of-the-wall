import type { GameState, WallPattern } from "./types";

export const WALL_PROGRESS_STEP = 0.25;
export const WALL_PROGRESS_PASSED = 1;

export function advanceWallProgress(
  gameState: GameState,
  wallPatterns: readonly WallPattern[],
): GameState {
  if (gameState.phase !== "playing" || wallPatterns.length === 0) {
    return gameState;
  }

  const nextProgress = gameState.wallProgress + WALL_PROGRESS_STEP;

  if (nextProgress < WALL_PROGRESS_PASSED) {
    return {
      ...gameState,
      wallProgress: nextProgress,
    };
  }

  const nextWallSequenceIndex = (gameState.wallSequenceIndex + 1) % wallPatterns.length;
  const nextWallPattern = wallPatterns[nextWallSequenceIndex];

  return {
    ...gameState,
    activeWallPatternId: nextWallPattern.id,
    wallProgress: 0,
    wallSequenceIndex: nextWallSequenceIndex,
  };
}
