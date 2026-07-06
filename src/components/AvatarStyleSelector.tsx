import type { AvatarStyle } from "../game/types";

type AvatarStyleSelectorProps = {
  value: AvatarStyle;
  onChange: (style: AvatarStyle) => void;
};

const AVATAR_STYLE_OPTIONS: readonly {
  value: AvatarStyle;
  label: string;
  description: string;
}[] = [
  {
    value: "masculine",
    label: "男性風",
    description: "青いウェアと短い髪",
  },
  {
    value: "feminine",
    label: "女性風",
    description: "紫のウェアと長い髪",
  },
  {
    value: "neutral",
    label: "ニュートラル",
    description: "緑のウェアとフード",
  },
];

export function AvatarStyleSelector({
  value,
  onChange,
}: AvatarStyleSelectorProps) {
  return (
    <fieldset className="avatar-style-selector">
      <legend>アバターを選ぶ</legend>
      <div className="avatar-style-options">
        {AVATAR_STYLE_OPTIONS.map((option) => (
          <button
            key={option.value}
            className="avatar-style-option"
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
