type ErrorScreenProps = {
  message: string;
  onRetry: () => void;
  onBackToTitle: () => void;
};

export function ErrorScreen({
  message,
  onRetry,
  onBackToTitle,
}: ErrorScreenProps) {
  return (
    <section className="screen-panel error-screen" aria-labelledby="error-title">
      <p className="eyebrow">Error</p>
      <h1 id="error-title">ゲームを開始できません</h1>
      <p className="summary">{message}</p>
      <div className="screen-actions">
        <button className="primary-action" type="button" onClick={onRetry}>
          再試行
        </button>
        <button
          className="secondary-action"
          type="button"
          onClick={onBackToTitle}
        >
          タイトルへ戻る
        </button>
      </div>
    </section>
  );
}
