type TitleScreenProps = {
  onStart: () => void;
};

export function TitleScreen({ onStart }: TitleScreenProps) {
  return (
    <section className="title-screen" aria-labelledby="app-title">
      <TitleGamePreview cyclePatterns />
      <div className="title-shade" />
      <div className="title-content">
        <p className="eyebrow">Full Body Arcade</p>
        <h1 id="app-title">Steer Clear<br />of the Wall</h1>
        <p className="summary">迫る壁を、全身でかわそう。</p>
        <button className="primary-action title-start-action" type="button" onClick={onStart}>
          ゲーム開始
        </button>
      </div>
      <p className="title-mode-note">Camera & Pose Detection</p>
    </section>
  );
}
import { TitleGamePreview } from "./TitleGamePreview";
