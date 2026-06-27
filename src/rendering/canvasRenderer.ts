import type {
  MockPose,
  PoseInputMode,
  SafeArea,
  WallPattern,
} from "../game/types";
import type {
  NormalizedPoint,
  PoseFrame,
  PoseLandmarkName,
} from "../pose/poseTypes";

type CanvasRenderInput = {
  mockPose: MockPose;
  poseFrame: PoseFrame | null;
  poseInputMode: PoseInputMode;
  playerArea: SafeArea | null;
  wallPattern: WallPattern;
  wallProgress: number;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const POSE_CONNECTIONS: readonly [
  PoseLandmarkName,
  PoseLandmarkName,
][] = [
  ["nose", "leftShoulder"],
  ["nose", "rightShoulder"],
  ["leftShoulder", "rightShoulder"],
  ["leftShoulder", "leftElbow"],
  ["leftElbow", "leftWrist"],
  ["rightShoulder", "rightElbow"],
  ["rightElbow", "rightWrist"],
  ["leftShoulder", "leftHip"],
  ["rightShoulder", "rightHip"],
  ["leftHip", "rightHip"],
  ["leftHip", "leftKnee"],
  ["leftKnee", "leftAnkle"],
  ["rightHip", "rightKnee"],
  ["rightKnee", "rightAnkle"],
];
const MIN_DRAW_VISIBILITY = 0.4;

export function renderGameCanvas(canvas: HTMLCanvasElement, input: CanvasRenderInput) {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const width = canvas.width;
  const height = canvas.height;
  const wallRect = getWallRect(width, height, input.wallProgress);
  const safeRect = getNestedRect(wallRect, input.wallPattern.safeArea);

  context.clearRect(0, 0, width, height);
  drawBackground(context, width, height);
  drawDepthGuide(context, width, height, input.wallProgress);
  drawWall(context, wallRect, safeRect);

  if (input.poseInputMode === "camera") {
    if (input.poseFrame?.detected) {
      drawDetectedPose(context, width, height, input.poseFrame);

      if (input.playerArea) {
        drawPlayerArea(
          context,
          getCanvasRect(width, height, input.playerArea),
        );
      }
    } else {
      drawPoseNotDetected(context, width, height);
    }

    return;
  }

  drawMockPose(
    context,
    getCanvasRect(width, height, input.mockPose.bodyArea),
  );
}

function getCanvasRect(canvasWidth: number, canvasHeight: number, area: SafeArea): Rect {
  return {
    x: area.x * canvasWidth,
    y: area.y * canvasHeight,
    width: area.width * canvasWidth,
    height: area.height * canvasHeight,
  };
}

function getNestedRect(parent: Rect, area: SafeArea): Rect {
  return {
    x: parent.x + area.x * parent.width,
    y: parent.y + area.y * parent.height,
    width: area.width * parent.width,
    height: area.height * parent.height,
  };
}

function getWallRect(canvasWidth: number, canvasHeight: number, wallProgress: number): Rect {
  const progress = Math.max(0, Math.min(wallProgress, 1));
  const scale = 0.42 + progress * 0.58;
  const width = canvasWidth * scale;
  const height = canvasHeight * scale;

  return {
    x: (canvasWidth - width) / 2,
    y: (canvasHeight - height) / 2,
    width,
    height,
  };
}

function drawBackground(context: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#111827");
  gradient.addColorStop(1, "#172321");

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.strokeStyle = "rgba(247, 247, 242, 0.1)";
  context.lineWidth = 1;
  context.strokeRect(0.5, 0.5, width - 1, height - 1);
}

function drawDepthGuide(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  wallProgress: number,
) {
  const progress = Math.max(0, Math.min(wallProgress, 1));
  const inset = 22 + progress * 30;

  context.strokeStyle = "rgba(52, 211, 153, 0.18)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(inset, inset);
  context.lineTo(width / 2, height / 2);
  context.lineTo(width - inset, inset);
  context.moveTo(inset, height - inset);
  context.lineTo(width / 2, height / 2);
  context.lineTo(width - inset, height - inset);
  context.stroke();
}

function drawWall(context: CanvasRenderingContext2D, wallRect: Rect, safeRect: Rect) {
  context.fillStyle = "rgba(248, 113, 113, 0.72)";
  context.fillRect(wallRect.x, wallRect.y, wallRect.width, safeRect.y - wallRect.y);
  context.fillRect(
    wallRect.x,
    safeRect.y + safeRect.height,
    wallRect.width,
    wallRect.y + wallRect.height - (safeRect.y + safeRect.height),
  );
  context.fillRect(wallRect.x, safeRect.y, safeRect.x - wallRect.x, safeRect.height);
  context.fillRect(
    safeRect.x + safeRect.width,
    safeRect.y,
    wallRect.x + wallRect.width - (safeRect.x + safeRect.width),
    safeRect.height,
  );

  context.strokeStyle = "rgba(255, 255, 255, 0.58)";
  context.lineWidth = 3;
  context.strokeRect(wallRect.x, wallRect.y, wallRect.width, wallRect.height);

  context.fillStyle = "rgba(52, 211, 153, 0.26)";
  context.fillRect(safeRect.x, safeRect.y, safeRect.width, safeRect.height);
  context.strokeStyle = "#34d399";
  context.lineWidth = 4;
  context.strokeRect(safeRect.x, safeRect.y, safeRect.width, safeRect.height);
}

function drawMockPose(context: CanvasRenderingContext2D, poseRect: Rect) {
  context.fillStyle = "rgba(96, 165, 250, 0.28)";
  context.fillRect(poseRect.x, poseRect.y, poseRect.width, poseRect.height);

  context.strokeStyle = "#93c5fd";
  context.lineWidth = 4;
  context.strokeRect(poseRect.x, poseRect.y, poseRect.width, poseRect.height);

  const headRadius = Math.max(10, poseRect.width * 0.24);
  context.beginPath();
  context.arc(poseRect.x + poseRect.width / 2, poseRect.y - headRadius * 0.8, headRadius, 0, Math.PI * 2);
  context.fillStyle = "rgba(147, 197, 253, 0.78)";
  context.fill();
}

function drawDetectedPose(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  poseFrame: PoseFrame,
) {
  context.strokeStyle = "#93c5fd";
  context.lineWidth = 6;
  context.lineCap = "round";

  for (const [startName, endName] of POSE_CONNECTIONS) {
    const start = getVisiblePoint(poseFrame, startName);
    const end = getVisiblePoint(poseFrame, endName);

    if (!start || !end) {
      continue;
    }

    context.beginPath();
    context.moveTo((1 - start.x) * width, start.y * height);
    context.lineTo((1 - end.x) * width, end.y * height);
    context.stroke();
  }

  context.fillStyle = "#dbeafe";

  for (const point of Object.values(poseFrame.landmarks)) {
    if (!point || point.visibility < MIN_DRAW_VISIBILITY) {
      continue;
    }

    context.beginPath();
    context.arc((1 - point.x) * width, point.y * height, 6, 0, Math.PI * 2);
    context.fill();
  }
}

function drawPlayerArea(context: CanvasRenderingContext2D, playerRect: Rect) {
  context.fillStyle = "rgba(96, 165, 250, 0.12)";
  context.fillRect(
    playerRect.x,
    playerRect.y,
    playerRect.width,
    playerRect.height,
  );
  context.strokeStyle = "rgba(147, 197, 253, 0.72)";
  context.lineWidth = 2;
  context.strokeRect(
    playerRect.x,
    playerRect.y,
    playerRect.width,
    playerRect.height,
  );
}

function drawPoseNotDetected(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.fillStyle = "rgba(247, 247, 242, 0.76)";
  context.font = "700 22px sans-serif";
  context.textAlign = "center";
  context.fillText(
    "全身が映る位置に移動してください",
    width / 2,
    height / 2,
  );
}

function getVisiblePoint(
  poseFrame: PoseFrame,
  name: PoseLandmarkName,
): NormalizedPoint | null {
  const point = poseFrame.landmarks[name];

  if (!point || point.visibility < MIN_DRAW_VISIBILITY) {
    return null;
  }

  return point;
}
