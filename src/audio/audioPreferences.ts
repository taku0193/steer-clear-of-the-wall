import type { AudioPreferences } from "./audioTypes";

export const AUDIO_PREFERENCES_STORAGE_KEY = "steer-clear.audio.v1";

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  muted: false,
  bgmVolume: 0.28,
  sfxVolume: 0.55,
};

export function parseAudioPreferences(value: string | null): AudioPreferences {
  if (!value) return DEFAULT_AUDIO_PREFERENCES;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed) || typeof parsed.muted !== "boolean") {
      return DEFAULT_AUDIO_PREFERENCES;
    }
    return {
      muted: parsed.muted,
      bgmVolume: normalizeVolume(parsed.bgmVolume, DEFAULT_AUDIO_PREFERENCES.bgmVolume),
      sfxVolume: normalizeVolume(parsed.sfxVolume, DEFAULT_AUDIO_PREFERENCES.sfxVolume),
    };
  } catch {
    return DEFAULT_AUDIO_PREFERENCES;
  }
}

export function serializeAudioPreferences(preferences: AudioPreferences): string {
  return JSON.stringify({
    muted: preferences.muted,
    bgmVolume: normalizeVolume(preferences.bgmVolume, DEFAULT_AUDIO_PREFERENCES.bgmVolume),
    sfxVolume: normalizeVolume(preferences.sfxVolume, DEFAULT_AUDIO_PREFERENCES.sfxVolume),
  });
}

export function clampAudioVolume(value: number): number {
  return normalizeVolume(value, 0);
}

function normalizeVolume(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(value, 0), 1)
    : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
