import { describe, expect, it } from "vitest";
import {
  CAMERA_PREPARING_IDLE_RETURN_DELAY_MS,
  ERROR_AUTO_RETURN_DELAY_MS,
  RESULT_AUTO_RETURN_DELAY_MS,
  canManuallyResetToTitle,
  getAutoReturnDelayMs,
  getAutoReturnDelaySeconds,
} from "./exhibitionMode";
import type { GamePhase } from "./types";

describe("getAutoReturnDelayMs", () => {
  it("returns auto return delays for result and error screens", () => {
    expect(getAutoReturnDelayMs("result")).toBe(RESULT_AUTO_RETURN_DELAY_MS);
    expect(getAutoReturnDelayMs("error")).toBe(ERROR_AUTO_RETURN_DELAY_MS);
  });

  it("does not auto return during title, countdown, or playing", () => {
    expect(getAutoReturnDelayMs("title")).toBeNull();
    expect(getAutoReturnDelayMs("countdown")).toBeNull();
    expect(getAutoReturnDelayMs("playing")).toBeNull();
  });

  it("only auto returns from preparing when an active camera is held", () => {
    expect(getAutoReturnDelayMs("preparing")).toBeNull();
    expect(getAutoReturnDelayMs("preparing", { hasActiveCamera: false })).toBeNull();
    expect(getAutoReturnDelayMs("preparing", { hasActiveCamera: true })).toBe(
      CAMERA_PREPARING_IDLE_RETURN_DELAY_MS,
    );
  });
});

describe("canManuallyResetToTitle", () => {
  it("allows manual reset outside title", () => {
    const resettablePhases: GamePhase[] = [
      "preparing",
      "countdown",
      "playing",
      "result",
      "error",
    ];

    for (const phase of resettablePhases) {
      expect(canManuallyResetToTitle(phase)).toBe(true);
    }
  });

  it("does not expose manual reset on title", () => {
    expect(canManuallyResetToTitle("title")).toBe(false);
  });
});

describe("getAutoReturnDelaySeconds", () => {
  it("converts nullable millisecond values to rounded seconds", () => {
    expect(getAutoReturnDelaySeconds(null)).toBeNull();
    expect(getAutoReturnDelaySeconds(15_000)).toBe(15);
    expect(getAutoReturnDelaySeconds(15_001)).toBe(16);
  });
});
