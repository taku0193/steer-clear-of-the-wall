import { useEffect, useRef } from "react";
import type {
  JudgmentResult,
  MockPose,
  PoseDetectionStatus,
  PoseInputMode,
  SafeArea,
  WallPattern,
} from "../game/types";
import type { PoseFrame } from "../pose/poseTypes";
import { renderGameCanvas } from "../rendering/canvasRenderer";

type GameScreenProps = {
  remainingSeconds: number;
  score: number;
  misses: number;
  lastJudgment: JudgmentResult | null;
  mockPose: MockPose;
  poseFrame: PoseFrame | null;
  poseInputMode: PoseInputMode;
  poseDetectionStatus: PoseDetectionStatus;
  playerArea: SafeArea | null;
  activeWallPattern: WallPattern;
  wallProgress: number;
};

export function GameScreen({
  remainingSeconds,
  score,
  misses,
  lastJudgment,
  mockPose,
  poseFrame,
  poseInputMode,
  poseDetectionStatus,
  playerArea,
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
      poseFrame,
      poseInputMode,
      playerArea,
      wallPattern: activeWallPattern,
      wallProgress,
    });
  }, [
    activeWallPattern,
    mockPose,
    playerArea,
    poseFrame,
    poseInputMode,
    wallProgress,
  ]);

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
          aria-label="プレイヤー姿勢と壁パターンのゲーム描画"
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
          <dt>姿勢入力</dt>
          <dd>{poseInputMode === "camera" ? "カメラ" : "モック"}</dd>
          <dt>検出状態</dt>
          <dd>{getPoseStatusLabel(poseDetectionStatus)}</dd>
          <dt>判定領域</dt>
          <dd>
            {playerArea
              ? `x: ${playerArea.x.toFixed(2)}, y: ${playerArea.y.toFixed(2)}, w: ${playerArea.width.toFixed(2)}, h: ${playerArea.height.toFixed(2)}`
              : "未検出"}
          </dd>
        </dl>
      </div>
    </section>
  );
}

function getPoseStatusLabel(status: PoseDetectionStatus): string {
  switch (status) {
    case "mock":
      return "モック姿勢を使用中";
    case "initializing":
      return "姿勢検出を初期化中";
    case "detecting":
      return "姿勢を検出中";
    case "detected":
      return "姿勢を検出しました";
    case "notDetected":
      return "全身を検出できません";
  }
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
