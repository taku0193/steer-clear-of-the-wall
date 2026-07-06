import type {
  PoseFrame,
  PoseLandmarkName,
} from "../pose/poseTypes";

export type CanvasPoint = {
  x: number;
  y: number;
};

export type CanvasRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AvatarPose = Partial<
  Record<PoseLandmarkName, CanvasPoint>
>;

const MIN_DRAW_VISIBILITY = 0.4;

export function projectPoseLandmarks(
  poseFrame: PoseFrame,
  width: number,
  height: number,
): AvatarPose {
  const projectedPose: AvatarPose = {};
  const landmarkEntries = Object.entries(poseFrame.landmarks) as [
    PoseLandmarkName,
    PoseFrame["landmarks"][PoseLandmarkName],
  ][];

  for (const [name, point] of landmarkEntries) {
    if (
      !point ||
      point.visibility < MIN_DRAW_VISIBILITY ||
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y)
    ) {
      continue;
    }

    projectedPose[name] = {
      x: (1 - point.x) * width,
      y: point.y * height,
    };
  }

  return projectedPose;
}

export function createMockAvatarPose(bodyRect: CanvasRect): AvatarPose {
  const point = (xRatio: number, yRatio: number): CanvasPoint => ({
    x: bodyRect.x + bodyRect.width * xRatio,
    y: bodyRect.y + bodyRect.height * yRatio,
  });

  return {
    nose: point(0.5, 0.09),
    leftShoulder: point(0.12, 0.25),
    rightShoulder: point(0.88, 0.25),
    leftElbow: point(0.05, 0.48),
    rightElbow: point(0.95, 0.48),
    leftWrist: point(0.02, 0.68),
    rightWrist: point(0.98, 0.68),
    leftHip: point(0.3, 0.58),
    rightHip: point(0.7, 0.58),
    leftKnee: point(0.28, 0.79),
    rightKnee: point(0.72, 0.79),
    leftAnkle: point(0.24, 0.98),
    rightAnkle: point(0.76, 0.98),
  };
}

export function getPointDistance(
  first: CanvasPoint,
  second: CanvasPoint,
): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

export function getPointMidpoint(
  first: CanvasPoint,
  second: CanvasPoint,
): CanvasPoint {
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}
