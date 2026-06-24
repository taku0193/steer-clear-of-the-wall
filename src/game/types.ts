export type GamePhase =
  | "title"
  | "preparing"
  | "countdown"
  | "playing"
  | "result"
  | "error";

export type GameState = {
  phase: GamePhase;
};
