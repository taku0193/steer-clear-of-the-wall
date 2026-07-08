import { describe, expect, it } from "vitest";
import type { PoseFrame } from "../pose/poseTypes";
import {
  createGameState,
  createInitialGameState,
  createPlayerAreaFromPoseFrame,
  fitPoseFrameToGame,
  GAME_POSE_SCALE,
  MAX_HEARTS,
  MAX_GAME_POSE_HEIGHT,
  MAX_GAME_POSE_WIDTH,
} from "./state";
import { WALL_PATTERNS } from "./wallPatterns";

describe("ゲーム状態の初期化", () => {
  it("初期状態はタイトルかつスコア・ミス・壁進行がリセットされている", () => {
    const state = createInitialGameState();

    expect(state).toMatchObject({
      phase: "title",
      error: null,
      remainingHearts: MAX_HEARTS,
      score: 0,
      misses: 0,
      lastJudgment: null,
      avatarStyle: "neutral",
      poseInputMode: "mock",
      poseDetectionStatus: "mock",
      activeWallPatternId: WALL_PATTERNS[0].id,
      wallProgress: 0,
      wallSequenceIndex: 0,
      successfulWalls: 0,
      wallSpeedLevel: 1,
      lastSpeedLevelUp: false,
    });
    expect(state.playerArea).toEqual(state.mockPose.bodyArea);
  });

  it("指定したフェーズでもゲーム値は初期値から開始する", () => {
    const state = createGameState("playing");

    expect(state.phase).toBe("playing");
    expect(state.remainingHearts).toBe(MAX_HEARTS);
    expect(state.score).toBe(0);
    expect(state.misses).toBe(0);
    expect(state.lastJudgment).toBeNull();
    expect(state.successfulWalls).toBe(0);
    expect(state.wallSpeedLevel).toBe(1);
    expect(state.lastSpeedLevelUp).toBe(false);
  });
});

describe("createPlayerAreaFromPoseFrame", () => {
  it("未検出フレームではnullを返す", () => {
    expect(
      createPlayerAreaFromPoseFrame({
        detected: false,
        timestampMs: 100,
        landmarks: {},
      }),
    ).toBeNull();
  });

  it("必要なランドマークから左右反転した判定領域を作る", () => {
    const poseFrame: PoseFrame = {
      detected: true,
      timestampMs: 100,
      landmarks: {
        leftShoulder: { x: 0.2, y: 0.2, visibility: 1 },
        rightShoulder: { x: 0.4, y: 0.2, visibility: 1 },
        leftHip: { x: 0.25, y: 0.5, visibility: 1 },
        rightHip: { x: 0.35, y: 0.5, visibility: 1 },
        leftAnkle: { x: 0.25, y: 0.8, visibility: 1 },
        rightAnkle: { x: 0.35, y: 0.8, visibility: 1 },
      },
    };

    const area = createPlayerAreaFromPoseFrame(poseFrame);

    expect(area).not.toBeNull();
    expect(area?.x).toBeCloseTo(0.57);
    expect(area?.y).toBeCloseTo(0.17);
    expect(area?.width).toBeCloseTo(0.26);
    expect(area?.height).toBeCloseTo(0.66);
  });

  it("必須ランドマークの視認性が不足する場合はnullを返す", () => {
    const poseFrame: PoseFrame = {
      detected: true,
      timestampMs: 100,
      landmarks: {
        leftShoulder: { x: 0.2, y: 0.2, visibility: 1 },
        rightShoulder: { x: 0.4, y: 0.2, visibility: 1 },
        leftHip: { x: 0.25, y: 0.5, visibility: 1 },
        rightHip: { x: 0.35, y: 0.5, visibility: 1 },
        leftAnkle: { x: 0.25, y: 0.8, visibility: 1 },
        rightAnkle: { x: 0.35, y: 0.8, visibility: 0.2 },
      },
    };

    expect(createPlayerAreaFromPoseFrame(poseFrame)).toBeNull();
  });
});

describe("fitPoseFrameToGame", () => {
  it("身体中心を維持してランドマーク間隔を縮小する", () => {
    const poseFrame: PoseFrame = {
      detected: true,
      timestampMs: 100,
      landmarks: {
        leftShoulder: { x: 0.2, y: 0.2, visibility: 1 },
        rightShoulder: { x: 0.4, y: 0.2, visibility: 1 },
        leftHip: { x: 0.25, y: 0.5, visibility: 1 },
        rightHip: { x: 0.35, y: 0.5, visibility: 1 },
        leftAnkle: { x: 0.25, y: 0.8, visibility: 1 },
        rightAnkle: { x: 0.35, y: 0.8, visibility: 1 },
      },
    };

    const fittedFrame = fitPoseFrameToGame(poseFrame);

    expect(fittedFrame.landmarks.leftShoulder?.x).toBeCloseTo(
      0.3 + (0.2 - 0.3) * GAME_POSE_SCALE,
    );
    expect(fittedFrame.landmarks.leftShoulder?.y).toBeCloseTo(
      0.5 + (0.2 - 0.5) * GAME_POSE_SCALE,
    );
    expect(fittedFrame.landmarks.rightAnkle?.y).toBeCloseTo(
      0.5 + (0.8 - 0.5) * GAME_POSE_SCALE,
    );

    const playerArea = createPlayerAreaFromPoseFrame(fittedFrame);
    expect(playerArea?.x).toBeCloseTo(0.598);
    expect(playerArea?.y).toBeCloseTo(0.254);
    expect(playerArea?.width).toBeCloseTo(0.204);
    expect(playerArea?.height).toBeCloseTo(0.492);
  });

  it("近距離の大きな姿勢を最大サイズ以内へ収める", () => {
    const poseFrame: PoseFrame = {
      detected: true,
      timestampMs: 100,
      landmarks: {
        leftShoulder: { x: 0.05, y: 0.02, visibility: 1 },
        rightShoulder: { x: 0.95, y: 0.02, visibility: 1 },
        leftHip: { x: 0.2, y: 0.5, visibility: 1 },
        rightHip: { x: 0.8, y: 0.5, visibility: 1 },
        leftAnkle: { x: 0.2, y: 0.98, visibility: 1 },
        rightAnkle: { x: 0.8, y: 0.98, visibility: 1 },
      },
    };

    const fittedFrame = fitPoseFrameToGame(poseFrame);
    const points = Object.values(fittedFrame.landmarks).filter(
      (point) => point,
    );
    const xValues = points.map((point) => point.x);
    const yValues = points.map((point) => point.y);

    expect(Math.max(...xValues) - Math.min(...xValues)).toBeLessThanOrEqual(
      MAX_GAME_POSE_WIDTH + Number.EPSILON,
    );
    expect(Math.max(...yValues) - Math.min(...yValues)).toBeLessThanOrEqual(
      MAX_GAME_POSE_HEIGHT + Number.EPSILON,
    );
    expect((Math.max(...xValues) + Math.min(...xValues)) / 2).toBeCloseTo(0.5);
    expect((Math.max(...yValues) + Math.min(...yValues)) / 2).toBeCloseTo(0.5);
  });

  it("未検出フレームは変更しない", () => {
    const poseFrame: PoseFrame = {
      detected: false,
      timestampMs: 100,
      landmarks: {},
    };

    expect(fitPoseFrameToGame(poseFrame)).toBe(poseFrame);
  });
});
