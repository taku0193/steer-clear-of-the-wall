import { formatHeartRateDuration } from "../heart-rate/heartRateChart";
import type { HeartRateSessionResult } from "../heart-rate/heartRateTypes";
import { HeartRateChart } from "./HeartRateChart";

export function HeartRateResultPanel({
  result,
}: {
  result: HeartRateSessionResult | null;
}) {
  if (!result || result.samples.length === 0 || !result.statistics) {
    return (
      <section className="heart-rate-result" aria-labelledby="heart-rate-result-title">
        <h2 id="heart-rate-result-title">プレイ中の心拍数</h2>
        <p className="heart-rate-empty">今回は心拍データを記録できませんでした。</p>
        <p className="heart-rate-medical-note">心拍表示はフィットネス・ゲーム演出用で、医療用途ではありません。</p>
      </section>
    );
  }

  const { statistics } = result;
  const hasGaps = new Set(result.samples.map((sample) => sample.segmentId)).size > 1;

  return (
    <section className="heart-rate-result" aria-labelledby="heart-rate-result-title">
      <div className="heart-rate-result-heading">
        <h2 id="heart-rate-result-title">プレイ中の心拍数</h2>
        <span>{formatHeartRateDuration(result.durationMs)}</span>
      </div>
      <div className="heart-rate-statistics" aria-label="心拍数の集計">
        <HeartRateStatistic label="最小" value={statistics.minimumBpm} />
        <HeartRateStatistic label="平均" value={statistics.averageBpm} />
        <HeartRateStatistic label="最大" value={statistics.maximumBpm} />
      </div>
      <HeartRateChart result={result} />
      {hasGaps && <p className="heart-rate-gap-note">接続が途切れた区間は線を分けて表示しています。</p>}
      <p className="heart-rate-medical-note">心拍表示はフィットネス・ゲーム演出用で、医療用途ではありません。</p>
    </section>
  );
}

function HeartRateStatistic({ label, value }: { label: string; value: number }) {
  return (
    <p>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>BPM</small>
    </p>
  );
}
