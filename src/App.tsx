import { useState } from "react";
import { createInitialGameState, GAME_PHASE_LABELS } from "./game/state";

export function App() {
  const [gameState] = useState(createInitialGameState);
  const phaseLabel = GAME_PHASE_LABELS[gameState.phase];

  return (
    <main className="app-shell" aria-labelledby="app-title">
      <section className="foundation-panel">
        <p className="eyebrow">Wall Dodge Game</p>
        <h1 id="app-title">Steer Clear of the Wall</h1>
        <p className="state-readout">Current phase: {phaseLabel}</p>
        <p className="summary">
          Frontend foundation is ready. Game state, screens, camera input, and
          pose detection will be added in later tasks.
        </p>
      </section>
    </main>
  );
}
