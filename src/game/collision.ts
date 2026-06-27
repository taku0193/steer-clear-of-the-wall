import type { JudgmentResult, SafeArea, WallPattern } from "./types";

type CollisionInput = {
  playerArea: SafeArea | null;
  wallPattern: WallPattern;
};

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
    playerArea.x >= wallPattern.safeArea.x &&
    playerArea.y >= wallPattern.safeArea.y &&
    playerRight <= safeRight &&
    playerBottom <= safeBottom;

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
