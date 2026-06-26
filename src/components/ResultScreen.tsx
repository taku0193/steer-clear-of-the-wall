type ResultScreenProps = {
  finalScore: number;
  misses: number;
  onRestart: () => void;
};

export function ResultScreen({ finalScore, misses, onRestart }: ResultScreenProps) {
  return (
    <section className="screen-panel result-screen" aria-labelledby="result-title">
      <p className="eyebrow">Result</p>
      <h1 id="result-title">結果</h1>
      <p className="summary">今回のプレイ結果です。</p>
      <div className="result-stats" aria-label="今回の結果">
        <p className="score-readout">
          <span>最終スコア</span>
          <strong>{finalScore}</strong>
        </p>
        <p className="score-readout">
          <span>ミス</span>
          <strong>{misses}</strong>
        </p>
      </div>
      <button className="primary-action" type="button" onClick={onRestart}>
        もう一度試す
      </button>
    </section>
  );
}
