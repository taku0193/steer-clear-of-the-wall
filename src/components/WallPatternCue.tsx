import { createWallCueModel, type WallCuePhase } from "../game/wallCue";
import type { WallPattern } from "../game/types";

const CUE_PHASES: readonly {
  phase: WallCuePhase;
  label: string;
}[] = [
  { phase: "preview", label: "確認" },
  { phase: "ready", label: "構える" },
  { phase: "act", label: "いま" },
];

type WallPatternCueProps = {
  pattern: WallPattern;
  wallProgress: number;
  visualWallProgress: number;
  wallSpeedLevel: number;
};

export function WallPatternCue({
  pattern,
  wallProgress,
  visualWallProgress,
  wallSpeedLevel,
}: WallPatternCueProps) {
  const cue = createWallCueModel({
    pattern,
    wallProgress,
    visualWallProgress,
    wallSpeedLevel,
  });
  const progressPercent = normalizeProgressPercent(visualWallProgress);

  return (
    <>
      <section
        className="wall-pattern-cue"
        data-phase={cue.phase}
        data-action={cue.isJump ? "jump" : "hold"}
        aria-label="次の動きと壁のタイミング"
      >
        <div className="wall-pattern-cue-copy">
          {cue.isJump && (
            <span className="wall-pattern-cue-icon" aria-hidden="true">
              ↑
            </span>
          )}
          <span className="wall-pattern-cue-text">
            <strong>{cue.headline}</strong>
            <small>{cue.detail}</small>
          </span>
        </div>
        <span
          className="visually-hidden"
          aria-live="polite"
          aria-atomic="true"
        >
          {cue.phase === "preview"
            ? `${cue.headline}。${cue.detail}`
            : ""}
        </span>
        <span
          className="visually-hidden"
          role="alert"
          aria-atomic="true"
        >
          {cue.phase === "act" ? `${cue.headline}。${cue.detail}` : ""}
        </span>

        <div
          className="wall-approach-meter"
          role="progressbar"
          aria-label="壁の接近度"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
        >
          <span
            className="wall-approach-meter-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <ol className="wall-cue-steps" aria-hidden="true">
          {CUE_PHASES.map(({ phase, label }) => (
            <li
              key={phase}
              className={phase === cue.phase ? "wall-cue-step-current" : ""}
            >
              {label}
            </li>
          ))}
        </ol>
      </section>

      {cue.isJump && cue.phase === "act" && (
        <div className="jump-now-signal" aria-hidden="true">
          ↑
        </div>
      )}
    </>
  );
}

function normalizeProgressPercent(progress: number): number {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.round(Math.min(Math.max(progress, 0), 1) * 100);
}
