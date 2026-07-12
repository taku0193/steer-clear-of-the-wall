import { describe, expect, it } from "vitest";
import {
  AUTO_START_READY_DELAY_MS,
  getAutoStartState,
} from "./autoStart";
import type { GamePhase } from "./types";

describe("getAutoStartState", () => {
  it("準備中でカメラ、検出器、キャリブレーションがそろうと待機状態を返す", () => {
    expect(
      getAutoStartState({
        phase: "preparing",
        hasActiveCamera: true,
        detectorReady: true,
        calibrationCanStart: true,
      }),
    ).toEqual({
      status: "waiting",
      delayMs: AUTO_START_READY_DELAY_MS,
    });
  });

  it.each<GamePhase>(["title", "countdown", "playing", "result", "error"])(
    "%s では自動開始しない",
    (phase) => {
      expect(
        getAutoStartState({
          phase,
          hasActiveCamera: true,
          detectorReady: true,
          calibrationCanStart: true,
        }),
      ).toEqual({
        status: "inactive",
        delayMs: null,
      });
    },
  );

  it("カメラがない準備画面では自動開始しない", () => {
    expect(
      getAutoStartState({
        phase: "preparing",
        hasActiveCamera: false,
        detectorReady: true,
        calibrationCanStart: true,
      }),
    ).toEqual({
      status: "inactive",
      delayMs: null,
    });
  });

  it("検出器が準備できていない場合は自動開始しない", () => {
    expect(
      getAutoStartState({
        phase: "preparing",
        hasActiveCamera: true,
        detectorReady: false,
        calibrationCanStart: true,
      }),
    ).toEqual({
      status: "inactive",
      delayMs: null,
    });
  });

  it("キャリブレーションが良好でない場合は自動開始しない", () => {
    expect(
      getAutoStartState({
        phase: "preparing",
        hasActiveCamera: true,
        detectorReady: true,
        calibrationCanStart: false,
      }),
    ).toEqual({
      status: "inactive",
      delayMs: null,
    });
  });
});
