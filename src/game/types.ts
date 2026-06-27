export type GamePhase =
  | "title"
  | "preparing"
  | "countdown"
  | "playing"
  | "result"
  | "error";

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
  remainingSeconds: number;
  score: number;
  misses: number;
  lastJudgment: JudgmentResult | null;
  mockPose: MockPose;
  activeWallPatternId: string;
  wallProgress: number;
  wallSequenceIndex: number;
};
