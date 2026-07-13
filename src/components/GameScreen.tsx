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
import { GameStatusHud } from "./GameStatusHud";
import { JudgmentOverlay } from "./JudgmentOverlay";
import { WallPatternCue } from "./WallPatternCue";

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
  wallSpeedLevel: number;
  wallSpeedLabel: string;
  lastSpeedLevelUp: boolean;
  onResetToTitle: () => void;
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
  wallSpeedLevel,
  wallSpeedLabel,
  lastSpeedLevelUp,
  onResetToTitle,
}: GameScreenProps) {
  const screenRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logicalWallProgressRef = useRef(wallProgress);
  const previousLogicalWallProgressRef = useRef(wallProgress);
  const [canvasViewport, setCanvasViewport] =
    useState<CanvasViewport | null>(null);
  const [visualWallProgress, setVisualWallProgress] =
    useState(wallProgress);
  const [visibleJudgment, setVisibleJudgment] =
    useState<JudgmentResult | null>(null);
  const poseStatus = getPoseStatusLabel(poseDetectionStatus);
  const inputModeLabel = poseInputMode === "camera" ? "カメラ" : "モック";

  useEffect(() => {
    if (!lastJudgment) return;
    setVisibleJudgment(lastJudgment);
    const timerId = window.setTimeout(() => setVisibleJudgment(null), 700);
    return () => window.clearTimeout(timerId);
  }, [lastJudgment]);

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
      judgment: visibleJudgment,
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
    visibleJudgment,
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

      <GameStatusHud
        remainingHearts={remainingHearts}
        score={score}
        misses={misses}
        wallSpeedLevel={wallSpeedLevel}
        wallSpeedLabel={wallSpeedLabel}
      />

      <p
        className={`pose-status pose-status-${poseDetectionStatus}`}
        aria-live="polite"
      >
        {inputModeLabel} / {poseStatus}
      </p>

      <JudgmentOverlay
        judgment={visibleJudgment}
        speedLevelUp={lastSpeedLevelUp}
      />
      <WallPatternCue pattern={activeWallPattern} />

      <button
        className="secondary-action game-reset-action"
        type="button"
        aria-label="プレイを終了してタイトルへ戻る"
        onClick={onResetToTitle}
      >
        終了
      </button>
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
