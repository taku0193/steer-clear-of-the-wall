import { useEffect, useState } from "react";

export function AnimatedScore({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayValue(value);
      return;
    }
    const startedAt = performance.now();
    let frameId = 0;
    const update = (now: number) => {
      const progress = Math.min((now - startedAt) / 900, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) frameId = requestAnimationFrame(update);
    };
    setDisplayValue(0);
    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [value]);

  return <span className="animated-score" aria-label={`${value}点`}>{displayValue}</span>;
}
