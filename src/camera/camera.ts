import type { GameError } from "../game/types";

export type CameraResult =
  | {
      ok: true;
      stream: MediaStream;
    }
  | {
      ok: false;
      error: GameError;
    };

export async function startCamera(): Promise<CameraResult> {
  if (typeof window === "undefined" || !window.isSecureContext) {
    return {
      ok: false,
      error: { type: "insecureContext" },
    };
  }

  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices ||
    typeof navigator.mediaDevices.getUserMedia !== "function"
  ) {
    return {
      ok: false,
      error: { type: "cameraUnavailable" },
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: "user" },
      },
    });

    return {
      ok: true,
      stream,
    };
  } catch (error: unknown) {
    return {
      ok: false,
      error: classifyCameraError(error),
    };
  }
}

export function stopCamera(stream: MediaStream): void {
  for (const track of stream.getTracks()) {
    if (track.readyState === "ended") {
      continue;
    }

    try {
      track.stop();
    } catch {
      // 他のtrackを確実に停止するため、個別の停止失敗は継続する。
    }
  }
}

export function attachCameraStream(
  videoElement: HTMLVideoElement,
  stream: MediaStream,
): void {
  videoElement.srcObject = stream;
}

export function detachCameraStream(videoElement: HTMLVideoElement): void {
  videoElement.pause();

  if (videoElement.srcObject) {
    videoElement.srcObject = null;
  }
}

function classifyCameraError(error: unknown): GameError {
  if (!(error instanceof DOMException)) {
    return { type: "cameraUnavailable" };
  }

  switch (error.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return { type: "cameraPermissionDenied" };
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return { type: "cameraNotFound" };
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return { type: "cameraNotReadable" };
    default:
      return { type: "cameraUnavailable" };
  }
}
