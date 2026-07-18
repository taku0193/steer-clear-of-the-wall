import { NicknameInput } from "./ranking/NicknameInput";
import { TitleGamePreview } from "./TitleGamePreview";

type TitleScreenProps = {
  nickname: string;
  onNicknameChange: (value: string) => void;
  onStart: (nickname: string) => void;
  onOpenRanking: () => void;
};

export function TitleScreen({
  nickname,
  onNicknameChange,
  onStart,
  onOpenRanking,
}: TitleScreenProps) {
  return (
    <section className="title-screen" aria-labelledby="app-title">
      <TitleGamePreview cyclePatterns />
      <div className="title-shade" />
      <div className="title-content">
        <p className="eyebrow">Full Body Arcade</p>
        <h1 id="app-title">体がコントローラー！<br />ウォール回避ゲーム</h1>
        <p className="summary">迫る壁を、全身でかわそう。</p>
        <NicknameInput
          value={nickname}
          onChange={onNicknameChange}
          onSubmit={onStart}
        />
        <div className="title-actions">
          <button className="secondary-action" type="button" onClick={onOpenRanking}>
            ランキング
          </button>
        </div>
      </div>
      <p className="title-mode-note">Camera & Pose Detection</p>
    </section>
  );
}
