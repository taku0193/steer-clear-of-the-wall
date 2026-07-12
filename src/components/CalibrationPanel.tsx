import type { CalibrationResult } from "../game/calibration";

type CalibrationPanelProps = {
  result: CalibrationResult;
  autoStartStatus?: "inactive" | "waiting";
};

export function CalibrationPanel({
  result,
  autoStartStatus = "inactive",
}: CalibrationPanelProps) {
  return (
    <section
      className={`calibration-panel calibration-panel-${result.status}`}
      aria-label="カメラ位置合わせ"
      aria-live="polite"
    >
      <div className="calibration-summary">
        <span className="calibration-status-label">
          {getStatusLabel(result.status)}
        </span>
        <strong>{result.summary}</strong>
      </div>
      {autoStartStatus === "waiting" && (
        <p className="auto-start-note">
          位置合わせOKです。そのまま待つと自動で始まります。
        </p>
      )}
      <ul className="calibration-checks" aria-label="位置合わせチェック">
        {result.checks.map((check) => (
          <li
            key={check.id}
            className={`calibration-check calibration-check-${check.status}`}
          >
            <span className="calibration-check-mark" aria-hidden="true">
              {getCheckMark(check.status)}
            </span>
            <span className="calibration-check-label">{check.label}</span>
            <strong>{getCheckStatusLabel(check.status)}</strong>
            <span>{check.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function getCheckMark(
  status: CalibrationResult["checks"][number]["status"],
): string {
  switch (status) {
    case "pass":
      return "✓";
    case "warn":
      return "!";
    case "fail":
      return "×";
  }
}

function getStatusLabel(status: CalibrationResult["status"]): string {
  switch (status) {
    case "initializing":
      return "準備中";
    case "notDetected":
      return "未検出";
    case "needsAdjustment":
      return "調整";
    case "ready":
      return "OK";
  }
}

function getCheckStatusLabel(
  status: CalibrationResult["checks"][number]["status"],
): string {
  switch (status) {
    case "pass":
      return "OK";
    case "warn":
      return "確認";
    case "fail":
      return "調整";
  }
}
