import { useState } from "react";
import { TitleScreen } from "./components/TitleScreen";
import { createInitialGameState, GAME_PHASE_LABELS } from "./game/state";

export function App() {
  const [gameState, setGameState] = useState(createInitialGameState);
  const phaseLabel = GAME_PHASE_LABELS[gameState.phase];

  function handleStartGame() {
    setGameState({ phase: "preparing" });
  }

  if (gameState.phase === "title") {
    return (
      <main className="app-shell">
        <TitleScreen onStart={handleStartGame} />
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
