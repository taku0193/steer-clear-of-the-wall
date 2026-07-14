import type { WallPattern } from "./types";
import { getWallProgressStep } from "./wallSpeed";

export type WallCuePhase = "preview" | "ready" | "act";

export type WallCueModel = {
  phase: WallCuePhase;
  headline: string;
  detail: string;
  isJump: boolean;
};

const PROGRESS_EPSILON = 1e-9;
const JUMP_ACT_INTERVAL_PROGRESS = 0.5;

export function getRemainingWallTicks(
  wallProgress: number,
  wallSpeedLevel: number,
): number {
  const progress = normalizeProgress(wallProgress);

  if (progress >= 1) {
    return 0;
  }

  const progressStep = getWallProgressStep(wallSpeedLevel);
  const remainingProgress = Math.max(1 - progress - PROGRESS_EPSILON, 0);

  return Math.max(Math.ceil(remainingProgress / progressStep), 1);
}

export function getWallCuePhase(
  wallProgress: number,
  wallSpeedLevel: number,
): WallCuePhase {
  const remainingTicks = getRemainingWallTicks(
    wallProgress,
    wallSpeedLevel,
  );

  if (remainingTicks <= 1) {
    return "act";
  }

  if (remainingTicks === 2) {
    return "ready";
  }

  return "preview";
}

export function createWallCueModel(
  {
    pattern,
    wallProgress,
    visualWallProgress,
    wallSpeedLevel,
  }: {
    pattern: WallPattern;
    wallProgress: number;
    visualWallProgress: number;
    wallSpeedLevel: number;
  },
): WallCueModel {
  const isJump = pattern.actionTiming === "jump";
  const logicalPhase = getWallCuePhase(wallProgress, wallSpeedLevel);
  const phase =
    isJump &&
    logicalPhase === "act" &&
    getCurrentIntervalProgress(wallProgress, visualWallProgress) +
      PROGRESS_EPSILON <
      JUMP_ACT_INTERVAL_PROGRESS
      ? "ready"
      : logicalPhase;

  if (phase === "act") {
    return {
      phase,
      headline: isJump
        ? "いま！ 小さくジャンプ"
        : `いま！ ${pattern.name}`,
      detail: isJump
        ? "その場で真上へ"
        : "壁が通るまで姿勢をキープ",
      isJump,
    };
  }

  if (phase === "ready") {
    return {
      phase,
      headline: isJump
        ? "ジャンプの準備"
        : `もうすぐ：${pattern.name}`,
      detail: isJump
        ? "ひざを軽く曲げて、合図を待つ"
        : "穴の形に合わせて構える",
      isJump,
    };
  }

  return {
    phase,
    headline: pattern.name,
    detail: isJump
      ? "「いま！」の合図で、その場で小さくジャンプ"
      : "穴の形に体を合わせる",
    isJump,
  };
}

function normalizeProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(Math.max(progress, 0), 1);
}

function getCurrentIntervalProgress(
  wallProgress: number,
  visualWallProgress: number,
): number {
  const logicalProgress = normalizeProgress(wallProgress);
  const visualProgress = normalizeProgress(visualWallProgress);
  const remainingProgress = 1 - logicalProgress;

  if (remainingProgress <= PROGRESS_EPSILON) {
    return 1;
  }

  return normalizeProgress(
    (visualProgress - logicalProgress) / remainingProgress,
  );
}
