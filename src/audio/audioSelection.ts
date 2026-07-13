import type { GamePhase, JudgmentResult } from "../game/types";
import type { BgmTrack, SoundEffect } from "./audioTypes";

export function selectBgmTrack(phase: GamePhase): BgmTrack {
  switch (phase) {
    case "title":
    case "preparing":
      return "lobby";
    case "countdown":
    case "playing":
      return "play";
    case "result":
    case "error":
      return "none";
  }
}

export function selectJudgmentEffect(
  judgment: JudgmentResult,
  speedLevelUp: boolean,
): SoundEffect {
  if (judgment.type === "success") return speedLevelUp ? "speedUp" : "success";
  if (judgment.type === "miss") return "miss";
  return "notDetected";
}

export function createJudgmentAudioKey(
  judgment: JudgmentResult,
  wallSequenceIndex: number,
): string {
  return `${wallSequenceIndex}:${judgment.patternId}:${judgment.type}`;
}
