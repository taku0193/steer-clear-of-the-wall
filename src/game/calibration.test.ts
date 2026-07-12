import { describe, expect, it } from "vitest";
import type { PoseFrame } from "../pose/poseTypes";
import {
  createCalibrationBodyArea,
  evaluateCalibration,
} from "./calibration";

describe("createCalibrationBodyArea", () => {
  it("未検出フレームでは必須ランドマーク不足を返す", () => {
    const result = createCalibrationBodyArea({
      detected: false,
      timestampMs: 100,
      landmarks: {},
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missingLandmarks).toContain("leftShoulder");
      expect(result.missingLandmarks).toContain("rightAnkle");
    }
  });

  it("必須ランドマーク不足を検出する", () => {
    const result = createCalibrationBodyArea(
      createPoseFrame({
        rightAnkleVisibility: 0.2,
      }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missingLandmarks).toEqual(["rightAnkle"]);
    }
  });

  it("元PoseFrameから未縮尺身体領域を作る", () => {
    const result = createCalibrationBodyArea(createPoseFrame());

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bodyArea.x).toBeCloseTo(0.35);
      expect(result.bodyArea.y).toBeCloseTo(0.16);
      expect(result.bodyArea.width).toBeCloseTo(0.3);
      expect(result.bodyArea.height).toBeCloseTo(0.62);
      expect(result.averageVisibility).toBe(1);
    }
  });
});

describe("evaluateCalibration", () => {
  it("detector未準備では初期化中を返す", () => {
    const result = evaluateCalibration({
      poseFrame: null,
      detectorReady: false,
    });

    expect(result.status).toBe("initializing");
    expect(result.canStart).toBe(false);
    expect(result.guidance).toBe("holdStill");
  });

  it("姿勢フレームがない場合は未検出を返す", () => {
    const result = evaluateCalibration({
      poseFrame: null,
      detectorReady: true,
    });

    expect(result.status).toBe("notDetected");
    expect(result.canStart).toBe(false);
    expect(result.guidance).toBe("standInFrame");
  });

  it("必須ランドマーク不足では全身検出を促す", () => {
    const result = evaluateCalibration({
      poseFrame: createPoseFrame({ leftAnkleVisibility: 0.1 }),
      detectorReady: true,
    });

    expect(result.status).toBe("notDetected");
    expect(result.guidance).toBe("standInFrame");
    expect(result.checks.find((check) => check.id === "fullBody")?.status).toBe(
      "fail",
    );
  });

  it("左に寄っている場合は右へ移動する案内を返す", () => {
    const result = evaluateCalibration({
      poseFrame: createPoseFrame({ centerX: 0.2 }),
      detectorReady: true,
    });

    expect(result.status).toBe("needsAdjustment");
    expect(result.canStart).toBe(false);
    expect(result.guidance).toBe("moveRight");
  });

  it("右に寄っている場合は左へ移動する案内を返す", () => {
    const result = evaluateCalibration({
      poseFrame: createPoseFrame({ centerX: 0.8 }),
      detectorReady: true,
    });

    expect(result.status).toBe("needsAdjustment");
    expect(result.canStart).toBe(false);
    expect(result.guidance).toBe("moveLeft");
  });

  it("近すぎる場合は後ろへ下がる案内を返す", () => {
    const result = evaluateCalibration({
      poseFrame: createPoseFrame({ width: 0.68, height: 0.84 }),
      detectorReady: true,
    });

    expect(result.status).toBe("needsAdjustment");
    expect(result.canStart).toBe(false);
    expect(result.guidance).toBe("stepBack");
  });

  it("遠すぎる場合は近づく案内を返す", () => {
    const result = evaluateCalibration({
      poseFrame: createPoseFrame({ width: 0.06, height: 0.3 }),
      detectorReady: true,
    });

    expect(result.status).toBe("needsAdjustment");
    expect(result.canStart).toBe(false);
    expect(result.guidance).toBe("stepForward");
  });

  it("検出品質が低い場合は静止を促す", () => {
    const result = evaluateCalibration({
      poseFrame: createPoseFrame({ visibility: 0.6 }),
      detectorReady: true,
    });

    expect(result.status).toBe("needsAdjustment");
    expect(result.canStart).toBe(false);
    expect(result.guidance).toBe("holdStill");
  });

  it("範囲内では開始可能になる", () => {
    const result = evaluateCalibration({
      poseFrame: createPoseFrame(),
      detectorReady: true,
    });

    expect(result.status).toBe("ready");
    expect(result.canStart).toBe(true);
    expect(result.guidance).toBe("ready");
    expect(result.checks.every((check) => check.status === "pass")).toBe(true);
  });
});

function createPoseFrame({
  centerX = 0.5,
  top = 0.16,
  width = 0.3,
  height = 0.62,
  visibility = 1,
  leftAnkleVisibility = visibility,
  rightAnkleVisibility = visibility,
}: {
  centerX?: number;
  top?: number;
  width?: number;
  height?: number;
  visibility?: number;
  leftAnkleVisibility?: number;
  rightAnkleVisibility?: number;
} = {}): PoseFrame {
  const left = centerX - width / 2;
  const right = centerX + width / 2;
  const shoulderY = top;
  const hipY = top + height * 0.48;
  const ankleY = top + height;

  return {
    detected: true,
    timestampMs: 100,
    landmarks: {
      leftShoulder: { x: left, y: shoulderY, visibility },
      rightShoulder: { x: right, y: shoulderY, visibility },
      leftHip: { x: left + width * 0.18, y: hipY, visibility },
      rightHip: { x: right - width * 0.18, y: hipY, visibility },
      leftAnkle: {
        x: left + width * 0.2,
        y: ankleY,
        visibility: leftAnkleVisibility,
      },
      rightAnkle: {
        x: right - width * 0.2,
        y: ankleY,
        visibility: rightAnkleVisibility,
      },
    },
  };
}
