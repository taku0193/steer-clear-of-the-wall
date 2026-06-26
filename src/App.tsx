import { useState } from "react";
import { ErrorScreen } from "./components/ErrorScreen";
import { ResultScreen } from "./components/ResultScreen";
import { TitleScreen } from "./components/TitleScreen";
import { createInitialGameState, GAME_PHASE_LABELS } from "./game/state";

export function App() {
  const [gameState, setGameState] = useState(createInitialGameState);
  const phaseLabel = GAME_PHASE_LABELS[gameState.phase];

  function handleStartGame() {
    setGameState({ phase: "preparing" });
  }

  function handleResetGame() {
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
        <ResultScreen finalScore={0} onRestart={handleResetGame} />
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

  return (
    <main className="app-shell" aria-labelledby="preparing-title">
      <section className="screen-panel preparing-screen" aria-live="polite">
        <p className="eyebrow">Wall Dodge Game</p>
        <h1 id="preparing-title">準備中</h1>
        <p className="state-readout">Current phase: {phaseLabel}</p>
        <p className="summary">
          ゲーム開始の操作を受け付けました。カメラ起動や姿勢検出は、後続タスクで接続します。
        </p>
      </section>
    </main>
  );
}
