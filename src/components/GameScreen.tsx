import { useEffect, useRef, useState } from "react";
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
import {
  calculateCanvasViewport,
  type CanvasViewport,
} from "../rendering/canvasViewport";

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
  const screenRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasViewport, setCanvasViewport] =
    useState<CanvasViewport | null>(null);
  const judgmentFeedback = getJudgmentFeedback(lastJudgment);
  const poseStatus = getPoseStatusLabel(poseDetectionStatus);
  const inputModeLabel = poseInputMode === "camera" ? "カメラ" : "モック";

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
      mockPose,
      poseFrame,
      poseInputMode,
      playerArea,
      wallPattern: activeWallPattern,
      wallProgress,
    });
  }, [
    activeWallPattern,
    canvasViewport,
    mockPose,
    playerArea,
    poseFrame,
    poseInputMode,
    wallProgress,
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
