import type { PoseFrame, PoseLandmarkName } from "../pose/poseTypes";

export type CalibrationStatus =
  | "initializing"
  | "notDetected"
  | "needsAdjustment"
  | "ready";

export type CalibrationGuidance =
  | "standInFrame"
  | "moveLeft"
  | "moveRight"
  | "stepBack"
  | "stepForward"
  | "holdStill"
  | "ready";

export type CalibrationCheckId =
  | "fullBody"
  | "centered"
  | "distance"
  | "stability";

export type CalibrationCheckStatus = "pass" | "warn" | "fail";

export type CalibrationCheck = {
  id: CalibrationCheckId;
  status: CalibrationCheckStatus;
  label: string;
  message: string;
};

export type CalibrationResult = {
  status: CalibrationStatus;
  canStart: boolean;
  guidance: CalibrationGuidance;
  summary: string;
  checks: readonly CalibrationCheck[];
};

export type CalibrationInput = {
  poseFrame: PoseFrame | null;
  detectorReady: boolean;
};

export type CalibrationBodyArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CalibrationThresholds = {
  minVisibility: number;
  centerMinX: number;
  centerMaxX: number;
  minBodyHeight: number;
  maxBodyHeight: number;
  minBodyWidth: number;
  maxBodyWidth: number;
  lowAverageVisibility: number;
};

export const CALIBRATION_THRESHOLDS: CalibrationThresholds = {
  minVisibility: 0.5,
  centerMinX: 0.32,
  centerMaxX: 0.68,
  minBodyHeight: 0.34,
  maxBodyHeight: 0.72,
  minBodyWidth: 0.08,
  maxBodyWidth: 0.58,
  lowAverageVisibility: 0.68,
};

export const CALIBRATION_REQUIRED_LANDMARKS: readonly PoseLandmarkName[] = [
  "leftShoulder",
  "rightShoulder",
  "leftHip",
  "rightHip",
  "leftAnkle",
  "rightAnkle",
];

type BodyAreaResult =
  | {
      ok: true;
      bodyArea: CalibrationBodyArea;
      averageVisibility: number;
    }
  | {
      ok: false;
      missingLandmarks: readonly PoseLandmarkName[];
    };

export function evaluateCalibration({
  poseFrame,
  detectorReady,
}: CalibrationInput): CalibrationResult {
  if (!detectorReady) {
    return createCalibrationResult({
      status: "initializing",
      guidance: "holdStill",
      summary: "姿勢検出を初期化しています",
      checks: [
        createCheck("fullBody", "warn", "モデルの準備中です"),
        createCheck("centered", "warn", "カメラの前で待機してください"),
        createCheck("distance", "warn", "全身が映る位置で待機してください"),
        createCheck("stability", "warn", "初期化が終わるまで動かずに待ってください"),
      ],
    });
  }

  const bodyAreaResult = createCalibrationBodyArea(poseFrame);

  if (!bodyAreaResult.ok) {
    return createCalibrationResult({
      status: "notDetected",
      guidance: "standInFrame",
      summary: "全身が映る位置へ移動してください",
      checks: [
        createCheck("fullBody", "fail", "肩、腰、足首が映るようにしてください"),
        createCheck("centered", "warn", "画面中央に立ってください"),
        createCheck("distance", "warn", "頭から足元まで入る距離に調整してください"),
        createCheck("stability", "fail", "姿勢を検出できていません"),
      ],
    });
  }

  const { bodyArea, averageVisibility } = bodyAreaResult;
  const centerX = bodyArea.x + bodyArea.width / 2;
  const fullBodyCheck = createCheck("fullBody", "pass", "主要部位を検出しています");
  const stabilityCheck =
    averageVisibility < CALIBRATION_THRESHOLDS.lowAverageVisibility
      ? createCheck("stability", "warn", "検出が少し不安定です")
      : createCheck("stability", "pass", "安定して検出しています");

  if (
    bodyArea.height > CALIBRATION_THRESHOLDS.maxBodyHeight ||
    bodyArea.width > CALIBRATION_THRESHOLDS.maxBodyWidth
  ) {
    return createCalibrationResult({
      status: "needsAdjustment",
      guidance: "stepBack",
      summary: "少し後ろへ下がってください",
      checks: [
        fullBodyCheck,
        createCenterCheck(centerX),
        createCheck("distance", "fail", "カメラに近すぎます"),
        stabilityCheck,
      ],
    });
  }

  if (
    bodyArea.height < CALIBRATION_THRESHOLDS.minBodyHeight ||
    bodyArea.width < CALIBRATION_THRESHOLDS.minBodyWidth
  ) {
    return createCalibrationResult({
      status: "needsAdjustment",
      guidance: "stepForward",
      summary: "少しカメラへ近づいてください",
      checks: [
        fullBodyCheck,
        createCenterCheck(centerX),
        createCheck("distance", "fail", "カメラから遠すぎます"),
        stabilityCheck,
      ],
    });
  }

  if (centerX < CALIBRATION_THRESHOLDS.centerMinX) {
    return createCalibrationResult({
      status: "needsAdjustment",
      guidance: "moveRight",
      summary: "画面中央へ移動してください",
      checks: [
        fullBodyCheck,
        createCheck("centered", "fail", "中央より左に寄っています"),
        createCheck("distance", "pass", "距離は良好です"),
        stabilityCheck,
      ],
    });
  }

  if (centerX > CALIBRATION_THRESHOLDS.centerMaxX) {
    return createCalibrationResult({
      status: "needsAdjustment",
      guidance: "moveLeft",
      summary: "画面中央へ移動してください",
      checks: [
        fullBodyCheck,
        createCheck("centered", "fail", "中央より右に寄っています"),
        createCheck("distance", "pass", "距離は良好です"),
        stabilityCheck,
      ],
    });
  }

  if (averageVisibility < CALIBRATION_THRESHOLDS.lowAverageVisibility) {
    return createCalibrationResult({
      status: "needsAdjustment",
      guidance: "holdStill",
      summary: "その位置で少し静止してください",
      checks: [
        fullBodyCheck,
        createCheck("centered", "pass", "中央に立てています"),
        createCheck("distance", "pass", "距離は良好です"),
        stabilityCheck,
      ],
    });
  }

  return createCalibrationResult({
    status: "ready",
    guidance: "ready",
    summary: "位置合わせOKです",
    checks: [
      fullBodyCheck,
      createCheck("centered", "pass", "中央に立てています"),
      createCheck("distance", "pass", "距離は良好です"),
      stabilityCheck,
    ],
  });
}

export function createCalibrationBodyArea(
  poseFrame: PoseFrame | null,
): BodyAreaResult {
  if (!poseFrame?.detected) {
    return {
      ok: false,
      missingLandmarks: CALIBRATION_REQUIRED_LANDMARKS,
    };
  }

  const missingLandmarks = CALIBRATION_REQUIRED_LANDMARKS.filter((name) => {
    const landmark = poseFrame.landmarks[name];

    return (
      !landmark || landmark.visibility < CALIBRATION_THRESHOLDS.minVisibility
    );
  });

  if (missingLandmarks.length > 0) {
    return {
      ok: false,
      missingLandmarks,
    };
  }

  const visiblePoints = Object.values(poseFrame.landmarks).filter(
    (point) =>
      point &&
      point.visibility >= CALIBRATION_THRESHOLDS.minVisibility &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.y),
  );

  if (visiblePoints.length === 0) {
    return {
      ok: false,
      missingLandmarks: CALIBRATION_REQUIRED_LANDMARKS,
    };
  }

  const xValues = visiblePoints.map((point) => point.x);
  const yValues = visiblePoints.map((point) => point.y);
  const left = Math.min(...xValues);
  const right = Math.max(...xValues);
  const top = Math.min(...yValues);
  const bottom = Math.max(...yValues);
  const visibilityTotal = visiblePoints.reduce(
    (total, point) => total + point.visibility,
    0,
  );

  return {
    ok: true,
    bodyArea: {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    },
    averageVisibility: visibilityTotal / visiblePoints.length,
  };
}

function createCenterCheck(centerX: number): CalibrationCheck {
  if (centerX < CALIBRATION_THRESHOLDS.centerMinX) {
    return createCheck("centered", "fail", "中央より左に寄っています");
  }

  if (centerX > CALIBRATION_THRESHOLDS.centerMaxX) {
    return createCheck("centered", "fail", "中央より右に寄っています");
  }

  return createCheck("centered", "pass", "中央に立てています");
}

function createCalibrationResult({
  status,
  guidance,
  summary,
  checks,
}: {
  status: CalibrationStatus;
  guidance: CalibrationGuidance;
  summary: string;
  checks: readonly CalibrationCheck[];
}): CalibrationResult {
  return {
    status,
    canStart: status === "ready",
    guidance,
    summary,
    checks,
  };
}

function createCheck(
  id: CalibrationCheckId,
  status: CalibrationCheckStatus,
  message: string,
): CalibrationCheck {
  return {
    id,
    status,
    label: getCheckLabel(id),
    message,
  };
}

function getCheckLabel(id: CalibrationCheckId): string {
  switch (id) {
    case "fullBody":
      return "全身";
    case "centered":
      return "中央";
    case "distance":
      return "距離";
    case "stability":
      return "安定";
  }
}
