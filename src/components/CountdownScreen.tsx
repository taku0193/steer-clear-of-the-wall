import type { AvatarStyle, WallPattern } from "../game/types";
import { TitleGamePreview } from "./TitleGamePreview";

type CountdownScreenProps = {
  value: number;
  avatarStyle: AvatarStyle;
  wallPattern: WallPattern;
  onBackToTitle: () => void;
};

export function CountdownScreen({
  value,
  avatarStyle,
  wallPattern,
  onBackToTitle,
}: CountdownScreenProps) {
  return (
    <section className="countdown-screen" aria-live="polite">
      <TitleGamePreview
        avatarStyle={avatarStyle}
        staticProgress={0.22}
        wallPattern={wallPattern}
      />
      <div className="countdown-shade" />
      <div className="countdown-content">
        <p className="eyebrow">Get Ready</p>
        <h1 id="countdown-title" aria-label="まもなく開始">構えて</h1>
        <p
          key={value}
          className="countdown-number"
          aria-label={`開始まで${value}秒`}
        >
          {value}
        </p>
        <p className="countdown-pattern-label">最初の壁: {wallPattern.name}</p>
      </div>
      <button
        className="secondary-action countdown-back-action"
        type="button"
        onClick={onBackToTitle}
      >
        タイトルへ戻る
      </button>
    </section>
  );
}
