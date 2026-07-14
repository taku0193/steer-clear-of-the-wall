import {
  WALL_PROGRESS_STEP,
  WALL_TICK_INTERVAL_MS,
} from "../game/gameLoop";

type WallMotionInput = {
  currentVisualProgress: number;
  previousLogicalProgress: number;
  logicalProgress: number;
  elapsedMs: number;
  progressStep: number;
};

export function advanceVisualWallProgress({
  currentVisualProgress,
  previousLogicalProgress,
  logicalProgress,
  elapsedMs,
  progressStep,
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
  const validProgressStep =
    Number.isFinite(progressStep) && progressStep > 0
      ? progressStep
      : WALL_PROGRESS_STEP;
  const nextLogicalBoundary = clampProgress(
    normalizedLogicalProgress + validProgressStep,
  );
  const intervalProgress =
    nextLogicalBoundary - normalizedLogicalProgress;

  return Math.min(
    clampProgress(
      baseProgress +
        (validElapsedMs * intervalProgress) / WALL_TICK_INTERVAL_MS,
    ),
    nextLogicalBoundary,
  );
}

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(Math.max(progress, 0), 1);
}
