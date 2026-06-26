import type { GamePhase, GameState } from "./types";

export const INITIAL_GAME_PHASE: GamePhase = "title";
export const GAME_DURATION_SECONDS = 20;
export const INITIAL_SCORE = 0;
export const INITIAL_MISSES = 0;

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
  return {
    phase,
    remainingSeconds: GAME_DURATION_SECONDS,
    score: INITIAL_SCORE,
    misses: INITIAL_MISSES,
  };
}
