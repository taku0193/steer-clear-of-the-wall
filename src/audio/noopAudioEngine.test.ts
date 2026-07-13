import { describe, expect, it } from "vitest";
import { DEFAULT_AUDIO_PREFERENCES } from "./audioPreferences";
import { createNoopAudioEngine } from "./noopAudioEngine";

describe("noopAudioEngine", () => {
  it("すべての操作を安全に無視する", async () => {
    const engine = createNoopAudioEngine();
    expect(await engine.unlock()).toBe(false);
    expect(() => {
      engine.setPreferences(DEFAULT_AUDIO_PREFERENCES);
      engine.setBgm("play");
      engine.playEffect("success");
      engine.stopEffects();
      engine.suspend();
      engine.resume();
      engine.stopAll();
      engine.dispose();
    }).not.toThrow();
    expect(engine.getStatus()).toBe("unsupported");
  });
});
