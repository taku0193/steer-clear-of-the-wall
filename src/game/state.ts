import type { GamePhase, GameState } from "./types";

export const INITIAL_GAME_PHASE: GamePhase = "title";

export const GAME_PHASE_LABELS: Record<GamePhase, string> = {
  title: "Title",
  preparing: "Preparing",
  countdown: "Countdown",
  playing: "Playing",
  result: "Result",
  error: "Error",
};

export function createInitialGameState(): GameState {
  return {
    phase: INITIAL_GAME_PHASE,
  };
}
