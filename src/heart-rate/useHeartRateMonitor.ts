"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  appendHeartRateReading,
  createHeartRateSession,
  finishHeartRateSession,
  markHeartRateGap,
  startHeartRateSession,
  type HeartRateSession,
} from "./heartRateSession";
import {
  HEART_RATE_FRESH_MS,
  type HeartRateAdapter,
  type HeartRateConnectionStatus,
  type HeartRateFreshness,
  type HeartRateReading,
  type HeartRateSessionResult,
} from "./heartRateTypes";
import { createWebBluetoothHeartRateAdapter } from "./webBluetoothHeartRate";

type UseHeartRateMonitorOptions = {
  adapter?: HeartRateAdapter;
  now?: () => number;
};

export type HeartRateMonitor = {
  connectionStatus: HeartRateConnectionStatus;
  freshness: HeartRateFreshness;
  currentBpm: number | null;
  errorMessage: string | null;
  result: HeartRateSessionResult | null;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  startSession(): void;
  finishSession(): void;
  resetSession(): void;
  disposeForTitle(): Promise<void>;
};

export function useHeartRateMonitor(
  options: UseHeartRateMonitorOptions = {},
): HeartRateMonitor {
  const nowRef = useRef(options.now ?? (() => performance.now()));
  const adapterRef = useRef<HeartRateAdapter | null>(null);
  if (!adapterRef.current) {
    adapterRef.current = options.adapter ?? createWebBluetoothHeartRateAdapter();
  }
  const adapter = adapterRef.current;
  const [connectionStatus, setConnectionStatus] =
    useState<HeartRateConnectionStatus>("idle");
  const [lastReading, setLastReading] = useState<HeartRateReading | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<HeartRateSessionResult | null>(null);
  const [freshnessTick, setFreshnessTick] = useState(0);
  const sessionRef = useRef<HeartRateSession>(createHeartRateSession());

  useEffect(() => {
    if (!adapter.isSupported()) setConnectionStatus("unsupported");

    const unsubscribe = adapter.subscribe((event) => {
      if (event.type === "status") {
        setConnectionStatus(event.status);
        if (event.status === "disconnected" || event.status === "error") {
          sessionRef.current = markHeartRateGap(sessionRef.current);
        }
        return;
      }
      if (event.type === "error") {
        setErrorMessage(event.error.message);
        return;
      }

      setLastReading(event.reading);
      setErrorMessage(null);
      sessionRef.current = appendHeartRateReading(
        sessionRef.current,
        event.reading,
      );
    });

    return () => {
      unsubscribe();
      void adapter.disconnect({ forgetDevice: true });
    };
  }, [adapter]);

  useEffect(() => {
    if (!lastReading) return;
    const timerId = window.setInterval(
      () => setFreshnessTick((value) => value + 1),
      1_000,
    );
    return () => window.clearInterval(timerId);
  }, [lastReading]);

  const freshness = useMemo<HeartRateFreshness>(() => {
    void freshnessTick;
    if (!lastReading) return "waiting";
    return connectionStatus === "connected" &&
      nowRef.current() - lastReading.receivedAtMs <= HEART_RATE_FRESH_MS
      ? "live"
      : "stale";
  }, [connectionStatus, freshnessTick, lastReading]);

  const connect = useCallback(async () => {
    setErrorMessage(null);
    await adapter.connect();
  }, [adapter]);

  const disconnect = useCallback(async () => {
    await adapter.disconnect();
    setLastReading(null);
  }, [adapter]);

  const resetSession = useCallback(() => {
    sessionRef.current = createHeartRateSession();
    setResult(null);
  }, []);

  const startSession = useCallback(() => {
    sessionRef.current = startHeartRateSession(nowRef.current());
    setResult(null);
  }, []);

  const finishSession = useCallback(() => {
    sessionRef.current = finishHeartRateSession(
      sessionRef.current,
      nowRef.current(),
    );
    setResult(sessionRef.current.result);
  }, []);

  const disposeForTitle = useCallback(async () => {
    await adapter.disconnect({ forgetDevice: true });
    sessionRef.current = createHeartRateSession();
    setResult(null);
    setLastReading(null);
    setErrorMessage(null);
    setConnectionStatus(adapter.isSupported() ? "idle" : "unsupported");
  }, [adapter]);

  return {
    connectionStatus,
    freshness,
    currentBpm: freshness === "live" ? lastReading?.bpm ?? null : null,
    errorMessage,
    result,
    connect,
    disconnect,
    startSession,
    finishSession,
    resetSession,
    disposeForTitle,
  };
}
