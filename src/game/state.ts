import type { PoseFrame, PoseLandmarkName } from "../pose/poseTypes";
import type { GamePhase, GameState, SafeArea } from "./types";
import { DEFAULT_MOCK_POSE } from "./mockPose";
import { getWallPatternByIndex } from "./wallPatterns";

export const INITIAL_GAME_PHASE: GamePhase = "title";
export const GAME_DURATION_SECONDS = 20;
export const INITIAL_SCORE = 0;
export const INITIAL_MISSES = 0;
export const INITIAL_WALL_SEQUENCE_INDEX = 0;
export const INITIAL_WALL_PROGRESS = 0;
export const MIN_POSE_VISIBILITY = 0.5;

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
    remainingSeconds: GAME_DURATION_SECONDS,
    score: INITIAL_SCORE,
    misses: INITIAL_MISSES,
    lastJudgment: null,
    mockPose: DEFAULT_MOCK_POSE,
    poseInputMode: "mock",
    poseDetectionStatus: "mock",
    playerArea: DEFAULT_MOCK_POSE.bodyArea,
    activeWallPatternId: initialWallPattern.id,
    wallProgress: INITIAL_WALL_PROGRESS,
    wallSequenceIndex: INITIAL_WALL_SEQUENCE_INDEX,
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
