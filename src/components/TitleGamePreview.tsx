import { useEffect, useRef } from "react";
import { DEFAULT_MOCK_POSE } from "../game/mockPose";
import type { AvatarStyle, WallPattern } from "../game/types";
import { WALL_PATTERNS } from "../game/wallPatterns";
import { renderGameCanvas } from "../rendering/canvasRenderer";
import { calculateCanvasViewport } from "../rendering/canvasViewport";
import { calculateGameViewport } from "../rendering/gameViewport";
import { createWallPreviewAvatarPose } from "../rendering/wallPreviewPose";

type TitleGamePreviewProps = {
  avatarStyle?: AvatarStyle;
  cyclePatterns?: boolean;
  staticProgress?: number;
  wallPattern?: WallPattern;
};

export function TitleGamePreview({
  avatarStyle = "neutral",
  cyclePatterns = false,
  staticProgress,
  wallPattern,
}: TitleGamePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId = 0;
    let viewport = calculateCanvasViewport(
      canvas.clientWidth,
      canvas.clientHeight,
      window.devicePixelRatio,
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const startedAt = performance.now();
    const patternSequence = cyclePatterns
      ? createShuffledPatterns(WALL_PATTERNS)
      : [wallPattern ?? WALL_PATTERNS[6] ?? WALL_PATTERNS[0]];

    const draw = (timestamp: number) => {
      if (!viewport) return;
      const elapsedMs = timestamp - startedAt;
      const elapsed = elapsedMs / 5200;
      const cycleProgress = elapsed % 1;
      const progress = staticProgress ?? (
        reducedMotion
          ? 0.72
          : cycleProgress < 0.78
            ? 0.06 + (cycleProgress / 0.78) * 0.94
            : 1
      );
      const poseProgress = reducedMotion
        ? 1
        : staticProgress === undefined
          ? Math.min(Math.max((cycleProgress - 0.18) / 0.44, 0), 1)
          : Math.min(elapsedMs / 1600, 1);
      const passProgress =
        staticProgress === undefined && cycleProgress > 0.78
          ? Math.min((cycleProgress - 0.78) / 0.14, 1)
          : 0;
      const successPulse =
        staticProgress === undefined && cycleProgress > 0.68 && cycleProgress < 0.9
          ? 1 - Math.abs(cycleProgress - 0.79) / 0.11
          : 0;

      const activePattern =
        patternSequence[Math.floor(elapsed) % patternSequence.length] ??
        WALL_PATTERNS[0];
      const gameViewport = calculateGameViewport(
        viewport.cssWidth,
        viewport.cssHeight,
      );
      if (!gameViewport) return;

      renderGameCanvas(canvas, {
        viewport,
        avatarStyle,
        mockPose: DEFAULT_MOCK_POSE,
        poseFrame: null,
        poseInputMode: "mock",
        playerArea: DEFAULT_MOCK_POSE.bodyArea,
        wallPattern: activePattern,
        wallProgress: progress,
        previewPose: createWallPreviewAvatarPose(
          activePattern,
          gameViewport.gameWidth,
          gameViewport.gameHeight,
          poseProgress,
        ),
        showPlayerArea: false,
        previewMotion: { passProgress, successPulse },
      });

      if (
        !reducedMotion &&
        (staticProgress === undefined || poseProgress < 1)
      ) {
        animationFrameId = window.requestAnimationFrame(draw);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      viewport = calculateCanvasViewport(
        canvas.clientWidth,
        canvas.clientHeight,
        window.devicePixelRatio,
      );
      draw(performance.now());
    });
    resizeObserver.observe(canvas);
    draw(performance.now());

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [avatarStyle, cyclePatterns, staticProgress, wallPattern]);

  return (
    <canvas
      ref={canvasRef}
      className="title-game-preview"
      aria-hidden="true"
    />
  );
}

function createShuffledPatterns(
  patterns: readonly WallPattern[],
): readonly WallPattern[] {
  const shuffled = [...patterns];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[targetIndex]] = [
      shuffled[targetIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}
