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
          [0, 0.13 + yOffset],
          [0.1, 0.17 + yOffset],
          [0.13, 0.28 + yOffset],
          [0.09, 0.36 + yOffset],
          [0.16, 0.45 + yOffset],
          [0.15, 0.58 + yOffset],
          [0.09, 0.65 + yOffset],
          [0.1, 0.96],
          [0.03, 0.98],
          [0, 0.72 + yOffset],
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
          [0, 0.12 + yOffset],
          [0.07, 0.16 + yOffset],
          [0.09, 0.26 + yOffset],
          [0.06, 0.34 + yOffset],
          [0.1, 0.48 + yOffset],
          [0.08, 0.7],
          [0.07, 0.98],
          [0.02, 0.99],
          [0, 0.72],
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
          [0, 0.42],
          [0.12, 0.46],
          [0.15, 0.56],
          [0.25, 0.62],
          [0.28, 0.75],
          [0.21, 0.9],
          [0.11, 0.98],
          [0, 0.92],
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
          [0, 0.52 + yOffset],
          [0.1, 0.55 + yOffset],
          [0.13, 0.65 + yOffset],
          [0.2, 0.72 + yOffset],
          [0.22, 0.86],
          [0.15, 0.98],
          [0, 0.95],
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
          [0, 0.4],
          [0.12, 0.44],
          [0.15, 0.55],
          [0.31, 0.52],
          [0.33, 0.65],
          [0.25, 0.78],
          [0.23, 0.98],
          [0.06, 0.94],
          [0, 0.82],
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
