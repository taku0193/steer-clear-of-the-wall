import { createHeartRateChartModel, formatHeartRateDuration } from "../heart-rate/heartRateChart";
import type { HeartRateSessionResult } from "../heart-rate/heartRateTypes";

export function HeartRateChart({ result }: { result: HeartRateSessionResult }) {
  const model = createHeartRateChartModel(result);
  if (!model) return null;

  return (
    <svg
      className="heart-rate-chart"
      viewBox={`0 0 ${model.width} ${model.height}`}
      role="img"
      aria-label="プレイ中の心拍数推移グラフ"
    >
      <line className="heart-rate-chart-axis" x1="44" y1="14" x2="44" y2="190" />
      <line className="heart-rate-chart-axis" x1="44" y1="190" x2="628" y2="190" />
      <text x="8" y="20">{model.yMaximum}</text>
      <text x="8" y="190">{model.yMinimum}</text>
      <text x="44" y="214">0:00</text>
      <text x="628" y="214" textAnchor="end">
        {formatHeartRateDuration(model.durationMs)}
      </text>
      {model.segments.map((segment, index) =>
        segment.length === 1 ? (
          <circle
            key={`segment-${index}`}
            className="heart-rate-chart-point"
            cx={segment[0].x}
            cy={segment[0].y}
            r="4"
          />
        ) : (
          <polyline
            key={`segment-${index}`}
            className="heart-rate-chart-line"
            points={segment.map((point) => `${point.x},${point.y}`).join(" ")}
          />
        ),
      )}
    </svg>
  );
}
