"use client";

import { useRanking } from "../../ranking/useRanking";
import { RankingTable } from "./RankingTable";

export function RankingPanel({
  highlightedEntryId,
  showHeader = true,
}: {
  highlightedEntryId?: string | null;
  showHeader?: boolean;
}) {
  const { snapshot, error, isLoading, isRefreshing, refresh } = useRanking();

  return (
    <section className="ranking-panel" aria-labelledby="ranking-title" aria-busy={isLoading || isRefreshing}>
      {showHeader && (
        <header className="ranking-header">
          <div>
            <p className="eyebrow">Live Leaderboard</p>
            <h1 id="ranking-title">ランキング</h1>
          </div>
          <button className="ranking-refresh" type="button" onClick={() => void refresh()} disabled={isRefreshing}>
            {isRefreshing ? "更新中" : "更新"}
          </button>
        </header>
      )}

      {isLoading && !snapshot && (
        <div className="ranking-loading" role="status">ランキングを読み込み中</div>
      )}
      {error && (
        <div className="ranking-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void refresh()}>再読込</button>
        </div>
      )}
      {snapshot?.entries.length === 0 && (
        <div className="ranking-empty">
          <strong>まだ記録がありません</strong>
          <span>最初のランキング登録に挑戦してください。</span>
        </div>
      )}
      {snapshot && snapshot.entries.length > 0 && (
        <RankingTable entries={snapshot.entries} highlightedEntryId={highlightedEntryId} />
      )}
      {snapshot && (
        <footer className="ranking-footer">
          <span>参加記録 {snapshot.totalEntries}件</span>
          <span>最終更新 {formatUpdatedAt(snapshot.updatedAt)}</span>
        </footer>
      )}
    </section>
  );
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "不明";
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}
