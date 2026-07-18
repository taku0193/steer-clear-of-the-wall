import { describe, expect, it } from "vitest";
import { appendHeartRateReading, createHeartRateSession, finishHeartRateSession, markHeartRateGap, splitHeartRateSegments, startHeartRateSession } from "./heartRateSession";

describe("heartRateSession", () => {
  it("記録期間内のreadingだけを保持して統計を作る", () => {
    const idle = createHeartRateSession();
    expect(appendHeartRateReading(idle, { bpm: 70, receivedAtMs: 900 })).toBe(idle);

    let session = startHeartRateSession(1_000);
    session = appendHeartRateReading(session, { bpm: 80, receivedAtMs: 1_000 });
    session = appendHeartRateReading(session, { bpm: 100, receivedAtMs: 2_000 });
    session = appendHeartRateReading(session, { bpm: 90, receivedAtMs: 3_000 });
    session = finishHeartRateSession(session, 4_000);

    expect(session.result).toEqual({
      samples: [
        { bpm: 80, elapsedMs: 0, segmentId: 0 },
        { bpm: 100, elapsedMs: 1_000, segmentId: 0 },
        { bpm: 90, elapsedMs: 2_000, segmentId: 0 },
      ],
      durationMs: 3_000,
      statistics: { minimumBpm: 80, averageBpm: 90, maximumBpm: 100 },
    });
    expect(appendHeartRateReading(session, { bpm: 120, receivedAtMs: 4_000 })).toBe(session);
  });

  it("同時刻は最後の値へ置換し、逆順は無視する", () => {
    let session = startHeartRateSession(1_000);
    session = appendHeartRateReading(session, { bpm: 80, receivedAtMs: 2_000 });
    session = appendHeartRateReading(session, { bpm: 82, receivedAtMs: 2_000 });
    const unchanged = appendHeartRateReading(session, { bpm: 60, receivedAtMs: 1_500 });
    expect(unchanged.samples).toEqual([{ bpm: 82, elapsedMs: 1_000, segmentId: 0 }]);
  });

  it("切断と5秒超の欠落でsegmentを分ける", () => {
    let session = startHeartRateSession(0);
    session = appendHeartRateReading(session, { bpm: 80, receivedAtMs: 0 });
    session = markHeartRateGap(session);
    session = appendHeartRateReading(session, { bpm: 90, receivedAtMs: 1_000 });
    session = appendHeartRateReading(session, { bpm: 100, receivedAtMs: 7_000 });
    expect(splitHeartRateSegments(session.samples).map((segment) => segment.length)).toEqual([1, 1, 1]);
  });

  it("0件と1件を安全に確定する", () => {
    const empty = finishHeartRateSession(startHeartRateSession(0), 500);
    expect(empty.result?.statistics).toBeNull();

    const single = finishHeartRateSession(
      appendHeartRateReading(startHeartRateSession(0), { bpm: 77, receivedAtMs: 10 }),
      20,
    );
    expect(single.result?.statistics).toEqual({ minimumBpm: 77, averageBpm: 77, maximumBpm: 77 });
  });
});
