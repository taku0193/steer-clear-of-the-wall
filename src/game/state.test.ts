import { describe, expect, it } from "vitest";
import type { PoseFrame } from "../pose/poseTypes";
import {
  createGameState,
  createInitialGameState,
  createPlayerAreaFromPoseFrame,
  GAME_DURATION_SECONDS,
} from "./state";
import { WALL_PATTERNS } from "./wallPatterns";

describe("ゲーム状態の初期化", () => {
  it("初期状態はタイトルかつスコア・ミス・壁進行がリセットされている", () => {
    const state = createInitialGameState();

    expect(state).toMatchObject({
      phase: "title",
      error: null,
      remainingSeconds: GAME_DURATION_SECONDS,
      score: 0,
      misses: 0,
      lastJudgment: null,
      poseInputMode: "mock",
      poseDetectionStatus: "mock",
      activeWallPatternId: WALL_PATTERNS[0].id,
      wallProgress: 0,
      wallSequenceIndex: 0,
    });
    expect(state.playerArea).toEqual(state.mockPose.bodyArea);
  });

  it("指定したフェーズでもゲーム値は初期値から開始する", () => {
    const state = createGameState("playing");

    expect(state.phase).toBe("playing");
    expect(state.remainingSeconds).toBe(GAME_DURATION_SECONDS);
    expect(state.score).toBe(0);
    expect(state.misses).toBe(0);
    expect(state.lastJudgment).toBeNull();
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
