import type { RankingEntry } from "../../ranking/rankingTypes";

export function RankingTable({
  entries,
  highlightedEntryId,
}: {
  entries: readonly RankingEntry[];
  highlightedEntryId?: string | null;
}) {
  const podium = entries.slice(0, 3);
  const remainder = entries.slice(3);

  return (
    <>
      {podium.length > 0 && (
        <ol className="ranking-podium" aria-label="上位3名">
          {podium.map((entry) => (
            <li
              key={entry.id}
              className="ranking-podium-entry"
              data-rank={entry.rank}
              data-highlighted={entry.id === highlightedEntryId}
            >
              <span className="ranking-position">{entry.rank}</span>
              <strong>{entry.displayName}</strong>
              <span className="ranking-points">{entry.score.toLocaleString("ja-JP")}</span>
              <small>クリア {entry.successfulWalls} / Lv.{entry.speedLevel}</small>
            </li>
          ))}
        </ol>
      )}
      {remainder.length > 0 && (
        <ol className="ranking-list" start={4} aria-label="4位以下">
          {remainder.map((entry) => (
            <li
              key={entry.id}
              className="ranking-list-entry"
              data-highlighted={entry.id === highlightedEntryId}
            >
              <span className="ranking-position">{entry.rank}</span>
              <strong>{entry.displayName}</strong>
              <span className="ranking-points">{entry.score.toLocaleString("ja-JP")}</span>
              <span className="ranking-entry-detail">
                クリア {entry.successfulWalls} / Lv.{entry.speedLevel} / {formatDate(entry.achievedAt)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日時不明";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
