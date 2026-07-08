import {
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import type { GameError } from "../game/types";
import type {
  NormalizedPoint,
  PoseDetectionResult,
  PoseDetectorAdapter,
  PoseDetectorInitializationResult,
  PoseFrame,
  PoseLandmarkName,
} from "./poseTypes";

const MEDIAPIPE_VERSION = "0.10.35";
const SUPPRESSED_MEDIAPIPE_LOG_PATTERNS = [
  "OpenGL error checking is disabled",
  "Created TensorFlow Lite XNNPACK delegate for CPU",
  "Feedback manager requires a model with a single signature inference",
  "Using NORM_RECT without IMAGE_DIMENSIONS",
] as const;

export const DEFAULT_POSE_WASM_BASE_URL =
  `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
export const DEFAULT_POSE_MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/" +
  "pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

type PoseDetectorOptions = {
  wasmBaseUrl?: string;
  modelAssetPath?: string;
};

const LANDMARK_INDEX_BY_NAME: Readonly<Record<PoseLandmarkName, number>> = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
};

export async function initializePoseDetector(
  options: PoseDetectorOptions = {},
): Promise<PoseDetectorInitializationResult> {
  const restoreMediaPipeConsole = installMediaPipeConsoleFilter();

  try {
    const visionFiles = await FilesetResolver.forVisionTasks(
      options.wasmBaseUrl ?? DEFAULT_POSE_WASM_BASE_URL,
    );
    const landmarker = await PoseLandmarker.createFromOptions(visionFiles, {
      baseOptions: {
        modelAssetPath: options.modelAssetPath ?? DEFAULT_POSE_MODEL_ASSET_PATH,
      },
      runningMode: "VIDEO",
      numPoses: 1,
      outputSegmentationMasks: false,
    });

    return {
      ok: true,
      detector: new MediaPipePoseDetector(landmarker, restoreMediaPipeConsole),
    };
  } catch (error: unknown) {
    restoreMediaPipeConsole();

    return {
      ok: false,
      error: createPoseError("poseInitializationFailed", error),
    };
  }
}

type ConsoleFilterState = {
  references: number;
  originalLog: typeof console.log;
  originalInfo: typeof console.info;
  originalWarn: typeof console.warn;
  originalError: typeof console.error;
};

let activeConsoleFilterState: ConsoleFilterState | null = null;

function installMediaPipeConsoleFilter(): () => void {
  if (typeof console === "undefined") {
    return () => {};
  }

  if (activeConsoleFilterState) {
    activeConsoleFilterState.references += 1;

    return () => releaseMediaPipeConsoleFilter();
  }

  activeConsoleFilterState = {
    references: 1,
    originalLog: console.log,
    originalInfo: console.info,
    originalWarn: console.warn,
    originalError: console.error,
  };

  console.log = createFilteredConsoleMethod(activeConsoleFilterState.originalLog);
  console.info = createFilteredConsoleMethod(activeConsoleFilterState.originalInfo);
  console.warn = createFilteredConsoleMethod(activeConsoleFilterState.originalWarn);
  console.error = createFilteredConsoleMethod(activeConsoleFilterState.originalError);

  return () => releaseMediaPipeConsoleFilter();
}

function releaseMediaPipeConsoleFilter(): void {
  if (!activeConsoleFilterState) {
    return;
  }

  activeConsoleFilterState.references -= 1;

  if (activeConsoleFilterState.references > 0) {
    return;
  }

  console.log = activeConsoleFilterState.originalLog;
  console.info = activeConsoleFilterState.originalInfo;
  console.warn = activeConsoleFilterState.originalWarn;
  console.error = activeConsoleFilterState.originalError;
  activeConsoleFilterState = null;
}

function createFilteredConsoleMethod(
  originalMethod: (...data: unknown[]) => void,
): (...data: unknown[]) => void {
  return (...data: unknown[]) => {
    if (isSuppressedMediaPipeLog(data)) {
      return;
    }

    originalMethod(...data);
  };
}

function isSuppressedMediaPipeLog(data: readonly unknown[]): boolean {
  const message = data.map(toConsoleMessagePart).join(" ");

  return SUPPRESSED_MEDIAPIPE_LOG_PATTERNS.some((pattern) =>
    message.includes(pattern),
  );
}

function toConsoleMessagePart(entry: unknown): string {
  if (typeof entry === "string") {
    return entry;
  }

  if (entry instanceof Error) {
    return entry.message;
  }

  try {
    return String(entry);
  } catch {
    return "";
  }
}

export function detectPose(
  detector: PoseDetectorAdapter,
  videoElement: HTMLVideoElement,
  timestampMs: number,
): PoseDetectionResult {
  return detector.detect(videoElement, timestampMs);
}

export function disposePoseDetector(detector: PoseDetectorAdapter): void {
  detector.dispose();
}

class MediaPipePoseDetector implements PoseDetectorAdapter {
  private landmarker: PoseLandmarker | null;
  private restoreMediaPipeConsole: (() => void) | null;

  constructor(
    landmarker: PoseLandmarker,
    restoreMediaPipeConsole: () => void,
  ) {
    this.landmarker = landmarker;
    this.restoreMediaPipeConsole = restoreMediaPipeConsole;
  }

  detect(
    videoElement: HTMLVideoElement,
    timestampMs: number,
  ): PoseDetectionResult {
    if (!this.landmarker) {
      return {
        ok: false,
        error: {
          type: "poseDetectionFailed",
          message: "姿勢検出アダプターは破棄済みです。",
        },
      };
    }

    try {
      const result = this.landmarker.detectForVideo(videoElement, timestampMs);

      return {
        ok: true,
        frame: toPoseFrame(result.landmarks[0], timestampMs),
      };
    } catch (error: unknown) {
      return {
        ok: false,
        error: createPoseError("poseDetectionFailed", error),
      };
    }
  }

  dispose(): void {
    const landmarker = this.landmarker;
    const restoreMediaPipeConsole = this.restoreMediaPipeConsole;
    this.landmarker = null;
    this.restoreMediaPipeConsole = null;

    if (landmarker) {
      try {
        landmarker.close();
      } catch {
        // 解放処理は再実行可能に保ち、画面遷移を妨げない。
      }
    }

    if (restoreMediaPipeConsole) {
      restoreMediaPipeConsole();
    }
  }
}

function toPoseFrame(
  poseLandmarks: NormalizedLandmark[] | undefined,
  timestampMs: number,
): PoseFrame {
  if (!poseLandmarks || poseLandmarks.length === 0) {
    return {
      detected: false,
      timestampMs,
      landmarks: {},
    };
  }

  const landmarks: Partial<Record<PoseLandmarkName, NormalizedPoint>> = {};
  const entries = Object.entries(LANDMARK_INDEX_BY_NAME) as [
    PoseLandmarkName,
    number,
  ][];

  for (const [name, index] of entries) {
    const landmark = poseLandmarks[index];

    if (!landmark) {
      continue;
    }

    landmarks[name] = {
      x: landmark.x,
      y: landmark.y,
      visibility: landmark.visibility,
    };
  }

  return {
    detected: true,
    timestampMs,
    landmarks,
  };
}

function createPoseError(
  type: "poseInitializationFailed" | "poseDetectionFailed",
  error: unknown,
): GameError {
  return {
    type,
    message: error instanceof Error ? error.message : "原因不明のエラーです。",
  };
}
