"use client";

import { useEffect, useRef } from "react";
import { RankingPanel } from "./RankingPanel";

export function RankingOverlay({
  highlightedEntryId,
  onClose,
}: {
  highlightedEntryId?: string | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button:not([disabled]), a[href], input:not([disabled])",
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="ranking-overlay" role="presentation">
      <div
        ref={dialogRef}
        className="ranking-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="ランキング"
      >
        <button className="ranking-dialog-close" type="button" onClick={onClose} autoFocus aria-label="ランキングを閉じる">
          ×
        </button>
        <div className="ranking-dialog-content">
          <RankingPanel highlightedEntryId={highlightedEntryId} />
        </div>
      </div>
    </div>
  );
}
