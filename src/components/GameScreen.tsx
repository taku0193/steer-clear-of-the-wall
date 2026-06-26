type GameScreenProps = {
  remainingSeconds: number;
  score: number;
  misses: number;
};

export function GameScreen({ remainingSeconds, score, misses }: GameScreenProps) {
  return (
    <section className="game-screen" aria-labelledby="playing-title">
      <header className="game-hud" aria-label="プレイ状況">
        <div className="hud-item">
          <span>残り時間</span>
          <strong>{remainingSeconds}</strong>
          <small>秒</small>
        </div>
        <div className="hud-item">
          <span>スコア</span>
          <strong>{score}</strong>
        </div>
        <div className="hud-item">
          <span>ミス</span>
          <strong>{misses}</strong>
        </div>
      </header>

      <div className="playfield-placeholder">
        <p className="eyebrow">Playing</p>
        <h1 id="playing-title">プレイ中</h1>
        <p className="summary">
          壁、当たり判定、スコア加算は後続タスクで接続します。
        </p>
      </div>
    </section>
  );
}
