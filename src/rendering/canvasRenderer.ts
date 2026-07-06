import type {
  AvatarStyle,
  MockPose,
  PoseInputMode,
  SafeArea,
  WallPattern,
} from "../game/types";
import type {
  PoseFrame,
} from "../pose/poseTypes";
import {
  createMockAvatarPose,
  getPointDistance,
  getPointMidpoint,
  projectPoseLandmarks,
  type AvatarPose,
  type CanvasPoint,
} from "./avatarGeometry";
import type { CanvasViewport } from "./canvasViewport";

type CanvasRenderInput = {
  viewport: CanvasViewport;
  avatarStyle: AvatarStyle;
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

type AvatarPalette = {
  jacketStart: string;
  jacketMiddle: string;
  jacketEnd: string;
  leftSleeve: string;
  rightSleeve: string;
  leftLeg: string;
  rightLeg: string;
  hairStart: string;
  hairEnd: string;
  backDetail: string;
};

export function renderGameCanvas(canvas: HTMLCanvasElement, input: CanvasRenderInput) {
  const { viewport } = input;

  if (canvas.width !== viewport.bitmapWidth) {
    canvas.width = viewport.bitmapWidth;
  }

  if (canvas.height !== viewport.bitmapHeight) {
    canvas.height = viewport.bitmapHeight;
  }

  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  const width = viewport.cssWidth;
  const height = viewport.cssHeight;
  const wallRect = getWallRect(width, height, input.wallProgress);
  const safeRect = getNestedRect(wallRect, input.wallPattern.safeArea);

  context.setTransform(
    viewport.pixelRatio,
    0,
    0,
    viewport.pixelRatio,
    0,
    0,
  );
  context.clearRect(0, 0, width, height);
  drawBackground(context, width, height);
  drawDepthGuide(context, width, height, input.wallProgress);
  drawWall(context, wallRect, safeRect);

  if (input.poseInputMode === "camera") {
    if (input.poseFrame?.detected) {
      if (input.playerArea) {
        drawPlayerArea(
          context,
          getCanvasRect(width, height, input.playerArea),
        );
      }

      drawAvatar(
        context,
        projectPoseLandmarks(input.poseFrame, width, height),
        width,
        height,
        input.avatarStyle,
      );
    } else {
      drawPoseNotDetected(context, width, height);
    }

    return;
  }

  const mockPoseRect = getCanvasRect(
    width,
    height,
    input.mockPose.bodyArea,
  );
  drawPlayerArea(context, mockPoseRect);
  drawAvatar(
    context,
    createMockAvatarPose(mockPoseRect),
    width,
    height,
    input.avatarStyle,
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
  const scale = 0.55 + progress * 0.45;
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

function drawAvatar(
  context: CanvasRenderingContext2D,
  pose: AvatarPose,
  width: number,
  height: number,
  avatarStyle: AvatarStyle,
) {
  const palette = getAvatarPalette(avatarStyle);
  const avatarScale = getAvatarScale(pose, width, height);
  const outlineWidth = clamp(avatarScale * 0.08, 3, 9);
  const armWidth = clamp(avatarScale * 0.2, 10, 28);
  const legWidth = clamp(avatarScale * 0.24, 12, 34);

  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  drawJointedLimb(
    context,
    [pose.leftHip, pose.leftKnee, pose.leftAnkle],
    legWidth,
    "#172554",
    palette.leftLeg,
  );
  drawJointedLimb(
    context,
    [pose.rightHip, pose.rightKnee, pose.rightAnkle],
    legWidth,
    "#172554",
    palette.rightLeg,
  );
  drawJointedLimb(
    context,
    [pose.leftShoulder, pose.leftElbow, pose.leftWrist],
    armWidth,
    "#172554",
    palette.leftSleeve,
  );
  drawJointedLimb(
    context,
    [pose.rightShoulder, pose.rightElbow, pose.rightWrist],
    armWidth,
    "#172554",
    palette.rightSleeve,
  );

  drawAvatarHairBack(
    context,
    pose,
    avatarScale,
    avatarStyle,
    palette,
  );
  drawAvatarNeck(context, pose, avatarScale, outlineWidth);
  drawAvatarTorso(
    context,
    pose,
    avatarScale,
    outlineWidth,
    palette,
  );
  drawAvatarHands(context, pose, avatarScale, outlineWidth);
  drawAvatarShoes(context, pose, avatarScale, outlineWidth);
  drawAvatarHead(
    context,
    pose,
    avatarScale,
    outlineWidth,
    avatarStyle,
    palette,
  );

  context.restore();
}

function getAvatarPalette(avatarStyle: AvatarStyle): AvatarPalette {
  switch (avatarStyle) {
    case "masculine":
      return {
        jacketStart: "#2563eb",
        jacketMiddle: "#3b82f6",
        jacketEnd: "#1d4ed8",
        leftSleeve: "#3b82f6",
        rightSleeve: "#60a5fa",
        leftLeg: "#263b69",
        rightLeg: "#314879",
        hairStart: "#172033",
        hairEnd: "#334155",
        backDetail: "rgba(219, 234, 254, 0.72)",
      };
    case "feminine":
      return {
        jacketStart: "#a21caf",
        jacketMiddle: "#d946ef",
        jacketEnd: "#7e22ce",
        leftSleeve: "#c026d3",
        rightSleeve: "#e879f9",
        leftLeg: "#4c1d5f",
        rightLeg: "#63306f",
        hairStart: "#3f2937",
        hairEnd: "#713f12",
        backDetail: "rgba(250, 232, 255, 0.78)",
      };
    case "neutral":
      return {
        jacketStart: "#0f766e",
        jacketMiddle: "#14b8a6",
        jacketEnd: "#115e59",
        leftSleeve: "#0d9488",
        rightSleeve: "#2dd4bf",
        leftLeg: "#1f3b46",
        rightLeg: "#294b55",
        hairStart: "#1f2937",
        hairEnd: "#475569",
        backDetail: "rgba(204, 251, 241, 0.78)",
      };
  }
}

function drawAvatarHairBack(
  context: CanvasRenderingContext2D,
  pose: AvatarPose,
  avatarScale: number,
  avatarStyle: AvatarStyle,
  palette: AvatarPalette,
) {
  const headCenter = getHeadCenter(pose, avatarScale);

  if (!headCenter) {
    return;
  }

  const headRadius = clamp(avatarScale * 0.27, 13, 48);

  if (avatarStyle === "feminine") {
    const gradient = context.createLinearGradient(
      headCenter.x,
      headCenter.y - headRadius,
      headCenter.x,
      headCenter.y + headRadius * 2,
    );
    gradient.addColorStop(0, palette.hairStart);
    gradient.addColorStop(1, palette.hairEnd);
    context.beginPath();
    context.ellipse(
      headCenter.x,
      headCenter.y + headRadius * 0.72,
      headRadius * 0.78,
      headRadius * 1.48,
      0,
      0,
      Math.PI * 2,
    );
    context.fillStyle = gradient;
    context.fill();
    context.strokeStyle = "#172554";
    context.lineWidth = clamp(avatarScale * 0.05, 2, 6);
    context.stroke();
    return;
  }

  if (avatarStyle === "neutral") {
    drawCircle(
      context,
      headCenter,
      headRadius * 1.2,
      palette.jacketEnd,
    );
  }
}

function drawJointedLimb(
  context: CanvasRenderingContext2D,
  points: readonly (CanvasPoint | undefined)[],
  limbWidth: number,
  outlineColor: string,
  fillColor: string,
) {
  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];

    if (!start || !end) {
      continue;
    }

    drawLine(context, start, end, limbWidth + 6, outlineColor);
    drawLine(context, start, end, limbWidth, fillColor);
  }
}

function drawLine(
  context: CanvasRenderingContext2D,
  start: CanvasPoint,
  end: CanvasPoint,
  lineWidth: number,
  color: string,
) {
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.stroke();
}

function drawAvatarNeck(
  context: CanvasRenderingContext2D,
  pose: AvatarPose,
  avatarScale: number,
  outlineWidth: number,
) {
  const shoulderCenter = getPairMidpoint(
    pose.leftShoulder,
    pose.rightShoulder,
  );
  const headCenter = getHeadCenter(pose, avatarScale);

  if (!shoulderCenter || !headCenter) {
    return;
  }

  const neckEnd = {
    x: shoulderCenter.x,
    y: shoulderCenter.y + avatarScale * 0.03,
  };
  drawLine(
    context,
    headCenter,
    neckEnd,
    avatarScale * 0.2 + outlineWidth * 2,
    "#172554",
  );
  drawLine(
    context,
    headCenter,
    neckEnd,
    avatarScale * 0.2,
    "#d8a27d",
  );
}

function drawAvatarTorso(
  context: CanvasRenderingContext2D,
  pose: AvatarPose,
  avatarScale: number,
  outlineWidth: number,
  palette: AvatarPalette,
) {
  const {
    leftShoulder,
    rightShoulder,
    leftHip,
    rightHip,
  } = pose;

  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    return;
  }

  const shoulderCenter = getPointMidpoint(
    leftShoulder,
    rightShoulder,
  );
  const hipCenter = getPointMidpoint(leftHip, rightHip);
  const gradient = context.createLinearGradient(
    leftShoulder.x,
    shoulderCenter.y,
    rightShoulder.x,
    hipCenter.y,
  );
  gradient.addColorStop(0, palette.jacketStart);
  gradient.addColorStop(0.52, palette.jacketMiddle);
  gradient.addColorStop(1, palette.jacketEnd);

  context.beginPath();
  context.moveTo(leftShoulder.x, leftShoulder.y);
  context.quadraticCurveTo(
    shoulderCenter.x,
    shoulderCenter.y - avatarScale * 0.06,
    rightShoulder.x,
    rightShoulder.y,
  );
  context.lineTo(rightHip.x, rightHip.y);
  context.quadraticCurveTo(
    hipCenter.x,
    hipCenter.y + avatarScale * 0.05,
    leftHip.x,
    leftHip.y,
  );
  context.closePath();
  context.fillStyle = gradient;
  context.fill();
  context.strokeStyle = "#172554";
  context.lineWidth = outlineWidth;
  context.stroke();

  drawBackDetails(
    context,
    shoulderCenter,
    hipCenter,
    avatarScale,
    palette.backDetail,
  );
}

function drawBackDetails(
  context: CanvasRenderingContext2D,
  shoulderCenter: CanvasPoint,
  hipCenter: CanvasPoint,
  avatarScale: number,
  detailColor: string,
) {
  context.strokeStyle = detailColor;
  context.lineWidth = clamp(avatarScale * 0.035, 2, 5);

  context.beginPath();
  context.moveTo(
    shoulderCenter.x - avatarScale * 0.22,
    shoulderCenter.y + avatarScale * 0.08,
  );
  context.lineTo(
    shoulderCenter.x,
    shoulderCenter.y + avatarScale * 0.22,
  );
  context.lineTo(
    shoulderCenter.x + avatarScale * 0.22,
    shoulderCenter.y + avatarScale * 0.08,
  );
  context.stroke();

  context.beginPath();
  context.moveTo(
    shoulderCenter.x,
    shoulderCenter.y + avatarScale * 0.22,
  );
  context.lineTo(hipCenter.x, hipCenter.y - avatarScale * 0.08);
  context.stroke();
}

function drawAvatarHands(
  context: CanvasRenderingContext2D,
  pose: AvatarPose,
  avatarScale: number,
  outlineWidth: number,
) {
  const handRadius = clamp(avatarScale * 0.1, 6, 15);

  for (const wrist of [pose.leftWrist, pose.rightWrist]) {
    if (!wrist) {
      continue;
    }

    drawCircle(
      context,
      wrist,
      handRadius + outlineWidth,
      "#172554",
    );
    drawCircle(context, wrist, handRadius, "#d8a27d");
  }
}

function drawAvatarShoes(
  context: CanvasRenderingContext2D,
  pose: AvatarPose,
  avatarScale: number,
  outlineWidth: number,
) {
  for (const ankle of [pose.leftAnkle, pose.rightAnkle]) {
    if (!ankle) {
      continue;
    }

    context.beginPath();
    context.ellipse(
      ankle.x,
      ankle.y + avatarScale * 0.04,
      avatarScale * 0.16 + outlineWidth,
      avatarScale * 0.1 + outlineWidth,
      0,
      0,
      Math.PI * 2,
    );
    context.fillStyle = "#172554";
    context.fill();

    context.beginPath();
    context.ellipse(
      ankle.x,
      ankle.y + avatarScale * 0.04,
      avatarScale * 0.16,
      avatarScale * 0.1,
      0,
      0,
      Math.PI * 2,
    );
    context.fillStyle = "#e0f2fe";
    context.fill();
  }
}

function drawAvatarHead(
  context: CanvasRenderingContext2D,
  pose: AvatarPose,
  avatarScale: number,
  outlineWidth: number,
  avatarStyle: AvatarStyle,
  palette: AvatarPalette,
) {
  const headCenter = getHeadCenter(pose, avatarScale);

  if (!headCenter) {
    return;
  }

  const headRadius = clamp(avatarScale * 0.27, 13, 48);
  drawCircle(
    context,
    headCenter,
    headRadius + outlineWidth,
    "#172554",
  );
  drawCircle(context, headCenter, headRadius, "#d8a27d");

  context.save();
  context.beginPath();
  context.arc(
    headCenter.x,
    headCenter.y,
    headRadius,
    0,
    Math.PI * 2,
  );
  context.clip();

  const hairGradient = context.createLinearGradient(
    headCenter.x - headRadius,
    headCenter.y - headRadius,
    headCenter.x + headRadius,
    headCenter.y + headRadius,
  );
  hairGradient.addColorStop(0, palette.hairStart);
  hairGradient.addColorStop(1, palette.hairEnd);
  context.fillStyle = hairGradient;
  context.beginPath();
  context.ellipse(
    headCenter.x,
    headCenter.y -
      headRadius * (avatarStyle === "masculine" ? 0.42 : 0.28),
    headRadius * 1.08,
    headRadius * (avatarStyle === "feminine" ? 1.08 : 0.82),
    0,
    0,
    Math.PI * 2,
  );
  context.fill();
  context.restore();

  context.strokeStyle = "rgba(148, 163, 184, 0.65)";
  context.lineWidth = clamp(avatarScale * 0.025, 1.5, 4);
  context.beginPath();
  context.moveTo(
    headCenter.x,
    headCenter.y - headRadius * 0.94,
  );
  context.quadraticCurveTo(
    headCenter.x - headRadius * 0.16,
    headCenter.y - headRadius * 0.2,
    headCenter.x,
    headCenter.y + headRadius * 0.38,
  );
  context.stroke();
}

function drawCircle(
  context: CanvasRenderingContext2D,
  center: CanvasPoint,
  radius: number,
  color: string,
) {
  context.beginPath();
  context.arc(center.x, center.y, radius, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
}

function getAvatarScale(
  pose: AvatarPose,
  width: number,
  height: number,
): number {
  const shoulderSpan = getPairDistance(
    pose.leftShoulder,
    pose.rightShoulder,
  );
  const hipSpan = getPairDistance(pose.leftHip, pose.rightHip);
  const measuredScale = shoulderSpan ?? hipSpan ?? Math.min(width, height) * 0.12;

  return clamp(
    measuredScale,
    48,
    Math.max(48, Math.min(width, height) * 0.22),
  );
}

function getHeadCenter(
  pose: AvatarPose,
  avatarScale: number,
): CanvasPoint | null {
  if (pose.nose) {
    return pose.nose;
  }

  const shoulderCenter = getPairMidpoint(
    pose.leftShoulder,
    pose.rightShoulder,
  );

  if (!shoulderCenter) {
    return null;
  }

  return {
    x: shoulderCenter.x,
    y: shoulderCenter.y - avatarScale * 0.48,
  };
}

function getPairDistance(
  first: CanvasPoint | undefined,
  second: CanvasPoint | undefined,
): number | null {
  return first && second ? getPointDistance(first, second) : null;
}

function getPairMidpoint(
  first: CanvasPoint | undefined,
  second: CanvasPoint | undefined,
): CanvasPoint | null {
  return first && second ? getPointMidpoint(first, second) : null;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function drawPlayerArea(context: CanvasRenderingContext2D, playerRect: Rect) {
  context.save();
  context.fillStyle = "rgba(96, 165, 250, 0.08)";
  context.fillRect(
    playerRect.x,
    playerRect.y,
    playerRect.width,
    playerRect.height,
  );
  context.strokeStyle = "rgba(147, 197, 253, 0.48)";
  context.lineWidth = 2;
  context.setLineDash([8, 8]);
  context.strokeRect(
    playerRect.x,
    playerRect.y,
    playerRect.width,
    playerRect.height,
  );
  context.restore();
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
