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

export type SafeZone =
  | {
      type: "rect";
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "ellipse";
      id: string;
      cx: number;
      cy: number;
      rx: number;
      ry: number;
    }
  | {
      type: "capsule";
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      radius: number;
    }
  | {
      type: "polygon";
      id: string;
      points: readonly {
        x: number;
        y: number;
      }[];
    };

export type SafeShape = {
  zones: readonly SafeZone[];
};

export type WallVerticalAnchor = "top" | "ground" | "center";
export type WallActionTiming = "hold" | "jump";

export type WallPattern = {
  id: string;
  name: string;
  safeArea: SafeArea;
  safeShape?: SafeShape;
  verticalAnchor: WallVerticalAnchor;
  actionTiming?: WallActionTiming;
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
      outsidePoints?: readonly {
        anchorId: string;
        x: number;
        y: number;
      }[];
    }
  | {
      type: "notDetected";
      patternId: string;
    };

export type GameState = {
  phase: GamePhase;
  error: GameError | null;
  remainingHearts: number;
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
  successfulWalls: number;
  wallSpeedLevel: number;
  lastSpeedLevelUp: boolean;
};
