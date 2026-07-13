import { describe, expect, it, vi } from "vitest";
import { scheduleMusicStep } from "./musicSynth";

describe("scheduleMusicStep", () => {
  it("全楽器を有限時間のsourceとして予約する", () => {
    const scheduled: { start: number[]; stop: number[] }[] = [];
    const createParam = () => ({
      value: 0,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    });
    const createSource = () => {
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
      createOscillator() {
        return {
          ...createSource(),
          type: "sine",
          frequency: createParam(),
        };
      },
      createBufferSource() {
        return { ...createSource(), buffer: null };
      },
      createGain() {
        return {
          gain: createParam(),
          connect(destination: unknown) {
            return destination;
          },
          disconnect: vi.fn(),
        };
      },
      createBiquadFilter() {
        return {
          type: "lowpass",
          frequency: createParam(),
          Q: createParam(),
          connect(destination: unknown) {
            return destination;
          },
          disconnect: vi.fn(),
        };
      },
    } as unknown as AudioContext;

    const sources = scheduleMusicStep(
      context,
      {} as AudioNode,
      {} as AudioBuffer,
      2,
      0.125,
      {
        kick: true,
        snare: true,
        closedHat: true,
        openHat: true,
        bass: 110,
        chord: [220, 261.63, 329.63],
        lead: 440,
      },
    );

    expect(sources).toHaveLength(12);
    expect(scheduled).toHaveLength(12);
    for (const source of scheduled) {
      expect(source.start).toEqual([2]);
      expect(source.stop).toHaveLength(1);
      expect(source.stop[0]).toBeGreaterThan(2);
      expect(Number.isFinite(source.stop[0])).toBe(true);
    }
  });

  it("空stepではsourceを生成しない", () => {
    const context = {} as AudioContext;
    expect(
      scheduleMusicStep(context, {} as AudioNode, {} as AudioBuffer, 0, 0.125, {}),
    ).toEqual([]);
  });
});
