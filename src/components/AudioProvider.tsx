"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AUDIO_PREFERENCES_STORAGE_KEY,
  clampAudioVolume,
  DEFAULT_AUDIO_PREFERENCES,
  parseAudioPreferences,
  serializeAudioPreferences,
} from "../audio/audioPreferences";
import type { AudioPreferences, GameAudioEngine } from "../audio/audioTypes";
import { GameAudioContext } from "../audio/useGameAudio";
import { createGameAudioEngine } from "../audio/webAudioEngine";

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const engineRef = useRef<GameAudioEngine | null>(null);
  const [preferences, setPreferences] = useState(DEFAULT_AUDIO_PREFERENCES);
  const [status, setStatus] = useState(engineRef.current?.getStatus() ?? "locked");

  const getEngine = useCallback(() => {
    if (!engineRef.current) engineRef.current = createGameAudioEngine();
    return engineRef.current;
  }, []);

  useEffect(() => {
    const engine = getEngine();
    let storedValue: string | null = null;
    try {
      storedValue = window.localStorage.getItem(AUDIO_PREFERENCES_STORAGE_KEY);
    } catch {
      // Some privacy modes expose localStorage but reject access.
    }
    const storedPreferences = parseAudioPreferences(storedValue);
    setPreferences(storedPreferences);
    engine.setPreferences(storedPreferences);
    setStatus(engine.getStatus());

    return () => {
      engine.dispose();
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, [getEngine]);

  const updatePreferences = useCallback(
    (update: (current: AudioPreferences) => AudioPreferences) => {
      setPreferences((current) => {
        const next = update(current);
        getEngine().setPreferences(next);
        try {
          window.localStorage.setItem(
            AUDIO_PREFERENCES_STORAGE_KEY,
            serializeAudioPreferences(next),
          );
        } catch {
          // The game remains usable when storage is unavailable.
        }
        return next;
      });
    },
    [getEngine],
  );

  const value = useMemo(
    () => ({
      preferences,
      status,
      async unlockAudio() {
        const engine = getEngine();
        const unlocked = await engine.unlock();
        setStatus(engine.getStatus());
        return unlocked;
      },
      setMuted(muted: boolean) {
        updatePreferences((current) => ({ ...current, muted }));
      },
      setBgmVolume(volume: number) {
        updatePreferences((current) => ({
          ...current,
          bgmVolume: clampAudioVolume(volume),
        }));
      },
      setSfxVolume(volume: number) {
        updatePreferences((current) => ({
          ...current,
          sfxVolume: clampAudioVolume(volume),
        }));
      },
      setBgm: (track: Parameters<GameAudioEngine["setBgm"]>[0]) =>
        getEngine().setBgm(track),
      playEffect: (effect: Parameters<GameAudioEngine["playEffect"]>[0]) =>
        getEngine().playEffect(effect),
      stopEffects: () => getEngine().stopEffects(),
      suspend: () => {
        getEngine().suspend();
        setStatus(getEngine().getStatus());
      },
      resume: () => {
        getEngine().resume();
        setStatus(getEngine().getStatus());
      },
    }),
    [getEngine, preferences, status, updatePreferences],
  );

  return (
    <GameAudioContext.Provider value={value}>
      {children}
    </GameAudioContext.Provider>
  );
}
