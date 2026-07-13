"use client";

import { useEffect, useRef, useState } from "react";
import { useGameAudio } from "../audio/useGameAudio";
import type { GamePhase } from "../game/types";

export function AudioControls({ phase }: { phase: GamePhase }) {
  const audio = useGameAudio();
  const [isOpen, setIsOpen] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!controlsRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  async function toggleMute() {
    const muted = !audio.preferences.muted;
    audio.setMuted(muted);
    await audio.unlockAudio();
  }

  return (
    <div
      ref={controlsRef}
      className={`audio-controls audio-controls-${phase}`}
      data-open={isOpen}
    >
      <button
        className="audio-icon-button"
        type="button"
        aria-label={audio.preferences.muted ? "音をオンにする" : "音をミュートする"}
        aria-pressed={audio.preferences.muted}
        title={audio.preferences.muted ? "音をオンにする" : "音をミュートする"}
        onClick={toggleMute}
      >
        <span aria-hidden="true">{audio.preferences.muted ? "🔇" : "🔊"}</span>
      </button>
      <button
        className="audio-menu-button"
        type="button"
        aria-expanded={isOpen}
        aria-controls="audio-settings"
        onClick={() => setIsOpen((current) => !current)}
      >
        音量
      </button>
      {isOpen && (
        <section id="audio-settings" className="audio-settings" aria-label="音量設定">
          <div className="audio-settings-heading">
            <strong>サウンド</strong>
            <button
              className="audio-settings-close"
              type="button"
              aria-label="音量設定を閉じる"
              title="閉じる"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>
          <label>
            <span>BGM</span>
            <output>{Math.round(audio.preferences.bgmVolume * 100)}</output>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(audio.preferences.bgmVolume * 100)}
              aria-label="BGM音量"
              onChange={(event) =>
                audio.setBgmVolume(Number(event.currentTarget.value) / 100)
              }
            />
          </label>
          <label>
            <span>効果音</span>
            <output>{Math.round(audio.preferences.sfxVolume * 100)}</output>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(audio.preferences.sfxVolume * 100)}
              aria-label="効果音音量"
              onChange={(event) =>
                audio.setSfxVolume(Number(event.currentTarget.value) / 100)
              }
            />
          </label>
          {audio.status === "unsupported" && (
            <p className="audio-unsupported">このブラウザでは音声を再生できません。</p>
          )}
        </section>
      )}
    </div>
  );
}
