import type { ReactNode } from "react";
import type {
  HeartRateConnectionStatus,
  HeartRateFreshness,
} from "../heart-rate/heartRateTypes";

type GameStatusHudProps = {
  remainingHearts: number;
  score: number;
  misses: number;
  wallSpeedLevel: number;
  wallSpeedLabel: string;
  heartRateBpm: number | null;
  heartRateFreshness: HeartRateFreshness;
  heartRateConnectionStatus: HeartRateConnectionStatus;
};

export function GameStatusHud({
  remainingHearts,
  score,
  misses,
  wallSpeedLevel,
  wallSpeedLabel,
  heartRateBpm,
  heartRateFreshness,
  heartRateConnectionStatus,
}: GameStatusHudProps) {
  return (
    <header className="game-hud" aria-label="プレイ状況">
      <HudItem label="ハート" className="hud-item-hearts">
        <strong
          className="heart-readout"
          aria-label={`残りハート${remainingHearts}個`}
        >
          {getHeartDisplay(remainingHearts)}
        </strong>
      </HudItem>
      <HudItem label="スコア">
        <strong>{score}</strong>
      </HudItem>
      <HudItem label="ミス">
        <strong>{misses}</strong>
      </HudItem>
      <HudItem label="速度">
        <strong
          className="speed-readout"
          aria-label={`速度レベル${wallSpeedLevel}、${wallSpeedLabel}`}
        >
          Lv.{wallSpeedLevel}
        </strong>
      </HudItem>
      <HudItem label="心拍" className="hud-item-heart-rate">
        <strong
          className="heart-rate-readout"
          aria-label={getHeartRateLabel(
            heartRateBpm,
            heartRateFreshness,
            heartRateConnectionStatus,
          )}
        >
          <span aria-hidden="true">♥</span> {heartRateBpm ?? "--"}
          <small>BPM</small>
        </strong>
        <span className="heart-rate-hud-status">
          {getHeartRateStatus(heartRateFreshness, heartRateConnectionStatus)}
        </span>
      </HudItem>
    </header>
  );
}

function getHeartRateStatus(
  freshness: HeartRateFreshness,
  connectionStatus: HeartRateConnectionStatus,
): string {
  if (freshness === "live") return "LIVE";
  if (connectionStatus === "disconnected" || freshness === "stale") return "切断";
  if (connectionStatus === "unsupported") return "非対応";
  return "受信待ち";
}

function getHeartRateLabel(
  bpm: number | null,
  freshness: HeartRateFreshness,
  connectionStatus: HeartRateConnectionStatus,
): string {
  return bpm === null
    ? `心拍数、${getHeartRateStatus(freshness, connectionStatus)}`
    : `心拍数、${bpm} BPM、ライブ`;
}

function HudItem({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`hud-item ${className}`}>
      <span>{label}</span>
      {children}
    </div>
  );
}

function getHeartDisplay(remainingHearts: number): string {
  const heartCount = Math.min(Math.max(Math.trunc(remainingHearts), 0), 5);
  return "♥".repeat(heartCount) + "♡".repeat(5 - heartCount);
}
