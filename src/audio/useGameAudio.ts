"use client";

import { createContext, useContext } from "react";
import type {
  AudioEngineStatus,
  AudioPreferences,
  BgmTrack,
  SoundEffect,
} from "./audioTypes";

export type GameAudioContextValue = {
  preferences: AudioPreferences;
  status: AudioEngineStatus;
  unlockAudio: () => Promise<boolean>;
  setMuted: (muted: boolean) => void;
  setBgmVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  setBgm: (track: BgmTrack) => void;
  playEffect: (effect: SoundEffect) => void;
  stopEffects: () => void;
  suspend: () => void;
  resume: () => void;
};

export const GameAudioContext = createContext<GameAudioContextValue | null>(null);

export function useGameAudio(): GameAudioContextValue {
  const value = useContext(GameAudioContext);
  if (!value) throw new Error("useGameAudio must be used inside AudioProvider");
  return value;
}
