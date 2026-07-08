import type { JudgmentResult } from "./types";

export type WallSpeedTier = {
  level: number;
  minSuccessfulWalls: number;
  progressStep: number;
  label: string;
};

export const WALL_SPEED_TIERS: readonly WallSpeedTier[] = [
  {
    level: 1,
    minSuccessfulWalls: 0,
    progressStep: 0.25,
    label: "通常",
  },
  {
    level: 2,
    minSuccessfulWalls: 3,
    progressStep: 0.3,
    label: "少し速い",
  },
  {
    level: 3,
    minSuccessfulWalls: 6,
    progressStep: 0.36,
    label: "速い",
  },
  {
    level: 4,
    minSuccessfulWalls: 10,
    progressStep: 0.45,
    label: "かなり速い",
  },
];

export const INITIAL_WALL_SPEED_LEVEL = WALL_SPEED_TIERS[0].level;
export const INITIAL_WALL_PROGRESS_STEP = WALL_SPEED_TIERS[0].progressStep;

type SpeedStateInput = {
  successfulWalls: number;
  currentSpeedLevel: number;
  judgmentType: JudgmentResult["type"];
};

type SpeedStateResult = {
  successfulWalls: number;
  wallSpeedLevel: number;
  speedLevelUp: boolean;
};

export function getWallSpeedTier(successfulWalls: number): WallSpeedTier {
  const normalizedSuccessfulWalls = normalizeNonNegativeInteger(successfulWalls);
  let matchedTier = WALL_SPEED_TIERS[0];

  for (const tier of WALL_SPEED_TIERS) {
    if (normalizedSuccessfulWalls >= tier.minSuccessfulWalls) {
      matchedTier = tier;
    }
  }

  return matchedTier;
}

export function getWallSpeedTierByLevel(speedLevel: number): WallSpeedTier {
  return (
    WALL_SPEED_TIERS.find((tier) => tier.level === speedLevel) ??
    WALL_SPEED_TIERS[0]
  );
}

export function getWallProgressStep(speedLevel: number): number {
  return getWallSpeedTierByLevel(speedLevel).progressStep;
}

export function getWallSpeedLabel(speedLevel: number): string {
  return getWallSpeedTierByLevel(speedLevel).label;
}

export function calculateNextSpeedState({
  successfulWalls,
  currentSpeedLevel,
  judgmentType,
}: SpeedStateInput): SpeedStateResult {
  const normalizedSuccessfulWalls = normalizeNonNegativeInteger(successfulWalls);
  const currentTier = getWallSpeedTierByLevel(currentSpeedLevel);

  if (judgmentType !== "success") {
    return {
      successfulWalls: normalizedSuccessfulWalls,
      wallSpeedLevel: currentTier.level,
      speedLevelUp: false,
    };
  }

  const nextSuccessfulWalls = normalizedSuccessfulWalls + 1;
  const nextTier = getWallSpeedTier(nextSuccessfulWalls);

  return {
    successfulWalls: nextSuccessfulWalls,
    wallSpeedLevel: nextTier.level,
    speedLevelUp: nextTier.level > currentTier.level,
  };
}

function normalizeNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(Math.trunc(value), 0);
}
