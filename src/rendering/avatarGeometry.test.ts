import { describe, expect, it } from "vitest";
import type { PoseFrame } from "../pose/poseTypes";
import {
  createMockAvatarPose,
  getPointDistance,
  getPointMidpoint,
  projectPoseLandmarks,
} from "./avatarGeometry";

describe("projectPoseLandmarks", () => {
  it("カメラ座標を左右反転してCanvas座標へ変換する", () => {
    const poseFrame: PoseFrame = {
      detected: true,
      timestampMs: 0,
      landmarks: {
        nose: { x: 0.25, y: 0.4, visibility: 0.9 },
      },
    };

    expect(projectPoseLandmarks(poseFrame, 800, 600).nose).toEqual({
      x: 600,
      y: 240,
    });
  });

  it("可視性が低い点と有限値でない点を除外する", () => {
    const poseFrame: PoseFrame = {
      detected: true,
      timestampMs: 0,
      landmarks: {
        nose: { x: 0.5, y: 0.2, visibility: 0.39 },
        leftShoulder: {
          x: Number.NaN,
          y: 0.3,
          visibility: 0.9,
        },
      },
    };

    expect(projectPoseLandmarks(poseFrame, 800, 600)).toEqual({});
  });
});

describe("createMockAvatarPose", () => {
  it("判定領域内に全身の後ろ姿を構成する点を配置する", () => {
    const pose = createMockAvatarPose({
      x: 100,
      y: 50,
      width: 200,
      height: 400,
    });

    expect(pose.nose).toEqual({ x: 200, y: 86 });
    expect(pose.leftShoulder).toEqual({ x: 124, y: 150 });
    expect(pose.rightAnkle).toEqual({ x: 252, y: 442 });
  });
});

describe("avatar point helpers", () => {
  it("中点と距離を計算する", () => {
    const first = { x: 0, y: 0 };
    const second = { x: 6, y: 8 };

    expect(getPointMidpoint(first, second)).toEqual({ x: 3, y: 4 });
    expect(getPointDistance(first, second)).toBe(10);
  });
});
