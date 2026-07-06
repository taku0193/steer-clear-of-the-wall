import type { JudgmentResult, SafeArea, WallPattern } from "./types";

type CollisionInput = {
  playerArea: SafeArea | null;
  wallPattern: WallPattern;
};

export const COLLISION_TOLERANCE = 0.05;

export function judgeCollision({
  playerArea,
  wallPattern,
}: CollisionInput): JudgmentResult {
  if (!playerArea) {
    return {
      type: "notDetected",
      patternId: wallPattern.id,
    };
  }

  const playerRight = playerArea.x + playerArea.width;
  const playerBottom = playerArea.y + playerArea.height;
  const safeRight = wallPattern.safeArea.x + wallPattern.safeArea.width;
  const safeBottom = wallPattern.safeArea.y + wallPattern.safeArea.height;
  const isInsideSafeArea =
    playerArea.x >= wallPattern.safeArea.x - COLLISION_TOLERANCE &&
    playerArea.y >= wallPattern.safeArea.y - COLLISION_TOLERANCE &&
    playerRight <= safeRight + COLLISION_TOLERANCE &&
    playerBottom <= safeBottom + COLLISION_TOLERANCE;

  if (isInsideSafeArea) {
    return {
      type: "success",
      patternId: wallPattern.id,
    };
  }

  return {
    type: "miss",
    patternId: wallPattern.id,
    reason: "outsideSafeArea",
  };
}
