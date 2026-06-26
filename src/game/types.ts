export type GamePhase =
  | "title"
  | "preparing"
  | "countdown"
  | "playing"
  | "result"
  | "error";

export type GameState = {
  phase: GamePhase;
  remainingSeconds: number;
  score: number;
  misses: number;
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
