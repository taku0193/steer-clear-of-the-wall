import { useEffect, useState } from "react";
import { ErrorScreen } from "./components/ErrorScreen";
import { GameScreen } from "./components/GameScreen";
import { ResultScreen } from "./components/ResultScreen";
import { TitleScreen } from "./components/TitleScreen";
import { advanceWallProgress } from "./game/gameLoop";
import { createGameState, createInitialGameState } from "./game/state";
import { getWallPatternById, WALL_PATTERNS } from "./game/wallPatterns";

const COUNTDOWN_START = 3;

export function App() {
  const [gameState, setGameState] = useState(createInitialGameState);
  const [countdownValue, setCountdownValue] = useState(COUNTDOWN_START);

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

  function handlePreparationComplete() {
    setCountdownValue(COUNTDOWN_START);
    setGameState(createGameState("countdown"));
  }

  function handleResetGame() {
    setCountdownValue(COUNTDOWN_START);
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
          message="準備中に問題が発生しました。タイトルへ戻ってもう一度試してください。"
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
          mockPoseName={gameState.mockPose.name}
          mockPoseBodyArea={gameState.mockPose.bodyArea}
          activeWallPatternName={activeWallPattern.name}
          wallProgress={gameState.wallProgress}
        />
      </main>
    );
  }

  return (
    <main className="app-shell" aria-labelledby="preparing-title">
      <section className="screen-panel preparing-screen" aria-live="polite">
        <p className="eyebrow">Wall Dodge Game</p>
        <h1 id="preparing-title">準備中</h1>
        <p className="state-readout">ゲーム準備中</p>
        <p className="summary">
          ゲームを始める準備をしています。画面が切り替わるまでそのままお待ちください。
        </p>
        <button className="primary-action" type="button" onClick={handlePreparationComplete}>
          準備完了
        </button>
      </section>
    </main>
  );
}
