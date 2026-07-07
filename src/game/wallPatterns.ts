import type { WallPattern } from "./types";

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

export function getWallPatternById(patternId: string): WallPattern {
  return WALL_PATTERNS.find((wallPattern) => wallPattern.id === patternId) ?? WALL_PATTERNS[0];
}

export function getWallPatternByIndex(index: number): WallPattern {
  return WALL_PATTERNS[index % WALL_PATTERNS.length] ?? WALL_PATTERNS[0];
}
