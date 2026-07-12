import { AutoReturnCountdown } from "./AutoReturnCountdown";

type ResultScreenProps = {
  finalScore: number;
  misses: number;
  successfulWalls: number;
  wallSpeedLevel: number;
  wallSpeedLabel: string;
  autoReturnSeconds: number | null;
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
  onRestart,
  onBackToTitle,
}: ResultScreenProps) {
  return (
    <section className="screen-panel result-screen" aria-labelledby="result-title">
      <p className="eyebrow">Result</p>
      <h1 id="result-title">結果</h1>
      <p className="summary">ハートがなくなりました。今回のプレイ結果です。</p>
      <div className="result-stats" aria-label="今回の結果">
        <p className="score-readout">
          <span>最終スコア</span>
          <strong>{finalScore}</strong>
        </p>
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
