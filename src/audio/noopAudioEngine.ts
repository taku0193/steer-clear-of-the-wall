import type { AudioEngineStatus, AudioPreferences, BgmTrack, GameAudioEngine, SoundEffect } from "./audioTypes";

export function createNoopAudioEngine(): GameAudioEngine {
  return {
    async unlock() { return false; },
    setPreferences(_preferences: AudioPreferences) {},
    setBgm(_track: BgmTrack) {},
    playEffect(_effect: SoundEffect) {},
    stopEffects() {},
    suspend() {},
    resume() {},
    stopAll() {},
    dispose() {},
    getStatus(): AudioEngineStatus { return "unsupported"; },
  };
}
