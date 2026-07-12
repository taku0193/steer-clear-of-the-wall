import type { SafeArea, WallPattern } from "./types";

type Point = readonly [x: number, y: number];

export const WALL_PATTERNS: readonly WallPattern[] = [
  createPattern("center-gap", "中央でまっすぐ", 0.5, "standing", 100),
  createPattern("left-gap", "左へ移動", 0.27, "standing", 110),
  createPattern("right-gap", "右へ移動", 0.73, "standing", 110),
  createPattern("crouch-low", "軽くしゃがむ", 0.5, "crouch", 130),
  createPattern("left-low", "左でしゃがむ", 0.29, "crouch", 150),
  createPattern("right-low", "右でしゃがむ", 0.71, "crouch", 150),
  createPattern("arms-wide", "腕を横に広げる", 0.5, "armsWide", 140),
  createPattern("hands-up", "両手を上げる", 0.5, "handsUp", 160),
  createPattern("side-step-left", "左へ踏み出す", 0.38, "sideStep", 170, false),
  createPattern("side-step-right", "右へ踏み出す", 0.62, "sideStep", 170, true),
  createPattern("small-jump", "小さくジャンプ", 0.5, "jump", 180),
  createPattern("side-seat-left", "左向きに座る", 0.38, "sideSeat", 180),
  createPattern("side-seat-right", "右向きに座る", 0.62, "sideSeat", 180, true),
  createPattern("one-hand-left", "左手を上げる", 0.5, "oneHandUp", 170),
  createPattern("one-hand-right", "右手を上げる", 0.5, "oneHandUp", 170, true),
  createPattern("lean-left", "左へ傾く", 0.42, "lean", 170),
  createPattern("lean-right", "右へ傾く", 0.58, "lean", 170, true),
  createPattern("wide-stance", "大股で立つ", 0.5, "wideStance", 160),
  createPattern("deep-low-left", "左へ深くしゃがむ", 0.3, "deepCrouch", 190),
  createPattern("deep-low-right", "右へ深くしゃがむ", 0.7, "deepCrouch", 190, true),
  createPattern("head-down", "頭を下げる", 0.5, "headDown", 150),
];

type PoseKind =
  | "standing"
  | "crouch"
  | "armsWide"
  | "handsUp"
  | "sideStep"
  | "jump"
  | "sideSeat"
  | "oneHandUp"
  | "lean"
  | "wideStance"
  | "deepCrouch"
  | "headDown";

function createPattern(
  id: string,
  name: string,
  centerX: number,
  pose: PoseKind,
  scoreValue: number,
  mirrored = false,
): WallPattern {
  const points = createPosePoints(centerX, pose, mirrored);

  return {
    id,
    name,
    verticalAnchor: "top",
    safeArea: getBounds(points),
    safeShape: {
      zones: [{ type: "polygon", id: `${id}-silhouette`, points }],
    },
    scoreValue,
  };
}

function createPosePoints(
  centerX: number,
  pose: PoseKind,
  mirrored: boolean,
): readonly { x: number; y: number }[] {
  const localPoints: Record<PoseKind, readonly Point[]> = {
    // These are movement envelopes rather than literal human silhouettes.
    standing: [
      [-0.08, 0.18], [0.08, 0.18], [0.13, 0.23], [0.14, 0.34],
      [0.12, 1], [-0.12, 1], [-0.14, 0.34], [-0.13, 0.23],
    ],
    crouch: [
      [-0.12, 0.5], [0.12, 0.5], [0.2, 0.55], [0.24, 0.66],
      [0.24, 1], [-0.24, 1], [-0.24, 0.66], [-0.2, 0.55],
    ],
    armsWide: [
      [-0.055, 0.2], [0, 0.18], [0.055, 0.2], [0.07, 0.27],
      [0.055, 0.3], [0.15, 0.32], [0.33, 0.3], [0.34, 0.35],
      [0.15, 0.39], [0.07, 0.43], [0.065, 0.62], [0.095, 0.97],
      [0.07, 1], [0.025, 1], [0, 0.64], [-0.025, 1], [-0.07, 1],
      [-0.095, 0.97], [-0.065, 0.62], [-0.07, 0.43], [-0.15, 0.39],
      [-0.34, 0.35], [-0.33, 0.3], [-0.15, 0.32], [-0.055, 0.3],
      [-0.07, 0.27],
    ],
    handsUp: [
      [-0.05, 0.16], [0, 0.14], [0.05, 0.16], [0.065, 0.22],
      [0.05, 0.26], [0.1, 0.29], [0.14, 0.08], [0.19, 0.09],
      [0.16, 0.36], [0.075, 0.43], [0.065, 0.62], [0.095, 0.97],
      [0.07, 1], [0.025, 1], [0, 0.64], [-0.025, 1], [-0.07, 1],
      [-0.095, 0.97], [-0.065, 0.62], [-0.075, 0.43], [-0.16, 0.36],
      [-0.19, 0.09], [-0.14, 0.08], [-0.1, 0.29], [-0.05, 0.26],
      [-0.065, 0.22],
    ],
    sideStep: [
      [-0.1, 0.2], [0.1, 0.2], [0.14, 0.3], [0.22, 0.52],
      [0.28, 1], [0.02, 1], [-0.04, 0.58], [-0.14, 0.36],
    ],
    jump: [
      [-0.11, 0.08], [0.11, 0.08], [0.16, 0.14], [0.18, 0.58],
      [0.13, 0.7], [-0.13, 0.7], [-0.18, 0.58], [-0.16, 0.14],
    ],
    sideSeat: [
      [-0.08, 0.64], [-0.03, 0.61], [0.03, 0.63], [0.05, 0.68],
      [0.03, 0.72], [0.08, 0.75], [0.16, 0.82], [0.18, 0.88],
      [0.14, 0.91], [0.08, 0.86], [0.04, 0.84], [0.13, 0.95],
      [0.12, 1], [0.07, 1], [-0.02, 0.89], [-0.11, 1],
      [-0.16, 1], [-0.18, 0.93], [-0.21, 0.87], [-0.2, 0.81],
      [-0.17, 0.76], [-0.09, 0.72], [-0.11, 0.68],
    ],
    oneHandUp: [
      [-0.055, 0.2], [0, 0.18], [0.055, 0.2], [0.07, 0.27],
      [0.05, 0.3], [0.12, 0.34], [0.15, 0.52], [0.1, 0.55],
      [0.065, 0.62], [0.095, 0.97], [0.07, 1], [0.025, 1],
      [0, 0.64], [-0.025, 1], [-0.07, 1], [-0.095, 0.97],
      [-0.065, 0.62], [-0.08, 0.42], [-0.16, 0.34], [-0.19, 0.08],
      [-0.14, 0.08], [-0.1, 0.29], [-0.05, 0.3], [-0.07, 0.27],
    ],
    lean: [
      [-0.34, 0.18], [-0.16, 0.18], [-0.11, 0.3], [0.02, 0.58],
      [0.14, 1], [-0.06, 1], [-0.12, 0.61], [-0.25, 0.35],
    ],
    wideStance: [
      [-0.055, 0.2], [0, 0.18], [0.055, 0.2], [0.07, 0.27],
      [0.05, 0.3], [0.1, 0.35], [0.07, 0.55], [0.28, 0.96],
      [0.27, 1], [0.21, 1], [0.02, 0.67], [-0.02, 0.67],
      [-0.21, 1], [-0.27, 1], [-0.28, 0.96], [-0.07, 0.55],
      [-0.1, 0.35], [-0.05, 0.3], [-0.07, 0.27],
    ],
    deepCrouch: [
      [-0.14, 0.62], [0.1, 0.62], [0.19, 0.68], [0.25, 0.8],
      [0.28, 1], [-0.28, 1], [-0.27, 0.84], [-0.22, 0.7],
    ],
    headDown: [
      [-0.13, 0.4], [0.13, 0.4], [0.18, 0.48], [0.16, 0.62],
      [0.13, 1], [-0.13, 1], [-0.16, 0.62], [-0.18, 0.48],
    ],
  };

  return localPoints[pose].map(([x, y]) => ({
    x: clampNormalized(centerX + (mirrored ? -x : x)),
    y,
  }));
}

function getBounds(points: readonly { x: number; y: number }[]): SafeArea {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);

  return {
    x: left,
    y: top,
    width: Math.max(...xs) - left,
    height: Math.max(...ys) - top,
  };
}

function clampNormalized(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export function getWallPatternById(patternId: string): WallPattern {
  return WALL_PATTERNS.find((wallPattern) => wallPattern.id === patternId) ?? WALL_PATTERNS[0];
}

export function getWallPatternByIndex(index: number): WallPattern {
  return WALL_PATTERNS[index % WALL_PATTERNS.length] ?? WALL_PATTERNS[0];
}
