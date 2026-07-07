import type { GameState, WallPattern } from "./types";
import { judgeCollision } from "./collision";
import { calculateScore } from "./scoring";

export const WALL_PROGRESS_STEP = 0.25;
export const WALL_PROGRESS_PASSED = 1;
export const GAME_TICK_INTERVAL_MS = 1000;
export const WALL_TICK_INTERVAL_MS = 600;
export const WALL_CYCLE_DURATION_MS =
  WALL_TICK_INTERVAL_MS / WALL_PROGRESS_STEP;

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

  const activeWallPattern =
    wallPatterns.find((wallPattern) => wallPattern.id === gameState.activeWallPatternId) ??
    wallPatterns[gameState.wallSequenceIndex % wallPatterns.length];
  const judgment = judgeCollision({
    playerArea:
      gameState.poseInputMode === "camera"
        ? gameState.playerArea
        : gameState.mockPose.bodyArea,
    wallPattern: activeWallPattern,
  });
  const nextMisses = gameState.misses + (judgment.type === "miss" ? 1 : 0);
  const nextRemainingHearts =
    judgment.type === "miss"
      ? Math.max(gameState.remainingHearts - 1, 0)
      : gameState.remainingHearts;
  const nextWallSequenceIndex = (gameState.wallSequenceIndex + 1) % wallPatterns.length;
  const nextWallPattern = wallPatterns[nextWallSequenceIndex];

  return {
    ...gameState,
    phase: nextRemainingHearts === 0 ? "result" : gameState.phase,
    score: calculateScore({
      currentScore: gameState.score,
      judgment,
      wallPattern: activeWallPattern,
    }),
    misses: nextMisses,
    remainingHearts: nextRemainingHearts,
    lastJudgment: judgment,
    activeWallPatternId: nextWallPattern.id,
    wallProgress: 0,
    wallSequenceIndex: nextWallSequenceIndex,
  };
}
