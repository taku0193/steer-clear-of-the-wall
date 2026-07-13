import type { SoundEffect } from "./audioTypes";

type Tone = {
  frequency: number;
  endFrequency?: number;
  offset?: number;
  duration: number;
  volume: number;
  wave?: OscillatorType;
};

const EFFECT_TONES: Record<Exclude<SoundEffect, "wallSpawn">, readonly Tone[]> = {
  confirm: [{ frequency: 620, duration: 0.07, volume: 0.18, wave: "sine" }],
  count: [{ frequency: 480, duration: 0.09, volume: 0.22, wave: "square" }],
  start: [
    { frequency: 520, endFrequency: 700, duration: 0.16, volume: 0.2 },
    { frequency: 780, offset: 0.11, duration: 0.12, volume: 0.18 },
  ],
  success: [
    { frequency: 660, duration: 0.16, volume: 0.18 },
    { frequency: 880, offset: 0.1, duration: 0.14, volume: 0.2 },
  ],
  miss: [{ frequency: 230, endFrequency: 92, duration: 0.26, volume: 0.28, wave: "sawtooth" }],
  notDetected: [
    { frequency: 330, duration: 0.08, volume: 0.12 },
    { frequency: 330, offset: 0.11, duration: 0.07, volume: 0.1 },
  ],
  speedUp: [
    { frequency: 523.25, duration: 0.14, volume: 0.18 },
    { frequency: 659.25, offset: 0.1, duration: 0.14, volume: 0.19 },
    { frequency: 880, offset: 0.2, duration: 0.2, volume: 0.22 },
  ],
  result: [
    { frequency: 392, duration: 0.28, volume: 0.14 },
    { frequency: 523.25, offset: 0.12, duration: 0.3, volume: 0.15 },
    { frequency: 659.25, offset: 0.24, duration: 0.34, volume: 0.16 },
  ],
};

export function scheduleSoundEffect(
  context: AudioContext,
  destination: AudioNode,
  effect: SoundEffect,
  noiseBuffer: AudioBuffer,
): readonly AudioScheduledSourceNode[] {
  const start = context.currentTime;
  if (effect === "wallSpawn") {
    return [scheduleNoise(context, destination, noiseBuffer, start)];
  }
  return EFFECT_TONES[effect].map((tone) => scheduleTone(context, destination, start, tone));
}

export function scheduleTone(
  context: AudioContext,
  destination: AudioNode,
  baseTime: number,
  tone: Tone,
): OscillatorNode {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = baseTime + (tone.offset ?? 0);
  const end = start + tone.duration;
  oscillator.type = tone.wave ?? "triangle";
  oscillator.frequency.setValueAtTime(tone.frequency, start);
  if (tone.endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(tone.endFrequency, end);
  }
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(tone.volume, start + Math.min(0.015, tone.duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  oscillator.connect(gain).connect(destination);
  oscillator.start(start);
  oscillator.stop(end + 0.01);
  oscillator.addEventListener("ended", () => {
    oscillator.disconnect();
    gain.disconnect();
  }, { once: true });
  return oscillator;
}

function scheduleNoise(
  context: AudioContext,
  destination: AudioNode,
  buffer: AudioBuffer,
  start: number,
): AudioBufferSourceNode {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = 420;
  filter.Q.value = 1.2;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.14, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
  source.connect(filter).connect(gain).connect(destination);
  source.start(start);
  source.stop(start + 0.13);
  source.addEventListener("ended", () => {
    source.disconnect();
    filter.disconnect();
    gain.disconnect();
  }, { once: true });
  return source;
}

export function createNoiseBuffer(context: AudioContext): AudioBuffer {
  const length = Math.max(1, Math.floor(context.sampleRate * 0.2));
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < channel.length; index += 1) {
    channel[index] = Math.random() * 2 - 1;
  }
  return buffer;
}
