"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchRankingSnapshot } from "./rankingClient";
import type { RankingSnapshot } from "./rankingTypes";

export function useRanking(enabled = true) {
  const [snapshot, setSnapshot] = useState<RankingSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const snapshotRef = useRef<RankingSnapshot | null>(null);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setIsRefreshing(Boolean(snapshotRef.current));
    if (!snapshotRef.current) setIsLoading(true);
    try {
      const nextSnapshot = await fetchRankingSnapshot(controller.signal);
      snapshotRef.current = nextSnapshot;
      setSnapshot(nextSnapshot);
    } catch (caught) {
      if (controller.signal.aborted) return;
      setError(caught instanceof Error ? caught.message : "ランキングを取得できませんでした");
    } finally {
      if (abortRef.current === controller) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    return () => {
      abortRef.current?.abort();
    };
  }, [enabled, refresh]);

  return { snapshot, error, isLoading, isRefreshing, refresh };
}
