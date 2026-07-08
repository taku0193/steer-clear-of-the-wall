import type { PoseFrame, PoseLandmarkName } from "../pose/poseTypes";
import type { GamePhase, GameState, SafeArea } from "./types";
import { DEFAULT_MOCK_POSE } from "./mockPose";
import { INITIAL_WALL_SPEED_LEVEL } from "./wallSpeed";
import { getWallPatternByIndex } from "./wallPatterns";

export const INITIAL_GAME_PHASE: GamePhase = "title";
export const MAX_HEARTS = 5;
export const INITIAL_SCORE = 0;
export const INITIAL_MISSES = 0;
export const INITIAL_SUCCESSFUL_WALLS = 0;
export const INITIAL_WALL_SEQUENCE_INDEX = 0;
export const INITIAL_WALL_PROGRESS = 0;
export const MIN_POSE_VISIBILITY = 0.5;
export const GAME_POSE_SCALE = 0.72;
export const MAX_GAME_POSE_WIDTH = 0.32;
export const MAX_GAME_POSE_HEIGHT = 0.62;

const REQUIRED_BODY_LANDMARKS: readonly PoseLandmarkName[] = [
  "leftShoulder",
  "rightShoulder",
  "leftHip",
  "rightHip",
  "leftAnkle",
  "rightAnkle",
];
const PLAYER_AREA_PADDING = 0.03;

export const GAME_PHASE_LABELS: Record<GamePhase, string> = {
  title: "Title",
  preparing: "Preparing",
  countdown: "Countdown",
  playing: "Playing",
  result: "Result",
  error: "Error",
};

export function createInitialGameState(): GameState {
  return createGameState(INITIAL_GAME_PHASE);
}

export function createGameState(phase: GamePhase): GameState {
  const initialWallPattern = getWallPatternByIndex(INITIAL_WALL_SEQUENCE_INDEX);

  return {
    phase,
    error: null,
    remainingHearts: MAX_HEARTS,
    score: INITIAL_SCORE,
    misses: INITIAL_MISSES,
    lastJudgment: null,
    mockPose: DEFAULT_MOCK_POSE,
    avatarStyle: "neutral",
    poseInputMode: "mock",
    poseDetectionStatus: "mock",
    playerArea: DEFAULT_MOCK_POSE.bodyArea,
    activeWallPatternId: initialWallPattern.id,
    wallProgress: INITIAL_WALL_PROGRESS,
    wallSequenceIndex: INITIAL_WALL_SEQUENCE_INDEX,
    successfulWalls: INITIAL_SUCCESSFUL_WALLS,
    wallSpeedLevel: INITIAL_WALL_SPEED_LEVEL,
    lastSpeedLevelUp: false,
  };
}

export function createPlayerAreaFromPoseFrame(
  poseFrame: PoseFrame,
): SafeArea | null {
  if (!poseFrame.detected) {
    return null;
  }

  const hasRequiredLandmarks = REQUIRED_BODY_LANDMARKS.every((name) => {
    const landmark = poseFrame.landmarks[name];
    return landmark && landmark.visibility >= MIN_POSE_VISIBILITY;
  });

  if (!hasRequiredLandmarks) {
    return null;
  }

  const visiblePoints = Object.values(poseFrame.landmarks).filter(
    (point) => point && point.visibility >= MIN_POSE_VISIBILITY,
  );

  if (visiblePoints.length === 0) {
    return null;
  }

  const mirroredXValues = visiblePoints.map((point) => 1 - point.x);
  const yValues = visiblePoints.map((point) => point.y);
  const left = Math.max(0, Math.min(...mirroredXValues) - PLAYER_AREA_PADDING);
  const top = Math.max(0, Math.min(...yValues) - PLAYER_AREA_PADDING);
  const right = Math.min(1, Math.max(...mirroredXValues) + PLAYER_AREA_PADDING);
  const bottom = Math.min(1, Math.max(...yValues) + PLAYER_AREA_PADDING);

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
}

export function fitPoseFrameToGame(poseFrame: PoseFrame): PoseFrame {
  if (!poseFrame.detected) {
    return poseFrame;
  }

  const visiblePoints = Object.values(poseFrame.landmarks).filter(
    (point) =>
      point &&
      point.visibility >= MIN_POSE_VISIBILITY &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y),
  );

  if (visiblePoints.length === 0) {
    return poseFrame;
  }

  const xValues = visiblePoints.map((point) => point.x);
  const yValues = visiblePoints.map((point) => point.y);
  const left = Math.min(...xValues);
  const right = Math.max(...xValues);
  const top = Math.min(...yValues);
  const bottom = Math.max(...yValues);
  const width = right - left;
  const height = bottom - top;
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  const widthScale =
    width > 0 ? MAX_GAME_POSE_WIDTH / width : GAME_POSE_SCALE;
  const heightScale =
    height > 0 ? MAX_GAME_POSE_HEIGHT / height : GAME_POSE_SCALE;
  const scale = Math.min(
    GAME_POSE_SCALE,
    widthScale,
    heightScale,
  );
  const landmarkEntries = Object.entries(poseFrame.landmarks) as [
    PoseLandmarkName,
    PoseFrame["landmarks"][PoseLandmarkName],
  ][];
  const landmarks: PoseFrame["landmarks"] = {};

  for (const [name, point] of landmarkEntries) {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      continue;
    }

    landmarks[name] = {
      ...point,
      x: clampNormalized(centerX + (point.x - centerX) * scale),
      y: clampNormalized(centerY + (point.y - centerY) * scale),
    };
  }

  return {
    ...poseFrame,
    landmarks,
  };
}

function clampNormalized(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}
