import type { SafeArea } from "../game/types";

type GameScreenProps = {
  remainingSeconds: number;
  score: number;
  misses: number;
  mockPoseName: string;
  mockPoseBodyArea: SafeArea;
  activeWallPatternName: string;
  wallProgress: number;
};

export function GameScreen({
  remainingSeconds,
  score,
  misses,
  mockPoseName,
  mockPoseBodyArea,
  activeWallPatternName,
  wallProgress,
}: GameScreenProps) {
  const wallProgressPercent = Math.round(wallProgress * 100);

  return (
    <section className="game-screen" aria-labelledby="playing-title">
      <header className="game-hud" aria-label="プレイ状況">
        <div className="hud-item">
          <span>残り時間</span>
          <strong>{remainingSeconds}</strong>
          <small>秒</small>
        </div>
        <div className="hud-item">
          <span>スコア</span>
          <strong>{score}</strong>
        </div>
        <div className="hud-item">
          <span>ミス</span>
          <strong>{misses}</strong>
        </div>
      </header>

      <div className="playfield-placeholder">
        <p className="eyebrow">Playing</p>
        <h1 id="playing-title">プレイ中</h1>
        <p className="summary">
          壁の描画、当たり判定、スコア加算は後続タスクで接続します。
        </p>
        <dl className="summary">
          <dt>現在の壁</dt>
          <dd>{activeWallPatternName}</dd>
          <dt>壁の進行</dt>
          <dd>{wallProgressPercent}%</dd>
          <dt>モック姿勢</dt>
          <dd>
            {mockPoseName} / x: {mockPoseBodyArea.x}, y: {mockPoseBodyArea.y}, w:{" "}
            {mockPoseBodyArea.width}, h: {mockPoseBodyArea.height}
          </dd>
        </dl>
      </div>
    </section>
  );
}
