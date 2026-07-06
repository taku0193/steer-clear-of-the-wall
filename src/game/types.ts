export type GamePhase =
  | "title"
  | "preparing"
  | "countdown"
  | "playing"
  | "result"
  | "error";

export type GameError =
  | {
      type: "cameraPermissionDenied";
    }
  | {
      type: "cameraNotFound";
    }
  | {
      type: "cameraNotReadable";
    }
  | {
      type: "cameraUnavailable";
    }
  | {
      type: "insecureContext";
    }
  | {
      type: "poseInitializationFailed";
      message: string;
    }
  | {
      type: "poseDetectionFailed";
      message: string;
    };

export type SafeArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WallPattern = {
  id: string;
  name: string;
  safeArea: SafeArea;
  scoreValue: number;
};

export type MockPose = {
  id: string;
  name: string;
  bodyArea: SafeArea;
};

export type PoseInputMode = "mock" | "camera";
export type AvatarStyle = "masculine" | "feminine" | "neutral";

export type PoseDetectionStatus =
  | "mock"
  | "initializing"
  | "detecting"
  | "detected"
  | "notDetected";

export type JudgmentResult =
  | {
      type: "success";
      patternId: string;
    }
  | {
      type: "miss";
      patternId: string;
      reason: "outsideSafeArea";
    }
  | {
      type: "notDetected";
      patternId: string;
    };

export type GameState = {
  phase: GamePhase;
  error: GameError | null;
  remainingSeconds: number;
  score: number;
  misses: number;
  lastJudgment: JudgmentResult | null;
  mockPose: MockPose;
  avatarStyle: AvatarStyle;
  poseInputMode: PoseInputMode;
  poseDetectionStatus: PoseDetectionStatus;
  playerArea: SafeArea | null;
  activeWallPatternId: string;
  wallProgress: number;
  wallSequenceIndex: number;
};
