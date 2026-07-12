import type { GamePhase } from "./types";

export const AUTO_START_READY_DELAY_MS = 1_000;

export type AutoStartInput = {
  phase: GamePhase;
  hasActiveCamera: boolean;
  detectorReady: boolean;
  calibrationCanStart: boolean;
};

export type AutoStartState =
  | {
      status: "inactive";
      delayMs: null;
    }
  | {
      status: "waiting";
      delayMs: number;
    };

export function getAutoStartState({
  phase,
  hasActiveCamera,
  detectorReady,
  calibrationCanStart,
}: AutoStartInput): AutoStartState {
  if (
    phase !== "preparing" ||
    !hasActiveCamera ||
    !detectorReady ||
    !calibrationCanStart
  ) {
    return {
      status: "inactive",
      delayMs: null,
    };
  }

  return {
    status: "waiting",
    delayMs: AUTO_START_READY_DELAY_MS,
  };
}
