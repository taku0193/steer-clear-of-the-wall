import { useEffect, useState } from "react";
import { ErrorScreen } from "./components/ErrorScreen";
import { ResultScreen } from "./components/ResultScreen";
import { TitleScreen } from "./components/TitleScreen";
import { createInitialGameState } from "./game/state";

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
        setGameState({ phase: "playing" });
        return;
      }

      setCountdownValue((currentValue) => currentValue - 1);
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [countdownValue, gameState.phase]);

  function handleStartGame() {
    setGameState({ phase: "preparing" });
  }

  function handlePreparationComplete() {
    setCountdownValue(COUNTDOWN_START);
    setGameState({ phase: "countdown" });
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
    return (
      <main className="app-shell" aria-labelledby="playing-title">
        <section className="screen-panel playing-screen" aria-live="polite">
          <p className="eyebrow">Playing</p>
          <h1 id="playing-title">プレイ中</h1>
          <p className="state-readout">仮のプレイ中表示</p>
          <p className="summary">
            ゲーム本体の表示、制限時間、スコア、壁の描画は後続タスクで接続します。
          </p>
        </section>
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
