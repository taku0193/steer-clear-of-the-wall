"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  postRankingSubmission,
  RankingClientError,
} from "../../ranking/rankingClient";
import type { RankingEntry } from "../../ranking/rankingTypes";

export type RankingSubmissionStatus =
  | "idle"
  | "submitting"
  | "success"
  | "error";

type ResultSubmissionStatusProps = {
  displayName: string;
  submissionId: string;
  score: number;
  successfulWalls: number;
  speedLevel: number;
  misses: number;
  onStatusChange: (status: RankingSubmissionStatus) => void;
  onRegistered: (entry: RankingEntry) => void;
  onOpenRanking: () => void;
};

export function ResultSubmissionStatus({
  displayName,
  submissionId,
  score,
  successfulWalls,
  speedLevel,
  misses,
  onStatusChange,
  onRegistered,
  onOpenRanking,
}: ResultSubmissionStatusProps) {
  const [status, setStatus] = useState<RankingSubmissionStatus>("idle");
  const [registeredRank, setRegisteredRank] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const startedSubmissionIdRef = useRef<string | null>(null);

  const submitResult = useCallback(async () => {
    setStatus("submitting");
    setMessage(null);
    onStatusChange("submitting");

    try {
      const result = await postRankingSubmission({
        submissionId,
        displayName,
        score,
        successfulWalls,
        speedLevel,
        misses,
      });
      setRegisteredRank(result.rank);
      setStatus("success");
      onRegistered(result.entry);
      onStatusChange("success");
    } catch (caught) {
      if (
        caught instanceof RankingClientError &&
        caught.code === "duplicateSubmission"
      ) {
        setStatus("success");
        setMessage("このゲーム結果は登録済みです。");
        onStatusChange("success");
        return;
      }

      setStatus("error");
      setMessage(
        caught instanceof Error
          ? caught.message
          : "ランキングへ登録できませんでした",
      );
      onStatusChange("error");
    }
  }, [
    displayName,
    misses,
    onRegistered,
    onStatusChange,
    score,
    speedLevel,
    submissionId,
    successfulWalls,
  ]);

  useEffect(() => {
    if (startedSubmissionIdRef.current === submissionId) {
      return;
    }
    startedSubmissionIdRef.current = submissionId;
    void submitResult();
  }, [submissionId, submitResult]);

  return (
    <section className="result-submission" aria-labelledby="ranking-submit-title">
      <div className="result-submission-heading">
        <div>
          <p className="eyebrow">Ranking Entry</p>
          <h2 id="ranking-submit-title">ランキング登録</h2>
        </div>
        {registeredRank !== null && (
          <p className="registered-rank"><strong>{registeredRank}</strong>位</p>
        )}
      </div>

      <p className="ranking-entry-name">
        ニックネーム <strong>{displayName}</strong>
      </p>

      {status === "idle" || status === "submitting" ? (
        <div className="ranking-submitting" role="status" aria-live="polite">
          <span className="ranking-submitting-indicator" aria-hidden="true" />
          ランキングへ登録しています
        </div>
      ) : status === "success" ? (
        <div className="ranking-registered" role="status">
          <strong>
            {registeredRank !== null
              ? `現在 ${registeredRank}位です`
              : "登録済みです"}
          </strong>
          {message && <span>{message}</span>}
        </div>
      ) : (
        <div className="ranking-submission-error" role="alert">
          <p>{message ?? "ランキングへ登録できませんでした"}</p>
          <button className="primary-action" type="button" onClick={() => void submitResult()}>
            登録を再試行
          </button>
        </div>
      )}

      <button className="secondary-action" type="button" onClick={onOpenRanking}>
        ランキングを見る
      </button>
    </section>
  );
}
