import { DEFAULT_AUDIO_PREFERENCES } from "./audioPreferences";
import { getMusicPattern, getStepDurationSeconds } from "./musicPatterns";
import { scheduleMusicStep } from "./musicSynth";
import { createNoopAudioEngine } from "./noopAudioEngine";
import { createNoiseBuffer, scheduleSoundEffect } from "./soundEffects";
import type {
  AudioEngineStatus,
  AudioPreferences,
  BgmTrack,
  GameAudioEngine,
  SoundEffect,
} from "./audioTypes";

type AudioContextConstructor = new () => AudioContext;

const DUCKING_DURATION: Partial<Record<SoundEffect, number>> = {
  success: 0.24,
  miss: 0.28,
  notDetected: 0.2,
  speedUp: 0.44,
  result: 0.62,
};

export function createGameAudioEngine(): GameAudioEngine {
  const AudioContextClass = getAudioContextConstructor();
  if (!AudioContextClass) return createNoopAudioEngine();

  let context: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let bgmGain: GainNode | null = null;
  let sfxGain: GainNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  let preferences = DEFAULT_AUDIO_PREFERENCES;
  let status: AudioEngineStatus = "locked";
  let desiredTrack: BgmTrack = "none";
  let activeTrack: BgmTrack = "none";
  let schedulerId: ReturnType<typeof setInterval> | null = null;
  let lifecycleRequest = 0;
  let nextStepTime = 0;
  let stepIndex = 0;
  const bgmSources = new Set<AudioScheduledSourceNode>();
  const effectSources = new Set<AudioScheduledSourceNode>();

  const engine: GameAudioEngine = {
    async unlock() {
      try {
        if (!context) {
          context = new AudioContextClass();
          masterGain = context.createGain();
          bgmGain = context.createGain();
          sfxGain = context.createGain();
          bgmGain.connect(masterGain);
          sfxGain.connect(masterGain);
          masterGain.connect(context.destination);
          noiseBuffer = createNoiseBuffer(context);
          applyPreferences();
        }
        if (context.state === "suspended") await context.resume();
        status = "ready";
        startBgm(desiredTrack);
        return true;
      } catch {
        status = "unsupported";
        return false;
      }
    },

    setPreferences(nextPreferences) {
      preferences = nextPreferences;
      applyPreferences();
    },

    setBgm(track) {
      desiredTrack = track;
      if (status === "ready" && track !== activeTrack) startBgm(track);
    },

    playEffect(effect) {
      if (!context || !sfxGain || status !== "ready" || preferences.muted) return;
      applyDucking(effect);
      const sources = scheduleSoundEffect(
        context,
        sfxGain,
        effect,
        noiseBuffer ?? createNoiseBuffer(context),
      );
      trackSources(sources, effectSources);
    },

    stopEffects() {
      stopSources(effectSources);
    },

    suspend() {
      if (!context || status !== "ready") return;
      const request = ++lifecycleRequest;
      void context.suspend().then(() => {
        if (request === lifecycleRequest) status = "suspended";
      }).catch(() => {});
    },

    resume() {
      if (!context || status === "unsupported") return;
      const request = ++lifecycleRequest;
      void context.resume().then(() => {
        if (request !== lifecycleRequest) return;
        status = "ready";
        if (desiredTrack !== activeTrack) startBgm(desiredTrack);
      }).catch(() => {
        if (request === lifecycleRequest) status = "locked";
      });
    },

    stopAll() {
      desiredTrack = "none";
      stopBgm();
      stopSources(effectSources);
    },

    dispose() {
      lifecycleRequest += 1;
      engine.stopAll();
      if (context) void context.close().catch(() => {});
      context = null;
      masterGain = null;
      bgmGain = null;
      sfxGain = null;
      status = "locked";
    },

    getStatus() {
      return status;
    },
  };

  function applyPreferences() {
    if (!context || !masterGain || !bgmGain || !sfxGain) return;
    const now = context.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    bgmGain.gain.cancelScheduledValues(now);
    sfxGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(preferences.muted ? 0 : 1, now, 0.015);
    bgmGain.gain.setTargetAtTime(preferences.bgmVolume, now, 0.02);
    sfxGain.gain.setTargetAtTime(preferences.sfxVolume, now, 0.015);
  }

  function startBgm(track: BgmTrack) {
    if (schedulerId !== null) clearInterval(schedulerId);
    schedulerId = null;
    activeTrack = track;
    if (!context || !bgmGain || status !== "ready") {
      stopSources(bgmSources);
      return;
    }

    const now = context.currentTime;
    bgmGain.gain.cancelScheduledValues(now);
    bgmGain.gain.setValueAtTime(Math.max(0.0001, bgmGain.gain.value), now);
    bgmGain.gain.linearRampToValueAtTime(0.0001, now + 0.07);
    stopSourcesAt(bgmSources, now + 0.08);
    if (track === "none") return;

    bgmGain.gain.setValueAtTime(0.0001, now + 0.08);
    bgmGain.gain.linearRampToValueAtTime(preferences.bgmVolume, now + 0.16);
    nextStepTime = now + 0.1;
    stepIndex = 0;
    scheduleBgm();
    schedulerId = setInterval(scheduleBgm, 100);
  }

  function scheduleBgm() {
    if (!context || !bgmGain || activeTrack === "none") return;
    const pattern = getMusicPattern(activeTrack);
    const stepDuration = getStepDurationSeconds(pattern);
    while (nextStepTime < context.currentTime + 0.5) {
      const step = pattern.steps[stepIndex % pattern.steps.length];
      const sources = scheduleMusicStep(
        context,
        bgmGain,
        noiseBuffer ?? createNoiseBuffer(context),
        nextStepTime,
        stepDuration,
        step,
      );
      trackSources(sources, bgmSources);
      stepIndex += 1;
      nextStepTime += stepDuration;
    }
  }

  function stopBgm() {
    if (schedulerId !== null) clearInterval(schedulerId);
    schedulerId = null;
    stopSources(bgmSources);
    activeTrack = "none";
  }

  function applyDucking(effect: SoundEffect) {
    if (!context || !bgmGain || activeTrack === "none") return;
    const duration = DUCKING_DURATION[effect];
    if (!duration) return;
    const now = context.currentTime;
    const configuredVolume = preferences.bgmVolume;
    bgmGain.gain.cancelScheduledValues(now);
    bgmGain.gain.setTargetAtTime(configuredVolume * 0.55, now, 0.018);
    bgmGain.gain.setTargetAtTime(configuredVolume, now + duration, 0.06);
  }

  return engine;
}

function trackSources(
  sources: readonly AudioScheduledSourceNode[],
  target: Set<AudioScheduledSourceNode>,
) {
  for (const source of sources) {
    target.add(source);
    source.addEventListener("ended", () => target.delete(source), { once: true });
  }
}

function stopSources(sources: Set<AudioScheduledSourceNode>) {
  for (const source of sources) {
    try { source.stop(); } catch {}
    try { source.disconnect(); } catch {}
  }
  sources.clear();
}

function stopSourcesAt(
  sources: Set<AudioScheduledSourceNode>,
  stopTime: number,
) {
  for (const source of sources) {
    try { source.stop(stopTime); } catch {}
  }
}

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;
  const browserWindow = window as typeof window & {
    webkitAudioContext?: AudioContextConstructor;
  };
  return window.AudioContext ?? browserWindow.webkitAudioContext ?? null;
}
