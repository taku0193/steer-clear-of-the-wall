type ErrorScreenProps = {
  message: string;
  onRestart: () => void;
};

export function ErrorScreen({ message, onRestart }: ErrorScreenProps) {
  return (
    <section className="screen-panel error-screen" aria-labelledby="error-title">
      <p className="eyebrow">Error</p>
      <h1 id="error-title">ゲームを開始できません</h1>
      <p className="summary">{message}</p>
      <button className="primary-action" type="button" onClick={onRestart}>
        タイトルへ戻る
      </button>
    </section>
  );
}
