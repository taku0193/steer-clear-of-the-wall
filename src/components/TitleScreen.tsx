type TitleScreenProps = {
  onStart: () => void;
};

export function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <section className="screen-panel title-screen" aria-labelledby="app-title">
      <p className="eyebrow">Wall Dodge Game</p>
      <h1 id="app-title">Steer Clear of the Wall</h1>
      <p className="summary">
        画面奥から迫る壁の穴に合わせて体を動かす、ブラウザ向けの体験型ゲームです。
      </p>
      <button className="primary-action" type="button" onClick={onStart}>
        ゲーム開始
      </button>
    </section>
  );
}
