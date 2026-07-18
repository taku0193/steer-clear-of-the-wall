import { calculatePerformanceRank } from "../game/performanceRank";
import { AnimatedScore } from "./AnimatedScore";
import { AutoReturnCountdown } from "./AutoReturnCountdown";
import type { RankingEntry } from "../ranking/rankingTypes";
import {
  ResultSubmissionStatus,
  type RankingSubmissionStatus,
} from "./ranking/ResultSubmissionStatus";
import type { HeartRateSessionResult } from "../heart-rate/heartRateTypes";
import { HeartRateResultPanel } from "./HeartRateResultPanel";

type ResultScreenProps = {
  finalScore: number;
  misses: number;
  successfulWalls: number;
  wallSpeedLevel: number;
  wallSpeedLabel: string;
  autoReturnSeconds: number | null;
  displayName: string;
  submissionId: string;
  heartRateResult: HeartRateSessionResult | null;
  onSubmissionStatusChange: (status: RankingSubmissionStatus) => void;
  onRankingRegistered: (entry: RankingEntry) => void;
  onOpenRanking: () => void;
  onRestart: () => void;
  onBackToTitle: () => void;
};

export function ResultScreen({
  finalScore,
  misses,
  successfulWalls,
  wallSpeedLevel,
  wallSpeedLabel,
  autoReturnSeconds,
  displayName,
  submissionId,
  heartRateResult,
  onSubmissionStatusChange,
  onRankingRegistered,
  onOpenRanking,
  onRestart,
  onBackToTitle,
}: ResultScreenProps) {
  const performanceRank = calculatePerformanceRank({
    successfulWalls,
    wallSpeedLevel,
    misses,
  });

  return (
    <section className="screen-panel result-screen" aria-labelledby="result-title">
      <p className="eyebrow">Result</p>
      <h1 id="result-title">結果</h1>
      <div className="result-summary" aria-label="今回の結果">
        <p className="result-score-hero">
          <span>最終スコア</span>
          <strong><AnimatedScore value={finalScore} /></strong>
        </p>
        <p className="performance-rank" aria-label={`今回の評価${performanceRank}`}>
          <span>今回の評価</span>
          <strong>{performanceRank}</strong>
        </p>
        <div className="result-stats">
          <p className="score-readout">
            <span>クリア枚数</span>
            <strong>{successfulWalls}</strong>
          </p>
          <p className="score-readout">
            <span>最高速度</span>
            <strong aria-label={`最高速度レベル${wallSpeedLevel}、${wallSpeedLabel}`}>
              Lv.{wallSpeedLevel}
            </strong>
          </p>
          <p className="score-readout">
            <span>ミス数</span>
            <strong>{misses}</strong>
          </p>
        </div>
      </div>
      <HeartRateResultPanel result={heartRateResult} />
      <ResultSubmissionStatus
        displayName={displayName}
        submissionId={submissionId}
        score={finalScore}
        successfulWalls={successfulWalls}
        speedLevel={wallSpeedLevel}
        misses={misses}
        onStatusChange={onSubmissionStatusChange}
        onRegistered={onRankingRegistered}
        onOpenRanking={onOpenRanking}
      />
      <div className="screen-actions result-actions">
        <button className="primary-action" type="button" onClick={onRestart}>
          もう一度プレイ
        </button>
        <button className="secondary-action" type="button" onClick={onBackToTitle}>
          タイトルへ戻る
        </button>
      </div>
      {autoReturnSeconds !== null && (
        <AutoReturnCountdown seconds={autoReturnSeconds} />
      )}
    </section>
  );
}
