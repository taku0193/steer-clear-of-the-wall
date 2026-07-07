import { useEffect, useRef, useState } from "react";
import type {
  AvatarStyle,
  JudgmentResult,
  MockPose,
  PoseDetectionStatus,
  PoseInputMode,
  SafeArea,
  WallPattern,
} from "../game/types";
import type { PoseFrame } from "../pose/poseTypes";
import { renderGameCanvas } from "../rendering/canvasRenderer";
import {
  calculateCanvasViewport,
  type CanvasViewport,
} from "../rendering/canvasViewport";
import { advanceVisualWallProgress } from "../rendering/wallMotion";

type GameScreenProps = {
  remainingHearts: number;
  score: number;
  misses: number;
  avatarStyle: AvatarStyle;
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
  remainingHearts,
  score,
  misses,
  avatarStyle,
  lastJudgment,
  mockPose,
  poseFrame,
  poseInputMode,
  poseDetectionStatus,
  playerArea,
  activeWallPattern,
  wallProgress,
}: GameScreenProps) {
  const screenRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logicalWallProgressRef = useRef(wallProgress);
  const previousLogicalWallProgressRef = useRef(wallProgress);
  const [canvasViewport, setCanvasViewport] =
    useState<CanvasViewport | null>(null);
  const [visualWallProgress, setVisualWallProgress] =
    useState(wallProgress);
  const judgmentFeedback = getJudgmentFeedback(lastJudgment);
  const poseStatus = getPoseStatusLabel(poseDetectionStatus);
  const inputModeLabel = poseInputMode === "camera" ? "カメラ" : "モック";
  const heartDisplay = getHeartDisplay(remainingHearts);

  useEffect(() => {
    logicalWallProgressRef.current = wallProgress;
  }, [wallProgress]);

  useEffect(() => {
    let animationFrameId = 0;
    let previousFrameTime: number | null = null;

    const animateWall = (timestampMs: number) => {
      const elapsedMs =
        previousFrameTime === null ? 0 : timestampMs - previousFrameTime;
      const logicalProgress = logicalWallProgressRef.current;
      const previousLogicalProgress =
        previousLogicalWallProgressRef.current;

      setVisualWallProgress((currentVisualProgress) =>
        advanceVisualWallProgress({
          currentVisualProgress,
          previousLogicalProgress,
          logicalProgress,
          elapsedMs,
        }),
      );
      previousLogicalWallProgressRef.current = logicalProgress;
      previousFrameTime = timestampMs;
      animationFrameId = window.requestAnimationFrame(animateWall);
    };

    animationFrameId = window.requestAnimationFrame(animateWall);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    const screenElement = screenRef.current;

    if (!screenElement) {
      return;
    }

    const updateViewport = (width: number, height: number) => {
      const nextViewport = calculateCanvasViewport(
        width,
        height,
        window.devicePixelRatio,
      );

      if (!nextViewport) {
        return;
      }

      setCanvasViewport((currentViewport) =>
        isSameViewport(currentViewport, nextViewport)
          ? currentViewport
          : nextViewport,
      );
    };

    const measureScreen = () => {
      const bounds = screenElement.getBoundingClientRect();
      updateViewport(bounds.width, bounds.height);
    };

    measureScreen();
    window.addEventListener("resize", measureScreen);

    if (typeof ResizeObserver === "undefined") {
      return () => window.removeEventListener("resize", measureScreen);
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry) {
        updateViewport(entry.contentRect.width, entry.contentRect.height);
      }
    });
    resizeObserver.observe(screenElement);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureScreen);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !canvasViewport) {
      return;
    }

    renderGameCanvas(canvasRef.current, {
      viewport: canvasViewport,
      avatarStyle,
      mockPose,
      poseFrame,
      poseInputMode,
      playerArea,
      wallPattern: activeWallPattern,
      wallProgress: visualWallProgress,
    });
  }, [
    activeWallPattern,
    avatarStyle,
    canvasViewport,
    mockPose,
    playerArea,
    poseFrame,
    poseInputMode,
    visualWallProgress,
  ]);

  return (
    <section
      ref={screenRef}
      className="game-screen"
      aria-labelledby="playing-title"
    >
      <h1 id="playing-title" className="visually-hidden">
        プレイ中
      </h1>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        aria-label="プレイヤー姿勢と壁パターンのゲーム描画"
      />

      <header className="game-hud" aria-label="プレイ状況">
        <div className="hud-item">
          <span>ハート</span>
          <strong
            className="heart-readout"
            aria-label={`残りハート${remainingHearts}個`}
          >
            {heartDisplay}
          </strong>
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

      <p
        className={`pose-status pose-status-${poseDetectionStatus}`}
        aria-live="polite"
      >
        {inputModeLabel} / {poseStatus}
      </p>

      <p
        className={`judgment-feedback judgment-feedback-${judgmentFeedback.status}`}
        aria-live="polite"
      >
        <span className="visually-hidden">直前の判定: </span>
        {judgmentFeedback.label}
      </p>
    </section>
  );
}

function isSameViewport(
  currentViewport: CanvasViewport | null,
  nextViewport: CanvasViewport,
): boolean {
  return (
    currentViewport?.cssWidth === nextViewport.cssWidth &&
    currentViewport.cssHeight === nextViewport.cssHeight &&
    currentViewport.pixelRatio === nextViewport.pixelRatio &&
    currentViewport.bitmapWidth === nextViewport.bitmapWidth &&
    currentViewport.bitmapHeight === nextViewport.bitmapHeight
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

function getHeartDisplay(remainingHearts: number): string {
  const heartCount = Math.min(Math.max(Math.trunc(remainingHearts), 0), 5);

  return "♥".repeat(heartCount) + "♡".repeat(5 - heartCount);
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
