export type BgmTrack = "none" | "lobby" | "play";

export type SoundEffect =
  | "confirm"
  | "count"
  | "start"
  | "wallSpawn"
  | "success"
  | "miss"
  | "notDetected"
  | "speedUp"
  | "result";

export type AudioPreferences = {
  muted: boolean;
  bgmVolume: number;
  sfxVolume: number;
};

export type AudioEngineStatus =
  | "locked"
  | "ready"
  | "suspended"
  | "unsupported";

export interface GameAudioEngine {
  unlock(): Promise<boolean>;
  setPreferences(preferences: AudioPreferences): void;
  setBgm(track: BgmTrack): void;
  playEffect(effect: SoundEffect): void;
  stopEffects(): void;
  suspend(): void;
  resume(): void;
  stopAll(): void;
  dispose(): void;
  getStatus(): AudioEngineStatus;
}
