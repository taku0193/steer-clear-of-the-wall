import type { SafeArea, SafeShape, SafeZone } from "./types";

export type PlayerAnchorPoint = {
  id:
    | "head"
    | "upperTorso"
    | "center"
    | "leftShoulder"
    | "rightShoulder"
    | "leftFoot"
    | "rightFoot";
  x: number;
  y: number;
};

export function createPlayerAnchorPoints(
  playerArea: SafeArea,
): readonly PlayerAnchorPoint[] {
  const left = playerArea.x;
  const top = playerArea.y;
  const width = playerArea.width;
  const height = playerArea.height;
  const centerX = left + width / 2;
  const bottom = top + height;

  return [
    {
      id: "head",
      x: centerX,
      y: top + height * 0.08,
    },
    {
      id: "upperTorso",
      x: centerX,
      y: top + height * 0.28,
    },
    {
      id: "center",
      x: centerX,
      y: top + height * 0.5,
    },
    {
      id: "leftShoulder",
      x: left + width * 0.18,
      y: top + height * 0.28,
    },
    {
      id: "rightShoulder",
      x: left + width * 0.82,
      y: top + height * 0.28,
    },
    {
      id: "leftFoot",
      x: left + width * 0.28,
      y: bottom,
    },
    {
      id: "rightFoot",
      x: left + width * 0.72,
      y: bottom,
    },
  ];
}

export function arePlayerAnchorsInsideSafeShape({
  playerArea,
  safeShape,
  tolerance,
}: {
  playerArea: SafeArea;
  safeShape: SafeShape;
  tolerance: number;
}): boolean {
  return createPlayerAnchorPoints(playerArea).every((point) =>
    isPointInsideSafeShape(point, safeShape, tolerance),
  );
}

export function getPlayerAnchorsOutsideSafeShape({
  playerArea,
  safeShape,
  tolerance,
}: {
  playerArea: SafeArea;
  safeShape: SafeShape;
  tolerance: number;
}): readonly PlayerAnchorPoint[] {
  return createPlayerAnchorPoints(playerArea).filter(
    (point) => !isPointInsideSafeShape(point, safeShape, tolerance),
  );
}

export function isPointInsideSafeShape(
  point: Pick<PlayerAnchorPoint, "x" | "y">,
  safeShape: SafeShape,
  tolerance: number,
): boolean {
  return safeShape.zones.some((zone) =>
    isPointInsideSafeZone(point, zone, tolerance),
  );
}

export function isPointInsideSafeZone(
  point: Pick<PlayerAnchorPoint, "x" | "y">,
  zone: SafeZone,
  tolerance: number,
): boolean {
  switch (zone.type) {
    case "rect":
      return (
        point.x >= zone.x - tolerance &&
        point.y >= zone.y - tolerance &&
        point.x <= zone.x + zone.width + tolerance &&
        point.y <= zone.y + zone.height + tolerance
      );
    case "ellipse": {
      const rx = zone.rx + tolerance;
      const ry = zone.ry + tolerance;

      if (rx <= 0 || ry <= 0) {
        return false;
      }

      const normalizedX = (point.x - zone.cx) / rx;
      const normalizedY = (point.y - zone.cy) / ry;

      return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
    }
    case "capsule":
      return (
        getDistanceToSegment(point, zone.x1, zone.y1, zone.x2, zone.y2) <=
        zone.radius + tolerance
      );
    case "polygon":
      return isPointInsidePolygon(point, zone.points, tolerance);
  }
}

function isPointInsidePolygon(
  point: Pick<PlayerAnchorPoint, "x" | "y">,
  points: readonly Pick<PlayerAnchorPoint, "x" | "y">[],
  tolerance: number,
): boolean {
  if (points.length < 3) {
    return false;
  }

  let isInside = false;

  for (let index = 0, previousIndex = points.length - 1; index < points.length; previousIndex = index++) {
    const current = points[index];
    const previous = points[previousIndex];

    if (getDistanceToSegment(point, previous.x, previous.y, current.x, current.y) <= tolerance) {
      return true;
    }

    const intersects =
      current.y > point.y !== previous.y > point.y &&
      point.x <
        ((previous.x - current.x) * (point.y - current.y)) /
          (previous.y - current.y) +
          current.x;

    if (intersects) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function getDistanceToSegment(
  point: Pick<PlayerAnchorPoint, "x" | "y">,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - x1, point.y - y1);
  }

  const projection = Math.min(
    Math.max(((point.x - x1) * dx + (point.y - y1) * dy) / lengthSquared, 0),
    1,
  );
  const closestX = x1 + projection * dx;
  const closestY = y1 + projection * dy;

  return Math.hypot(point.x - closestX, point.y - closestY);
}
