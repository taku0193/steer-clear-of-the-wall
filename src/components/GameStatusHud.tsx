import type { ReactNode } from "react";

type GameStatusHudProps = {
  remainingHearts: number;
  score: number;
  misses: number;
  wallSpeedLevel: number;
  wallSpeedLabel: string;
};

export function GameStatusHud({
  remainingHearts,
  score,
  misses,
  wallSpeedLevel,
  wallSpeedLabel,
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
    </header>
  );
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
