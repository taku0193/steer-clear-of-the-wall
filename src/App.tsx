import { useEffect, useState } from "react";
import { startCamera, stopCamera } from "./camera/camera";
import { CameraPreview } from "./components/CameraPreview";
import { ErrorScreen } from "./components/ErrorScreen";
import { GameScreen } from "./components/GameScreen";
import { ResultScreen } from "./components/ResultScreen";
import { TitleScreen } from "./components/TitleScreen";
import { advanceWallProgress } from "./game/gameLoop";
import {
  createGameState,
  createInitialGameState,
  createPlayerAreaFromPoseFrame,
} from "./game/state";
import type { GameError } from "./game/types";
import { getWallPatternById, WALL_PATTERNS } from "./game/wallPatterns";
import {
  detectPose,
  disposePoseDetector,
  initializePoseDetector,
} from "./pose/poseDetector";
import type {
  PoseDetectorAdapter,
  PoseFrame,
} from "./pose/poseTypes";

const COUNTDOWN_START = 3;

export function App() {
  const [gameState, setGameState] = useState(createInitialGameState);
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_START);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [poseDetector, setPoseDetector] =
    useState<PoseDetectorAdapter | null>(null);
  const [poseFrame, setPoseFrame] = useState<PoseFrame | null>(null);
  const [poseVideoElement, setPoseVideoElement] =
    useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!cameraStream) {
      return;
    }

    return () => stopCamera(cameraStream);
  }, [cameraStream]);

  useEffect(() => {
    if (!poseDetector) {
      return;
    }

    return () => disposePoseDetector(poseDetector);
  }, [poseDetector]);

  useEffect(() => {
    if (
      gameState.phase === "title" ||
      gameState.phase === "result" ||
      gameState.phase === "error"
    ) {
      setCameraStream(null);
      setPoseDetector(null);
      setPoseFrame(null);
      setPoseVideoElement(null);
    }
  }, [gameState.phase]);

  useEffect(() => {
    if (
      !poseDetector ||
      !poseVideoElement ||
      !isPoseDetectionPhase(gameState.phase)
    ) {
      return;
    }

    let animationFrameId = 0;
    let isActive = true;
    let lastVideoTime = -1;

    const detectFrame = (timestampMs: number) => {
      if (!isActive) {
        return;
      }

      if (
        poseVideoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        poseVideoElement.currentTime !== lastVideoTime
      ) {
        lastVideoTime = poseVideoElement.currentTime;
        const result = detectPose(
          poseDetector,
          poseVideoElement,
          timestampMs,
        );

        if (!result.ok) {
          setGameState((currentState) => ({
            ...currentState,
            phase: "error",
            error: result.error,
          }));
          return;
        }

        const playerArea = createPlayerAreaFromPoseFrame(result.frame);
        setPoseFrame(result.frame);
        setGameState((currentState) => {
          if (!isPoseDetectionPhase(currentState.phase)) {
            return currentState;
          }

          return {
            ...currentState,
            poseInputMode: "camera",
            poseDetectionStatus:
              result.frame.detected && playerArea
                ? "detected"
                : "notDetected",
            playerArea,
          };
        });
      }

      animationFrameId = window.requestAnimationFrame(detectFrame);
    };

    animationFrameId = window.requestAnimationFrame(detectFrame);

    return () => {
      isActive = false;
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [gameState.phase, poseDetector, poseVideoElement]);

  useEffect(() => {
    if (gameState.phase !== "countdown") {
      return;
    }

    const timerId = window.setTimeout(() => {
      if (countdownValue <= 1) {
        setGameState((currentState) =>
          currentState.phase === "countdown"
            ? {
                ...currentState,
                phase: "playing",
              }
            : currentState,
        );
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
    setGameState((currentState) => ({
      ...currentState,
      poseInputMode: "camera",
      poseDetectionStatus: "initializing",
      playerArea: null,
    }));
    const cameraResult = await startCamera();
    setIsCameraStarting(false);

    if (!cameraResult.ok) {
      setGameState((currentState) => ({
        ...currentState,
        phase: "error",
        error: cameraResult.error,
      }));
      return;
    }

    setCameraStream(cameraResult.stream);
    const detectorResult = await initializePoseDetector();

    if (!detectorResult.ok) {
      setGameState((currentState) => ({
        ...currentState,
        phase: "error",
        error: detectorResult.error,
      }));
      return;
    }

    setPoseDetector(detectorResult.detector);
    setGameState((currentState) => ({
      ...currentState,
      poseInputMode: "camera",
      poseDetectionStatus: "detecting",
      playerArea: null,
    }));
  }

  function handlePreparationComplete() {
    setCountdownValue(COUNTDOWN_START);
    setGameState((currentState) => ({
      ...currentState,
      phase: "countdown",
    }));
  }

  function handleUseMockPose() {
    setCountdownValue(COUNTDOWN_START);
    setPoseFrame(null);
    setGameState(createGameState("countdown"));
  }

  function handleResetGame() {
    setCountdownValue(COUNTDOWN_START);
    setCameraStream(null);
    setIsCameraStarting(false);
    setPoseDetector(null);
    setPoseFrame(null);
    setPoseVideoElement(null);
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
          message={getGameErrorMessage(gameState.error)}
          onRestart={handleResetGame}
        />
      </main>
    );
  }

  if (gameState.phase === "countdown") {
    return (
      <main className="app-shell" aria-labelledby="countdown-title">
        <section className="screen-panel countdown-screen" aria-live="polite">
          {cameraStream && (
            <CameraPreview
              stream={cameraStream}
              onVideoElementChange={setPoseVideoElement}
              visuallyHidden
            />
          )}
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
        {cameraStream && (
          <CameraPreview
            stream={cameraStream}
            onVideoElementChange={setPoseVideoElement}
            visuallyHidden
          />
        )}
        <GameScreen
          remainingSeconds={gameState.remainingSeconds}
          score={gameState.score}
          misses={gameState.misses}
          lastJudgment={gameState.lastJudgment}
          mockPose={gameState.mockPose}
          poseFrame={poseFrame}
          poseInputMode={gameState.poseInputMode}
          poseDetectionStatus={gameState.poseDetectionStatus}
          playerArea={gameState.playerArea}
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
            <CameraPreview
              stream={cameraStream}
              onVideoElementChange={setPoseVideoElement}
            />
            <p className="state-readout">
              {getPosePreparationLabel(gameState.poseDetectionStatus)}
            </p>
            <button
              className="primary-action"
              type="button"
              onClick={handlePreparationComplete}
              disabled={!poseDetector}
            >
              {poseDetector ? "準備完了" : "姿勢検出を初期化中"}
            </button>
          </>
        ) : (
          <>
            <p className="state-readout">
              {isCameraStarting ? "カメラの許可を待っています" : "カメラは未接続です"}
            </p>
            <div className="preparation-actions">
              <button
                className="primary-action"
                type="button"
                onClick={handleStartCamera}
                disabled={isCameraStarting}
              >
                {isCameraStarting ? "カメラを起動中" : "カメラを開始"}
              </button>
              <button
                className="secondary-action"
                type="button"
                onClick={handleUseMockPose}
                disabled={isCameraStarting}
              >
                モック姿勢で試す
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function getGameErrorMessage(error: GameError | null): string {
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
    case "poseInitializationFailed":
      return `姿勢検出を初期化できませんでした。通信環境を確認して、もう一度試してください。詳細: ${error.message}`;
    case "poseDetectionFailed":
      return `姿勢検出中に問題が発生しました。もう一度試してください。詳細: ${error.message}`;
    default:
      return "カメラの準備中に問題が発生しました。タイトルへ戻ってもう一度試してください。";
  }
}

function getPosePreparationLabel(
  status: "mock" | "initializing" | "detecting" | "detected" | "notDetected",
): string {
  switch (status) {
    case "initializing":
      return "姿勢検出モデルを初期化しています";
    case "detecting":
      return "姿勢を確認しています";
    case "detected":
      return "姿勢を検出しました";
    case "notDetected":
      return "全身が映るように位置を調整してください";
    case "mock":
      return "モック姿勢を使用します";
  }
}

function isPoseDetectionPhase(
  phase: "title" | "preparing" | "countdown" | "playing" | "result" | "error",
): boolean {
  return (
    phase === "preparing" ||
    phase === "countdown" ||
    phase === "playing"
  );
}
