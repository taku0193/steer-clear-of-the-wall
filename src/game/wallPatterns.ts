import type { SafeShape, WallPattern } from "./types";

export const WALL_PATTERNS: readonly WallPattern[] = [
  {
    id: "center-gap",
    name: "中央",
    verticalAnchor: "top",
    safeArea: {
      x: 0.36,
      y: 0.18,
      width: 0.28,
      height: 0.82,
    },
    safeShape: createStandingShape(0.5),
    scoreValue: 100,
  },
  {
    id: "left-gap",
    name: "左",
    verticalAnchor: "top",
    safeArea: {
      x: 0.12,
      y: 0.2,
      width: 0.28,
      height: 0.8,
    },
    safeShape: createStandingShape(0.26),
    scoreValue: 100,
  },
  {
    id: "right-gap",
    name: "右",
    verticalAnchor: "top",
    safeArea: {
      x: 0.6,
      y: 0.2,
      width: 0.28,
      height: 0.8,
    },
    safeShape: createStandingShape(0.74),
    scoreValue: 100,
  },
  {
    id: "crouch-low",
    name: "しゃがみ",
    verticalAnchor: "top",
    safeArea: {
      x: 0.34,
      y: 0.45,
      width: 0.32,
      height: 0.55,
    },
    safeShape: createCrouchShape(0.5),
    scoreValue: 120,
  },
  {
    id: "deep-crouch",
    name: "深くしゃがむ",
    verticalAnchor: "top",
    safeArea: {
      x: 0.36,
      y: 0.55,
      width: 0.28,
      height: 0.45,
    },
    safeShape: createDeepCrouchShape(0.5),
    scoreValue: 160,
  },
  {
    id: "left-low",
    name: "左下",
    verticalAnchor: "top",
    safeArea: {
      x: 0.14,
      y: 0.44,
      width: 0.32,
      height: 0.56,
    },
    safeShape: createCrouchShape(0.3),
    scoreValue: 140,
  },
  {
    id: "right-low",
    name: "右下",
    verticalAnchor: "top",
    safeArea: {
      x: 0.54,
      y: 0.44,
      width: 0.32,
      height: 0.56,
    },
    safeShape: createCrouchShape(0.7),
    scoreValue: 140,
  },
  {
    id: "narrow-center",
    name: "細い中央",
    verticalAnchor: "top",
    safeArea: {
      x: 0.4,
      y: 0.2,
      width: 0.2,
      height: 0.8,
    },
    safeShape: createNarrowStandingShape(0.5),
    scoreValue: 150,
  },
  {
    id: "wide-low",
    name: "広い低姿勢",
    verticalAnchor: "top",
    safeArea: {
      x: 0.22,
      y: 0.42,
      width: 0.56,
      height: 0.58,
    },
    safeShape: createWideLowShape(),
    scoreValue: 120,
  },
  {
    id: "tiny-hop",
    name: "小さくジャンプ",
    verticalAnchor: "top",
    safeArea: {
      x: 0.34,
      y: 0.11,
      width: 0.32,
      height: 0.54,
    },
    safeShape: createStandingShape(0.5, 0.05),
    scoreValue: 80,
  },
  {
    id: "jump-center",
    name: "中央ジャンプ",
    verticalAnchor: "top",
    safeArea: {
      x: 0.33,
      y: 0.08,
      width: 0.34,
      height: 0.53,
    },
    safeShape: createStandingShape(0.5, 0.02),
    scoreValue: 100,
  },
  {
    id: "jump-left",
    name: "左ジャンプ",
    verticalAnchor: "top",
    safeArea: {
      x: 0.15,
      y: 0.08,
      width: 0.34,
      height: 0.55,
    },
    safeShape: createStandingShape(0.32, 0.02),
    scoreValue: 130,
  },
  {
    id: "jump-right",
    name: "右ジャンプ",
    verticalAnchor: "top",
    safeArea: {
      x: 0.51,
      y: 0.08,
      width: 0.34,
      height: 0.55,
    },
    safeShape: createStandingShape(0.68, 0.02),
    scoreValue: 130,
  },
  {
    id: "high-narrow",
    name: "高い細道",
    verticalAnchor: "top",
    safeArea: {
      x: 0.39,
      y: 0.05,
      width: 0.22,
      height: 0.5,
    },
    safeShape: createNarrowStandingShape(0.5, -0.1),
    scoreValue: 180,
  },
  {
    id: "hell-left-low",
    name: "鬼畜左下",
    verticalAnchor: "top",
    safeArea: {
      x: 0.08,
      y: 0.5,
      width: 0.26,
      height: 0.46,
    },
    safeShape: createDeepCrouchShape(0.21, 0.04),
    scoreValue: 200,
  },
  {
    id: "hell-right-low",
    name: "鬼畜右下",
    verticalAnchor: "top",
    safeArea: {
      x: 0.66,
      y: 0.5,
      width: 0.26,
      height: 0.46,
    },
    safeShape: createDeepCrouchShape(0.79, 0.04),
    scoreValue: 200,
  },
  {
    id: "hell-left-high",
    name: "鬼畜左上",
    verticalAnchor: "top",
    safeArea: {
      x: 0.1,
      y: 0.05,
      width: 0.25,
      height: 0.48,
    },
    safeShape: createNarrowStandingShape(0.23, -0.08),
    scoreValue: 210,
  },
  {
    id: "hell-right-high",
    name: "鬼畜右上",
    verticalAnchor: "top",
    safeArea: {
      x: 0.65,
      y: 0.05,
      width: 0.25,
      height: 0.48,
    },
    safeShape: createNarrowStandingShape(0.77, -0.08),
    scoreValue: 210,
  },
  {
    id: "needle-center",
    name: "針の中央",
    verticalAnchor: "top",
    safeArea: {
      x: 0.455,
      y: 0.18,
      width: 0.09,
      height: 0.75,
    },
    safeShape: createNeedleStandingShape(0.5),
    scoreValue: 260,
  },
  {
    id: "floor-scrape",
    name: "床すれすれ",
    verticalAnchor: "top",
    safeArea: {
      x: 0.3,
      y: 0.6,
      width: 0.4,
      height: 0.36,
    },
    safeShape: createDeepCrouchShape(0.5, 0.04),
    scoreValue: 220,
  },
  {
    id: "corner-left",
    name: "左端",
    verticalAnchor: "top",
    safeArea: {
      x: 0.04,
      y: 0.22,
      width: 0.24,
      height: 0.74,
    },
    safeShape: createStandingShape(0.16, 0.02),
    scoreValue: 170,
  },
  {
    id: "corner-right",
    name: "右端",
    verticalAnchor: "top",
    safeArea: {
      x: 0.72,
      y: 0.22,
      width: 0.24,
      height: 0.74,
    },
    safeShape: createStandingShape(0.84, 0.02),
    scoreValue: 170,
  },
  {
    id: "high-center-tight",
    name: "高い中央タイト",
    verticalAnchor: "top",
    safeArea: {
      x: 0.405,
      y: 0.04,
      width: 0.19,
      height: 0.5,
    },
    safeShape: createNeedleStandingShape(0.5, -0.08),
    scoreValue: 260,
  },
];

function createStandingShape(centerX: number, yOffset = 0): SafeShape {
  return {
    zones: [
      {
        type: "polygon",
        id: "standing-silhouette",
        points: createSymmetricPoints(centerX, [
          [0, 0.1 + yOffset],
          [0.05, 0.12 + yOffset],
          [0.075, 0.17 + yOffset],
          [0.065, 0.23 + yOffset],
          [0.04, 0.255 + yOffset],
          [0.125, 0.285 + yOffset],
          [0.165, 0.37 + yOffset],
          [0.145, 0.45 + yOffset],
          [0.095, 0.405 + yOffset],
          [0.075, 0.565 + yOffset],
          [0.115, 0.665 + yOffset],
          [0.105, 0.94],
          [0.05, 0.985],
          [0.018, 0.955],
          [0.035, 0.735],
          [0, 0.685 + yOffset],
        ]),
      },
    ],
  };
}

function createNarrowStandingShape(centerX: number, yOffset = 0): SafeShape {
  return {
    zones: [
      {
        type: "polygon",
        id: "narrow-silhouette",
        points: createSymmetricPoints(centerX, [
          [0, 0.1 + yOffset],
          [0.042, 0.125 + yOffset],
          [0.06, 0.18 + yOffset],
          [0.05, 0.245 + yOffset],
          [0.032, 0.27 + yOffset],
          [0.085, 0.315 + yOffset],
          [0.095, 0.46 + yOffset],
          [0.06, 0.585 + yOffset],
          [0.078, 0.695],
          [0.068, 0.965],
          [0.028, 0.992],
          [0.012, 0.95],
          [0.024, 0.73],
          [0, 0.69],
        ]),
      },
    ],
  };
}

function createNeedleStandingShape(centerX: number, yOffset = 0): SafeShape {
  return {
    zones: [
      {
        type: "polygon",
        id: "needle-human-silhouette",
        points: createSymmetricPoints(centerX, [
          [0, 0.11 + yOffset],
          [0.032, 0.135 + yOffset],
          [0.044, 0.19 + yOffset],
          [0.036, 0.255 + yOffset],
          [0.024, 0.29 + yOffset],
          [0.055, 0.36 + yOffset],
          [0.052, 0.52 + yOffset],
          [0.042, 0.68],
          [0.038, 0.965],
          [0.016, 0.992],
          [0.006, 0.945],
          [0.012, 0.735],
          [0, 0.7],
        ]),
      },
    ],
  };
}

function createCrouchShape(centerX: number): SafeShape {
  return {
    zones: [
      {
        type: "polygon",
        id: "crouch-silhouette",
        points: createSymmetricPoints(centerX, [
          [0, 0.39],
          [0.065, 0.405],
          [0.09, 0.455],
          [0.07, 0.5],
          [0.15, 0.52],
          [0.255, 0.6],
          [0.3, 0.72],
          [0.245, 0.86],
          [0.125, 0.985],
          [0.045, 0.935],
          [0, 0.835],
        ]),
      },
    ],
  };
}

function createDeepCrouchShape(centerX: number, yOffset = 0): SafeShape {
  return {
    zones: [
      {
        type: "polygon",
        id: "deep-crouch-silhouette",
        points: createSymmetricPoints(centerX, [
          [0, 0.5 + yOffset],
          [0.055, 0.515 + yOffset],
          [0.08, 0.565 + yOffset],
          [0.06, 0.61 + yOffset],
          [0.12, 0.64 + yOffset],
          [0.205, 0.72 + yOffset],
          [0.225, 0.85],
          [0.16, 0.985],
          [0.055, 0.94],
          [0, 0.895],
        ]),
      },
    ],
  };
}

function createWideLowShape(): SafeShape {
  return {
    zones: [
      {
        type: "polygon",
        id: "wide-low-silhouette",
        points: createSymmetricPoints(0.5, [
          [0, 0.385],
          [0.065, 0.4],
          [0.09, 0.45],
          [0.07, 0.5],
          [0.155, 0.525],
          [0.32, 0.515],
          [0.355, 0.635],
          [0.285, 0.775],
          [0.235, 0.985],
          [0.085, 0.955],
          [0.035, 0.84],
          [0, 0.81],
        ]),
      },
    ],
  };
}

function createSymmetricPoints(
  centerX: number,
  rightSidePoints: readonly [number, number][],
): readonly { x: number; y: number }[] {
  const rightSide = rightSidePoints.map(([offsetX, y]) => ({
    x: clampNormalized(centerX + offsetX),
    y: clampNormalized(y),
  }));
  const leftSide = rightSidePoints
    .slice(1)
    .reverse()
    .map(([offsetX, y]) => ({
      x: clampNormalized(centerX - offsetX),
      y: clampNormalized(y),
    }));

  return [...rightSide, ...leftSide];
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
