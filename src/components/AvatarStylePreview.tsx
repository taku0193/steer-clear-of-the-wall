import { useEffect, useRef } from "react";
import type { AvatarStyle } from "../game/types";
import { renderAvatarPreviewCanvas } from "../rendering/canvasRenderer";
import { calculateCanvasViewport } from "../rendering/canvasViewport";

export function AvatarStylePreview({ style }: { style: AvatarStyle }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const viewport = calculateCanvasViewport(
        canvas.clientWidth,
        canvas.clientHeight,
        window.devicePixelRatio,
      );
      if (viewport) renderAvatarPreviewCanvas(canvas, viewport, style);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  }, [style]);

  return <canvas ref={canvasRef} className="avatar-style-preview" aria-hidden="true" />;
}
