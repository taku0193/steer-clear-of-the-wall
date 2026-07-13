"use client";

import { useEffect, useRef } from "react";
import {
  createJudgmentAudioKey,
  selectBgmTrack,
  selectJudgmentEffect,
} from "../audio/audioSelection";
import { useGameAudio } from "../audio/useGameAudio";
import type { GamePhase, JudgmentResult } from "../game/types";

type AudioControllerProps = {
  phase: GamePhase;
  countdownValue: number;
  wallSequenceIndex: number;
  lastJudgment: JudgmentResult | null;
  lastSpeedLevelUp: boolean;
};

export function AudioController({
  phase,
  countdownValue,
  wallSequenceIndex,
  lastJudgment,
  lastSpeedLevelUp,
}: AudioControllerProps) {
  const audio = useGameAudio();
  const previousPhaseRef = useRef(phase);
  const countdownKeyRef = useRef<string | null>(null);
  const wallSequenceRef = useRef(wallSequenceIndex);
  const judgmentKeyRef = useRef<string | null>(null);

  useEffect(() => {
    audio.setBgm(selectBgmTrack(phase));
  }, [audio, phase]);

  useEffect(() => {
    const previousPhase = previousPhaseRef.current;
    if (phase === "playing" && previousPhase === "countdown") {
      audio.playEffect("start");
    } else if (phase === "result" && previousPhase !== "result") {
      audio.stopEffects();
      audio.playEffect("result");
    }
    previousPhaseRef.current = phase;
  }, [audio, phase]);

  useEffect(() => {
    if (phase !== "countdown") {
      countdownKeyRef.current = null;
      return;
    }
    const key = `${phase}:${countdownValue}`;
    if (countdownKeyRef.current !== key) {
      countdownKeyRef.current = key;
      audio.playEffect("count");
    }
  }, [audio, countdownValue, phase]);

  useEffect(() => {
    if (phase === "playing" && wallSequenceRef.current !== wallSequenceIndex) {
      audio.playEffect("wallSpawn");
    }
    wallSequenceRef.current = wallSequenceIndex;
  }, [audio, phase, wallSequenceIndex]);

  useEffect(() => {
    if (!lastJudgment) {
      judgmentKeyRef.current = null;
      return;
    }
    const key = createJudgmentAudioKey(lastJudgment, wallSequenceIndex);
    if (judgmentKeyRef.current !== key) {
      judgmentKeyRef.current = key;
      audio.playEffect(
        selectJudgmentEffect(lastJudgment, lastSpeedLevelUp),
      );
    }
  }, [audio, lastJudgment, lastSpeedLevelUp, wallSequenceIndex]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") audio.suspend();
      else audio.resume();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [audio]);

  return null;
}
