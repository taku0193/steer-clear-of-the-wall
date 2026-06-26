type ResultScreenProps = {
  finalScore: number;
  onRestart: () => void;
};

export function ResultScreen({ finalScore, onRestart }: ResultScreenProps) {
  return (
    <section className="screen-panel result-screen" aria-labelledby="result-title">
      <p className="eyebrow">Result</p>
      <h1 id="result-title">結果</h1>
      <p className="summary">今回のプレイ結果です。</p>
      <p className="score-readout">
        <span>最終スコア</span>
        <strong>{finalScore}</strong>
      </p>
      <button className="primary-action" type="button" onClick={onRestart}>
        もう一度試す
      </button>
    </section>
  );
}
