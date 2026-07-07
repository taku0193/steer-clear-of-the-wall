import { useCallback, useEffect, useRef, useState } from "react";
import { startCamera, stopCamera } from "./camera/camera";
import { AvatarStyleSelector } from "./components/AvatarStyleSelector";
import { CameraPreview } from "./components/CameraPreview";
import { ErrorScreen } from "./components/ErrorScreen";
import { GameScreen } from "./components/GameScreen";
import { ResultScreen } from "./components/ResultScreen";
import { TitleScreen } from "./components/TitleScreen";
import {
  advanceWallProgress,
  GAME_TICK_INTERVAL_MS,
  WALL_TICK_INTERVAL_MS,
} from "./game/gameLoop";
import {
  createGameState,
  createInitialGameState,
  createPlayerAreaFromPoseFrame,
  fitPoseFrameToGame,
} from "./game/state";
import type { AvatarStyle, GameError } from "./game/types";
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
  const resourceSessionRef = useRef(0);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const poseDetectorRef = useRef<PoseDetectorAdapter | null>(null);

  const releaseMediaResources = useCallback((updateState = true) => {
    resourceSessionRef.current += 1;

    const currentDetector = poseDetectorRef.current;
    poseDetectorRef.current = null;
    if (currentDetector) {
      disposePoseDetector(currentDetector);
    }

    const currentStream = cameraStreamRef.current;
    cameraStreamRef.current = null;
    if (currentStream) {
      stopCamera(currentStream);
    }

    if (updateState) {
      setCameraStream(null);
      setPoseDetector(null);
      setPoseFrame(null);
      setPoseVideoElement(null);
      setIsCameraStarting(false);
    }
  }, []);

  useEffect(() => {
    return () => releaseMediaResources(false);
  }, [releaseMediaResources]);

  useEffect(() => {
    if (gameState.phase === "result" || gameState.phase === "error") {
      releaseMediaResources();
    }
  }, [gameState.phase, releaseMediaResources]);

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

        const gamePoseFrame = fitPoseFrameToGame(result.frame);
        const playerArea = createPlayerAreaFromPoseFrame(gamePoseFrame);
        setPoseFrame(gamePoseFrame);
        setGameState((currentState) => {
          if (!isPoseDetectionPhase(currentState.phase)) {
            return currentState;
          }

          return {
            ...currentState,
            poseInputMode: "camera",
            poseDetectionStatus:
              gamePoseFrame.detected && playerArea
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
    }, GAME_TICK_INTERVAL_MS);

    return () => window.clearTimeout(timerId);
  }, [countdownValue, gameState.phase]);

  useEffect(() => {
    if (gameState.phase !== "playing") {
      return;
    }

    const timerId = window.setInterval(() => {
      setGameState((currentState) =>
        advanceWallProgress(currentState, WALL_PATTERNS),
      );
    }, WALL_TICK_INTERVAL_MS);

    return () => window.clearInterval(timerId);
  }, [gameState.phase]);

  function handleStartGame() {
    resetGameSession("preparing");
  }

  async function handleStartCamera() {
    releaseMediaResources();
    const resourceSession = resourceSessionRef.current;
    setIsCameraStarting(true);
    setGameState((currentState) => ({
      ...currentState,
      poseInputMode: "camera",
      poseDetectionStatus: "initializing",
      playerArea: null,
    }));
    const cameraResult = await startCamera();

    if (resourceSession !== resourceSessionRef.current) {
      if (cameraResult.ok) {
        stopCamera(cameraResult.stream);
      }
      return;
    }

    setIsCameraStarting(false);

    if (!cameraResult.ok) {
      setGameState((currentState) => ({
        ...currentState,
        phase: "error",
        error: cameraResult.error,
      }));
      return;
    }

    cameraStreamRef.current = cameraResult.stream;
    setCameraStream(cameraResult.stream);
    const detectorResult = await initializePoseDetector();

    if (resourceSession !== resourceSessionRef.current) {
      if (detectorResult.ok) {
        disposePoseDetector(detectorResult.detector);
      }
      stopCamera(cameraResult.stream);
      return;
    }

    if (!detectorResult.ok) {
      setGameState((currentState) => ({
        ...currentState,
        phase: "error",
        error: detectorResult.error,
      }));
      return;
    }

    poseDetectorRef.current = detectorResult.detector;
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
    releaseMediaResources();
    setCountdownValue(COUNTDOWN_START);
    setGameState((currentState) => ({
      ...createGameState("countdown"),
      avatarStyle: currentState.avatarStyle,
    }));
  }

  function handleAvatarStyleChange(avatarStyle: AvatarStyle) {
    setGameState((currentState) => ({
      ...currentState,
      avatarStyle,
    }));
  }

  function resetGameSession(phase: "title" | "preparing" | "countdown") {
    releaseMediaResources();
    setCountdownValue(COUNTDOWN_START);
    setGameState(
      phase === "title" ? createInitialGameState() : createGameState(phase),
    );
  }

  function handleReplayGame() {
    resetGameSession("preparing");
  }

  function handleReturnToTitle() {
    resetGameSession("title");
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
          remainingHearts={gameState.remainingHearts}
          onRestart={handleReplayGame}
        />
      </main>
    );
  }

  if (gameState.phase === "error") {
    return (
      <main className="app-shell">
        <ErrorScreen
          message={getGameErrorMessage(gameState.error)}
          onRetry={handleReplayGame}
          onBackToTitle={handleReturnToTitle}
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
          remainingHearts={gameState.remainingHearts}
          score={gameState.score}
          misses={gameState.misses}
          avatarStyle={gameState.avatarStyle}
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
        <AvatarStyleSelector
          value={gameState.avatarStyle}
          onChange={handleAvatarStyleChange}
        />
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
