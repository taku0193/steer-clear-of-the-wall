import { HEART_RATE_FRESH_MS, type HeartRateReading, type HeartRateSample, type HeartRateSessionResult, type HeartRateStatistics } from "./heartRateTypes";

export type HeartRateSession = {
  status: "idle" | "recording" | "finished";
  startedAtMs: number | null;
  samples: readonly HeartRateSample[];
  currentSegmentId: number;
  gapPending: boolean;
  lastReceivedAtMs: number | null;
  result: HeartRateSessionResult | null;
};

export function createHeartRateSession(): HeartRateSession {
  return {
    status: "idle",
    startedAtMs: null,
    samples: [],
    currentSegmentId: 0,
    gapPending: false,
    lastReceivedAtMs: null,
    result: null,
  };
}

export function startHeartRateSession(startedAtMs: number): HeartRateSession {
  return {
    ...createHeartRateSession(),
    status: "recording",
    startedAtMs,
  };
}

export function appendHeartRateReading(
  session: HeartRateSession,
  reading: HeartRateReading,
): HeartRateSession {
  if (session.status !== "recording" || session.startedAtMs === null) {
    return session;
  }

  const elapsedMs = Math.max(0, reading.receivedAtMs - session.startedAtMs);
  const previous = session.samples.at(-1);

  if (previous && elapsedMs < previous.elapsedMs) {
    return session;
  }

  const hasTimedGap =
    session.lastReceivedAtMs !== null &&
    reading.receivedAtMs - session.lastReceivedAtMs > HEART_RATE_FRESH_MS;
  const startsNewSegment = Boolean(previous) && (session.gapPending || hasTimedGap);
  const segmentId = startsNewSegment
    ? session.currentSegmentId + 1
    : session.currentSegmentId;
  const sample: HeartRateSample = { bpm: reading.bpm, elapsedMs, segmentId };
  const samples =
    previous?.elapsedMs === elapsedMs
      ? [...session.samples.slice(0, -1), sample]
      : [...session.samples, sample];

  return {
    ...session,
    samples,
    currentSegmentId: segmentId,
    gapPending: false,
    lastReceivedAtMs: reading.receivedAtMs,
  };
}

export function markHeartRateGap(session: HeartRateSession): HeartRateSession {
  return session.status === "recording"
    ? { ...session, gapPending: true }
    : session;
}

export function finishHeartRateSession(
  session: HeartRateSession,
  finishedAtMs: number,
): HeartRateSession {
  if (session.status !== "recording" || session.startedAtMs === null) {
    return session;
  }

  const samples = session.samples.map((sample) => ({ ...sample }));
  const result: HeartRateSessionResult = {
    samples,
    durationMs: Math.max(0, finishedAtMs - session.startedAtMs),
    statistics: calculateHeartRateStatistics(samples),
  };

  return { ...session, status: "finished", samples, result };
}

export function calculateHeartRateStatistics(
  samples: readonly HeartRateSample[],
): HeartRateStatistics | null {
  if (samples.length === 0) return null;

  const values = samples.map((sample) => sample.bpm);
  return {
    minimumBpm: Math.min(...values),
    averageBpm: Math.round(
      values.reduce((total, value) => total + value, 0) / values.length,
    ),
    maximumBpm: Math.max(...values),
  };
}

export function splitHeartRateSegments(
  samples: readonly HeartRateSample[],
): readonly (readonly HeartRateSample[])[] {
  const segments: HeartRateSample[][] = [];

  for (const sample of samples) {
    const current = segments.at(-1);
    const previous = current?.at(-1);
    if (
      !current ||
      !previous ||
      sample.segmentId !== previous.segmentId ||
      sample.elapsedMs - previous.elapsedMs > HEART_RATE_FRESH_MS
    ) {
      segments.push([sample]);
    } else {
      current.push(sample);
    }
  }

  return segments;
}
