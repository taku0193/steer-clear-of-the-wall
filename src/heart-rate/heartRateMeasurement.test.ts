import { describe, expect, it } from "vitest";
import { parseHeartRateMeasurement } from "./heartRateMeasurement";

const view = (bytes: readonly number[]) =>
  new DataView(Uint8Array.from(bytes).buffer);

describe("parseHeartRateMeasurement", () => {
  it("8bit心拍数を解析する", () => {
    expect(parseHeartRateMeasurement(view([0x00, 128]))).toBe(128);
  });

  it("16bit心拍数をlittle-endianで解析する", () => {
    expect(parseHeartRateMeasurement(view([0x01, 0x04, 0x01]))).toBe(260);
  });

  it.each([
    ["空データ", view([])],
    ["短い8bitデータ", view([0x00])],
    ["短い16bitデータ", view([0x01, 100])],
    ["DataView以外", new Uint8Array([0, 70])],
    ["0 BPM", view([0x00, 0])],
    ["301 BPM", view([0x01, 0x2d, 0x01])],
  ])("%sを拒否する", (_label, value) => {
    expect(() => parseHeartRateMeasurement(value)).toThrow();
  });
});
