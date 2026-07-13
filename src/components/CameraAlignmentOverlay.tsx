import { useEffect, useState } from "react";
import type { AutoStartState } from "../game/autoStart";
import type { CalibrationResult } from "../game/calibration";

type CameraAlignmentOverlayProps = {
  result: CalibrationResult;
  autoStartState: AutoStartState;
};

export function CameraAlignmentOverlay({
  result,
  autoStartState,
}: CameraAlignmentOverlayProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (autoStartState.status !== "waiting") {
      setProgress(0);
      return;
    }
    const startedAt = performance.now();
    let frameId = 0;
    const update = (now: number) => {
      const next = Math.min((now - startedAt) / autoStartState.delayMs, 1);
      setProgress(next);
      if (next < 1) frameId = requestAnimationFrame(update);
    };
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [autoStartState]);

  return (
    <div className={`camera-alignment-overlay camera-alignment-${result.status}`} aria-hidden="true">
      <div className="camera-center-line" />
      <div className="camera-person-guide">
        <span className="camera-guide-head" />
        <span className="camera-guide-body" />
        <span className="camera-guide-ground" />
      </div>
      <p className="camera-distance-state">{getDistanceLabel(result)}</p>
      {autoStartState.status === "waiting" && (
        <div className="camera-ready-progress" style={{ "--ready-progress": progress } as React.CSSProperties} />
      )}
    </div>
  );
}

function getDistanceLabel(result: CalibrationResult): string {
  if (result.status === "notDetected" || result.status === "initializing") return "全身をガイド内へ";
  if (result.guidance === "stepBack") return "近すぎます";
  if (result.guidance === "stepForward") return "遠すぎます";
  if (result.checks.find((check) => check.id === "distance")?.status === "pass") return "距離 OK";
  return "距離を調整";
}
