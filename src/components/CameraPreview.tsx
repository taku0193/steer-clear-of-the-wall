import { useEffect, useRef } from "react";
import { attachCameraStream, detachCameraStream } from "../camera/camera";

type CameraPreviewProps = {
  stream: MediaStream;
  onVideoElementChange?: (videoElement: HTMLVideoElement | null) => void;
  visuallyHidden?: boolean;
};

export function CameraPreview({
  stream,
  onVideoElementChange,
  visuallyHidden = false,
}: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    attachCameraStream(videoElement, stream);
    onVideoElementChange?.(videoElement);

    return () => {
      onVideoElementChange?.(null);
      detachCameraStream(videoElement);
    };
  }, [onVideoElementChange, stream]);

  return (
    <video
      ref={videoRef}
      className={visuallyHidden ? "camera-video-source" : "camera-preview"}
      autoPlay
      muted
      playsInline
      aria-hidden={visuallyHidden || undefined}
      aria-label={visuallyHidden ? undefined : "カメラ映像のプレビュー"}
    />
  );
}
