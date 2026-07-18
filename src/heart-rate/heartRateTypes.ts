export const MIN_HEART_RATE_BPM = 1;
export const MAX_HEART_RATE_BPM = 300;
export const HEART_RATE_FRESH_MS = 5_000;

export type HeartRateConnectionStatus =
  | "unsupported"
  | "idle"
  | "requesting"
  | "connected"
  | "disconnected"
  | "error";

export type HeartRateErrorCode =
  | "unsupported"
  | "insecureContext"
  | "deviceNotSelected"
  | "connectionFailed"
  | "serviceUnavailable"
  | "notificationFailed";

export type HeartRateError = {
  code: HeartRateErrorCode;
  message: string;
};

export type HeartRateReading = {
  bpm: number;
  receivedAtMs: number;
};

export type HeartRateSample = {
  bpm: number;
  elapsedMs: number;
  segmentId: number;
};

export type HeartRateStatistics = {
  minimumBpm: number;
  averageBpm: number;
  maximumBpm: number;
};

export type HeartRateSessionResult = {
  samples: readonly HeartRateSample[];
  durationMs: number;
  statistics: HeartRateStatistics | null;
};

export type HeartRateFreshness = "waiting" | "live" | "stale";

export type HeartRateAdapterEvent =
  | { type: "status"; status: HeartRateConnectionStatus }
  | { type: "reading"; reading: HeartRateReading }
  | { type: "error"; error: HeartRateError };

export type HeartRateAdapterListener = (event: HeartRateAdapterEvent) => void;

export interface HeartRateAdapter {
  isSupported(): boolean;
  connect(): Promise<void>;
  disconnect(options?: { forgetDevice?: boolean }): Promise<void>;
  subscribe(listener: HeartRateAdapterListener): () => void;
}
