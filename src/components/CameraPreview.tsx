import { useEffect, useRef } from "react";
import { attachCameraStream, detachCameraStream } from "../camera/camera";

type CameraPreviewProps = {
  stream: MediaStream;
};

export function CameraPreview({ stream }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (!videoElement) {
      return;
    }

    attachCameraStream(videoElement, stream);

    return () => detachCameraStream(videoElement);
  }, [stream]);

  return (
    <video
      ref={videoRef}
      className="camera-preview"
      autoPlay
      muted
      playsInline
      aria-label="カメラ映像のプレビュー"
    />
  );
}
