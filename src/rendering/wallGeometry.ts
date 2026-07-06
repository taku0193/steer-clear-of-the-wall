import type { WallVerticalAnchor } from "../game/types";

export type WallRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const INITIAL_WALL_SCALE = 0.55;
const WALL_SCALE_RANGE = 0.45;

export function calculateWallRect(
  canvasWidth: number,
  canvasHeight: number,
  wallProgress: number,
  verticalAnchor: WallVerticalAnchor,
): WallRect {
  const progress = clampProgress(wallProgress);
  const scale = INITIAL_WALL_SCALE + progress * WALL_SCALE_RANGE;
  const width = canvasWidth * scale;
  const height = canvasHeight * scale;
  const yByAnchor: Record<WallVerticalAnchor, number> = {
    top: 0,
    ground: canvasHeight - height,
    center: (canvasHeight - height) / 2,
  };

  return {
    x: (canvasWidth - width) / 2,
    y: yByAnchor[verticalAnchor],
    width,
    height,
  };
}

function clampProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(Math.max(progress, 0), 1);
}
