export type GameViewport = {
  canvasWidth: number;
  canvasHeight: number;
  gameX: number;
  gameY: number;
  gameWidth: number;
  gameHeight: number;
  scale: number;
};

export const GAME_ASPECT_RATIO = 16 / 10;

export function calculateGameViewport(
  canvasWidth: number,
  canvasHeight: number,
): GameViewport | null {
  if (
    !Number.isFinite(canvasWidth) ||
    !Number.isFinite(canvasHeight) ||
    canvasWidth <= 0 ||
    canvasHeight <= 0
  ) {
    return null;
  }

  const canvasAspectRatio = canvasWidth / canvasHeight;
  const gameWidth =
    canvasAspectRatio > GAME_ASPECT_RATIO
      ? canvasHeight * GAME_ASPECT_RATIO
      : canvasWidth;
  const gameHeight = gameWidth / GAME_ASPECT_RATIO;

  return {
    canvasWidth,
    canvasHeight,
    gameX: (canvasWidth - gameWidth) / 2,
    gameY: (canvasHeight - gameHeight) / 2,
    gameWidth,
    gameHeight,
    scale: Math.min(gameWidth, gameHeight),
  };
}
