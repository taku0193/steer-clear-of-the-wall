import { useEffect, useState } from "react";

type AutoReturnCountdownProps = {
  seconds: number;
};

export function AutoReturnCountdown({ seconds }: AutoReturnCountdownProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(seconds);
  const [remainingTime, setRemainingTime] = useState(seconds);

  useEffect(() => {
    const deadlineMs = Date.now() + seconds * 1000;
    setRemainingSeconds(seconds);
    setRemainingTime(seconds);

    let animationFrameId = 0;
    const updateRemainingTime = () => {
      const nextRemainingTime = Math.max(
        0,
        (deadlineMs - Date.now()) / 1000,
      );
      setRemainingTime(nextRemainingTime);
      setRemainingSeconds(Math.ceil(nextRemainingTime));

      if (nextRemainingTime > 0) {
        animationFrameId = window.requestAnimationFrame(updateRemainingTime);
      }
    };
    animationFrameId = window.requestAnimationFrame(updateRemainingTime);

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [seconds]);

  return (
    <section className="auto-return-countdown" aria-label="タイトルへの自動復帰">
      <div className="auto-return-copy">
        <span>タイトルへ戻るまで</span>
        <strong aria-live="off">{remainingSeconds}</strong>
        <span>秒</span>
      </div>
      <progress
        max={seconds}
        value={remainingTime}
        aria-label={`あと${remainingSeconds}秒`}
      />
    </section>
  );
}
