import { useEffect, useState } from "react";
import { startCamera, stopCamera } from "./camera/camera";
import { CameraPreview } from "./components/CameraPreview";
import { ErrorScreen } from "./components/ErrorScreen";
import { GameScreen } from "./components/GameScreen";
import { ResultScreen } from "./components/ResultScreen";
import { TitleScreen } from "./components/TitleScreen";
import { advanceWallProgress } from "./game/gameLoop";
import { createGameState, createInitialGameState } from "./game/state";
import type { GameError } from "./game/types";
import { getWallPatternById, WALL_PATTERNS } from "./game/wallPatterns";

const COUNTDOWN_START = 3;

export function App() {
  const [gameState, setGameState] = useState(createInitialGameState);
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_START);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);

  useEffect(() => {
    if (!cameraStream) {
      return;
    }

    return () => stopCamera(cameraStream);
  }, [cameraStream]);

  useEffect(() => {
    if (gameState.phase === "result" || gameState.phase === "error") {
      setCameraStream(null);
    }
  }, [gameState.phase]);

  useEffect(() => {
    if (gameState.phase !== "countdown") {
      return;
    }

    const timerId = window.setTimeout(() => {
      if (countdownValue <= 1) {
        setGameState(createGameState("playing"));
        return;
      }

      setCountdownValue((currentValue) => currentValue - 1);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [countdownValue, gameState.phase]);

  useEffect(() => {
    if (gameState.phase !== "playing") {
      return;
    }

    const timerId = window.setTimeout(() => {
      setGameState((currentState) => {
        if (currentState.phase !== "playing") {
          return currentState;
        }

        const nextRemainingSeconds = Math.max(currentState.remainingSeconds - 1, 0);

        if (nextRemainingSeconds === 0) {
          return {
            ...currentState,
            phase: "result",
            remainingSeconds: 0,
          };
        }

        return advanceWallProgress({
          ...currentState,
          remainingSeconds: nextRemainingSeconds,
        }, WALL_PATTERNS);
      });
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [gameState.phase, gameState.remainingSeconds]);

  function handleStartGame() {
    setGameState(createGameState("preparing"));
  }

  async function handleStartCamera() {
    setIsCameraStarting(true);
    const result = await startCamera();
    setIsCameraStarting(false);

    if (!result.ok) {
      setGameState((currentState) => ({
        ...currentState,
        phase: "error",
        error: result.error,
      }));
      return;
    }

    setCameraStream(result.stream);
  }

  function handlePreparationComplete() {
    setCountdownValue(COUNTDOWN_START);
    setGameState(createGameState("countdown"));
  }

  function handleResetGame() {
    setCountdownValue(COUNTDOWN_START);
    setCameraStream(null);
    setIsCameraStarting(false);
    setGameState(createInitialGameState());
  }

  if (gameState.phase === "title") {
    return (
      <main className="app-shell">
        <TitleScreen onStart={handleStartGame} />
      </main>
    );
  }

  if (gameState.phase === "result") {
    return (
      <main className="app-shell">
        <ResultScreen
          finalScore={gameState.score}
          misses={gameState.misses}
          onRestart={handleResetGame}
        />
      </main>
    );
  }

  if (gameState.phase === "error") {
    return (
      <main className="app-shell">
        <ErrorScreen
          message={getCameraErrorMessage(gameState.error)}
          onRestart={handleResetGame}
        />
      </main>
    );
  }

  if (gameState.phase === "countdown") {
    return (
      <main className="app-shell" aria-labelledby="countdown-title">
        <section className="screen-panel countdown-screen" aria-live="polite">
          <p className="eyebrow">Countdown</p>
          <h1 id="countdown-title">まもなく開始</h1>
          <p className="countdown-number" aria-label={`開始まで${countdownValue}秒`}>
            {countdownValue}
          </p>
          <p className="summary">
            カウントダウン中です。壁との判定はまだ始まりません。
          </p>
        </section>
      </main>
    );
  }

  if (gameState.phase === "playing") {
    const activeWallPattern = getWallPatternById(gameState.activeWallPatternId);

    return (
      <main className="app-shell app-shell-game">
        <GameScreen
          remainingSeconds={gameState.remainingSeconds}
          score={gameState.score}
          misses={gameState.misses}
          lastJudgment={gameState.lastJudgment}
          mockPose={gameState.mockPose}
          activeWallPattern={activeWallPattern}
          wallProgress={gameState.wallProgress}
        />
      </main>
    );
  }

  return (
    <main className="app-shell" aria-labelledby="preparing-title">
      <section className="screen-panel preparing-screen" aria-live="polite">
        <p className="eyebrow">Wall Dodge Game</p>
        <h1 id="preparing-title">カメラ準備</h1>
        <p className="summary">
          カメラ映像を確認してからゲームを開始します。音声は取得しません。
        </p>
        {cameraStream ? (
          <>
            <CameraPreview stream={cameraStream} />
            <p className="state-readout">カメラ準備完了</p>
            <button className="primary-action" type="button" onClick={handlePreparationComplete}>
              準備完了
            </button>
          </>
        ) : (
          <>
            <p className="state-readout">
              {isCameraStarting ? "カメラの許可を待っています" : "カメラは未接続です"}
            </p>
            <button
              className="primary-action"
              type="button"
              onClick={handleStartCamera}
              disabled={isCameraStarting}
            >
              {isCameraStarting ? "カメラを起動中" : "カメラを開始"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}

function getCameraErrorMessage(error: GameError | null): string {
  switch (error?.type) {
    case "cameraPermissionDenied":
      return "カメラの使用が拒否されました。ブラウザの設定でカメラを許可してから、もう一度試してください。";
    case "cameraNotFound":
      return "利用できるカメラが見つかりません。カメラの接続を確認してから、もう一度試してください。";
    case "cameraNotReadable":
      return "カメラを読み取れません。他のアプリがカメラを使用していないか確認してください。";
    case "cameraUnavailable":
      return "このブラウザではカメラを利用できません。対応ブラウザで開いてください。";
    case "insecureContext":
      return "カメラを利用するには、localhostまたはHTTPSでページを開いてください。";
    default:
      return "カメラの準備中に問題が発生しました。タイトルへ戻ってもう一度試してください。";
  }
}
