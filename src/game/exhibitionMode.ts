import type { GamePhase } from "./types";

export const RESULT_AUTO_RETURN_DELAY_MS = 15_000;
export const ERROR_AUTO_RETURN_DELAY_MS = 20_000;
export const CAMERA_PREPARING_IDLE_RETURN_DELAY_MS = 90_000;

type AutoReturnOptions = {
  hasActiveCamera?: boolean;
};

export function getAutoReturnDelayMs(
  phase: GamePhase,
  options: AutoReturnOptions = {},
): number | null {
  switch (phase) {
    case "result":
      return RESULT_AUTO_RETURN_DELAY_MS;
    case "error":
      return ERROR_AUTO_RETURN_DELAY_MS;
    case "preparing":
      return options.hasActiveCamera
        ? CAMERA_PREPARING_IDLE_RETURN_DELAY_MS
        : null;
    case "title":
    case "countdown":
    case "playing":
      return null;
  }
}

export function canManuallyResetToTitle(phase: GamePhase): boolean {
  switch (phase) {
    case "preparing":
    case "countdown":
    case "playing":
    case "result":
    case "error":
      return true;
    case "title":
      return false;
  }
}

export function getAutoReturnDelaySeconds(delayMs: number | null): number | null {
  return delayMs === null ? null : Math.ceil(delayMs / 1000);
}
