import type { JudgmentResult, SafeArea, WallPattern } from "./types";
import { arePlayerAnchorsInsideSafeShape } from "./safeShape";

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

  const isInsideSafeArea = wallPattern.safeShape
    ? arePlayerAnchorsInsideSafeShape({
        playerArea,
        safeShape: wallPattern.safeShape,
        tolerance: COLLISION_TOLERANCE,
      })
    : isPlayerAreaInsideSafeArea(playerArea, wallPattern.safeArea);

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

function isPlayerAreaInsideSafeArea(
  playerArea: SafeArea,
  safeArea: SafeArea,
): boolean {
  const playerRight = playerArea.x + playerArea.width;
  const playerBottom = playerArea.y + playerArea.height;
  const safeRight = safeArea.x + safeArea.width;
  const safeBottom = safeArea.y + safeArea.height;

  return (
    playerArea.x >= safeArea.x - COLLISION_TOLERANCE &&
    playerArea.y >= safeArea.y - COLLISION_TOLERANCE &&
    playerRight <= safeRight + COLLISION_TOLERANCE &&
    playerBottom <= safeBottom + COLLISION_TOLERANCE
  );
}
