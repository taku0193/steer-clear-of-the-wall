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
    safeShape: createLowDodgeShape(0.5),
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
    safeShape: createFloorDodgeShape(0.5),
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
    safeShape: createLowDodgeShape(0.3),
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
    safeShape: createLowDodgeShape(0.7),
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
    safeShape: createFloorDodgeShape(0.21, 0.04),
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
    safeShape: createFloorDodgeShape(0.79, 0.04),
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
    safeShape: createSideReachShape(0.23, -0.08),
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
    safeShape: createSideReachShape(0.77, -0.08),
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
    safeShape: createFloorDodgeShape(0.5, 0.04),
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
          [0, 0.08 + yOffset],
          [0.052, 0.095 + yOffset],
          [0.078, 0.145 + yOffset],
          [0.07, 0.205 + yOffset],
          [0.04, 0.235 + yOffset],
          [0.025, 0.265 + yOffset],
          [0.12, 0.285 + yOffset],
          [0.19, 0.36 + yOffset],
          [0.175, 0.465 + yOffset],
          [0.102, 0.425 + yOffset],
          [0.075, 0.57 + yOffset],
          [0.125, 0.67 + yOffset],
          [0.132, 0.945],
          [0.058, 0.988],
          [0.018, 0.952],
          [0.036, 0.735],
          [0, 0.66 + yOffset],
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
          [0, 0.085 + yOffset],
          [0.04, 0.105 + yOffset],
          [0.058, 0.155 + yOffset],
          [0.048, 0.22 + yOffset],
          [0.028, 0.25 + yOffset],
          [0.075, 0.292 + yOffset],
          [0.102, 0.405 + yOffset],
          [0.072, 0.55 + yOffset],
          [0.084, 0.69],
          [0.07, 0.965],
          [0.028, 0.992],
          [0.012, 0.95],
          [0.024, 0.73],
          [0, 0.67],
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

function createSideReachShape(centerX: number, yOffset = 0): SafeShape {
  return {
    zones: [
      {
        type: "polygon",
        id: "side-reach-window",
        points: createSymmetricPoints(centerX, [
          [0, 0.05 + yOffset],
          [0.095, 0.08 + yOffset],
          [0.12, 0.18 + yOffset],
          [0.105, 0.38 + yOffset],
          [0.075, 0.51 + yOffset],
          [0.09, 0.94],
          [0.045, 0.985],
          [0, 0.92],
        ]),
      },
    ],
  };
}

function createLowDodgeShape(centerX: number): SafeShape {
  return {
    zones: [
      {
        type: "polygon",
        id: "low-dodge-gate",
        points: createSymmetricPoints(centerX, [
          [0, 0.41],
          [0.105, 0.43],
          [0.19, 0.505],
          [0.245, 0.625],
          [0.255, 0.755],
          [0.215, 0.895],
          [0.115, 0.992],
          [0.035, 0.945],
          [0, 0.86],
        ]),
      },
    ],
  };
}

function createFloorDodgeShape(centerX: number, yOffset = 0): SafeShape {
  return {
    zones: [
      {
        type: "polygon",
        id: "floor-dodge-gate",
        points: createSymmetricPoints(centerX, [
          [0, 0.53 + yOffset],
          [0.075, 0.545 + yOffset],
          [0.135, 0.62 + yOffset],
          [0.185, 0.745 + yOffset],
          [0.19, 0.875],
          [0.13, 0.992],
          [0.04, 0.955],
          [0, 0.9],
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
          [0, 0.43],
          [0.13, 0.425],
          [0.25, 0.49],
          [0.3, 0.62],
          [0.265, 0.78],
          [0.19, 0.965],
          [0.07, 0.985],
          [0.02, 0.88],
          [0, 0.74],
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
