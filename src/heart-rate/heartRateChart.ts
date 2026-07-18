import { splitHeartRateSegments } from "./heartRateSession";
import type { HeartRateSessionResult } from "./heartRateTypes";

export type HeartRateChartPoint = {
  x: number;
  y: number;
  bpm: number;
  elapsedMs: number;
};

export type HeartRateChartModel = {
  width: number;
  height: number;
  segments: readonly (readonly HeartRateChartPoint[])[];
  yMinimum: number;
  yMaximum: number;
  durationMs: number;
};

const WIDTH = 640;
const HEIGHT = 220;
const LEFT = 44;
const RIGHT = 12;
const TOP = 14;
const BOTTOM = 30;

export function createHeartRateChartModel(
  result: HeartRateSessionResult,
): HeartRateChartModel | null {
  if (result.samples.length === 0) return null;

  const bpms = result.samples.map((sample) => sample.bpm);
  const rawMinimum = Math.min(...bpms);
  const rawMaximum = Math.max(...bpms);
  let yMinimum = Math.max(1, Math.floor((rawMinimum - 10) / 10) * 10);
  let yMaximum = Math.min(300, Math.ceil((rawMaximum + 10) / 10) * 10);
  if (yMinimum === yMaximum) {
    yMinimum = Math.max(1, yMinimum - 10);
    yMaximum = Math.min(300, yMaximum + 10);
  }
  const durationMs = Math.max(1, result.durationMs);
  const chartWidth = WIDTH - LEFT - RIGHT;
  const chartHeight = HEIGHT - TOP - BOTTOM;

  const segments = splitHeartRateSegments(result.samples).map((segment) =>
    segment.map((sample) => ({
      x: LEFT + (sample.elapsedMs / durationMs) * chartWidth,
      y:
        TOP +
        ((yMaximum - sample.bpm) / (yMaximum - yMinimum)) * chartHeight,
      bpm: sample.bpm,
      elapsedMs: sample.elapsedMs,
    })),
  );

  return { width: WIDTH, height: HEIGHT, segments, yMinimum, yMaximum, durationMs };
}

export function formatHeartRateDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
