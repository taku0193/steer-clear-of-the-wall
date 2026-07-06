export type CanvasViewport = {
  cssWidth: number;
  cssHeight: number;
  pixelRatio: number;
  bitmapWidth: number;
  bitmapHeight: number;
};

const MIN_PIXEL_RATIO = 1;
const MAX_PIXEL_RATIO = 2;

export function calculateCanvasViewport(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
): CanvasViewport | null {
  if (!Number.isFinite(cssWidth) || !Number.isFinite(cssHeight)) {
    return null;
  }

  const roundedWidth = Math.round(cssWidth);
  const roundedHeight = Math.round(cssHeight);

  if (roundedWidth <= 0 || roundedHeight <= 0) {
    return null;
  }

  const pixelRatio = Number.isFinite(devicePixelRatio)
    ? Math.min(
        Math.max(devicePixelRatio, MIN_PIXEL_RATIO),
        MAX_PIXEL_RATIO,
      )
    : MIN_PIXEL_RATIO;

  return {
    cssWidth: roundedWidth,
    cssHeight: roundedHeight,
    pixelRatio,
    bitmapWidth: Math.round(roundedWidth * pixelRatio),
    bitmapHeight: Math.round(roundedHeight * pixelRatio),
  };
}
