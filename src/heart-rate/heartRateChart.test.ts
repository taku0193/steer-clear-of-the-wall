import { describe, expect, it } from "vitest";
import { createHeartRateChartModel, formatHeartRateDuration } from "./heartRateChart";

describe("heartRateChart", () => {
  it("segmentをまたぐ線を作らない", () => {
    const model = createHeartRateChartModel({
      durationMs: 10_000,
      statistics: { minimumBpm: 80, averageBpm: 90, maximumBpm: 100 },
      samples: [
        { bpm: 80, elapsedMs: 0, segmentId: 0 },
        { bpm: 90, elapsedMs: 1_000, segmentId: 0 },
        { bpm: 100, elapsedMs: 8_000, segmentId: 1 },
      ],
    });
    expect(model?.segments.map((segment) => segment.length)).toEqual([2, 1]);
  });

  it("0件はmodelを作らず、時間を表示形式へ変換する", () => {
    expect(createHeartRateChartModel({ samples: [], durationMs: 0, statistics: null })).toBeNull();
    expect(formatHeartRateDuration(65_000)).toBe("1:05");
  });
});
