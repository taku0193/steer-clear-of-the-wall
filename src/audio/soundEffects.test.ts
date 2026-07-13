import { describe, expect, it, vi } from "vitest";
import { scheduleSoundEffect } from "./soundEffects";
import type { SoundEffect } from "./audioTypes";

const EFFECTS: readonly SoundEffect[] = [
  "confirm",
  "count",
  "start",
  "wallSpawn",
  "success",
  "miss",
  "notDetected",
  "speedUp",
  "result",
];

describe("scheduleSoundEffect", () => {
  it.each(EFFECTS)("%sを有限時間のone-shotとして予約する", (effect) => {
    const scheduled: { start: number[]; stop: number[] }[] = [];
    const audioParam = {
      value: 0,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    };
    const makeSource = () => {
      const calls = { start: [] as number[], stop: [] as number[] };
      scheduled.push(calls);
      return {
        connect(destination: unknown) {
          return destination;
        },
        disconnect: vi.fn(),
        addEventListener: vi.fn(),
        start: (time: number) => calls.start.push(time),
        stop: (time: number) => calls.stop.push(time),
      };
    };
    const context = {
      currentTime: 1,
      createOscillator() {
        return {
          ...makeSource(),
          type: "sine",
          frequency: audioParam,
        };
      },
      createBufferSource() {
        return { ...makeSource(), buffer: null };
      },
      createGain() {
        return {
          gain: audioParam,
          connect(destination: unknown) {
            return destination;
          },
          disconnect: vi.fn(),
        };
      },
      createBiquadFilter() {
        return {
          type: "lowpass",
          frequency: { value: 0 },
          Q: { value: 0 },
          connect(destination: unknown) {
            return destination;
          },
          disconnect: vi.fn(),
        };
      },
    } as unknown as AudioContext;

    const sources = scheduleSoundEffect(
      context,
      {} as AudioNode,
      effect,
      {} as AudioBuffer,
    );

    expect(sources.length).toBeGreaterThan(0);
    expect(scheduled).toHaveLength(sources.length);
    for (const source of scheduled) {
      expect(source.start).toHaveLength(1);
      expect(source.stop).toHaveLength(1);
      expect(source.stop[0]).toBeGreaterThan(source.start[0]);
      expect(Number.isFinite(source.stop[0])).toBe(true);
    }
  });
});
