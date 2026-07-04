import { useEffect, useRef, useState } from "react";

export interface Countdown {
  secondsLeft: number;
  start: (minutes: number) => void;
  stop: () => void;
}

export function useCountdown(onExpire: () => void): Countdown {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function start(minutes: number): void {
    stop();
    let remaining = minutes * 60;
    setSecondsLeft(remaining);
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        stop();
        onExpireRef.current();
      }
    }, 1000);
  }

  function stop(): void {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSecondsLeft(0);
  }

  return { secondsLeft, start, stop };
}
