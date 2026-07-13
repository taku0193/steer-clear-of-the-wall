import type { WallPattern } from "../game/types";
import type { AvatarPose, CanvasPoint } from "./avatarGeometry";

type NormalizedPose = {
  [K in keyof AvatarPose]?: CanvasPoint;
};

export function createWallPreviewAvatarPose(
  pattern: WallPattern,
  width: number,
  height: number,
  poseProgress = 1,
): AvatarPose {
  const centerX = pattern.safeArea.x + pattern.safeArea.width / 2;
  const targetPose = createNormalizedPose(pattern.id, centerX);
  const startPose = standingPose(0.5);
  const anticipationPose = createAnticipationPose(
    pattern.id,
    startPose,
    targetPose,
  );
  const normalizedProgress = Math.min(Math.max(poseProgress, 0), 1);
  const pose =
    normalizedProgress < 0.28
      ? interpolatePose(
          startPose,
          anticipationPose,
          smoothStep(normalizedProgress / 0.28),
        )
      : interpolatePose(
          anticipationPose,
          targetPose,
          smoothStep((normalizedProgress - 0.28) / 0.72),
        );
  const projected: AvatarPose = {};

  for (const [name, point] of Object.entries(pose)) {
    if (!point) continue;
    projected[name as keyof AvatarPose] = {
      x: point.x * width,
      y: point.y * height,
    };
  }

  return projected;
}

function createAnticipationPose(
  patternId: string,
  start: NormalizedPose,
  target: NormalizedPose,
): NormalizedPose {
  if (patternId === "small-jump") {
    const pose = interpolatePose(start, crouchPose(0.5, false), 0.42);
    pose.leftWrist = p(0.39, 0.5);
    pose.rightWrist = p(0.61, 0.5);
    return pose;
  }

  if (
    patternId.includes("low") ||
    patternId === "crouch-low" ||
    patternId.includes("side-seat") ||
    patternId === "head-down"
  ) {
    return interpolatePose(start, target, 0.24);
  }

  if (
    patternId.includes("lean") ||
    patternId.includes("side-step") ||
    patternId.includes("gap")
  ) {
    const pose = interpolatePose(start, target, 0.3);
    pose.leftAnkle = start.leftAnkle;
    pose.rightAnkle = start.rightAnkle;
    return pose;
  }

  return interpolatePose(start, target, 0.2);
}

function interpolatePose(
  start: NormalizedPose,
  target: NormalizedPose,
  progress: number,
): NormalizedPose {
  const result: NormalizedPose = {};
  const names = new Set([...Object.keys(start), ...Object.keys(target)]);

  for (const name of names) {
    const key = name as keyof AvatarPose;
    const startPoint = start[key] ?? target[key];
    const targetPoint = target[key] ?? start[key];
    if (!startPoint || !targetPoint) continue;
    result[key] = {
      x: startPoint.x + (targetPoint.x - startPoint.x) * progress,
      y: startPoint.y + (targetPoint.y - startPoint.y) * progress,
    };
  }

  return result;
}

function smoothStep(progress: number): number {
  const value = Math.min(Math.max(progress, 0), 1);
  return value * value * (3 - 2 * value);
}

function createNormalizedPose(patternId: string, centerX: number): NormalizedPose {
  if (patternId === "arms-wide") return armsWidePose(centerX);
  if (patternId === "hands-up") return handsUpPose(centerX);
  if (patternId === "small-jump") return jumpPose(centerX);
  if (patternId.includes("side-seat")) {
    return seatedPose(centerX, patternId.endsWith("right") ? -1 : 1);
  }
  if (patternId.includes("one-hand")) {
    return oneHandPose(centerX, patternId.endsWith("right") ? 1 : -1);
  }
  if (patternId.includes("lean")) {
    return leanPose(centerX, patternId.endsWith("right") ? 1 : -1);
  }
  if (patternId === "wide-stance") return wideStancePose(centerX);
  if (patternId.includes("deep-low")) return crouchPose(centerX, true);
  if (patternId.includes("low") || patternId === "crouch-low" || patternId === "head-down") {
    return crouchPose(centerX, false);
  }
  if (patternId.includes("side-step")) {
    return sideStepPose(centerX, patternId.endsWith("right") ? 1 : -1);
  }
  return standingPose(centerX);
}

function standingPose(cx: number): NormalizedPose {
  return {
    nose: p(cx, 0.23),
    leftShoulder: p(cx - 0.055, 0.34), rightShoulder: p(cx + 0.055, 0.34),
    leftElbow: p(cx - 0.07, 0.48), rightElbow: p(cx + 0.07, 0.48),
    leftWrist: p(cx - 0.065, 0.61), rightWrist: p(cx + 0.065, 0.61),
    leftHip: p(cx - 0.035, 0.6), rightHip: p(cx + 0.035, 0.6),
    leftKnee: p(cx - 0.045, 0.78), rightKnee: p(cx + 0.045, 0.78),
    leftAnkle: p(cx - 0.055, 0.97), rightAnkle: p(cx + 0.055, 0.97),
  };
}

function armsWidePose(cx: number): NormalizedPose {
  return {
    ...standingPose(cx),
    leftElbow: p(cx - 0.18, 0.35), rightElbow: p(cx + 0.18, 0.35),
    leftWrist: p(cx - 0.31, 0.33), rightWrist: p(cx + 0.31, 0.33),
  };
}

function handsUpPose(cx: number): NormalizedPose {
  return {
    ...standingPose(cx),
    leftElbow: p(cx - 0.12, 0.27), rightElbow: p(cx + 0.12, 0.27),
    leftWrist: p(cx - 0.16, 0.1), rightWrist: p(cx + 0.16, 0.1),
  };
}

function oneHandPose(cx: number, raisedSide: -1 | 1): NormalizedPose {
  const pose = standingPose(cx);
  if (raisedSide < 0) {
    pose.leftElbow = p(cx - 0.12, 0.27);
    pose.leftWrist = p(cx - 0.16, 0.1);
  } else {
    pose.rightElbow = p(cx + 0.12, 0.27);
    pose.rightWrist = p(cx + 0.16, 0.1);
  }
  return pose;
}

function crouchPose(cx: number, deep: boolean): NormalizedPose {
  const top = deep ? 0.65 : 0.52;
  return {
    nose: p(cx, top),
    leftShoulder: p(cx - 0.07, top + 0.08), rightShoulder: p(cx + 0.07, top + 0.08),
    leftElbow: p(cx - 0.13, top + 0.14), rightElbow: p(cx + 0.13, top + 0.14),
    leftWrist: p(cx - 0.08, top + 0.2), rightWrist: p(cx + 0.08, top + 0.2),
    leftHip: p(cx - 0.06, top + 0.2), rightHip: p(cx + 0.06, top + 0.2),
    leftKnee: p(cx - 0.16, 0.87), rightKnee: p(cx + 0.16, 0.87),
    leftAnkle: p(cx - 0.2, 0.98), rightAnkle: p(cx + 0.2, 0.98),
  };
}

function jumpPose(cx: number): NormalizedPose {
  return {
    nose: p(cx, 0.14),
    leftShoulder: p(cx - 0.07, 0.24), rightShoulder: p(cx + 0.07, 0.24),
    leftElbow: p(cx - 0.12, 0.34), rightElbow: p(cx + 0.12, 0.34),
    leftWrist: p(cx - 0.14, 0.44), rightWrist: p(cx + 0.14, 0.44),
    leftHip: p(cx - 0.04, 0.42), rightHip: p(cx + 0.04, 0.42),
    leftKnee: p(cx - 0.1, 0.54), rightKnee: p(cx + 0.1, 0.54),
    leftAnkle: p(cx - 0.04, 0.65), rightAnkle: p(cx + 0.04, 0.65),
  };
}

function seatedPose(cx: number, direction: -1 | 1): NormalizedPose {
  return {
    nose: p(cx - direction * 0.06, 0.67),
    leftShoulder: p(cx - 0.05, 0.74), rightShoulder: p(cx + 0.05, 0.74),
    leftElbow: p(cx + direction * 0.07, 0.8), rightElbow: p(cx + direction * 0.11, 0.82),
    leftWrist: p(cx + direction * 0.13, 0.86), rightWrist: p(cx + direction * 0.15, 0.87),
    leftHip: p(cx - 0.04, 0.84), rightHip: p(cx + 0.04, 0.84),
    leftKnee: p(cx + direction * 0.13, 0.88), rightKnee: p(cx + direction * 0.17, 0.9),
    leftAnkle: p(cx + direction * 0.15, 0.97), rightAnkle: p(cx + direction * 0.2, 0.98),
  };
}

function leanPose(cx: number, direction: -1 | 1): NormalizedPose {
  const topX = cx + direction * 0.2;
  return {
    ...standingPose(cx),
    nose: p(topX, 0.22),
    leftShoulder: p(topX - 0.055, 0.34), rightShoulder: p(topX + 0.055, 0.34),
    leftElbow: p(cx + direction * 0.14 - 0.06, 0.48), rightElbow: p(cx + direction * 0.14 + 0.06, 0.48),
    leftWrist: p(cx + direction * 0.08 - 0.05, 0.6), rightWrist: p(cx + direction * 0.08 + 0.05, 0.6),
  };
}

function wideStancePose(cx: number): NormalizedPose {
  return {
    ...standingPose(cx),
    leftKnee: p(cx - 0.13, 0.78), rightKnee: p(cx + 0.13, 0.78),
    leftAnkle: p(cx - 0.25, 0.98), rightAnkle: p(cx + 0.25, 0.98),
  };
}

function sideStepPose(cx: number, direction: -1 | 1): NormalizedPose {
  return {
    ...standingPose(cx),
    leftKnee: p(cx - 0.05, 0.78), rightKnee: p(cx + direction * 0.12, 0.78),
    leftAnkle: p(cx - 0.06, 0.98), rightAnkle: p(cx + direction * 0.23, 0.98),
  };
}

function p(x: number, y: number): CanvasPoint {
  return { x, y };
}
