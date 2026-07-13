"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useGameAudio } from "./audio/useGameAudio";
import { AudioController } from "./components/AudioController";
import { AudioControls } from "./components/AudioControls";
import { AudioProvider } from "./components/AudioProvider";
import { startCamera, stopCamera } from "./camera/camera";
import { AvatarStyleSelector } from "./components/AvatarStyleSelector";
import { CalibrationPanel } from "./components/CalibrationPanel";
import { CameraPreview } from "./components/CameraPreview";
import { CameraAlignmentOverlay } from "./components/CameraAlignmentOverlay";
import { CountdownScreen } from "./components/CountdownScreen";
import { ErrorScreen } from "./components/ErrorScreen";
import { GameScreen } from "./components/GameScreen";
import { ResultScreen } from "./components/ResultScreen";
import { TitleScreen } from "./components/TitleScreen";
import { RankingOverlay } from "./components/ranking/RankingOverlay";
import type { RankingSubmissionStatus } from "./components/ranking/ResultSubmissionStatus";
import {
  evaluateCalibration,
  type CalibrationResult,
} from "./game/calibration";
import { getAutoStartState } from "./game/autoStart";
import {
  advanceWallProgress,
  GAME_TICK_INTERVAL_MS,
  WALL_TICK_INTERVAL_MS,
} from "./game/gameLoop";
import {
  getAutoReturnDelayMs,
  getAutoReturnDelaySeconds,
} from "./game/exhibitionMode";
import {
  createGameState,
  createInitialGameState,
  createPlayerAreaFromPoseFrame,
  fitPoseFrameToGame,
} from "./game/state";
import type { AvatarStyle, GameError } from "./game/types";
import { getWallSpeedLabel } from "./game/wallSpeed";
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
import type { RankingEntry } from "./ranking/rankingTypes";

const COUNTDOWN_START = 3;
const CALIBRATION_READY_HOLD_MS = 600;

export function App() {
  return (
    <AudioProvider>
      <GameApp />
    </AudioProvider>
  );
}

function GameApp() {
  const audio = useGameAudio();
  const [gameState, setGameState] = useState(createInitialGameState);
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_START);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [poseDetector, setPoseDetector] =
    useState<PoseDetectorAdapter | null>(null);
  const [poseFrame, setPoseFrame] = useState<PoseFrame | null>(null);
  const [calibrationPoseFrame, setCalibrationPoseFrame] =
    useState<PoseFrame | null>(null);
  const [displayedCalibrationResult, setDisplayedCalibrationResult] =
    useState<CalibrationResult | null>(null);
  const [poseVideoElement, setPoseVideoElement] =
    useState<HTMLVideoElement | null>(null);
  const [rankingDisplayName, setRankingDisplayName] = useState("");
  const [rankingOverlayOpen, setRankingOverlayOpen] = useState(false);
  const [resultSubmissionStatus, setResultSubmissionStatus] =
    useState<RankingSubmissionStatus>("idle");
  const [submissionId, setSubmissionId] = useState(createRankingSubmissionId);
  const [highlightedRankingEntryId, setHighlightedRankingEntryId] =
    useState<string | null>(null);
  const resourceSessionRef = useRef(0);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const poseDetectorRef = useRef<PoseDetectorAdapter | null>(null);
  const calibrationReadyHoldStartedAtRef = useRef<number | null>(null);
  const gamePhaseRef = useRef(gameState.phase);
  gamePhaseRef.current = gameState.phase;

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
        setCalibrationPoseFrame(null);
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
      gameState.phase === "result" &&
      (resultSubmissionStatus !== "success" || rankingOverlayOpen)
    ) {
      return;
    }
    const delayMs = getAutoReturnDelayMs(gameState.phase, {
      hasActiveCamera: Boolean(cameraStream),
    });

    if (delayMs === null) {
      return;
    }

    const targetPhase = gameState.phase;
    const timerId = window.setTimeout(() => {
      if (gamePhaseRef.current === targetPhase) {
        resetGameSession("title");
      }
    }, delayMs);

    return () => window.clearTimeout(timerId);
  }, [
    cameraStream,
    gameState.phase,
    rankingOverlayOpen,
    releaseMediaResources,
    resultSubmissionStatus,
  ]);

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
        setCalibrationPoseFrame(result.frame);
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

  const calibrationResult = useMemo(
    () =>
      evaluateCalibration({
        poseFrame: calibrationPoseFrame,
        detectorReady: Boolean(poseDetector),
      }),
    [calibrationPoseFrame, poseDetector],
  );

  const autoStartState = useMemo(
    () =>
      getAutoStartState({
        phase: gameState.phase,
        hasActiveCamera: Boolean(cameraStream),
        detectorReady: Boolean(poseDetector),
        calibrationCanStart: calibrationResult.canStart,
      }),
    [cameraStream, calibrationResult.canStart, gameState.phase, poseDetector],
  );

  const startCountdownFromPreparation = useCallback(() => {
    setCountdownValue(COUNTDOWN_START);
    setGameState((currentState) => {
      if (currentState.phase !== "preparing") {
        return currentState;
      }

      return {
        ...currentState,
        phase: "countdown",
      };
    });
  }, []);

  useEffect(() => {
    if (gameState.phase !== "preparing" || !cameraStream) {
      calibrationReadyHoldStartedAtRef.current = null;
      setDisplayedCalibrationResult(null);
      return;
    }

    if (calibrationResult.status === "ready") {
      calibrationReadyHoldStartedAtRef.current = Date.now();
      setDisplayedCalibrationResult(calibrationResult);
      return;
    }

    if (displayedCalibrationResult?.status === "ready") {
      const holdStartedAt = calibrationReadyHoldStartedAtRef.current;
      const elapsedMs =
        holdStartedAt === null
          ? CALIBRATION_READY_HOLD_MS
          : Date.now() - holdStartedAt;

      if (elapsedMs >= CALIBRATION_READY_HOLD_MS) {
        calibrationReadyHoldStartedAtRef.current = null;
        setDisplayedCalibrationResult(calibrationResult);
        return;
      }

      const timerId = window.setTimeout(() => {
        calibrationReadyHoldStartedAtRef.current = null;
        setDisplayedCalibrationResult(calibrationResult);
      }, CALIBRATION_READY_HOLD_MS - elapsedMs);

      return () => window.clearTimeout(timerId);
    }

    calibrationReadyHoldStartedAtRef.current = null;
    setDisplayedCalibrationResult(calibrationResult);
  }, [
    calibrationResult,
    cameraStream,
    displayedCalibrationResult?.status,
    gameState.phase,
  ]);

  useEffect(() => {
    if (autoStartState.status !== "waiting") {
      return;
    }

    const timerId = window.setTimeout(() => {
      startCountdownFromPreparation();
    }, autoStartState.delayMs);

    return () => window.clearTimeout(timerId);
  }, [autoStartState, startCountdownFromPreparation]);

  async function confirmAudioInteraction() {
    await audio.unlockAudio();
    audio.stopEffects();
    audio.playEffect("confirm");
  }

  async function handleStartGame(nickname: string) {
    await confirmAudioInteraction();
    setRankingDisplayName(nickname);
    setSubmissionId(createRankingSubmissionId());
    setResultSubmissionStatus("idle");
    resetGameSession("preparing");
  }

  async function handleStartCamera() {
    await confirmAudioInteraction();
    releaseMediaResources();
    const resourceSession = resourceSessionRef.current;
    setIsCameraStarting(true);
    setGameState((currentState) => ({
      ...currentState,
      poseInputMode: "camera",
      poseDetectionStatus: "initializing",
      playerArea: null,
    }));
    setCalibrationPoseFrame(null);
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

  async function handleUseMockPose() {
    await confirmAudioInteraction();
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
    if (phase === "title") {
      setRankingDisplayName("");
      setHighlightedRankingEntryId(null);
      setResultSubmissionStatus("idle");
    }
    setGameState(
      phase === "title" ? createInitialGameState() : createGameState(phase),
    );
  }

  async function handleReplayGame() {
    await confirmAudioInteraction();
    setSubmissionId(createRankingSubmissionId());
    setResultSubmissionStatus("idle");
    resetGameSession("preparing");
  }

  async function handleReturnToTitle() {
    await confirmAudioInteraction();
    resetGameSession("title");
  }

  async function handleOpenRanking() {
    await confirmAudioInteraction();
    setRankingOverlayOpen(true);
  }

  function handleCloseRanking() {
    setRankingOverlayOpen(false);
  }

  function handleRankingRegistered(entry: RankingEntry) {
    if (gamePhaseRef.current !== "result") {
      return;
    }
    setHighlightedRankingEntryId(entry.id);
  }

  function handleResultSubmissionStatusChange(status: RankingSubmissionStatus) {
    if (gamePhaseRef.current !== "result") {
      return;
    }
    setResultSubmissionStatus(status);
  }

  const renderWithAudio = (screen: ReactNode) => (
    <>
      <AudioController
        phase={gameState.phase}
        countdownValue={countdownValue}
        wallSequenceIndex={gameState.wallSequenceIndex}
        lastJudgment={gameState.lastJudgment}
        lastSpeedLevelUp={gameState.lastSpeedLevelUp}
      />
      <AudioControls phase={gameState.phase} />
      {screen}
      {rankingOverlayOpen && (
        <RankingOverlay
          highlightedEntryId={highlightedRankingEntryId}
          onClose={handleCloseRanking}
        />
      )}
    </>
  );

  if (gameState.phase === "title") {
    return renderWithAudio(
      <main className="app-shell app-shell-title">
        <TitleScreen
          nickname={rankingDisplayName}
          onNicknameChange={setRankingDisplayName}
          onStart={handleStartGame}
          onOpenRanking={handleOpenRanking}
        />
      </main>
    );
  }

  if (gameState.phase === "result") {
    const autoReturnDelayMs =
      resultSubmissionStatus === "success" && !rankingOverlayOpen
        ? getAutoReturnDelayMs(gameState.phase)
        : null;

    return renderWithAudio(
      <main className="app-shell">
        <ResultScreen
          finalScore={gameState.score}
          misses={gameState.misses}
          successfulWalls={gameState.successfulWalls}
          wallSpeedLevel={gameState.wallSpeedLevel}
          wallSpeedLabel={getWallSpeedLabel(gameState.wallSpeedLevel)}
          autoReturnSeconds={getAutoReturnDelaySeconds(autoReturnDelayMs)}
          displayName={rankingDisplayName}
          submissionId={submissionId}
          onSubmissionStatusChange={handleResultSubmissionStatusChange}
          onRankingRegistered={handleRankingRegistered}
          onOpenRanking={handleOpenRanking}
          onRestart={handleReplayGame}
          onBackToTitle={handleReturnToTitle}
        />
      </main>
    );
  }

  if (gameState.phase === "error") {
    const autoReturnDelayMs = getAutoReturnDelayMs(gameState.phase);

    return renderWithAudio(
      <main className="app-shell">
        <ErrorScreen
          message={getGameErrorMessage(gameState.error)}
          autoReturnSeconds={getAutoReturnDelaySeconds(autoReturnDelayMs)}
          onRetry={handleReplayGame}
          onBackToTitle={handleReturnToTitle}
        />
      </main>
    );
  }

  if (gameState.phase === "preparing" && cameraStream) {
    return renderWithAudio(
      <main
        className="app-shell-camera-prep"
        aria-labelledby="preparing-title"
      >
        <section className="camera-prep-screen" aria-live="polite">
          <CameraPreview
            stream={cameraStream}
            onVideoElementChange={setPoseVideoElement}
          />
          <CameraAlignmentOverlay
            result={displayedCalibrationResult ?? calibrationResult}
            autoStartState={autoStartState}
          />
          <div className="camera-prep-header">
            <p className="eyebrow">Camera Setup</p>
            <h1 id="preparing-title">カメラ準備</h1>
          </div>
          <div className="camera-prep-panel">
            <AvatarStyleSelector
              value={gameState.avatarStyle}
              onChange={handleAvatarStyleChange}
            />
            <p className="state-readout">
              {getPosePreparationLabel(gameState.poseDetectionStatus)}
            </p>
            {displayedCalibrationResult && (
              <CalibrationPanel
                result={displayedCalibrationResult}
                autoStartStatus={autoStartState.status}
              />
            )}
            <p
              className={`auto-start-readout auto-start-readout-${autoStartState.status}`}
            >
              {getAutoStartReadout(autoStartState.status)}
            </p>
            <button
              className="secondary-action exhibition-reset-action"
              type="button"
              onClick={handleReturnToTitle}
            >
              タイトルへ戻る
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (gameState.phase === "countdown") {
    return renderWithAudio(
      <main className="app-shell app-shell-countdown" aria-labelledby="countdown-title">
        {cameraStream && (
          <CameraPreview
            stream={cameraStream}
            onVideoElementChange={setPoseVideoElement}
            visuallyHidden
          />
        )}
        <CountdownScreen
          value={countdownValue}
          avatarStyle={gameState.avatarStyle}
          wallPattern={getWallPatternById(gameState.activeWallPatternId)}
          onBackToTitle={handleReturnToTitle}
        />
      </main>
    );
  }

  if (gameState.phase === "playing") {
    const activeWallPattern = getWallPatternById(gameState.activeWallPatternId);

    return renderWithAudio(
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
          wallSpeedLevel={gameState.wallSpeedLevel}
          wallSpeedLabel={getWallSpeedLabel(gameState.wallSpeedLevel)}
          lastSpeedLevelUp={gameState.lastSpeedLevelUp}
          onResetToTitle={handleReturnToTitle}
        />
      </main>
    );
  }

  return renderWithAudio(
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
          <button
            className="secondary-action"
            type="button"
            onClick={handleReturnToTitle}
          >
            タイトルへ戻る
          </button>
        </div>
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

function getAutoStartReadout(status: "inactive" | "waiting"): string {
  if (status === "waiting") {
    return "そのままお待ちください。まもなく始まります。";
  }

  return "全身が映ると自動で始まります。";
}

function createRankingSubmissionId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
