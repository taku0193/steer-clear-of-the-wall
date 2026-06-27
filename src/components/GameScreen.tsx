import { useEffect, useRef } from "react";
import type { JudgmentResult, MockPose, WallPattern } from "../game/types";
import { renderGameCanvas } from "../rendering/canvasRenderer";

type GameScreenProps = {
  remainingSeconds: number;
  score: number;
  misses: number;
  lastJudgment: JudgmentResult | null;
  mockPose: MockPose;
  activeWallPattern: WallPattern;
  wallProgress: number;
};

export function GameScreen({
  remainingSeconds,
  score,
  misses,
  lastJudgment,
  mockPose,
  activeWallPattern,
  wallProgress,
}: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wallProgressPercent = Math.round(wallProgress * 100);
  const judgmentFeedback = getJudgmentFeedback(lastJudgment);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    renderGameCanvas(canvasRef.current, {
      mockPose,
      wallPattern: activeWallPattern,
      wallProgress,
    });
  }, [activeWallPattern, mockPose, wallProgress]);

  return (
    <section className="game-screen" aria-labelledby="playing-title">
      <header className="game-hud" aria-label="プレイ状況">
        <div className="hud-item">
          <span>残り時間</span>
          <strong>{remainingSeconds}</strong>
          <small>秒</small>
        </div>
        <div className="hud-item">
          <span>スコア</span>
          <strong>{score}</strong>
        </div>
        <div className="hud-item">
          <span>ミス</span>
          <strong>{misses}</strong>
        </div>
      </header>

      <div className="playfield-placeholder">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          width="720"
          height="420"
          aria-label="モック姿勢と壁パターンの簡易描画"
        />
        <p className="eyebrow">Playing</p>
        <h1 id="playing-title">プレイ中</h1>
        <p className="summary">
          壁が通過したとき、プレイヤー領域が安全領域内に収まっているか判定します。
        </p>
        <p
          className={`judgment-feedback judgment-feedback-${judgmentFeedback.status}`}
          aria-live="polite"
        >
          直前の判定: {judgmentFeedback.label}
        </p>
        <dl className="summary">
          <dt>現在の壁</dt>
          <dd>{activeWallPattern.name}</dd>
          <dt>壁の進行</dt>
          <dd>{wallProgressPercent}%</dd>
          <dt>モック姿勢</dt>
          <dd>
            {mockPose.name} / x: {mockPose.bodyArea.x}, y: {mockPose.bodyArea.y}, w:{" "}
            {mockPose.bodyArea.width}, h: {mockPose.bodyArea.height}
          </dd>
        </dl>
      </div>
    </section>
  );
}

type JudgmentFeedback = {
  label: string;
  status: "pending" | "success" | "miss" | "not-detected";
};

function getJudgmentFeedback(judgment: JudgmentResult | null): JudgmentFeedback {
  if (!judgment) {
    return {
      label: "判定待ち",
      status: "pending",
    };
  }

  if (judgment.type === "success") {
    return {
      label: "成功",
      status: "success",
    };
  }

  if (judgment.type === "miss") {
    return {
      label: "失敗（安全領域からはみ出しています）",
      status: "miss",
    };
  }

  return {
    label: "判定不能（姿勢を検出できません）",
    status: "not-detected",
  };
}
