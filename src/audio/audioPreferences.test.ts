import { describe, expect, it } from "vitest";
import {
  DEFAULT_AUDIO_PREFERENCES,
  parseAudioPreferences,
  serializeAudioPreferences,
} from "./audioPreferences";

describe("audioPreferences", () => {
  it("保存値を復元し音量を範囲内へ制限する", () => {
    expect(parseAudioPreferences('{"muted":true,"bgmVolume":2,"sfxVolume":-1}')).toEqual({
      muted: true,
      bgmVolume: 1,
      sfxVolume: 0,
    });
  });

  it("壊れた保存値では初期値へ戻る", () => {
    expect(parseAudioPreferences("{" )).toEqual(DEFAULT_AUDIO_PREFERENCES);
    expect(parseAudioPreferences('{"muted":"no"}')).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });

  it("設定をJSONへ保存できる", () => {
    expect(JSON.parse(serializeAudioPreferences(DEFAULT_AUDIO_PREFERENCES))).toEqual(
      DEFAULT_AUDIO_PREFERENCES,
    );
  });
});
