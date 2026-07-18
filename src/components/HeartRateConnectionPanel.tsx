import type {
  HeartRateConnectionStatus,
  HeartRateFreshness,
} from "../heart-rate/heartRateTypes";

type HeartRateConnectionPanelProps = {
  status: HeartRateConnectionStatus;
  freshness: HeartRateFreshness;
  currentBpm: number | null;
  errorMessage: string | null;
  compact?: boolean;
  onConnect: () => Promise<void>;
};

export function HeartRateConnectionPanel({
  status,
  freshness,
  currentBpm,
  errorMessage,
  compact = false,
  onConnect,
}: HeartRateConnectionPanelProps) {
  const isConnecting = status === "requesting";
  const isConnected = status === "connected";
  const canConnect = status !== "unsupported" && !isConnecting && !isConnected;

  return (
    <section
      className={`heart-rate-connection ${compact ? "heart-rate-connection-compact" : ""}`}
      aria-label="Fitbit Air心拍数"
    >
      <div className="heart-rate-connection-heading">
        <span aria-hidden="true">♥</span>
        <strong>Fitbit Air 心拍数</strong>
        <span className={`heart-rate-status heart-rate-status-${status}`}>
          {getConnectionLabel(status, freshness)}
        </span>
      </div>
      <p className="heart-rate-current" aria-label={getHeartRateAriaLabel(currentBpm, freshness)}>
        <strong>{currentBpm ?? "--"}</strong>
        <span>BPM</span>
      </p>
      {!compact && (
        <p className="heart-rate-help">
          Google Healthアプリで「心拍数を共有」を有効にしてから接続してください。
          データは今回の結果表示だけに一時記録します。
        </p>
      )}
      {errorMessage && <p className="heart-rate-error">{errorMessage}</p>}
      {canConnect && (
        <button
          className="secondary-action heart-rate-connect-action"
          type="button"
          onClick={() => void onConnect().catch(() => undefined)}
        >
          {status === "disconnected" || status === "error"
            ? "心拍数を再接続"
            : "Fitbit Airを接続"}
        </button>
      )}
      {status === "unsupported" && !compact && (
        <p className="heart-rate-error">
          Web Bluetooth対応のChrome系ブラウザをlocalhostまたはHTTPSで使用してください。
        </p>
      )}
    </section>
  );
}

function getConnectionLabel(
  status: HeartRateConnectionStatus,
  freshness: HeartRateFreshness,
): string {
  if (status === "connected") {
    return freshness === "live" ? "LIVE" : "受信待ち";
  }
  switch (status) {
    case "unsupported":
      return "非対応";
    case "requesting":
      return "接続中";
    case "disconnected":
      return "切断";
    case "error":
      return "接続エラー";
    case "idle":
      return "未接続";
  }
}

function getHeartRateAriaLabel(
  bpm: number | null,
  freshness: HeartRateFreshness,
): string {
  return bpm === null
    ? `心拍数、${freshness === "stale" ? "切断" : "受信待ち"}`
    : `心拍数、${bpm} BPM、ライブ`;
}
