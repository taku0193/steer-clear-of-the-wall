import { useEffect, useState } from "react";
import type { WallPattern } from "../game/types";

export function WallPatternCue({ pattern }: { pattern: WallPattern }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(true);
    const timerId = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(timerId);
  }, [pattern.id]);

  return (
    <p className={`wall-pattern-cue ${visible ? "wall-pattern-cue-visible" : ""}`}>
      {pattern.name}
    </p>
  );
}
