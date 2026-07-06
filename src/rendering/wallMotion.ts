import {
  WALL_CYCLE_DURATION_MS,
  WALL_PROGRESS_STEP,
} from "../game/gameLoop";

type WallMotionInput = {
  currentVisualProgress: number;
  previousLogicalProgress: number;
  logicalProgress: number;
  elapsedMs: number;
};

export function advanceVisualWallProgress({
  currentVisualProgress,
  previousLogicalProgress,
  logicalProgress,
  elapsedMs,
}: WallMotionInput): number {
  const normalizedLogicalProgress = clampProgress(logicalProgress);

  if (normalizedLogicalProgress < previousLogicalProgress) {
    return normalizedLogicalProgress;
  }

  const baseProgress = Math.max(
    clampProgress(currentVisualProgress),
    normalizedLogicalProgress,
  );
  const validElapsedMs =
    Number.isFinite(elapsedMs) && elapsedMs > 0 ? elapsedMs : 0;

  return Math.min(
    clampProgress(
      baseProgress + validElapsedMs / WALL_CYCLE_DURATION_MS,
    ),
    clampProgress(normalizedLogicalProgress + WALL_PROGRESS_STEP),
  );
}

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(Math.max(progress, 0), 1);
}
