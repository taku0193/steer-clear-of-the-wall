import type { JudgmentResult } from "../game/types";

type JudgmentOverlayProps = {
  judgment: JudgmentResult | null;
  speedLevelUp: boolean;
};

export function JudgmentOverlay({
  judgment,
  speedLevelUp,
}: JudgmentOverlayProps) {
  const feedback = getFeedback(judgment, speedLevelUp);

  return (
    <p
      key={`${feedback.status}-${judgment?.patternId ?? "pending"}`}
      className={`judgment-feedback judgment-feedback-${feedback.status}`}
      aria-live="polite"
    >
      <span className="judgment-mark" aria-hidden="true">
        {feedback.mark}
      </span>
      <span>{feedback.label}</span>
    </p>
  );
}

function getFeedback(
  judgment: JudgmentResult | null,
  speedLevelUp: boolean,
): { label: string; mark: string; status: string } {
  if (!judgment) return { label: "判定待ち", mark: "·", status: "pending" };
  if (judgment.type === "success") {
    return speedLevelUp
      ? { label: "速度アップ", mark: "+", status: "speed-up" }
      : { label: "クリア", mark: "✓", status: "success" };
  }
  if (judgment.type === "miss") {
    return { label: "安全領域からはみ出しました", mark: "×", status: "miss" };
  }
  return { label: "姿勢を検出できません", mark: "!", status: "not-detected" };
}
