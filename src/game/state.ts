import type { GamePhase, GameState } from "./types";
import { DEFAULT_MOCK_POSE } from "./mockPose";
import { getWallPatternByIndex } from "./wallPatterns";

export const INITIAL_GAME_PHASE: GamePhase = "title";
export const GAME_DURATION_SECONDS = 20;
export const INITIAL_SCORE = 0;
export const INITIAL_MISSES = 0;
export const INITIAL_WALL_SEQUENCE_INDEX = 0;
export const INITIAL_WALL_PROGRESS = 0;

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
    activeWallPatternId: initialWallPattern.id,
    wallProgress: INITIAL_WALL_PROGRESS,
    wallSequenceIndex: INITIAL_WALL_SEQUENCE_INDEX,
  };
}
