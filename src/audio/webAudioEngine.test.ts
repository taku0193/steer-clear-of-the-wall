import { afterEach, describe, expect, it, vi } from "vitest";
import { createGameAudioEngine } from "./webAudioEngine";

describe("createGameAudioEngine", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("unlockを繰り返してもAudioContextを1つだけ生成する", async () => {
    let contextCount = 0;
    let resumeCount = 0;
    let closeCount = 0;

    class FakeAudioContext {
      state = "suspended";
      currentTime = 0;
      sampleRate = 100;
      destination = {};

      constructor() {
        contextCount += 1;
      }

      createGain() {
        return {
          gain: {
            value: 1,
            setTargetAtTime: vi.fn(),
            cancelScheduledValues: vi.fn(),
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
          },
          connect() {
            return this;
          },
        };
      }

      createBuffer(_channels: number, length: number) {
        return { getChannelData: () => new Float32Array(length) };
      }

      async resume() {
        resumeCount += 1;
        this.state = "running";
      }

      async close() {
        closeCount += 1;
      }
    }

    vi.stubGlobal("window", { AudioContext: FakeAudioContext });
    const engine = createGameAudioEngine();

    expect(engine.getStatus()).toBe("locked");
    expect(await engine.unlock()).toBe(true);
    expect(await engine.unlock()).toBe(true);
    expect(contextCount).toBe(1);
    expect(resumeCount).toBe(1);
    expect(engine.getStatus()).toBe("ready");

    engine.dispose();
    expect(closeCount).toBe(1);
  });

  it("AudioContextがない環境ではno-opへフォールバックする", async () => {
    vi.stubGlobal("window", {});
    const engine = createGameAudioEngine();

    expect(await engine.unlock()).toBe(false);
    expect(engine.getStatus()).toBe("unsupported");
    expect(() => engine.setBgm("play")).not.toThrow();
  });

  it("track切替でschedulerを増やさず判定音でBGMをduckする", async () => {
    vi.useFakeTimers();
    const gains: ReturnType<typeof createAudioParam>[] = [];

    class FakeAudioContext {
      state = "running";
      currentTime = 1;
      sampleRate = 100;
      destination = {};

      createGain() {
        const gain = createAudioParam();
        gains.push(gain);
        return createConnectable({ gain });
      }

      createOscillator() {
        return createConnectable({
          type: "sine",
          frequency: createAudioParam(),
          start: vi.fn(),
          stop: vi.fn(),
          addEventListener: vi.fn(),
        });
      }

      createBufferSource() {
        return createConnectable({
          buffer: null,
          start: vi.fn(),
          stop: vi.fn(),
          addEventListener: vi.fn(),
        });
      }

      createBiquadFilter() {
        return createConnectable({
          type: "lowpass",
          frequency: createAudioParam(),
          Q: createAudioParam(),
        });
      }

      createBuffer(_channels: number, length: number) {
        return { getChannelData: () => new Float32Array(length) };
      }

      async resume() {}
      async suspend() {}
      async close() {}
    }

    vi.stubGlobal("window", { AudioContext: FakeAudioContext });
    const engine = createGameAudioEngine();
    engine.setBgm("play");
    expect(await engine.unlock()).toBe(true);
    expect(vi.getTimerCount()).toBe(1);

    const bgmGain = gains[1];
    engine.playEffect("success");
    expect(bgmGain.setTargetAtTime).toHaveBeenCalledWith(0.28 * 0.55, 1, 0.018);
    expect(bgmGain.setTargetAtTime).toHaveBeenCalledWith(0.28, 1.24, 0.06);

    engine.setBgm("lobby");
    expect(vi.getTimerCount()).toBe(1);
    engine.stopAll();
    expect(vi.getTimerCount()).toBe(0);
  });
});

function createAudioParam() {
  return {
    value: 1,
    setTargetAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  };
}

function createConnectable<T extends object>(properties: T) {
  return {
    ...properties,
    connect(destination: unknown) {
      return destination;
    },
    disconnect: vi.fn(),
  };
}
