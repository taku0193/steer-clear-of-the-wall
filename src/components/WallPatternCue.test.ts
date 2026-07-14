import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WALL_PATTERNS } from "../game/wallPatterns";
import { WallPatternCue } from "./WallPatternCue";

describe("WallPatternCue", () => {
  it("ジャンプ直前は文言・上向き記号・即時通知を表示する", () => {
    const jumpPattern = WALL_PATTERNS.find(
      (pattern) => pattern.actionTiming === "jump",
    );
    expect(jumpPattern).toBeDefined();

    const markup = renderToStaticMarkup(
      createElement(WallPatternCue, {
        pattern: jumpPattern!,
        wallProgress: 0.75,
        visualWallProgress: 0.875,
        wallSpeedLevel: 1,
      }),
    );

    expect(markup).toContain('data-phase="act"');
    expect(markup).toContain('data-action="jump"');
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("いま！ 小さくジャンプ");
    expect(markup).toContain("その場で真上へ");
    expect(markup).toContain("jump-now-signal");
    expect(markup).toContain('aria-valuenow="88"');
  });

  it("保持する姿勢では大きなジャンプ記号を表示しない", () => {
    const markup = renderToStaticMarkup(
      createElement(WallPatternCue, {
        pattern: WALL_PATTERNS[0],
        wallProgress: 0.75,
        visualWallProgress: 0.75,
        wallSpeedLevel: 1,
      }),
    );

    expect(markup).toContain('data-action="hold"');
    expect(markup).toContain("壁が通るまで姿勢をキープ");
    expect(markup).not.toContain("jump-now-signal");
  });
});
