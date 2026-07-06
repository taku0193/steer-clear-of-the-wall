import type { GameError } from "../game/types";

export type PoseLandmarkName =
  | "nose"
  | "leftShoulder"
  | "rightShoulder"
  | "leftElbow"
  | "rightElbow"
  | "leftWrist"
  | "rightWrist"
  | "leftHip"
  | "rightHip"
  | "leftKnee"
  | "rightKnee"
  | "leftAnkle"
  | "rightAnkle";

export type NormalizedPoint = {
  x: number;
  y: number;
  visibility: number;
};

export type PoseFrame = {
  detected: boolean;
  timestampMs: number;
  landmarks: Partial<Record<PoseLandmarkName, NormalizedPoint>>;
};

export type PoseDetectionResult =
  | {
      ok: true;
      frame: PoseFrame;
    }
  | {
      ok: false;
      error: GameError;
    };

export type PoseDetectorAdapter = {
  detect(videoElement: HTMLVideoElement, timestampMs: number): PoseDetectionResult;
  dispose(): void;
};

export type PoseDetectorInitializationResult =
  | {
      ok: true;
      detector: PoseDetectorAdapter;
    }
  | {
      ok: false;
      error: GameError;
    };
